import { createClient } from "@/lib/supabase/server";
import type { WeeklyScrumData, WeekOption, ScrumItem } from "@/types/scrum";

/**
 * snapshot_weeks 기반 주차 목록 타입
 */
export interface SnapshotWeek {
  id: string;
  workspace_id: string;
  year: number;
  week: string;
  week_start_date: string;
  week_end_date: string;
}

/**
 * Supabase snapshot_entry를 ScrumItem (v1 형식)으로 변환
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertEntryToScrumItem(entry: any): ScrumItem {
  // past_week은 { tasks: [...] } 형태의 jsonb 필드
  const pastWeek = entry.past_week || {};
  const pastWeekTasks = pastWeek.tasks || [];
  
  // this_week도 { tasks: [...] } 형태의 jsonb 필드
  const thisWeek = entry.this_week || {};
  const thisWeekTasks = thisWeek.tasks || [];
  
  const avgProgress =
    pastWeekTasks.length > 0
      ? Math.round(
          pastWeekTasks.reduce(
            (sum: number, t: { progress: number }) => sum + (t.progress || 0),
            0
          ) / pastWeekTasks.length
        )
      : 0;

  // collaborators에서 relation 필드 제거하고 relations만 사용하도록 정규화
  const normalizedCollaborators = (entry.collaborators || []).map(
    (c: { name: string; relation?: string; relations?: string[] }) => ({
      name: c.name,
      relations: c.relations || (c.relation ? [c.relation] : []),
    })
  );

  return {
    name: entry.name || "",
    domain: entry.domain,
    project: entry.project,
    module: entry.module || null,
    topic: entry.feature || "",
    plan:
      pastWeekTasks
        .map((t: { title: string; progress: number }) => `${t.title} (${t.progress || 0}%)`)
        .join(", ") || "",
    planPercent: avgProgress,
    progress: pastWeekTasks.map(
      (t: { title: string; progress: number }) => `${t.title} (${t.progress || 0}%)`
    ),
    progressPercent: avgProgress,
    reason: "",
    next: thisWeekTasks,
    risk: entry.risk,
    riskLevel: entry.risk_level,
    collaborators: normalizedCollaborators,
  };
}

/**
 * Supabase에서 모든 스냅샷 데이터 조회 (snapshot_weeks 기반)
 * 같은 주차의 모든 개인 스냅샷 entries를 합쳐서 반환
 * 
 * 폴백 전략:
 * 1. snapshot_weeks 테이블이 있으면 주차 목록으로 사용
 * 2. snapshot_weeks가 비어있으면 snapshots에서 직접 주차 추출 (레거시 호환)
 */
