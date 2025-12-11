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

/**
 * 날짜에서 ISO 주차 정보를 계산합니다.
 */
export function getISOWeekInfo(date: Date): { year: number; week: number; weekStart: Date; weekEnd: Date } {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  // 해당 주의 목요일 찾기 (ISO 주차 결정에 사용)
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + 4 - (d.getDay() || 7));
  
  // ISO 연도의 첫 번째 목요일 (1월 4일이 포함된 주의 목요일)
  const yearStart = new Date(thursday.getFullYear(), 0, 4);
  const firstThursday = new Date(yearStart);
  firstThursday.setDate(yearStart.getDate() + 4 - (yearStart.getDay() || 7));
  
  // 주차 계산
  const weekNumber = Math.ceil(((thursday.getTime() - firstThursday.getTime()) / 86400000 + 1) / 7);
  
  // 주의 시작일 (월요일) 계산
  const weekStart = new Date(d);
  const dayOfWeek = d.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  weekStart.setDate(d.getDate() + diffToMonday);
  
  // 주의 종료일 (일요일) 계산
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  return {
    year: thursday.getFullYear(),
    week: weekNumber,
    weekStart,
    weekEnd,
  };
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷합니다.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * ISO 주차 키 생성 (YYYY-WXX)
 */
export function getISOWeekKey(date: Date): string {
  const info = getISOWeekInfo(date);
  return `${info.year}-W${info.week.toString().padStart(2, "0")}`;
}
