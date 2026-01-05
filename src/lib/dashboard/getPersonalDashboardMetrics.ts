/**
 * Personal Dashboard Metrics Aggregator
 * 
 * 서버 사이드에서 개인 메트릭을 집계하여 반환
 * - Snapshot 메트릭
 * - Plan 메트릭
 * - Usage 메트릭 (페이지 방문)
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentISOWeek, getPreviousISOWeek } from "@/lib/date/isoWeek";

export interface RecentSnapshotEntry {
  id: string;
  name: string;
  domain: string;
  project: string;
  module: string;
  feature: string;
  updatedAt: string;
  year: number;
  week: string;
}

export interface PersonalDashboardMetrics {
  snapshots: {
    weeksCount: number;
    entriesTotal: number;
    entriesThisWeek: number;
    entriesLastWeek: number;
    lastSnapshotAt: string | null;
  };
  plans: {
    assignedTotal: number;
    assignedActive: number;
    updatedByMe30d?: number;
  };
  usage: {
    visits7dTotal: number;
    topRoutes7d: { path: string; count: number }[];
    visitsByDay14d: { date: string; count: number }[];
    lastVisitAt: string | null;
  };
  recentEntries: RecentSnapshotEntry[];
  domainDistribution: { label: string; count: number }[];
  weeklyTrend: { week: string; count: number }[];
  weeklyProgressTrend: { week: string; avgProgress: number; entryCount: number }[];
}

/**
 * 개인 대시보드 메트릭 조회
 */
