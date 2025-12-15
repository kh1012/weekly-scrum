import { createClient } from "@/lib/supabase/server";
import type { WeeklyScrumData, WeekOption, ScrumItem } from "@/types/scrum";

/**
 * Supabase snapshot_entry를 ScrumItem (v1 형식)으로 변환
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertEntryToScrumItem(entry: any): ScrumItem {
  const pastWeekTasks = entry.past_week_tasks || [];
  const avgProgress =
    pastWeekTasks.length > 0
      ? Math.round(
          pastWeekTasks.reduce(
            (sum: number, t: { progress: number }) => sum + t.progress,
            0
          ) / pastWeekTasks.length
        )
      : 0;

  return {
    name: entry.name,
    domain: entry.domain,
    project: entry.project,
    module: entry.module || null,
    topic: entry.feature || "",
    plan:
      pastWeekTasks
        .map((t: { title: string; progress: number }) => `${t.title} (${t.progress}%)`)
        .join(", ") || "",
    planPercent: avgProgress,
    progress: pastWeekTasks.map(
      (t: { title: string; progress: number }) => `${t.title} (${t.progress}%)`
    ),
    progressPercent: avgProgress,
    reason: "",
    next: entry.this_week_tasks || [],
    risk: entry.risk,
    riskLevel: entry.risk_level,
    collaborators: entry.collaborators || [],
  };
}

/**
 * Supabase에서 모든 스냅샷 데이터 조회
 */
export async function getAllSnapshotsFromSupabase(
  workspaceId: string
): Promise<Record<string, WeeklyScrumData>> {
  const supabase = await createClient();

  const { data: snapshots, error } = await supabase
    .from("snapshots")
    .select("*, entries:snapshot_entries(*)")
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching snapshots from Supabase:", error);
    return {};
  }

  const allData: Record<string, WeeklyScrumData> = {};

  for (const snapshot of snapshots || []) {
    const key = `${snapshot.year}-${snapshot.week}`;
    
    // weekStart에서 월 추출
    const [, month] = snapshot.week_start_date.split("-").map(Number);

    const items = (snapshot.entries || []).map(convertEntryToScrumItem);

    allData[key] = {
      year: snapshot.year,
      month: month,
      week: snapshot.week,
      range: `${snapshot.week_start_date} ~ ${snapshot.week_end_date}`,
      items,
    };
  }

  return allData;
}

/**
 * Supabase에서 사용 가능한 주차 목록 조회
 */
export async function getAvailableWeeksFromSupabase(
  workspaceId: string
): Promise<WeekOption[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("year, week, week_start_date, week_end_date")
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching weeks from Supabase:", error);
    return [];
  }

  return (data || []).map((row) => ({
    year: row.year,
    week: row.week,
    weekStart: row.week_start_date,
    weekEnd: row.week_end_date,
    key: `${row.year}-${row.week}`,
    label: `${row.year}년 ${row.week}`,
    filePath: "", // Supabase에서는 파일 경로 없음
  }));
}

/**
 * 데이터 소스 선택 (Supabase 우선, 실패 시 정적 파일)
 */
export async function getDataSource(workspaceId: string): Promise<{
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  source: "supabase" | "static";
}> {
  try {
    // Supabase에서 데이터 조회 시도
    const [allData, weeks] = await Promise.all([
      getAllSnapshotsFromSupabase(workspaceId),
      getAvailableWeeksFromSupabase(workspaceId),
    ]);

    // 데이터가 있으면 Supabase 사용
    if (Object.keys(allData).length > 0) {
      return { allData, weeks, source: "supabase" };
    }

    // 데이터가 없으면 정적 파일로 폴백
    throw new Error("No data in Supabase, falling back to static files");
  } catch (error) {
    console.log("Falling back to static files:", error);

    // 정적 파일에서 데이터 조회
    const { getAllScrumData, getAvailableWeeks } = await import(
      "@/lib/scrumData"
    );
    const allData = getAllScrumData();
    const weeks = getAvailableWeeks() as WeekOption[];

    return { allData, weeks, source: "static" };
  }
}

