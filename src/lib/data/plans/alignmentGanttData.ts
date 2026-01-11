/**
 * Alignment Gantt Data Layer
 *
 * 사용자 개인 관점에서 Plans와 Snapshot Entries를 간트 차트용으로 조회합니다.
 * - Plans: 사용자에게 할당된 Plans
 * - Snapshot Entries: 사용자가 작성한 Snapshot Entries (주차를 날짜 범위로 변환)
 */

import { createClient } from "@/lib/supabase/server";
import { getWeekDateRange } from "@/lib/utils/date";
import { listWorkspaceMembers } from "../members";
import type { PastWeekTask } from "@/types/scrum";

/**
 * Supabase plans 테이블 조회 결과 타입
 */
interface PlanQueryResult {
  id: string;
  type?: string | null;
  title: string;
  domain: string;
  project: string;
  module: string | null;
  feature: string | null;
  start_date: string;
  end_date: string;
  status?: string | null;
  stage?: string | null;
}

/**
 * Plan assignee raw 타입 (DB에서 조회한 그대로)
 */
interface PlanAssigneeRaw {
  user_id: string;
  role: string;
  profiles?: {
    display_name?: string | null;
  };
}

/**
 * Plan assignee 정보 확장 타입
 */
interface PlanWithAssignees extends PlanQueryResult {
  assignees?: PlanAssigneeRaw[];
}

/**
 * Snapshot entry 정보
 */
interface SnapshotEntryQueryResult {
  id: string;
  snapshot_id: string;
  name: string;
  domain: string;
  project: string;
  module: string | null;
  feature: string | null;
  past_week?: {
    tasks?: PastWeekTask[];
  };
  this_week?: {
    tasks?: string[];
  };
  collaborators?: Array<{
    name: string;
    relation?: string;
    relations?: string[];
  }>;
  risks?: string[];
  risk_level?: number | null;
}

/**
 * Snapshot with metadata
 */
interface SnapshotQueryResult {
  id: string;
  year: number;
  week: string;
  author_id?: string | null;
  workspace_id: string;
  authorName?: string;
  authorId?: string;
}

/**
 * 간트 차트용 Plan 인터페이스 (Plans + Snapshot Entries 통합)
 */
export interface AlignmentGanttItem {
  id: string;
  type: "plan" | "snapshot";
  title: string;
  domain: string;
  project: string;
  module: string | null;
  feature: string | null;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  status?: string | null;
  stage?: string | null;
  priority?: string;
  custom_feature?: boolean;
  custom_module?: boolean;
  assignees?: Array<{
    userId: string;
    role: string;
    displayName?: string | null;
  }>;
  // Snapshot 전용 필드
  snapshotId?: string;
  year?: number;
  week?: string;
  avgProgress?: number; // 평균 진행률 (0-100)
  metaKey?: string; // 메타 정보 키 (연결 화살표용)
  authorName?: string; // 작성자 이름
  authorId?: string | null; // 작성자 user_id (화살표 연결용)
  past_week?: {
    tasks?: Array<{ title: string; progress: number }>;
    progress?: string;
    next?: string;
    risk?: string;
    memo?: string;
  };
  this_week?: {
    tasks?: string[];
  };
  collaborators?: Array<{ name: string; relations?: string[] }>;
  risks?: string[];
  risk_level?: number;
}

export interface AlignmentGanttData {
  items: AlignmentGanttItem[];
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null;
  }>;
}

/**
 * Workspace-wide Alignment 간트 차트 데이터 조회 (내부 구현)
 *
 * 모든 Plans와 모든 사용자의 Snapshot Entries를 조회합니다.
 * My Alignment와 달리 사용자 필터링을 하지 않습니다.
 *
 * @param workspaceId - 워크스페이스 ID
 * @returns Plans + 모든 사용자의 Snapshot Entries
 */
