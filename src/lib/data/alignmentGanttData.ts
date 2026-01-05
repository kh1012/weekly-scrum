/**
 * Alignment Gantt Data Layer
 * 
 * 사용자 개인 관점에서 Plans와 Snapshot Entries를 간트 차트용으로 조회합니다.
 * - Plans: 사용자에게 할당된 Plans
 * - Snapshot Entries: 사용자가 작성한 Snapshot Entries (주차를 날짜 범위로 변환)
 */

import { createClient } from "@/lib/supabase/server";
import { getWeekDateRange } from "@/lib/date/isoWeek";

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
  end_date: string;   // YYYY-MM-DD
  status?: string;
  stage?: string;
  priority?: string;
  custom_feature?: boolean;
  custom_module?: boolean;
  assignees?: Array<{
    userId: string;
    role: string;
    displayName?: string;
  }>;
  // Snapshot 전용 필드
  snapshotId?: string;
  year?: number;
  week?: string;
  avgProgress?: number; // 평균 진행률 (0-100)
  metaKey?: string; // 메타 정보 키 (연결 화살표용)
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
 * Alignment 간트 차트 데이터 조회
 * 
 * 엣지 케이스 처리:
 * - Plans 없음: 빈 배열 반환
 * - Snapshots 없음: 빈 배열 반환
 * - 둘 다 없음: 빈 items 배열 반환
 * - 날짜 형식 오류: try-catch로 안전 처리
 */
export async function getAlignmentGanttData({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): Promise<AlignmentGanttData> {
  const supabase = await createClient();

  try {
    // 1. 사용자에게 할당된 Plans 조회
    const { data: planAssignees } = await supabase
      .from("plan_assignees")
      .select("plan_id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    const assignedPlanIds = planAssignees?.map((pa) => pa.plan_id) || [];

    let plans: any[] = [];
    if (assignedPlanIds.length > 0) {
      // Step 1: Plans 기본 정보 조회
      const { data: plansData, error: plansError } = await supabase
        .from("plans")
        .select(`
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
        `)
        .eq("workspace_id", workspaceId)
        .in("id", assignedPlanIds)
        .order("start_date", { ascending: true });

      if (plansError) {
        console.error("[Alignment] Failed to fetch plans:", plansError);
        plans = [];
      } else {
        plans = plansData || [];

        // Step 2: 해당 Plans의 모든 담당자 조회
        const { data: allAssigneesData } = await supabase
          .from("plan_assignees")
          .select("plan_id, user_id, role")
          .eq("workspace_id", workspaceId)
          .in("plan_id", assignedPlanIds);

        // Step 3: 담당자의 프로필 조회
        const userIds = [...new Set((allAssigneesData || []).map((a) => a.user_id))];
        let profilesMap = new Map<string, string>();

        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);

          for (const p of profilesData || []) {
            if (p.display_name) {
              profilesMap.set(p.user_id, p.display_name);
            }
          }
        }

        // Step 4: plan_id별로 담당자 그룹핑
        const assigneesMap = new Map<string, any[]>();
        for (const a of allAssigneesData || []) {
          if (!assigneesMap.has(a.plan_id)) {
            assigneesMap.set(a.plan_id, []);
          }
          assigneesMap.get(a.plan_id)!.push({
            user_id: a.user_id,
            role: a.role,
            profiles: { display_name: profilesMap.get(a.user_id) || null },
          });
        }

        // Step 5: Plans에 담당자 정보 추가
        for (const plan of plans) {
          plan.assignees = assigneesMap.get(plan.id) || [];
        }
      }
    }

  // 2. 사용자가 작성한 Snapshot Entries 조회
  const { data: snapshots } = await supabase
    .from("snapshots")
    .select("id, year, week")
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId)
    .order("year", { ascending: true })
    .order("week", { ascending: true });

  const snapshotIds = snapshots?.map((s) => s.id) || [];

  let snapshotEntries: any[] = [];
  if (snapshotIds.length > 0) {
    const { data: entriesData } = await supabase
      .from("snapshot_entries")
      .select(`
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
      `)
      .in("snapshot_id", snapshotIds);

    snapshotEntries = entriesData || [];
  }

  // 3. Snapshot 맵 생성 (snapshot_id -> {year, week})
  const snapshotMap = new Map(
    snapshots?.map((s) => [s.id, { year: s.year, week: s.week }]) || []
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
    assignees: plan.assignees?.map((a: any) => ({
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
    const { weekStart, weekEnd } = getWeekDateRange(snapshot.year, weekNumber);

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
    const avgProgress = tasks.length > 0
      ? tasks.reduce((sum: number, task: any) => sum + (task.progress || 0), 0) / tasks.length
      : 0;

    // 메타 정보로 고유 키 생성 (연결 화살표용)
    const metaKey = `${entry.domain}::${entry.project}::${entry.module || ""}::${entry.feature || ""}`;

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
  const { data: members } = await supabase
    .from("workspace_members")
    .select(`
      user_id,
      basic_role,
      profiles!inner(display_name, email)
    `)
    .eq("workspace_id", workspaceId);

  const membersList = members?.map((m: any) => ({
    userId: m.user_id,
    displayName: m.profiles?.display_name || m.profiles?.email || m.user_id,
    email: m.profiles?.email || undefined,
    basicRole: (m.basic_role as "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null) || null,
  })) || [];

    return {
      items,
      members: membersList,
    };
  } catch (error) {
    console.error("Error fetching alignment gantt data:", error);
    
    // 에러 발생 시 빈 데이터 반환 (앱이 크래시되지 않도록)
    const { data: members } = await supabase
      .from("workspace_members")
      .select(`
        user_id,
        basic_role,
        profiles!inner(display_name, email)
      `)
      .eq("workspace_id", workspaceId);

    const membersList = members?.map((m: any) => ({
      userId: m.user_id,
      displayName: m.profiles?.display_name || m.profiles?.email || m.user_id,
      email: m.profiles?.email || undefined,
      basicRole: (m.basic_role as "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null) || null,
    })) || [];

    return {
      items: [],
      members: membersList,
    };
  }
}

