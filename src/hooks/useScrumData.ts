/**
 * Scrum 데이터 관리 Hook
 * 
 * 주차 데이터와 선택 모드에 따른 데이터 병합을 담당
 */

import { useMemo } from "react";
import type { WeeklyScrumData, WeekOption } from "@/types/scrum";
import { weekKeyToSortValue, mergeDataInRange } from "@/lib/weekUtils";

export interface UseScrumDataProps {
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  selectMode: "single" | "range";
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;
}

export interface UseScrumDataReturn {
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  currentData: WeeklyScrumData | null;
  sortedWeekKeys: string[];
}

/**
 * Scrum 데이터 관리 Hook
 * 단일/범위 선택 모드에 따라 현재 데이터를 계산
 */
export function useScrumData({
  allData,
  weeks,
  selectMode,
  selectedWeekKey,
  rangeStart,
  rangeEnd,
}: UseScrumDataProps): UseScrumDataReturn {
  // 정렬된 주차 키 목록
  const sortedWeekKeys = useMemo(() => {
    return Object.keys(allData).sort(
      (a, b) => weekKeyToSortValue(a) - weekKeyToSortValue(b)
    );
  }, [allData]);

  // 현재 데이터 (단일/범위 모드에 따라)
  const currentData = useMemo((): WeeklyScrumData | null => {
    if (selectMode === "single") {
      return allData[selectedWeekKey] ?? Object.values(allData)[0] ?? null;
    }
    return mergeDataInRange(allData, sortedWeekKeys, rangeStart, rangeEnd);
  }, [selectMode, selectedWeekKey, rangeStart, rangeEnd, allData, sortedWeekKeys]);

  return {
    allData,
    weeks,
    currentData,
    sortedWeekKeys,
  };
}