export async function getPersonalDashboardMetrics({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): Promise<PersonalDashboardMetrics> {
  const supabase = await createClient();

  // 현재 주차 & 지난 주차 정보
  const currentWeek = getCurrentISOWeek();
  const previousWeek = getPreviousISOWeek(currentWeek.year, currentWeek.week);
  const currentWeekLabel = `W${currentWeek.week.toString().padStart(2, "0")}`;
  const previousWeekLabel = `W${previousWeek.week.toString().padStart(2, "0")}`;

  // ========================================
  // A) Snapshot Metrics
  // ========================================

  // 1. 모든 스냅샷 조회 (주차 수 계산용)
  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("id, year, week, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId);

  const snapshotWeeksCount = snapshots
    ? new Set(snapshots.map((s) => `${s.year}-${s.week}`)).size
    : 0;

  // 2. 스냅샷 엔트리 조회
  const snapshotIds = snapshots?.map((s) => s.id) || [];
  let entriesTotal = 0;
  let entriesThisWeek = 0;
  let entriesLastWeek = 0;
  let lastSnapshotAt: string | null = null;

  if (snapshotIds.length > 0) {
    const { data: entries } = await supabase
      .from("snapshot_entries")
      .select("snapshot_id, created_at, updated_at")
      .in("snapshot_id", snapshotIds);

    entriesTotal = entries?.length || 0;

    // 이번 주 & 지난 주 스냅샷 ID 분류
    const thisWeekSnapshotIds = new Set(
      snapshots
        ?.filter(
          (s) => s.year === currentWeek.year && s.week === currentWeekLabel
        )
        .map((s) => s.id)
    );
    const lastWeekSnapshotIds = new Set(
      snapshots
        ?.filter(
          (s) => s.year === previousWeek.year && s.week === previousWeekLabel
        )
        .map((s) => s.id)
    );

    entriesThisWeek =
      entries?.filter((e) => thisWeekSnapshotIds.has(e.snapshot_id)).length ||
      0;
    entriesLastWeek =
      entries?.filter((e) => lastWeekSnapshotIds.has(e.snapshot_id)).length ||
      0;

    // 마지막 스냅샷 시각 (엔트리 기준)
    if (entries && entries.length > 0) {
      const sortedEntries = entries.sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      );
      lastSnapshotAt = sortedEntries[0].updated_at || sortedEntries[0].created_at;
    }
  }

  // ========================================
  // B) Plan Metrics
  // ========================================

  // 1. 나에게 할당된 Plans 조회
  const { data: planAssignees } = await supabase
    .from("plan_assignees")
    .select("plan_id")
    .eq("user_id", userId);

  const assignedPlanIds = planAssignees?.map((pa) => pa.plan_id) || [];
  let assignedTotal = 0;
  let assignedActive = 0;

  if (assignedPlanIds.length > 0) {
    const { data: plans } = await supabase
      .from("plans")
      .select("id, status")
      .eq("workspace_id", workspaceId)
      .in("id", assignedPlanIds);

    assignedTotal = plans?.length || 0;

    // Active Plans (status가 done/closed/completed가 아닌 것)
    const completedStatuses = ["done", "closed", "completed"];
    assignedActive =
      plans?.filter(
        (p) => !completedStatuses.includes(p.status?.toLowerCase() || "")
      ).length || 0;
  }

  // ========================================
  // C) Usage Metrics (Page Visits)
  // ========================================

  let visits7dTotal = 0;
  let topRoutes7d: { path: string; count: number }[] = [];
  let visitsByDay14d: { date: string; count: number }[] = [];
  let lastVisitAt: string | null = null;

  // 7일 전, 14일 전 날짜 계산
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // 기존 menu_events 테이블에서 PAGE_VIEW 이벤트 조회
  try {
    // 최근 14일 방문 기록 조회 (PAGE_VIEW만)
    const { data: visits } = await supabase
      .from("menu_events")
      .select("page_path, occurred_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("event_type", "PAGE_VIEW")
      .gte("occurred_at", fourteenDaysAgo.toISOString())
      .order("occurred_at", { ascending: false });

    if (visits && visits.length > 0) {
      // 최근 7일 방문 총 횟수
      const visits7d = visits.filter(
        (v) => new Date(v.occurred_at) >= sevenDaysAgo
      );
      visits7dTotal = visits7d.length;

      // Top 5 Routes (최근 7일)
      const routeCounts = new Map<string, number>();
      for (const visit of visits7d) {
        routeCounts.set(
          visit.page_path,
          (routeCounts.get(visit.page_path) || 0) + 1
        );
      }
      topRoutes7d = Array.from(routeCounts.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Visits by Day (최근 14일)
      const dayCounts = new Map<string, number>();
      for (const visit of visits) {
        const dateStr = new Date(visit.occurred_at)
          .toISOString()
          .split("T")[0];
        dayCounts.set(dateStr, (dayCounts.get(dateStr) || 0) + 1);
      }
      visitsByDay14d = Array.from(dayCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 마지막 방문 시각
      lastVisitAt = visits[0].occurred_at;
    }
  } catch (err) {
    // 테이블 접근 오류 시 무시
    console.warn("menu_events table not available:", err);
  }

  // ========================================
  // D) Additional Data for Enhanced Dashboard
  // ========================================

  // 1. 최근 스냅샷 엔트리 5개
  let recentEntries: RecentSnapshotEntry[] = [];
  if (snapshotIds.length > 0) {
    const { data: entriesWithDetails } = await supabase
      .from("snapshot_entries")
      .select("id, name, domain, project, module, feature, updated_at, created_at, snapshot_id")
      .in("snapshot_id", snapshotIds)
      .order("updated_at", { ascending: false })
      .limit(5);

    if (entriesWithDetails) {
      recentEntries = entriesWithDetails.map((e) => {
        const snapshot = snapshots?.find((s) => s.id === e.snapshot_id);
        return {
          id: e.id,
          name: e.name,
          domain: e.domain,
          project: e.project,
          module: e.module || "",
          feature: e.feature || "",
          updatedAt: e.updated_at || e.created_at,
          year: snapshot?.year || 0,
          week: snapshot?.week || "",
        };
      });
    }
  }

  // 2. 도메인/프로젝트 분포 (Top 10)
  const domainMap = new Map<string, number>();
  if (snapshotIds.length > 0) {
    const { data: allEntries } = await supabase
      .from("snapshot_entries")
      .select("domain, project")
      .in("snapshot_id", snapshotIds);

    if (allEntries) {
      for (const entry of allEntries) {
        const key = entry.domain && entry.project 
          ? `${entry.domain} / ${entry.project}`
          : entry.domain || entry.project || "미분류";
        domainMap.set(key, (domainMap.get(key) || 0) + 1);
      }
    }
  }

  const domainDistribution = Array.from(domainMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 3. 주차별 엔트리 수 추이 (최근 8주)
  const weeklyTrend: { week: string; count: number }[] = [];
  const weeklyProgressTrend: { week: string; avgProgress: number; entryCount: number }[] = [];
  
  if (snapshots && snapshots.length > 0 && snapshotIds.length > 0) {
    // 모든 엔트리를 한 번에 조회 (N+1 쿼리 방지) - past_week 포함
    const { data: allEntriesForTrend } = await supabase
      .from("snapshot_entries")
      .select("snapshot_id, past_week")
      .in("snapshot_id", snapshotIds);

    if (allEntriesForTrend) {
      // 주차별 스냅샷 그룹핑
      const weekMap = new Map<string, string[]>(); // "2025-W01" -> [snapshotIds]
      for (const snapshot of snapshots) {
        const weekKey = `${snapshot.year}-${snapshot.week}`;
        if (!weekMap.has(weekKey)) {
          weekMap.set(weekKey, []);
        }
        weekMap.get(weekKey)!.push(snapshot.id);
      }

      // 스냅샷 ID -> 엔트리 매핑
      const snapshotIdToEntries = new Map<string, any[]>();
      for (const entry of allEntriesForTrend) {
        if (!snapshotIdToEntries.has(entry.snapshot_id)) {
          snapshotIdToEntries.set(entry.snapshot_id, []);
        }
        snapshotIdToEntries.get(entry.snapshot_id)!.push(entry);
      }

      // 최근 8주 추출 및 집계
      const sortedWeeks = Array.from(weekMap.keys()).sort().reverse().slice(0, 8);

      for (const weekKey of sortedWeeks.reverse()) {
        const weekSnapshotIds = weekMap.get(weekKey) || [];
        
        // 엔트리 수 계산
        const weekEntries = weekSnapshotIds.flatMap(
          (sid) => snapshotIdToEntries.get(sid) || []
        );
        const weekEntryCount = weekEntries.length;

        weeklyTrend.push({
          week: weekKey,
          count: weekEntryCount,
        });

        // 평균 진행률 계산
        let totalProgress = 0;
        let taskCount = 0;

        for (const entry of weekEntries) {
          const pastWeek = entry.past_week as any;
          const tasks = pastWeek?.tasks || [];
          
          for (const task of tasks) {
            if (typeof task.progress === "number") {
              totalProgress += task.progress;
              taskCount++;
            }
          }
        }

        const avgProgress = taskCount > 0 ? totalProgress / taskCount : 0;

        weeklyProgressTrend.push({
          week: weekKey,
          avgProgress: Math.round(avgProgress * 10) / 10, // 소수점 1자리
          entryCount: weekEntryCount,
        });
      }
    }
  }

  return {
    snapshots: {
      weeksCount: snapshotWeeksCount,
      entriesTotal,
      entriesThisWeek,
      entriesLastWeek,
      lastSnapshotAt,
    },
    plans: {
      assignedTotal,
      assignedActive,
    },
    usage: {
      visits7dTotal,
      topRoutes7d,
      visitsByDay14d,
      lastVisitAt,
    },
    recentEntries,
    domainDistribution,
    weeklyTrend,
    weeklyProgressTrend,
  };
}

