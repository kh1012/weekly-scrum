/**
 * My Snapshot Timeline Data Fetching (Read-only)
 * 
 * Personal Space 대시보드의 Snapshot Timeline 시각화를 위한 데이터 조회
 * - 주어진 기간(주차 범위)의 내 스냅샷 엔트리 조회
 * - 읽기 전용: 수정/삭제 없음
 */

import { createClient } from "@/lib/supabase/server";

/**
 * 스냅샷 엔트리 (타임라인용)
 */
export interface SnapshotTimelineEntry {
  id: string;
  snapshotId: string;
  domain: string;
  project: string;
  module: string | null;
  feature: string;
  name: string; // 작성자명
  pastWeek: {
    tasks: { title: string; progress: number }[];
    risk?: string[] | null;
    riskLevel?: number | null;
  };
  thisWeek: {
    tasks: string[];
  };
  createdAt: string;
  // 주차 정보 (snapshot에서 join)
  year: number;
  week: string; // W01, W02, ...
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string;
}

/**
 * 타임라인용 스냅샷 엔트리 조회 파라미터
 */
export interface GetMySnapshotEntriesParams {
  workspaceId: string;
  userId: string;
  /** ISO 주차 시작 (YYYY-WXX, 예: "2025-W01") */
  fromWeek: string;
  /** ISO 주차 종료 (YYYY-WXX, 예: "2025-W12") */
  toWeek: string;
}

/**
 * 주어진 기간의 내 스냅샷 엔트리 조회 (읽기 전용)
 * 
 * @param params 조회 파라미터 (workspaceId, userId, fromWeek, toWeek)
 * @returns 스냅샷 엔트리 배열 (주차 정보 포함)
 */
export async function getMySnapshotEntries({
  workspaceId,
  userId,
  fromWeek,
  toWeek,
}: GetMySnapshotEntriesParams): Promise<SnapshotTimelineEntry[]> {
  const supabase = await createClient();

  // fromWeek와 toWeek 파싱 (YYYY-WXX 형식)
  const parseWeek = (weekStr: string) => {
    const match = weekStr.match(/^(\d{4})-W(\d{2})$/);
    if (!match) throw new Error(`Invalid week format: ${weekStr}`);
    return { year: parseInt(match[1], 10), week: `W${match[2]}` };
  };

  const from = parseWeek(fromWeek);
  const to = parseWeek(toWeek);

  // 1. 내 스냅샷 조회 (기간 내)
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("snapshots")
    .select("id, year, week, week_start_date, week_end_date")
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId)
    .gte("year", from.year)
    .lte("year", to.year)
    .order("year", { ascending: true })
    .order("week", { ascending: true });

  if (snapshotsError) {
    console.error("Error fetching snapshots:", snapshotsError);
    return [];
  }

  if (!snapshots || snapshots.length === 0) {
    return [];
  }

  // 2. 주차 필터링 (년도 경계 처리)
  const filteredSnapshots = snapshots.filter((s) => {
    const weekNum = parseInt(s.week.replace("W", ""), 10);
    const fromWeekNum = parseInt(from.week.replace("W", ""), 10);
    const toWeekNum = parseInt(to.week.replace("W", ""), 10);

    if (s.year === from.year && s.year === to.year) {
      // 같은 년도
      return weekNum >= fromWeekNum && weekNum <= toWeekNum;
    } else if (s.year === from.year) {
      // 시작 년도
      return weekNum >= fromWeekNum;
    } else if (s.year === to.year) {
      // 종료 년도
      return weekNum <= toWeekNum;
    } else {
      // 중간 년도
      return s.year > from.year && s.year < to.year;
    }
  });

  if (filteredSnapshots.length === 0) {
    return [];
  }

  const snapshotIds = filteredSnapshots.map((s) => s.id);

  // 3. 엔트리 조회
  const { data: entries, error: entriesError } = await supabase
    .from("snapshot_entries")
    .select("*")
    .in("snapshot_id", snapshotIds);

  if (entriesError) {
    console.error("Error fetching entries:", entriesError);
    return [];
  }

  if (!entries || entries.length === 0) {
    return [];
  }

  // 4. 스냅샷 정보와 엔트리 조인
  const snapshotMap = new Map(
    filteredSnapshots.map((s) => [
      s.id,
      {
        year: s.year,
        week: s.week,
        weekStartDate: s.week_start_date,
        weekEndDate: s.week_end_date,
      },
    ])
  );

  const result: SnapshotTimelineEntry[] = entries.map((entry) => {
    const snapshot = snapshotMap.get(entry.snapshot_id);
    if (!snapshot) {
      throw new Error(`Snapshot not found for entry ${entry.id}`);
    }

    return {
      id: entry.id,
      snapshotId: entry.snapshot_id,
      domain: entry.domain || "",
      project: entry.project || "",
      module: entry.module || null,
      feature: entry.feature || "",
      name: entry.name || "",
      pastWeek: (entry.past_week as any) || { tasks: [] },
      thisWeek: (entry.this_week as any) || { tasks: [] },
      createdAt: entry.created_at,
      year: snapshot.year,
      week: snapshot.week,
      weekStartDate: snapshot.weekStartDate,
      weekEndDate: snapshot.weekEndDate,
    };
  });

  return result;
}

/**
 * 주차 키 생성 (YYYY-WXX 형식)
 */
export function createWeekKey(year: number, week: string): string {
  return `${year}-${week}`;
}

/**
 * Meta 키 생성 (domain/project/module/feature)
 */
export function createMetaKey(entry: {
  domain: string;
  project: string;
  module: string | null;
  feature: string;
}): string {
  const parts = [entry.domain, entry.project];
  if (entry.module) parts.push(entry.module);
  parts.push(entry.feature);
  return parts.join("/");
}

