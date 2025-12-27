/**
 * Team Activity Feed 데이터 조회 로직
 */

import { createClient } from "@/lib/supabase/server";
import type { TeamFeedEntry, FeedItemData, ActivityChartData } from "@/types/teamFeed";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

/**
 * 최근 N주의 모든 snapshot entries를 조회하여 person + week별로 그룹화
 */
export async function getTeamFeedData(
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  weeksLimit: number = 8
): Promise<{ feedItems: FeedItemData[]; error?: string }> {
  const supabase = await createClient();

  // 1. 워크스페이스 멤버 조회
  const { data: members, error: membersError } = await supabase
    .from("workspace_members")
    .select("user_id, role")
    .eq("workspace_id", workspaceId);

  if (membersError || !members) {
    return { feedItems: [], error: "멤버 정보 조회 실패" };
  }

  // 2. 프로필 정보 조회
  const userIds = members.map((m) => m.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("user_id, display_name, email")
    .in("user_id", userIds);

  if (profilesError || !profiles) {
    return { feedItems: [], error: "프로필 정보 조회 실패" };
  }

  // 3. 최근 N주의 스냅샷과 엔트리 조회
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("snapshots")
    .select(
      `
      id,
      year,
      week,
      week_start_date,
      week_end_date,
      author_id,
      created_at,
      entries:snapshot_entries (
        id,
        name,
        domain,
        project,
        module,
        feature,
        past_week,
        this_week,
        risks,
        risk_level,
        collaborators,
        created_at,
        updated_at
      )
    `
    )
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false })
    .limit(weeksLimit * members.length); // 멤버 수 * 주차 수

  if (snapshotsError || !snapshots) {
    return { feedItems: [], error: "스냅샷 조회 실패" };
  }

  // 4. 멤버 정보 맵 생성 (members + profiles 결합)
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
  const memberMap = new Map(
    members.map((m) => {
      const profile = profileMap.get(m.user_id);
      return [
        m.user_id,
        {
          name: profile?.display_name || "",
          email: profile?.email || "",
          role: m.role,
        },
      ];
    })
  );

  // 5. person + week 조합으로 그룹화
  const feedItemsMap = new Map<string, FeedItemData>();

  for (const snapshot of snapshots) {
    if (!snapshot.entries || snapshot.entries.length === 0) continue;

    const authorId = snapshot.author_id;
    const memberInfo = memberMap.get(authorId);
    if (!memberInfo) continue;

    const key = `${authorId}-${snapshot.year}-${snapshot.week}`;

    if (!feedItemsMap.has(key)) {
      feedItemsMap.set(key, {
        personId: authorId,
        personName: memberInfo.name,
        personEmail: memberInfo.email,
        personRole: memberInfo.role,
        year: snapshot.year,
        week: snapshot.week,
        weekStartDate: snapshot.week_start_date,
        weekEndDate: snapshot.week_end_date,
        highlight: {
          progress: "",
          next: "",
          risk: "None",
        },
        entries: [],
        latestActivityDate: snapshot.created_at,
      });
    }

    const feedItem = feedItemsMap.get(key)!;

    // 엔트리 추가
    for (const entry of snapshot.entries as any[]) {
      feedItem.entries.push({
        id: entry.id,
        snapshotId: snapshot.id,
        authorId,
        authorName: memberInfo.name,
        authorEmail: memberInfo.email,
        authorRole: memberInfo.role,
        name: entry.name,
        domain: entry.domain,
        project: entry.project,
        module: entry.module,
        feature: entry.feature,
        pastWeek: entry.past_week || { tasks: [] },
        thisWeek: entry.this_week || { tasks: [] },
        risks: entry.risks || [],
        riskLevel: entry.risk_level || 0,
        collaborators: entry.collaborators || [],
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
      });

      // 최신 활동 날짜 업데이트
      if (entry.created_at > feedItem.latestActivityDate) {
        feedItem.latestActivityDate = entry.created_at;
      }
    }
  }

  // 6. 각 피드 아이템의 하이라이트 추출
  const feedItems = Array.from(feedItemsMap.values());
  for (const item of feedItems) {
    item.highlight = extractWeeklyHighlight(item.entries);
  }

  // 7. 최신 활동 순으로 정렬
  feedItems.sort((a, b) => {
    return new Date(b.latestActivityDate).getTime() - new Date(a.latestActivityDate).getTime();
  });

  return { feedItems };
}

/**
 * 하이라이트 추출 로직
 * - Progress 1줄, Next 1줄, Risk 1줄 (총 3줄 고정)
 * - 순서: Progress → Next → Risk
 */
function extractWeeklyHighlight(entries: TeamFeedEntry[]): {
  progress: string;
  next: string;
  risk: string;
} {
  let progress = "";
  let next = "";
  let risk = "None";

  // Progress: this_week tasks가 있는 첫 엔트리
  for (const entry of entries) {
    if (entry.thisWeek.tasks && entry.thisWeek.tasks.length > 0) {
      progress = entry.thisWeek.tasks[0];
      if (progress.length > 80) {
        progress = progress.substring(0, 80) + "...";
      }
      break;
    }
  }

  // Next: past_week tasks가 있는 첫 엔트리 (객체에서 title 추출)
  for (const entry of entries) {
    if (entry.pastWeek.tasks && entry.pastWeek.tasks.length > 0) {
      next = entry.pastWeek.tasks[0].title;
      if (next.length > 80) {
        next = next.substring(0, 80) + "...";
      }
      break;
    }
  }

  // Risk: risks가 있는 첫 엔트리
  for (const entry of entries) {
    if (entry.risks.length > 0) {
      risk = entry.risks[0];
      if (risk.length > 80) {
        risk = risk.substring(0, 80) + "...";
      }
      break;
    }
  }

  return { progress, next, risk };
}

/**
 * 최근 14일간의 일별 활동 데이터 조회
 */
export async function getActivityChartData(
  workspaceId: string = DEFAULT_WORKSPACE_ID,
  days: number = 14
): Promise<{ activityData: ActivityChartData[]; error?: string }> {
  const supabase = await createClient();

  // 14일 전 날짜 계산 (Asia/Seoul 기준)
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  // snapshot_entries를 날짜별로 그룹화하여 집계
  const { data: entries, error } = await supabase
    .from("snapshot_entries")
    .select("created_at, author_id")
    .eq("workspace_id", workspaceId)
    .gte("created_at", startDate.toISOString());

  if (error || !entries) {
    return { activityData: [], error: "활동 데이터 조회 실패" };
  }

  // 날짜별로 그룹화
  const dailyMap = new Map<string, { count: number; authors: Set<string> }>();

  for (const entry of entries) {
    const date = new Date(entry.created_at);
    const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, { count: 0, authors: new Set() });
    }

    const dayData = dailyMap.get(dateKey)!;
    dayData.count++;
    dayData.authors.add(entry.author_id);
  }

  // 모든 날짜에 대해 데이터 생성 (0인 날도 포함)
  const activityData: ActivityChartData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateKey = date.toISOString().split("T")[0];

    const dayData = dailyMap.get(dateKey);
    activityData.push({
      date: dateKey,
      count: dayData?.count || 0,
      authorCount: dayData?.authors.size || 0,
    });
  }

  return { activityData };
}