export async function getAllSnapshotsFromSupabase(
  workspaceId: string
): Promise<Record<string, WeeklyScrumData>> {
  const supabase = await createClient();

  // 1. 모든 스냅샷과 entries를 한 번에 조회
  const { data: snapshots, error } = await supabase
    .from("snapshots")
    .select("*, entries:snapshot_entries(*)")
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching snapshots from Supabase:", error);
    return {};
  }

  if (!snapshots || snapshots.length === 0) {
    console.log("[getAllSnapshotsFromSupabase] No snapshots found");
    return {};
  }

  // 2. snapshot_weeks에서 주차 목록 조회 (중복 없음)
  const weeks = await listSnapshotWeeks(workspaceId);
  
  console.log(`[getAllSnapshotsFromSupabase] Found ${weeks.length} weeks in snapshot_weeks, ${snapshots.length} snapshots`);

  // 3. 주차별로 스냅샷 entries 그룹화
  const allData: Record<string, WeeklyScrumData> = {};

  if (weeks.length > 0) {
    // snapshot_weeks 테이블 기준으로 그룹화
    for (const week of weeks) {
      const key = `${week.year}-${week.week}`;
      const [, month] = week.week_start_date.split("-").map(Number);

      // 해당 주차의 모든 스냅샷에서 entries 수집
      // week_id로 조인 (우선), 없으면 year/week 또는 week_start_date로 폴백
      const weekSnapshots = snapshots.filter((s) => {
        // week_id로 매칭 (FK 연결된 경우)
        if (s.week_id && s.week_id === week.id) {
          return true;
        }
        // year/week으로 매칭 (레거시 데이터)
        if (s.year === week.year && s.week === week.week) {
          return true;
        }
        // week_start_date로 매칭 (최후의 폴백)
        if (s.week_start_date === week.week_start_date) {
          return true;
        }
        return false;
      });
      
      // 모든 entries 합치기
      const allItems: ScrumItem[] = [];
      for (const snapshot of weekSnapshots) {
        const items = (snapshot.entries || []).map(convertEntryToScrumItem);
        allItems.push(...items);
      }

      allData[key] = {
        year: week.year,
        month: month,
        week: week.week,
        range: `${week.week_start_date} ~ ${week.week_end_date}`,
        items: allItems,
      };
    }
  } else {
    // snapshot_weeks가 비어있으면 snapshots에서 직접 주차 추출 (레거시 호환)
    console.log("[getAllSnapshotsFromSupabase] Fallback: extracting weeks from snapshots directly");
    
    // 주차별로 그룹화 (중복 제거)
    const weekMap = new Map<string, { year: number; week: string; weekStart: string; weekEnd: string; snapshots: typeof snapshots }>();
    
    for (const snapshot of snapshots) {
      if (!snapshot.year || !snapshot.week) continue;
      
      const key = `${snapshot.year}-${snapshot.week}`;
      if (!weekMap.has(key)) {
        weekMap.set(key, {
          year: snapshot.year,
          week: snapshot.week,
          weekStart: snapshot.week_start_date,
          weekEnd: snapshot.week_end_date || snapshot.week_start_date,
          snapshots: [],
        });
      }
      weekMap.get(key)!.snapshots.push(snapshot);
    }

    for (const [key, weekData] of weekMap) {
      const [, month] = weekData.weekStart.split("-").map(Number);
      
      const allItems: ScrumItem[] = [];
      for (const snapshot of weekData.snapshots) {
        const items = (snapshot.entries || []).map(convertEntryToScrumItem);
        allItems.push(...items);
      }

      allData[key] = {
        year: weekData.year,
        month: month,
        week: weekData.week,
        range: `${weekData.weekStart} ~ ${weekData.weekEnd}`,
        items: allItems,
      };
    }
  }

  console.log(`[getAllSnapshotsFromSupabase] Returning ${Object.keys(allData).length} weeks with data`);
  return allData;
}

/**
 * snapshot_weeks 테이블에서 주차 목록 조회 (중복 없음)
 * @param workspaceId - 워크스페이스 ID
 * @returns 주차 목록 (week_start_date DESC 정렬)
 */
export async function listSnapshotWeeks(
  workspaceId: string
): Promise<SnapshotWeek[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshot_weeks")
    .select("id, workspace_id, year, week, week_start_date, week_end_date")
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching snapshot_weeks:", error);
    return [];
  }

  return data || [];
}

/**
 * Supabase에서 사용 가능한 주차 목록 조회 (snapshot_weeks 기반 - 중복 없음)
 * 폴백: snapshot_weeks가 비어있으면 snapshots에서 직접 추출
 * 
 * @param workspaceId - 워크스페이스 ID
 * @returns WeekOption 배열
 */
export async function getAvailableWeeksFromSupabase(
  workspaceId: string
): Promise<WeekOption[]> {
  // 1. snapshot_weeks에서 주차 목록 조회
  const weeks = await listSnapshotWeeks(workspaceId);

  if (weeks.length > 0) {
    return weeks.map((row) => ({
      id: row.id,
      year: row.year,
      week: row.week,
      weekStart: row.week_start_date,
      weekEnd: row.week_end_date,
      key: `${row.year}-${row.week}`,
      label: `${row.year}년 ${row.week}`,
      filePath: "", // Supabase에서는 파일 경로 없음
    }));
  }

  // 2. 폴백: snapshots에서 직접 주차 추출 (중복 제거)
  console.log("[getAvailableWeeksFromSupabase] Fallback: extracting weeks from snapshots");
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

  // 중복 제거
  const weekMap = new Map<string, WeekOption>();
  for (const row of data || []) {
    if (!row.year || !row.week) continue;
    
    const key = `${row.year}-${row.week}`;
    if (!weekMap.has(key)) {
      weekMap.set(key, {
        year: row.year,
        week: row.week,
        weekStart: row.week_start_date,
        weekEnd: row.week_end_date || row.week_start_date,
        key,
        label: `${row.year}년 ${row.week}`,
        filePath: "",
      });
    }
  }

  return Array.from(weekMap.values());
}

