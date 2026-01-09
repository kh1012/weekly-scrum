import type { ScrumItem, WeeklyScrumData } from "@/types/scrum";

/**
 * 주차 키를 정렬 가능한 숫자로 변환
 * 
 * v3 형식: "2025-W49" → 202549
 * v2 형식: "2025-12-W01" → 2025120001
 */
export function weekKeyToSortValue(key: string): number {
  // v3 형식: YYYY-WXX (ISO 주차)
  const v3Match = key.match(/^(\d{4})-W(\d{2})$/);
  if (v3Match) {
    const year = parseInt(v3Match[1], 10);
    const week = parseInt(v3Match[2], 10);
    return year * 100 + week;
  }
  
  // v2 형식: YYYY-MM-WXX (월 내 주차)
  const v2Match = key.match(/^(\d{4})-(\d{1,2})-W(\d{2})$/);
  if (v2Match) {
    const year = parseInt(v2Match[1], 10);
    const month = parseInt(v2Match[2], 10);
    const week = parseInt(v2Match[3], 10);
    return year * 10000 + month * 100 + week;
  }
  
  // 레거시 형식 시도
  const parts = key.split("-");
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const weekNum = parseInt(parts[2].replace("W", ""), 10);
    return year * 10000 + month * 100 + weekNum;
  }
  
  return 0;
}

/**
 * 범위 모드에서 데이터 병합
 */
export function mergeDataInRange(
  allData: Record<string, WeeklyScrumData>,
  sortedWeekKeys: string[],
  rangeStart: string,
  rangeEnd: string
): WeeklyScrumData | null {
  const startValue = weekKeyToSortValue(rangeStart);
  const endValue = weekKeyToSortValue(rangeEnd);
  const minValue = Math.min(startValue, endValue);
  const maxValue = Math.max(startValue, endValue);

  const keysInRange = sortedWeekKeys.filter((key) => {
    const value = weekKeyToSortValue(key);
    return value >= minValue && value <= maxValue;
  });

  if (keysInRange.length === 0) {
    return Object.values(allData)[0] ?? null;
  }

  const allItems: ScrumItem[] = [];
  keysInRange.forEach((key) => {
    const data = allData[key];
    if (data) {
      allItems.push(...data.items);
    }
  });

  const firstData = allData[keysInRange[0]];
  const lastData = allData[keysInRange[keysInRange.length - 1]];

  return {
    year: firstData.year,
    month: firstData.month,
    week: `${firstData.week} ~ ${lastData.week}`,
    range: `${firstData.range.split(" ~ ")[0]} ~ ${lastData.range.split(" ~ ")[1]}`,
    items: allItems,
  };
}

// Re-export from consolidated date utilities
export { getISOWeekFromDate as getISOWeekInfo, formatDate, getISOWeekKey } from "@/lib/utils/date";