async function getWorkspaceAlignmentDataInternal({
  workspaceId,
}: {
  workspaceId: string;
}): Promise<AlignmentGanttData> {
  const supabase = await createClient();

  try {
    // 1. Plans와 Snapshots를 병렬로 조회
    const [plansResult, snapshotsResult] = await Promise.all([
      supabase
        .from("plans")
        .select(
          `
          id,
          type,
          title,
          domain,
          project,
          module,
          feature,
          start_date,
          end_date,
          status,
          stage
        `
        )
        .eq("workspace_id", workspaceId)
        .order("start_date", { ascending: true }),
      supabase
        .from("snapshots")
        .select(
          `
          id,
          year,
          week,
          author_id,
          workspace_id
        `
        )
        .eq("workspace_id", workspaceId)
        .order("year", { ascending: true })
        .order("week", { ascending: true }),
    ]);

    const { data: plansData, error: plansError } = plansResult;
    const { data: snapshots, error: snapshotsError } = snapshotsResult as {
      data: SnapshotQueryResult[] | null;
      error: unknown;
    };

    let plans: PlanWithAssignees[] = [];
    if (plansError) {
      plans = [];
    } else {
      plans = (plansData || []) as PlanWithAssignees[];

      // Plan 담당자 조회 (프로필 정보 별도 조회)
      const planIds = plans.map((p) => p.id);
      if (planIds.length > 0) {
        const { data: allAssigneesData } = await supabase
          .from("plan_assignees")
          .select("plan_id, user_id, role")
          .eq("workspace_id", workspaceId)
          .in("plan_id", planIds);

        // 담당자들의 프로필 조회
        const assigneeUserIds = [
          ...new Set((allAssigneesData || []).map((a) => a.user_id)),
        ];
        const { data: assigneeProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", assigneeUserIds);

        const assigneeProfileMap = new Map(
          (assigneeProfiles || []).map((p) => [p.user_id, p])
        );

        const assigneesMap = new Map<string, PlanAssigneeRaw[]>();
        for (const a of allAssigneesData || []) {
          if (!assigneesMap.has(a.plan_id)) {
            assigneesMap.set(a.plan_id, []);
          }
          const profile = assigneeProfileMap.get(a.user_id);
          assigneesMap.get(a.plan_id)!.push({
            user_id: a.user_id,
            role: a.role,
            profiles: {
              display_name: profile?.display_name || null,
            },
          });
        }

        for (const plan of plans) {
          plan.assignees = assigneesMap.get(plan.id) || [];
        }
      }
    }

    // 2. Snapshot 데이터 처리

    // Author 정보를 별도로 조회
    const authorProfiles = new Map<
      string,
      { display_name?: string; email?: string; user_id: string }
    >();
    if (snapshots && snapshots.length > 0) {
      const authorIds = [
        ...new Set(snapshots.map((s) => s.author_id).filter(Boolean)),
      ];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", authorIds);

        (profiles || []).forEach((p) => {
          authorProfiles.set(p.user_id, {
            display_name: p.display_name,
            email: p.email,
            user_id: p.user_id,
          });
        });
      }
    }

    const snapshotIds = snapshots?.map((s) => s.id) || [];

    let snapshotEntries: SnapshotEntryQueryResult[] = [];
    if (snapshotIds.length > 0) {
      const { data: entriesData, error: entriesError } = await supabase
        .from("snapshot_entries")
        .select(
          `
          id,
          snapshot_id,
          name,
          domain,
          project,
          module,
          feature,
          past_week,
          this_week,
          collaborators,
          risks,
          risk_level
        `
        )
        .in("snapshot_id", snapshotIds);

      snapshotEntries = entriesData || [];

      // snapshot_entries의 name으로 user_id를 찾기 위한 추가 프로필 조회
      const entryNames = [
        ...new Set(snapshotEntries.map((e) => e.name).filter(Boolean)),
      ];
      if (entryNames.length > 0) {
        const { data: nameProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("display_name", entryNames);

        nameProfiles?.forEach((p) => {
          if (p.display_name && !authorProfiles.has(p.user_id)) {
            authorProfiles.set(p.display_name, {
              display_name: p.display_name,
              email: p.email,
              user_id: p.user_id,
            });
          }
        });
      }
    }

    // 3. Snapshot 맵 생성
    const snapshotMap = new Map(
      snapshots?.map((s) => {
        const profile = s.author_id ? authorProfiles.get(s.author_id) : null;
        const authorName = profile?.display_name || profile?.email || "Unknown";
        return [
          s.id,
          {
            year: s.year,
            week: s.week,
            authorName,
            authorId: s.author_id || null,
          },
        ];
      }) || []
    );

    // 4. Plans를 AlignmentGanttItem 형식으로 변환
    const planItems: AlignmentGanttItem[] = plans.map((plan) => ({
      id: plan.id,
      type: "plan",
      title: plan.title || `${plan.domain} / ${plan.project}`,
      domain: plan.domain || "",
      project: plan.project || "",
      module: plan.module || null,
      feature: plan.feature || null,
      start_date: plan.start_date,
      end_date: plan.end_date,
      status: plan.status,
      stage: plan.stage,
      assignees:
        plan.assignees?.map((a) => ({
          userId: a.user_id,
          role: a.role,
          displayName: a.profiles?.display_name,
        })) || [],
    }));

    // 5. Snapshot Entries를 AlignmentGanttItem 형식으로 변환
    const snapshotItems: AlignmentGanttItem[] = snapshotEntries.map((entry) => {
      const snapshot = snapshotMap.get(entry.snapshot_id);
      if (!snapshot) {
        throw new Error(`Snapshot not found for entry ${entry.id}`);
      }

      const weekNumber = parseInt(snapshot.week.replace("W", ""), 10);
      const { weekStart, weekEnd } = getWeekDateRange(
        snapshot.year,
        weekNumber
      );

      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const pastWeek = entry.past_week as any;
      const thisWeek = entry.this_week as any;
      const tasks = pastWeek?.tasks || [];
      const avgProgress =
        tasks.length > 0
          ? tasks.reduce(
              (sum: number, task: PastWeekTask) => sum + (task.progress || 0),
              0
            ) / tasks.length
          : 0;

      const metaKey = `${entry.project}::${entry.module || ""}::${
        entry.feature || ""
      }`;

      // entry.name을 우선 사용하고, 없으면 snapshot.authorName 사용
      const authorName = entry.name?.trim() || snapshot.authorName || "Unknown";

      // authorId 결정: snapshot.authorId 우선, 없으면 authorName으로 찾기
      let authorId = snapshot.authorId;
      if (!authorId && authorName) {
        const profileByName = authorProfiles.get(authorName);
        if (profileByName) {
          authorId = profileByName.user_id;
        }
      }

      return {
        id: `snapshot-${entry.id}`,
        type: "snapshot",
        title: entry.feature || entry.module || entry.project,
        domain: entry.domain || "",
        project: entry.project || "",
        module: entry.module || null,
        feature: entry.feature || null,
        start_date: formatDate(weekStart),
        end_date: formatDate(weekEnd),
        status: "done",
        stage: "completed",
        priority: "snapshot",
        custom_feature: true,
        custom_module: false,
        snapshotId: entry.snapshot_id,
        year: snapshot.year,
        week: snapshot.week,
        avgProgress,
        metaKey,
        authorName,
        authorId,
        past_week: pastWeek,
        this_week: thisWeek,
        collaborators: entry.collaborators || [],
        risks: entry.risks || [],
        risk_level: entry.risk_level || 0,
        assignees: [],
      };
    });

    // 6. Plans + Snapshots 통합
    const items = [...planItems, ...snapshotItems].sort((a, b) =>
      a.start_date.localeCompare(b.start_date)
    );

    // 7. 워크스페이스 멤버 목록 조회
    const workspaceMembers = await listWorkspaceMembers({ workspaceId });

    const membersList = workspaceMembers.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name || m.email || m.user_id,
      email: m.email || undefined,
      basicRole: m.basic_role,
    }));

    return {
      items,
      members: membersList,
    };
  } catch (error) {
    console.error("[getWorkspaceAlignmentData] Error:", error);

    // 에러 발생 시에도 멤버 목록은 조회 시도
    const workspaceMembers = await listWorkspaceMembers({ workspaceId });
    const membersList = workspaceMembers.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name || m.email || m.user_id,
      email: m.email || undefined,
      basicRole: m.basic_role,
    }));

    return {
      items: [],
      members: membersList,
    };
  }
}

