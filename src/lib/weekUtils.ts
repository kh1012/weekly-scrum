import type { ScrumItem, WeeklyScrumData } from "@/types/scrum";

/**
 * 주차 키를 정렬 가능한 숫자로 변환
 */
export function weekKeyToSortValue(key: string): number {
  const [year, month, week] = key.split("-");
  const weekNum = parseInt(week.replace("W", ""), 10);
  return parseInt(year, 10) * 10000 + parseInt(month, 10) * 100 + weekNum;
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

