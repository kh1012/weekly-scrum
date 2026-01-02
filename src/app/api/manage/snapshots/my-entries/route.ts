import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getISOWeekFromDate, formatDate } from "@/lib/date/isoWeek";

/**
 * GET /api/manage/snapshots/my-entries
 * 
 * 본인의 모든 스냅샷 엔트리를 주차별로 그룹화하여 조회
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const workspaceId = searchParams.get("workspaceId");
  const userId = searchParams.get("userId");

  if (!workspaceId || !userId) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  // 사용자 프로필에서 display_name 조회 (name이 비어있을 때 사용)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .single();

  const defaultName = profile?.display_name?.trim() || "";

  // 본인의 모든 스냅샷과 엔트리 조회 (새 DB 스키마: risks, collaborators 별도 컬럼)
  const { data: snapshots, error } = await supabase
    .from("snapshots")
    .select(`
      id,
      year,
      week,
      week_start_date,
      week_end_date,
      entries:snapshot_entries(
        id,
        name,
        domain,
        project,
        module,
        feature,
        past_week,
        this_week,
        risks,
        risk_level,
        collaborators
      )
    `)
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching my entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch entries" },
      { status: 500 }
    );
  }

  // entries의 name이 비어있거나 "지정된 이름없음"이면 defaultName으로 채우기
  (snapshots || []).forEach((snapshot) => {
    (snapshot.entries || []).forEach((entry: any) => {
      const entryName = entry.name?.trim();
      if (!entryName || entryName === "지정된 이름없음" || entryName === "사용자") {
        entry.name = defaultName;
      }
    });
  });

  // 주차별로 그룹화
  const weeklyData: Record<string, {
    year: number;
    week: string;
    weekStartDate: string;
    weekEndDate: string;
    entries: NonNullable<typeof snapshots>[number]["entries"];
  }> = {};

  (snapshots || []).forEach((snapshot) => {
    // DB에 year/week가 있으면 사용, 없으면 week_start_date에서 계산
    let year: number;
    let weekLabel: string;
    let weekEndDateStr: string;

    if (snapshot.year && snapshot.week) {
      year = snapshot.year;
      weekLabel = snapshot.week;
      weekEndDateStr = snapshot.week_end_date || formatDate(
        new Date(new Date(snapshot.week_start_date).getTime() + 6 * 24 * 60 * 60 * 1000)
      );
    } else {
      const weekInfo = getISOWeekFromDate(new Date(snapshot.week_start_date));
      year = weekInfo.year;
      weekLabel = `W${weekInfo.week.toString().padStart(2, "0")}`;
      weekEndDateStr = formatDate(weekInfo.weekEnd);
    }

    const weekKey = `${year}-${weekLabel}`;
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        year,
        week: weekLabel,
        weekStartDate: snapshot.week_start_date,
        weekEndDate: weekEndDateStr,
        entries: [],
      };
    }
    weeklyData[weekKey].entries.push(...(snapshot.entries || []));
  });

  // 배열로 변환 (엔트리가 0개인 주차는 제외)
  const weeks = Object.entries(weeklyData)
    .map(([key, data]) => ({
      key,
      ...data,
      entriesCount: data.entries.length,
    }))
    .filter((week) => week.entriesCount > 0);

  return NextResponse.json({ weeks });
}

