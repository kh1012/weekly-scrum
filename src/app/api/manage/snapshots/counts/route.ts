import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/manage/snapshots/counts
 * 
 * 특정 년도의 모든 주차별 본인 엔트리 갯수 조회
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");
  const year = searchParams.get("year");

  if (!workspaceId || !userId || !year) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 현재 사용자의 display_name 조회 (author_id 또는 author_display_name으로 매칭)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .single();

  const displayName = profile?.display_name;

  // 해당 연도의 모든 스냅샷 조회 (주차 정보 포함)
  const yearNum = parseInt(year, 10);
  const yearStart = `${yearNum}-01-01`;
  const yearEnd = `${yearNum}-12-31`;

  const { data: snapshots, error: snapshotError } = await supabase
    .from("snapshots")
    .select("id, week")
    .eq("workspace_id", workspaceId)
    .gte("week_start_date", yearStart)
    .lte("week_start_date", yearEnd);

  if (snapshotError) {
    console.error("Error fetching snapshots:", snapshotError);
    return NextResponse.json(
      { error: "Failed to fetch snapshots" },
      { status: 500 }
    );
  }

  if (!snapshots || snapshots.length === 0) {
    return NextResponse.json({ counts: {} });
  }

  const snapshotIds = snapshots.map((s) => s.id);

  // 해당 스냅샷들의 엔트리 중 본인이 작성한 것만 조회
  // author_id 또는 author_display_name으로 매칭
  let entriesQuery = supabase
    .from("snapshot_entries")
    .select("snapshot_id")
    .in("snapshot_id", snapshotIds);

  // author_id 또는 author_display_name으로 필터
  if (displayName) {
    entriesQuery = entriesQuery.or(`author_id.eq.${userId},author_display_name.eq.${displayName}`);
  } else {
    entriesQuery = entriesQuery.eq("author_id", userId);
  }

  const { data: entries, error: entriesError } = await entriesQuery;

  if (entriesError) {
    console.error("Error fetching entries:", entriesError);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }

  // snapshot_id → week 매핑 생성
  const snapshotWeekMap = new Map<string, string>();
  snapshots.forEach((s) => {
    if (s.week) {
      snapshotWeekMap.set(s.id, s.week);
    }
  });

  // 주차별 엔트리 갯수 계산 (key: "년도-주차", value: 갯수)
  const countMap: Record<string, number> = {};
  
  (entries || []).forEach((entry) => {
    const week = snapshotWeekMap.get(entry.snapshot_id);
    if (week) {
      const weekNum = parseInt(week.replace("W", ""), 10);
      const key = `${yearNum}-${weekNum}`;
      countMap[key] = (countMap[key] || 0) + 1;
    }
  });

  return NextResponse.json({
    counts: countMap,
  });
}
