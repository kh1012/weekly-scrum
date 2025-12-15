import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeWeekStats } from "@/lib/stats/snapshotWeekStats";

/**
 * GET /api/manage/snapshots
 * 
 * 특정 주차의 내 스냅샷 목록 조회
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");
  const weekStartDate = searchParams.get("weekStartDate");

  if (!workspaceId || !userId || !weekStartDate) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 스냅샷 목록 조회
  const { data: snapshots, error } = await supabase
    .from("snapshots")
    .select(`
      id,
      title,
      created_at,
      updated_at,
      entries:snapshot_entries(
        id,
        project,
        module,
        feature,
        past_week_tasks
      )
    `)
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId)
    .eq("week_start_date", weekStartDate)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching snapshots:", error);
    return NextResponse.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 }
    );
  }

  // 스냅샷 요약 데이터 생성
  const snapshotSummaries = (snapshots || []).map((snapshot) => ({
    id: snapshot.id,
    title: snapshot.title,
    created_at: snapshot.created_at,
    updated_at: snapshot.updated_at,
    entriesCount: snapshot.entries?.length || 0,
    entries: (snapshot.entries || []).map((e) => ({
      project: e.project,
      module: e.module,
      feature: e.feature,
    })),
  }));

  // 모든 엔트리를 모아서 통계 계산
  const allEntries = (snapshots || []).flatMap((s) => s.entries || []);
  const stats = computeWeekStats(allEntries as Parameters<typeof computeWeekStats>[0]);

  return NextResponse.json({
    snapshots: snapshotSummaries,
    stats,
  });
}

