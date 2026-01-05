/**
 * 지난 주 Next 데이터 조회 유틸리티
 */

import { createClient } from "@/lib/supabase/server";
import { getPreviousISOWeek, getWeekStartDateString } from "@/lib/date/isoWeek";

export interface LastWeekNextItem {
  id: string;
  entryId: string;
  feature: string;
  project: string;
  module: string;
  next: string[];
  updatedAt: string;
}

/**
 * 지난 주 Next 항목들을 조회합니다.
 * @param workspaceId - 워크스페이스 ID
 * @param userId - 사용자 ID (현재 로그인한 사용자)
 * @param currentYear - 현재 연도
 * @param currentWeek - 현재 주차
 * @returns 지난 주의 Next 항목 리스트
 */
export async function getLastWeekNext(
  workspaceId: string,
  userId: string,
  currentYear: number,
  currentWeek: number
): Promise<LastWeekNextItem[]> {
  const supabase = await createClient();

  // 이전 주차 계산
  const { year: prevYear, week: prevWeek } = getPreviousISOWeek(currentYear, currentWeek);
  const prevWeekStartDate = getWeekStartDateString(prevYear, prevWeek);

  // 지난 주 스냅샷 엔트리 조회 (현재 사용자가 작성한 것만, this_week.tasks가 있는 것만)
  // snapshot_entries에는 week_start_date가 없으므로 snapshots 테이블과 join
  const { data, error } = await supabase
    .from("snapshot_entries")
    .select(`
      id,
      snapshot_id,
      feature,
      project,
      module,
      this_week,
      updated_at,
      snapshots!inner(week_start_date)
    `)
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId)
    .eq("snapshots.week_start_date", prevWeekStartDate)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching last week next:", error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // 필터링 및 매핑: this_week.tasks 배열이 비어있지 않고, 모든 요소가 빈 문자열이 아닌 경우만
  const filtered = data
    .filter((entry) => {
      const thisWeek = entry.this_week as { tasks?: string[] } | null;
      if (!thisWeek || !thisWeek.tasks || !Array.isArray(thisWeek.tasks)) return false;
      // 빈 문자열이 아닌 tasks 항목이 하나라도 있는지 확인
      return thisWeek.tasks.some((item) => item && typeof item === "string" && item.trim() !== "");
    })
    .map((entry) => {
      const thisWeek = entry.this_week as { tasks: string[] };
      return {
        id: entry.id,
        entryId: entry.id,
        feature: entry.feature || "Untitled",
        project: entry.project || "",
        module: entry.module || "",
        next: thisWeek.tasks.filter(
          (item) => item && typeof item === "string" && item.trim() !== ""
        ),
        updatedAt: entry.updated_at,
      };
    });

  return filtered;
}

