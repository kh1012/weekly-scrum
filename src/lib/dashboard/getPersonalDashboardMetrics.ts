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

  // user_page_visits 테이블이 존재하는지 확인 (try-catch로 처리)
  try {
    // 최근 14일 방문 기록 조회
    const { data: visits } = await supabase
      .from("user_page_visits")
      .select("path, created_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .gte("created_at", fourteenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (visits && visits.length > 0) {
      // 최근 7일 방문 총 횟수
      const visits7d = visits.filter(
        (v) => new Date(v.created_at) >= sevenDaysAgo
      );
      visits7dTotal = visits7d.length;

      // Top 5 Routes (최근 7일)
      const routeCounts = new Map<string, number>();
      for (const visit of visits7d) {
        routeCounts.set(visit.path, (routeCounts.get(visit.path) || 0) + 1);
      }
      topRoutes7d = Array.from(routeCounts.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Visits by Day (최근 14일)
      const dayCounts = new Map<string, number>();
      for (const visit of visits) {
        const dateStr = new Date(visit.created_at).toISOString().split("T")[0];
        dayCounts.set(dateStr, (dayCounts.get(dateStr) || 0) + 1);
      }
      visitsByDay14d = Array.from(dayCounts.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 마지막 방문 시각
      lastVisitAt = visits[0].created_at;
    }
  } catch (err) {
    // 테이블이 없거나 RLS 오류 시 무시
    console.warn("user_page_visits table not available:", err);
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
  };
}

