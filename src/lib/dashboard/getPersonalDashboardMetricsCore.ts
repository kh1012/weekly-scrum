/**
 * Personal Dashboard Core Metrics
 *
 * 증분 로딩 전략: 핵심 메트릭만 먼저 로딩
 * - 서버 사이드에서 핵심 숫자 데이터만 조회
 * - 차트 데이터는 클라이언트에서 별도 로딩
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentISOWeek, getPreviousISOWeek } from "@/lib/utils/date";

export interface CoreMetrics {
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
  };
  usage: {
    visits7dTotal: number;
    lastVisitAt: string | null;
  };
}

/**
 * 핵심 메트릭만 조회 (빠른 초기 렌더링용)
 */
export async function getPersonalDashboardMetricsCore({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): Promise<CoreMetrics> {
  const supabase = await createClient();

  const currentWeek = getCurrentISOWeek();
  const previousWeek = getPreviousISOWeek(currentWeek.year, currentWeek.week);
  const currentWeekLabel = `W${currentWeek.week.toString().padStart(2, "0")}`;
  const previousWeekLabel = `W${previousWeek.week.toString().padStart(2, "0")}`;

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // 핵심 데이터만 병렬로 조회
  const [userStatsResult, weeklyStatsResult, planStatsResult, visitsCountResult] =
    await Promise.allSettled([
      // Materialized View 사용
      supabase
        .from("user_snapshot_stats")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .maybeSingle(),

      // 이번 주/지난 주 통계
      supabase
        .from("weekly_entry_stats")
        .select("year, week, entry_count")
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .or(
          `and(year.eq.${currentWeek.year},week.eq.${currentWeekLabel}),and(year.eq.${previousWeek.year},week.eq.${previousWeekLabel})`
        ),

      // Plan 통계
      supabase
        .from("user_plan_stats")
        .select("assigned_total, assigned_active")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .maybeSingle(),

      // 최근 7일 방문 수만
      supabase
        .from("menu_events")
        .select("occurred_at", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .eq("event_type", "PAGE_VIEW")
        .gte("occurred_at", sevenDaysAgo.toISOString()),
    ]);

  // 결과 추출
  const userStats =
    userStatsResult.status === "fulfilled" ? userStatsResult.value.data : null;

  const weeklyStats =
    weeklyStatsResult.status === "fulfilled"
      ? weeklyStatsResult.value.data
      : null;

  const thisWeek = weeklyStats?.find(
    (w) => w.year === currentWeek.year && w.week === currentWeekLabel
  );
  const lastWeek = weeklyStats?.find(
    (w) => w.year === previousWeek.year && w.week === previousWeekLabel
  );

  const planStats =
    planStatsResult.status === "fulfilled"
      ? planStatsResult.value.data
      : null;

  const visitsCount =
    visitsCountResult.status === "fulfilled"
      ? visitsCountResult.value.count || 0
      : 0;

  // 마지막 방문 시각은 한 건만 조회
  const lastVisitResult = await supabase
    .from("menu_events")
    .select("occurred_at")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .eq("event_type", "PAGE_VIEW")
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    snapshots: {
      weeksCount: userStats?.unique_weeks_count || 0,
      entriesTotal: userStats?.total_entries_count || 0,
      entriesThisWeek: thisWeek?.entry_count || 0,
      entriesLastWeek: lastWeek?.entry_count || 0,
      lastSnapshotAt: userStats?.last_entry_at || null,
    },
    plans: {
      assignedTotal: planStats?.assigned_total || 0,
      assignedActive: planStats?.assigned_active || 0,
    },
    usage: {
      visits7dTotal: visitsCount,
      lastVisitAt: lastVisitResult.data?.occurred_at || null,
    },
  };
}