/**
 * Personal Alignment 간트 차트 데이터 조회 (내부 구현)
 *
 * 엣지 케이스 처리:
 * - Plans 없음: 빈 배열 반환
 * - Snapshots 없음: 빈 배열 반환
 * - 둘 다 없음: 빈 items 배열 반환
 * - 날짜 형식 오류: try-catch로 안전 처리
 */
async function getAlignmentGanttDataInternal({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): Promise<AlignmentGanttData> {
  const supabase = await createClient();

  try {
    // 1. plan_assignees와 snapshots를 병렬로 조회
    const [planAssigneesResult, snapshotsResult] = await Promise.all([
      supabase
        .from("plan_assignees")
        .select("plan_id, role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId),
      supabase
        .from("snapshots")
        .select(
          `
          id,
          year,
          week,
          author_id,
          workspace_id
        `
        )
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .order("year", { ascending: true })
        .order("week", { ascending: true }),
    ]);

    const { data: planAssignees } = planAssigneesResult;
    const { data: snapshots, error: snapshotsError } = snapshotsResult;

    const assignedPlanIds = planAssignees?.map((pa) => pa.plan_id) || [];

    let plans: PlanWithAssignees[] = [];
    if (assignedPlanIds.length > 0) {
      // Step 1: Plans 기본 정보 조회
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(
          `
          id,
          type,
          title,
          domain,
          project,
          module,
          feature,
          start_date,
          end_date,
          status,
          stage
        `
        )
        .eq("workspace_id", workspaceId)
        .in("id", assignedPlanIds)
        .order("start_date", { ascending: true });

      if (plansError) {
        plans = [];
      } else {
        plans = plansData || [];

        // Step 2: 해당 Plans의 모든 담당자 조회
        const { data: allAssigneesData } = await supabase
          .from("plan_assignees")
          .select("plan_id, user_id, role")
          .eq("workspace_id", workspaceId)
          .in("plan_id", assignedPlanIds);

        // Step 3: 담당자들의 프로필 조회
        const assigneeUserIds = [
          ...new Set((allAssigneesData || []).map((a) => a.user_id)),
        ];
        const { data: assigneeProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", assigneeUserIds);

        const assigneeProfileMap = new Map(
          (assigneeProfiles || []).map((p) => [p.user_id, p])
        );

        // Step 4: plan_id별로 담당자 그룹핑
        const assigneesMap = new Map<string, PlanAssigneeRaw[]>();
        for (const a of allAssigneesData || []) {
          if (!assigneesMap.has(a.plan_id)) {
            assigneesMap.set(a.plan_id, []);
          }
          const profile = assigneeProfileMap.get(a.user_id);
          assigneesMap.get(a.plan_id)!.push({
            user_id: a.user_id,
            role: a.role,
            profiles: {
              display_name: profile?.display_name || null,
            },
          });
        }

        // Step 5: Plans에 담당자 정보 추가
        for (const plan of plans) {
          plan.assignees = assigneesMap.get(plan.id) || [];
        }
      }
    }

    // 2. Snapshot 데이터 처리

    // Author 정보를 별도로 조회
    const authorProfiles = new Map<
      string,
      { display_name?: string; email?: string; user_id: string }
    >();
    if (snapshots && snapshots.length > 0) {
      const authorIds = [
        ...new Set(snapshots.map((s) => s.author_id).filter(Boolean)),
      ];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("user_id", authorIds);

        (profiles || []).forEach((p) => {
          authorProfiles.set(p.user_id, {
            display_name: p.display_name,
            email: p.email,
            user_id: p.user_id,
          });
        });
      }
    }

    const snapshotIds = snapshots?.map((s) => s.id) || [];

    let snapshotEntries: SnapshotEntryQueryResult[] = [];
    if (snapshotIds.length > 0) {
      const { data: entriesData, error: entriesError } = await supabase
        .from("snapshot_entries")
        .select(
          `
        id,
        snapshot_id,
        name,
        domain,
        project,
        module,
        feature,
        past_week,
        this_week,
        collaborators,
        risks,
        risk_level
      `
        )
        .in("snapshot_id", snapshotIds);

      snapshotEntries = entriesData || [];

      // snapshot_entries의 name으로 user_id를 찾기 위한 추가 프로필 조회
      const entryNames = [
        ...new Set(snapshotEntries.map((e) => e.name).filter(Boolean)),
      ];
      if (entryNames.length > 0) {
        const { data: nameProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, email")
          .in("display_name", entryNames);

        nameProfiles?.forEach((p) => {
          if (p.display_name && !authorProfiles.has(p.user_id)) {
            authorProfiles.set(p.display_name, {
              display_name: p.display_name,
              email: p.email,
              user_id: p.user_id,
            });
          }
        });
      }
    }

    // 3. Snapshot 맵 생성 (snapshot_id -> {year, week, authorName, authorId})
    const snapshotMap = new Map(
      snapshots?.map((s) => {
        const profile = authorProfiles.get(s.author_id);
        const authorName = profile?.display_name || profile?.email || "Unknown";
        return [
          s.id,
          { year: s.year, week: s.week, authorName, authorId: s.author_id },
        ];
      }) || []
    );

    // 4. Plans를 AlignmentGanttItem 형식으로 변환
    const planItems: AlignmentGanttItem[] = plans.map((plan) => ({
      id: plan.id,
      type: "plan",
      title: plan.title || `${plan.domain} / ${plan.project}`,
      domain: plan.domain || "",
      project: plan.project || "",
      module: plan.module || null,
      feature: plan.feature || null,
      start_date: plan.start_date,
      end_date: plan.end_date,
      status: plan.status,
      stage: plan.stage,
      assignees:
        plan.assignees?.map((a) => ({
          userId: a.user_id,
          role: a.role,
          displayName: a.profiles?.display_name,
        })) || [],
    }));

    // 5. Snapshot Entries를 AlignmentGanttItem 형식으로 변환
    const snapshotItems: AlignmentGanttItem[] = snapshotEntries.map((entry) => {
      const snapshot = snapshotMap.get(entry.snapshot_id);
      if (!snapshot) {
        throw new Error(`Snapshot not found for entry ${entry.id}`);
      }

      // year + week을 실제 날짜 범위로 변환
      // week 형식: W01, W02, ... -> 숫자로 변환
      const weekNumber = parseInt(snapshot.week.replace("W", ""), 10);
      const { weekStart, weekEnd } = getWeekDateRange(
        snapshot.year,
        weekNumber
      );

      // Date를 YYYY-MM-DD 형식으로 변환
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // 평균 진행률 계산
      const pastWeek = entry.past_week as any;
      const thisWeek = entry.this_week as any;
      const tasks = pastWeek?.tasks || [];
      const avgProgress =
        tasks.length > 0
          ? tasks.reduce(
              (sum: number, task: PastWeekTask) => sum + (task.progress || 0),
              0
            ) / tasks.length
          : 0;

      // 메타 정보로 고유 키 생성 (연결 화살표용)
      const metaKey = `${entry.project}::${entry.module || ""}::${
        entry.feature || ""
      }`;

      // entry.name을 우선 사용하고, 없으면 snapshot.authorName 사용
      const authorName = entry.name?.trim() || snapshot.authorName || "Unknown";

      // authorId 결정: snapshot.authorId 우선, 없으면 authorName으로 찾기
      let authorId = snapshot.authorId;
      if (!authorId && authorName) {
        const profileByName = authorProfiles.get(authorName);
        if (profileByName) {
          authorId = profileByName.user_id;
        }
      }

      return {
        id: `snapshot-${entry.id}`,
        type: "snapshot",
        title: entry.feature || entry.module || entry.project,
        domain: entry.domain || "",
        project: entry.project || "",
        module: entry.module || null,
        feature: entry.feature || null,
        start_date: formatDate(weekStart),
        end_date: formatDate(weekEnd),
        status: "done", // Snapshot은 이미 완료된 작업
        stage: "completed",
        priority: "snapshot", // Snapshot 전용 우선순위
        custom_feature: true, // Snapshot 항목 시각적 구분
        custom_module: false,
        snapshotId: entry.snapshot_id,
        year: snapshot.year,
        week: snapshot.week,
        avgProgress, // 평균 진행률 추가
        metaKey, // 메타 키 추가 (연결 화살표용)
        authorName, // 작성자 이름 추가 (entry.name 우선 사용)
        authorId, // 작성자 ID 추가 (화살표 연결용, fallback 로직 적용)
        past_week: pastWeek, // Snapshot 상세 정보 추가
        this_week: thisWeek, // NEXT 작업 추가
        collaborators: entry.collaborators || [], // 협업자 추가
        risks: entry.risks || [], // 리스크 목록 추가
        risk_level: entry.risk_level || 0, // 리스크 레벨 추가
        assignees: [],
      };
    });

    // 6. Plans + Snapshots 통합
    const items = [...planItems, ...snapshotItems].sort((a, b) =>
      a.start_date.localeCompare(b.start_date)
    );

    // 7. 워크스페이스 멤버 목록 조회 (DraftGanttView에서 필요)
    const workspaceMembers = await listWorkspaceMembers({ workspaceId });

    const membersList = workspaceMembers.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name || m.email || m.user_id,
      email: m.email || undefined,
      basicRole: m.basic_role,
    }));

    return {
      items,
      members: membersList,
    };
  } catch (error) {
    console.error("[getAlignmentGanttData] Error:", error);

    // 에러 발생 시에도 멤버 목록은 조회 시도
    const workspaceMembers = await listWorkspaceMembers({ workspaceId });
    const membersList = workspaceMembers.map((m) => ({
      userId: m.user_id,
      displayName: m.display_name || m.email || m.user_id,
      email: m.email || undefined,
      basicRole: m.basic_role,
    }));

    return {
      items: [],
      members: membersList,
    };
  }
}

/**
 * Workspace-wide Alignment 간트 차트 데이터 조회
 *
 * 페이지 레벨 ISR 캐싱 사용 (unstable_cache는 cookies와 호환되지 않음)
 */
export const getWorkspaceAlignmentData = getWorkspaceAlignmentDataInternal;

/**
 * Personal Alignment 간트 차트 데이터 조회
 *
 * 페이지 레벨 ISR 캐싱 사용 (unstable_cache는 cookies와 호환되지 않음)
 */
export const getAlignmentGanttData = getAlignmentGanttDataInternal;
