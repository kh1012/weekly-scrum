/**
 * Personal Dashboard Metrics Aggregator V2
 *
 * Materialized View를 사용한 최적화 버전
 * - 집계 데이터는 Materialized View에서 조회
 * - 실시간 데이터만 직접 쿼리
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentISOWeek, getPreviousISOWeek } from "@/lib/utils/date";
import type { PersonalDashboardMetrics, RecentSnapshotEntry } from "./getPersonalDashboardMetrics";

/**
 * 개인 대시보드 메트릭 조회 (V2 - Materialized View 사용)
 */
export async function getPersonalDashboardMetricsV2({
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

  // 7일 전, 14일 전 날짜 계산
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // ========================================
  // 병렬 쿼리 실행 (Materialized View 우선 사용)
  // ========================================

  const [
    userStatsResult,
    weeklyStatsResult,
    domainDistResult,
    planStatsResult,
    visitsResult,
    recentEntriesResult,
  ] = await Promise.allSettled([
    // 1. 사용자 스냅샷 통계 (Materialized View)
    supabase
      .from("user_snapshot_stats")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("author_id", userId)
      .maybeSingle(),

    // 2. 주차별 통계 (Materialized View) - 최근 8주
    supabase
      .from("weekly_entry_stats")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("author_id", userId)
      .order("year", { ascending: false })
      .order("week", { ascending: false })
      .limit(8),

    // 3. 도메인 분포 (Materialized View)
    supabase
      .from("domain_project_distribution")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("author_id", userId)
      .order("entry_count", { ascending: false })
      .limit(10),

    // 4. Plan 통계 (Materialized View)
    supabase
      .from("user_plan_stats")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle(),

    // 5. Usage 메트릭 (실시간 데이터)
    supabase
      .from("menu_events")
      .select("page_path, occurred_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("event_type", "PAGE_VIEW")
      .gte("occurred_at", fourteenDaysAgo.toISOString())
      .order("occurred_at", { ascending: false }),

    // 6. 최근 엔트리 (실시간 데이터)
    supabase
      .rpc("get_recent_user_entries", {
        p_workspace_id: workspaceId,
        p_user_id: userId,
        p_limit: 5,
      }),
  ]);

  // ========================================
  // A) Snapshot Metrics 처리
  // ========================================

  const userStats =
    userStatsResult.status === "fulfilled" ? userStatsResult.value.data : null;

  const snapshotWeeksCount = userStats?.unique_weeks_count || 0;
  const entriesTotal = userStats?.total_entries_count || 0;
  const lastSnapshotAt = userStats?.last_entry_at || null;

  // 이번 주/지난 주 엔트리는 실시간으로 조회 (Materialized View는 지연될 수 있음)
  const weeklyStats =
    weeklyStatsResult.status === "fulfilled" ? weeklyStatsResult.value.data : null;

  const thisWeekStats = weeklyStats?.find(
    (w) => w.year === currentWeek.year && w.week === currentWeekLabel
  );
  const lastWeekStats = weeklyStats?.find(
    (w) => w.year === previousWeek.year && w.week === previousWeekLabel
  );

  const entriesThisWeek = thisWeekStats?.entry_count || 0;
  const entriesLastWeek = lastWeekStats?.entry_count || 0;

  // ========================================
  // B) Plan Metrics 처리
  // ========================================

  const planStats =
    planStatsResult.status === "fulfilled" ? planStatsResult.value.data : null;

  const assignedTotal = planStats?.assigned_total || 0;
  const assignedActive = planStats?.assigned_active || 0;

  // ========================================
  // C) Usage Metrics 처리
  // ========================================

  let visits7dTotal = 0;
  let topRoutes7d: { path: string; count: number }[] = [];
  let visitsByDay14d: { date: string; count: number }[] = [];
  let lastVisitAt: string | null = null;

  const visits =
    visitsResult.status === "fulfilled" ? visitsResult.value.data : null;

  if (visits && visits.length > 0) {
    const visits7d = visits.filter(
      (v) => new Date(v.occurred_at) >= sevenDaysAgo
    );
    visits7dTotal = visits7d.length;

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

    const dayCounts = new Map<string, number>();
    for (const visit of visits) {
      const dateStr = new Date(visit.occurred_at).toISOString().split("T")[0];
      dayCounts.set(dateStr, (dayCounts.get(dateStr) || 0) + 1);
    }
    visitsByDay14d = Array.from(dayCounts.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    lastVisitAt = visits[0].occurred_at;
  }

  // ========================================
  // D) Additional Data 처리
  // ========================================

  // 최근 엔트리
  const recentEntries: RecentSnapshotEntry[] =
    recentEntriesResult.status === "fulfilled" && recentEntriesResult.value.data
      ? recentEntriesResult.value.data.map((e: any) => ({
          id: e.id,
          name: e.name,
          domain: e.domain,
          project: e.project,
          module: e.module || "",
          feature: e.feature || "",
          updatedAt: e.updated_at,
          year: e.year,
          week: e.week,
        }))
      : [];

  // 도메인 분포 (Materialized View에서)
  const domainDistribution =
    domainDistResult.status === "fulfilled" && domainDistResult.value.data
      ? domainDistResult.value.data.map((d) => ({
          label: d.domain_project_label,
          count: d.entry_count,
        }))
      : [];

  // 주차별 추이 (Materialized View에서)
  const weeklyTrend =
    weeklyStats?.map((w) => ({
      week: `${w.year}-${w.week}`,
      count: w.entry_count,
    })) || [];

  const weeklyProgressTrend =
    weeklyStats?.map((w) => ({
      week: `${w.year}-${w.week}`,
      avgProgress: w.avg_progress || 0,
      entryCount: w.entry_count,
    })) || [];

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
