import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/manage/snapshots/counts
 *
 * 모든 주차별 본인 엔트리 갯수 조회
 * year 파라미터는 선택적 (없으면 모든 연도 조회)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");
  const year = searchParams.get("year");

  console.log("[API /api/manage/snapshots/counts] Request params:", {
    workspaceId,
    userId,
    year,
  });

  if (!workspaceId || !userId) {
    console.error(
      "[API /api/manage/snapshots/counts] Missing required parameters"
    );
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

  // 모든 스냅샷 조회 (주차 정보 및 연도 정보 포함)
  // year 파라미터가 있으면 해당 연도만, 없으면 모든 연도
  let snapshotsQuery = supabase
    .from("snapshots")
    .select("id, week, year, week_start_date")
    .eq("workspace_id", workspaceId);

  if (year) {
    const yearNum = parseInt(year, 10);
    const yearStart = `${yearNum}-01-01`;
    const yearEnd = `${yearNum}-12-31`;
    snapshotsQuery = snapshotsQuery
      .gte("week_start_date", yearStart)
      .lte("week_start_date", yearEnd);
  }

  const { data: snapshots, error: snapshotError } = await snapshotsQuery;

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
    entriesQuery = entriesQuery.or(
      `author_id.eq.${userId},author_display_name.eq.${displayName}`
    );
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

  // snapshot_id → (week, year) 매핑 생성
  const snapshotInfoMap = new Map<string, { week: string; year: number }>();
  snapshots.forEach((s) => {
    if (s.week && s.year) {
      // DB에 저장된 year 컬럼 사용 (ISO 주차 연도)
      snapshotInfoMap.set(s.id, { week: s.week, year: s.year });
    }
  });

  // 주차별 엔트리 갯수 계산 (key: "년도-주차", value: 갯수)
  const countMap: Record<string, number> = {};

  (entries || []).forEach((entry) => {
    const info = snapshotInfoMap.get(entry.snapshot_id);
    if (info) {
      const weekNum = parseInt(info.week.replace("W", ""), 10);
      const key = `${info.year}-${weekNum}`;
      countMap[key] = (countMap[key] || 0) + 1;
    }
  });

  return NextResponse.json({
    counts: countMap,
  });
}
