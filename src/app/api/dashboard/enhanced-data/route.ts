/**
 * Enhanced Dashboard Data API
 *
 * 차트 및 부가 데이터를 위한 API
 * 클라이언트에서 증분 로딩을 위해 사용
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentISOWeek } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const dataType = searchParams.get("type"); // 'charts', 'recent', 'distribution', 'all'

  if (!workspaceId) {
    return NextResponse.json(
      { error: "workspaceId is required" },
      { status: 400 }
    );
  }

  try {
    const result: any = {};

    // 요청된 데이터 타입에 따라 조회
    if (!dataType || dataType === "all" || dataType === "recent") {
      // 최근 엔트리
      const { data: recentEntries } = await supabase.rpc(
        "get_recent_user_entries",
        {
          p_workspace_id: workspaceId,
          p_user_id: user.id,
          p_limit: 5,
        }
      );
      result.recentEntries = recentEntries || [];
    }

    if (!dataType || dataType === "all" || dataType === "distribution") {
      // 도메인 분포
      const { data: domainDist } = await supabase
        .from("domain_project_distribution")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("author_id", user.id)
        .order("entry_count", { ascending: false })
        .limit(10);

      result.domainDistribution =
        domainDist?.map((d) => ({
          label: d.domain_project_label,
          count: d.entry_count,
        })) || [];
    }

    if (!dataType || dataType === "all" || dataType === "charts") {
      // 주차별 추이
      const { data: weeklyData } = await supabase
        .from("weekly_entry_stats")
        .select("year, week, entry_count, avg_progress")
        .eq("workspace_id", workspaceId)
        .eq("author_id", user.id)
        .order("year", { ascending: false })
        .order("week", { ascending: false })
        .limit(8);

      const sortedWeekly = weeklyData?.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week.localeCompare(b.week);
      });

      result.weeklyTrend =
        sortedWeekly?.map((w) => ({
          week: `${w.year}-${w.week}`,
          count: w.entry_count,
        })) || [];

      result.weeklyProgressTrend =
        sortedWeekly?.map((w) => ({
          week: `${w.year}-${w.week}`,
          avgProgress: Math.round((w.avg_progress || 0) * 10) / 10,
          entryCount: w.entry_count,
        })) || [];

      // Usage 상세 데이터
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const { data: visits } = await supabase
        .from("menu_events")
        .select("page_path, occurred_at")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .eq("event_type", "PAGE_VIEW")
        .gte("occurred_at", fourteenDaysAgo.toISOString())
        .order("occurred_at", { ascending: false });

      if (visits) {
        const visits7d = visits.filter(
          (v) => new Date(v.occurred_at) >= sevenDaysAgo
        );

        // Top Routes
        const routeCounts = new Map<string, number>();
        for (const visit of visits7d) {
          routeCounts.set(
            visit.page_path,
            (routeCounts.get(visit.page_path) || 0) + 1
          );
        }
        result.topRoutes7d = Array.from(routeCounts.entries())
          .map(([path, count]) => ({ path, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Visits by Day
        const dayCounts = new Map<string, number>();
        for (const visit of visits) {
          const dateStr = new Date(visit.occurred_at)
            .toISOString()
            .split("T")[0];
          dayCounts.set(dateStr, (dayCounts.get(dateStr) || 0) + 1);
        }
        result.visitsByDay14d = Array.from(dayCounts.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Enhanced data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch enhanced data" },
      { status: 500 }
    );
  }
}