/**
 * 데이터 소스 선택 (Supabase와 정적 파일 데이터 병합)
 * - 기존 정적 파일 데이터는 유지
 * - Supabase에 동일 주차 데이터가 있으면 Supabase 데이터로 덮어씀
 */
export async function getDataSource(workspaceId: string): Promise<{
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  source: "supabase" | "static" | "merged";
}> {
  // 정적 파일에서 데이터 조회 (기본 데이터)
  const { getAllScrumData, getAvailableWeeks } = await import(
    "@/lib/scrumData"
  );
  const staticAllData = getAllScrumData();
  const staticWeeks = getAvailableWeeks() as WeekOption[];

  try {
    // Supabase에서 데이터 조회 시도
    const [supabaseAllData, supabaseWeeks] = await Promise.all([
      getAllSnapshotsFromSupabase(workspaceId),
      getAvailableWeeksFromSupabase(workspaceId),
    ]);

    // Supabase 데이터가 없으면 정적 파일만 사용
    if (Object.keys(supabaseAllData).length === 0) {
      console.log("[getDataSource] No Supabase data, using static files only");
      return { allData: staticAllData, weeks: staticWeeks, source: "static" };
    }

    // 데이터 병합: 정적 파일 데이터 + Supabase 데이터 (Supabase 우선)
    const mergedAllData: Record<string, WeeklyScrumData> = {
      ...staticAllData,
      ...supabaseAllData, // Supabase 데이터가 동일 키면 덮어씀
    };

    // 주차 목록 병합 (중복 제거)
    const weekKeySet = new Set<string>();
    const mergedWeeks: WeekOption[] = [];
    
    // Supabase 주차 먼저 추가 (최신 데이터)
    for (const week of supabaseWeeks) {
      if (!weekKeySet.has(week.key)) {
        weekKeySet.add(week.key);
        mergedWeeks.push(week);
      }
    }
    
    // 정적 파일 주차 추가 (중복 제외)
    for (const week of staticWeeks) {
      if (!weekKeySet.has(week.key)) {
        weekKeySet.add(week.key);
        mergedWeeks.push(week);
      }
    }

    // 날짜 기준 정렬 (최신 먼저)
    mergedWeeks.sort((a, b) => {
      const keyA = `${a.year}-${a.week}`;
      const keyB = `${b.year}-${b.week}`;
      return keyB.localeCompare(keyA);
    });

    console.log(
      `[getDataSource] Merged data: ${Object.keys(supabaseAllData).length} from Supabase, ${Object.keys(staticAllData).length} from static files, ${Object.keys(mergedAllData).length} total`
    );

    return { allData: mergedAllData, weeks: mergedWeeks, source: "merged" };
  } catch (error) {
    console.log("[getDataSource] Supabase error, using static files only:", error);
    return { allData: staticAllData, weeks: staticWeeks, source: "static" };
  }
}

/**
 * Supabase 데이터만 사용 (정적 파일 사용하지 않음)
 */
export async function getSupabaseOnlyData(workspaceId: string): Promise<{
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
}> {
  const [allData, weeks] = await Promise.all([
    getAllSnapshotsFromSupabase(workspaceId),
    getAvailableWeeksFromSupabase(workspaceId),
  ]);

  // 주차 목록 정렬 (최신 먼저)
  weeks.sort((a, b) => {
    const keyA = `${a.year}-${a.week}`;
    const keyB = `${b.year}-${b.week}`;
    return keyB.localeCompare(keyA);
  });

  return { allData, weeks };
}

