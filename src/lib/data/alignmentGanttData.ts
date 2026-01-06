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
  end_date: string; // YYYY-MM-DD
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
  authorName?: string; // 작성자 이름
  authorId?: string; // 작성자 user_id (화살표 연결용)
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
 * Workspace-wide Alignment 간트 차트 데이터 조회
 *
 * 모든 Plans와 모든 사용자의 Snapshot Entries를 조회합니다.
 * My Alignment와 달리 사용자 필터링을 하지 않습니다.
 *
 * @param workspaceId - 워크스페이스 ID
 * @returns Plans + 모든 사용자의 Snapshot Entries
 */
export async function getWorkspaceAlignmentData({
  workspaceId,
}: {
  workspaceId: string;
}): Promise<AlignmentGanttData> {
  const supabase = await createClient();

  try {
    console.log(
      "[getWorkspaceAlignmentData] 📊 Starting data fetch for workspace:",
      workspaceId
    );

    // 1. 워크스페이스의 모든 Plans 조회
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
      .order("start_date", { ascending: true });

    console.log(
      "[getWorkspaceAlignmentData] 📋 Plans fetched:",
      plansData?.length || 0
    );

    let plans: any[] = [];
    if (plansError) {
      console.error("[Workspace Alignment] Failed to fetch plans:", plansError);
      plans = [];
    } else {
      plans = plansData || [];

      // Plan 담당자 조회
      const planIds = plans.map((p) => p.id);
      if (planIds.length > 0) {
        const { data: allAssigneesData } = await supabase
          .from("plan_assignees")
          .select("plan_id, user_id, role")
          .eq("workspace_id", workspaceId)
          .in("plan_id", planIds);

        const userIds = [
          ...new Set((allAssigneesData || []).map((a) => a.user_id)),
        ];
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

        for (const plan of plans) {
          plan.assignees = assigneesMap.get(plan.id) || [];
        }
      }
    }

    // 2. 워크스페이스의 모든 Snapshot Entries 조회 (with author profile)
    console.log("[getWorkspaceAlignmentData] 🔍 Querying snapshots with:", {
      workspace_id: workspaceId,
      table: "snapshots",
    });

    // 전체 데이터 확인
    const { count: totalCount } = await supabase
      .from("snapshots")
      .select("*", { count: "exact", head: true });
    console.log(
      "[getWorkspaceAlignmentData] 📊 Total snapshots in DB:",
      totalCount
    );

    // 실제 쿼리
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("snapshots")
      .select(
        `
        id,
        year,
        week,
        author_id,
        workspace_id,
        profiles!snapshots_author_id_fkey(display_name, email)
      `
      )
      .eq("workspace_id", workspaceId)
      .order("year", { ascending: true })
      .order("week", { ascending: true });

    if (snapshotsError) {
      console.error(
        "[getWorkspaceAlignmentData] ❌ Snapshots query error:",
        JSON.stringify(snapshotsError, null, 2)
      );
      console.error(
        "[getWorkspaceAlignmentData] ❌ Error details:",
        {
          message: snapshotsError.message,
          details: snapshotsError.details,
          hint: snapshotsError.hint,
          code: snapshotsError.code,
        }
      );
    }

    console.log(
      "[getWorkspaceAlignmentData] 📸 Snapshots fetched:",
      snapshots?.length || 0
    );

    // 샘플 데이터 로그
    if (snapshots && snapshots.length > 0) {
      console.log(
        "[getWorkspaceAlignmentData] 📸 Sample snapshots:",
        snapshots.slice(0, 3).map((s) => ({
          id: s.id,
          year: s.year,
          week: s.week,
          author_id: s.author_id,
          workspace_id: (s as any).workspace_id,
        }))
      );
    }

    // Fallback: workspace_id로 필터링했을 때 결과가 0개면 조건 없이 재시도
    if (!snapshots || snapshots.length === 0) {
      console.log(
        "[getWorkspaceAlignmentData] 🔄 Retrying without workspace_id filter..."
      );

      const { data: allSnapshots, count, error: fallbackError } = await supabase
        .from("snapshots")
        .select("id, workspace_id, year, week, author_id", { count: "exact" })
        .limit(10);

      if (fallbackError) {
        console.error(
          "[getWorkspaceAlignmentData] ❌ Fallback query error:",
          JSON.stringify(fallbackError, null, 2)
        );
      }

      console.log("[getWorkspaceAlignmentData] 📊 Available snapshots:", {
        total: count,
        queriedWorkspaceId: workspaceId,
        queriedWorkspaceIdType: typeof workspaceId,
        workspaces: [...new Set(allSnapshots?.map((s) => s.workspace_id))],
        workspaceTypes: [...new Set(allSnapshots?.map((s) => typeof s.workspace_id))],
        sample: allSnapshots?.map((s) => ({
          id: s.id,
          workspace_id: s.workspace_id,
          workspace_id_type: typeof s.workspace_id,
          matches: s.workspace_id === workspaceId,
          year: s.year,
          week: s.week,
        })),
      });

      // profiles 조인 없이 쿼리 시도 (조인이 문제인지 확인)
      console.log(
        "[getWorkspaceAlignmentData] 🔄 Trying query without profiles join..."
      );
      const { data: snapshotsNoJoin, error: noJoinError } = await supabase
        .from("snapshots")
        .select("id, year, week, author_id, workspace_id")
        .eq("workspace_id", workspaceId)
        .limit(5);

      if (noJoinError) {
        console.error(
          "[getWorkspaceAlignmentData] ❌ No-join query error:",
          JSON.stringify(noJoinError, null, 2)
        );
      } else {
        console.log(
          "[getWorkspaceAlignmentData] ✅ No-join query result:",
          snapshotsNoJoin?.length || 0,
          "snapshots"
        );
        if (snapshotsNoJoin && snapshotsNoJoin.length > 0) {
          console.log(
            "[getWorkspaceAlignmentData] 📸 Sample no-join snapshots:",
            snapshotsNoJoin.slice(0, 3)
          );
        }
      }
    }

    const snapshotIds = snapshots?.map((s) => s.id) || [];

    let snapshotEntries: any[] = [];
    if (snapshotIds.length > 0) {
      console.log(
        "[getWorkspaceAlignmentData] 🔍 Querying entries with snapshot_ids:",
        {
          count: snapshotIds.length,
          ids: snapshotIds.slice(0, 5),
        }
      );

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

      if (entriesError) {
        console.error(
          "[getWorkspaceAlignmentData] ❌ Entries query error:",
          JSON.stringify(entriesError, null, 2)
        );
        console.error(
          "[getWorkspaceAlignmentData] ❌ Entries error details:",
          {
            message: entriesError.message,
            details: entriesError.details,
            hint: entriesError.hint,
            code: entriesError.code,
          }
        );
      }

      snapshotEntries = entriesData || [];
      console.log(
        "[getWorkspaceAlignmentData] 📦 Snapshot entries fetched:",
        snapshotEntries.length
      );

      // 샘플 엔트리 로그 (첫 3개)
      if (snapshotEntries.length > 0) {
        console.log(
          "[getWorkspaceAlignmentData] 📦 Sample entries:",
          snapshotEntries.slice(0, 3).map((e) => ({
            id: e.id,
            snapshot_id: e.snapshot_id,
            domain: e.domain,
            project: e.project,
            module: e.module,
            feature: e.feature,
          }))
        );
      }
    } else {
      console.log(
        "[getWorkspaceAlignmentData] ⚠️ No snapshots found, skipping entries query"
      );
    }

    // 3. Snapshot 맵 생성
    const snapshotMap = new Map(
      snapshots?.map((s) => {
        const profile = (s as any).profiles;
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
        plan.assignees?.map((a: any) => ({
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
              (sum: number, task: any) => sum + (task.progress || 0),
              0
            ) / tasks.length
          : 0;

      const metaKey = `${entry.domain}::${entry.project}::${
        entry.module || ""
      }::${entry.feature || ""}`;

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
        authorName: snapshot.authorName,
        authorId: snapshot.authorId,
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

    console.log("[getWorkspaceAlignmentData] ✅ Final items:", {
      total: items.length,
      plans: planItems.length,
      snapshots: snapshotItems.length,
    });

    // 7. 워크스페이스 멤버 목록 조회
    const { data: members } = await supabase
      .from("workspace_members")
      .select(
        `
        user_id,
        basic_role,
        profiles!inner(display_name, email)
      `
      )
      .eq("workspace_id", workspaceId);

    const membersList =
      members?.map((m: any) => ({
        userId: m.user_id,
        displayName: m.profiles?.display_name || m.profiles?.email || m.user_id,
        email: m.profiles?.email || undefined,
        basicRole:
          (m.basic_role as "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null) ||
          null,
      })) || [];

    return {
      items,
      members: membersList,
    };
  } catch (error) {
    console.error("Error fetching workspace alignment data:", error);

    const { data: members } = await supabase
      .from("workspace_members")
      .select(
        `
        user_id,
        basic_role,
        profiles!inner(display_name, email)
      `
      )
      .eq("workspace_id", workspaceId);

    const membersList =
      members?.map((m: any) => ({
        userId: m.user_id,
        displayName: m.profiles?.display_name || m.profiles?.email || m.user_id,
        email: m.profiles?.email || undefined,
        basicRole:
          (m.basic_role as "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null) ||
          null,
      })) || [];

    return {
      items: [],
      members: membersList,
    };
  }
}

/**
 * Personal Alignment 간트 차트 데이터 조회
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
    console.log(
      "[getAlignmentGanttData] 📊 Starting data fetch for user:",
      userId
    );

    // 1. 사용자에게 할당된 Plans 조회
    const { data: planAssignees } = await supabase
      .from("plan_assignees")
      .select("plan_id, role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    const assignedPlanIds = planAssignees?.map((pa) => pa.plan_id) || [];
    console.log(
      "[getAlignmentGanttData] 👤 User assigned to plans:",
      assignedPlanIds.length
    );

    let plans: any[] = [];
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
        const userIds = [
          ...new Set((allAssigneesData || []).map((a) => a.user_id)),
        ];
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

    // 2. 사용자가 작성한 Snapshot Entries 조회 (with author profile)
    console.log("[getAlignmentGanttData] 🔍 Querying user snapshots with:", {
      workspace_id: workspaceId,
      user_id: userId,
      table: "snapshots",
    });

    // 전체 데이터 확인 (해당 사용자)
    const { count: userTotalCount } = await supabase
      .from("snapshots")
      .select("*", { count: "exact", head: true })
      .eq("author_id", userId);
    console.log(
      "[getAlignmentGanttData] 📊 Total user snapshots in DB:",
      userTotalCount
    );

    // 실제 쿼리
    const { data: snapshots, error: snapshotsError } = await supabase
      .from("snapshots")
      .select(
        `
      id,
      year,
      week,
      author_id,
      workspace_id,
      profiles!snapshots_author_id_fkey(display_name, email)
    `
      )
      .eq("workspace_id", workspaceId)
      .eq("author_id", userId)
      .order("year", { ascending: true })
      .order("week", { ascending: true });

    if (snapshotsError) {
      console.error(
        "[getAlignmentGanttData] ❌ Snapshots query error:",
        JSON.stringify(snapshotsError, null, 2)
      );
      console.error(
        "[getAlignmentGanttData] ❌ Error details:",
        {
          message: snapshotsError.message,
          details: snapshotsError.details,
          hint: snapshotsError.hint,
          code: snapshotsError.code,
        }
      );
    }

    console.log(
      "[getAlignmentGanttData] 📸 User snapshots fetched:",
      snapshots?.length || 0
    );

    // 샘플 데이터 로그
    if (snapshots && snapshots.length > 0) {
      console.log(
        "[getAlignmentGanttData] 📸 Sample user snapshots:",
        snapshots.slice(0, 3).map((s) => ({
          id: s.id,
          year: s.year,
          week: s.week,
          author_id: s.author_id,
          workspace_id: (s as any).workspace_id,
        }))
      );
    }

    // Fallback: 조건으로 필터링했을 때 결과가 0개면 조건 완화하여 재확인
    if (!snapshots || snapshots.length === 0) {
      console.log(
        "[getAlignmentGanttData] 🔄 Retrying with relaxed filters..."
      );

      // 1. 해당 workspace의 모든 snapshots 확인
      const { data: workspaceSnapshots, count: workspaceCount, error: wsError } = await supabase
        .from("snapshots")
        .select("id, author_id, workspace_id, year, week", { count: "exact" })
        .eq("workspace_id", workspaceId)
        .limit(10);

      if (wsError) {
        console.error(
          "[getAlignmentGanttData] ❌ Workspace fallback error:",
          JSON.stringify(wsError, null, 2)
        );
      }

      console.log("[getAlignmentGanttData] 📊 Workspace snapshots:", {
        total: workspaceCount,
        queriedWorkspaceId: workspaceId,
        queriedUserId: userId,
        authors: [...new Set(workspaceSnapshots?.map((s) => s.author_id))],
        userMatch: workspaceSnapshots?.filter((s) => s.author_id === userId).length,
        sample: workspaceSnapshots?.slice(0, 3),
      });

      // 2. 해당 사용자의 다른 workspace snapshots 확인
      const { data: userOtherSnapshots, count: userOtherCount, error: userError } = await supabase
        .from("snapshots")
        .select("id, workspace_id, author_id, year, week", { count: "exact" })
        .eq("author_id", userId)
        .limit(10);

      if (userError) {
        console.error(
          "[getAlignmentGanttData] ❌ User fallback error:",
          JSON.stringify(userError, null, 2)
        );
      }

      console.log(
        "[getAlignmentGanttData] 📊 User snapshots in other workspaces:",
        {
          total: userOtherCount,
          workspaces: [
            ...new Set(userOtherSnapshots?.map((s) => s.workspace_id)),
          ],
          workspaceMatch: userOtherSnapshots?.filter((s) => s.workspace_id === workspaceId).length,
          sample: userOtherSnapshots?.slice(0, 3),
        }
      );

      // 3. profiles 조인 없이 쿼리 시도
      console.log(
        "[getAlignmentGanttData] 🔄 Trying query without profiles join..."
      );
      const { data: snapshotsNoJoin, error: noJoinError } = await supabase
        .from("snapshots")
        .select("id, year, week, author_id, workspace_id")
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .limit(5);

      if (noJoinError) {
        console.error(
          "[getAlignmentGanttData] ❌ No-join query error:",
          JSON.stringify(noJoinError, null, 2)
        );
      } else {
        console.log(
          "[getAlignmentGanttData] ✅ No-join query result:",
          snapshotsNoJoin?.length || 0,
          "snapshots"
        );
        if (snapshotsNoJoin && snapshotsNoJoin.length > 0) {
          console.log(
            "[getAlignmentGanttData] 📸 Sample no-join snapshots:",
            snapshotsNoJoin.slice(0, 3)
          );
        }
      }
    }

    const snapshotIds = snapshots?.map((s) => s.id) || [];

    let snapshotEntries: any[] = [];
    if (snapshotIds.length > 0) {
      console.log(
        "[getAlignmentGanttData] 🔍 Querying entries with snapshot_ids:",
        {
          count: snapshotIds.length,
          ids: snapshotIds.slice(0, 5),
        }
      );

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

      if (entriesError) {
        console.error(
          "[getAlignmentGanttData] ❌ Entries query error:",
          JSON.stringify(entriesError, null, 2)
        );
        console.error(
          "[getAlignmentGanttData] ❌ Entries error details:",
          {
            message: entriesError.message,
            details: entriesError.details,
            hint: entriesError.hint,
            code: entriesError.code,
          }
        );
      }

      snapshotEntries = entriesData || [];
      console.log(
        "[getAlignmentGanttData] 📦 User snapshot entries fetched:",
        snapshotEntries.length
      );

      // 샘플 엔트리 로그 (첫 3개)
      if (snapshotEntries.length > 0) {
        console.log(
          "[getAlignmentGanttData] 📦 Sample entries:",
          snapshotEntries.slice(0, 3).map((e) => ({
            id: e.id,
            snapshot_id: e.snapshot_id,
            domain: e.domain,
            project: e.project,
            module: e.module,
            feature: e.feature,
          }))
        );
      }
    } else {
      console.log(
        "[getAlignmentGanttData] ⚠️ No snapshots found for user, skipping entries query"
      );
    }

    // 3. Snapshot 맵 생성 (snapshot_id -> {year, week, authorName, authorId})
    const snapshotMap = new Map(
      snapshots?.map((s) => {
        const profile = (s as any).profiles;
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
        plan.assignees?.map((a: any) => ({
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
              (sum: number, task: any) => sum + (task.progress || 0),
              0
            ) / tasks.length
          : 0;

      // 메타 정보로 고유 키 생성 (연결 화살표용)
      const metaKey = `${entry.domain}::${entry.project}::${
        entry.module || ""
      }::${entry.feature || ""}`;

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
        authorName: snapshot.authorName, // 작성자 이름 추가
        authorId: snapshot.authorId, // 작성자 ID 추가 (화살표 연결용)
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

    console.log("[getAlignmentGanttData] ✅ Final items:", {
      total: items.length,
      plans: planItems.length,
      snapshots: snapshotItems.length,
    });

    // 7. 워크스페이스 멤버 목록 조회 (DraftGanttView에서 필요)
    const { data: members } = await supabase
      .from("workspace_members")
      .select(
        `
      user_id,
      basic_role,
      profiles!inner(display_name, email)
    `
      )
      .eq("workspace_id", workspaceId);

    const membersList =
      members?.map((m: any) => ({
        userId: m.user_id,
        displayName: m.profiles?.display_name || m.profiles?.email || m.user_id,
        email: m.profiles?.email || undefined,
        basicRole:
          (m.basic_role as "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null) ||
          null,
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
      .select(
        `
        user_id,
        basic_role,
        profiles!inner(display_name, email)
      `
      )
      .eq("workspace_id", workspaceId);

    const membersList =
      members?.map((m: any) => ({
        userId: m.user_id,
        displayName: m.profiles?.display_name || m.profiles?.email || m.user_id,
        email: m.profiles?.email || undefined,
        basicRole:
          (m.basic_role as "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null) ||
          null,
      })) || [];

    return {
      items: [],
      members: membersList,
    };
  }
}
