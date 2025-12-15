/**
 * ISO 주차 유틸리티
 * 
 * ISO 8601 기준:
 * - 주의 시작: 월요일
 * - 주의 종료: 일요일
 * - 연도의 첫 주: 해당 연도의 첫 번째 목요일이 포함된 주
 */

export interface ISOWeekInfo {
  year: number;
  week: number;
  weekStart: Date;
  weekEnd: Date;
}

/**
 * 연도와 주차로 해당 주의 시작일(월요일)과 종료일(일요일)을 계산합니다.
 */
export function getWeekDateRange(year: number, week: number): { weekStart: Date; weekEnd: Date } {
  // ISO 연도의 첫 번째 주의 목요일 찾기 (1월 4일이 포함된 주)
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = jan4.getDay() || 7; // 0 → 7 (일요일)
  
  // 첫 번째 주의 월요일
  const firstMonday = new Date(jan4);
  firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
  
  // 해당 주차의 월요일
  const weekStart = new Date(firstMonday);
  weekStart.setDate(firstMonday.getDate() + (week - 1) * 7);
  weekStart.setHours(0, 0, 0, 0);
  
  // 해당 주차의 일요일
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  
  return { weekStart, weekEnd };
}

/**
 * 날짜에서 ISO 주차 정보를 계산합니다.
 */
export function getISOWeekFromDate(date: Date): ISOWeekInfo {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  
  // 해당 주의 목요일 찾기 (ISO 주차 결정에 사용)
  const thursday = new Date(d);
  const dayOfWeek = d.getDay() || 7;
  thursday.setDate(d.getDate() + 4 - dayOfWeek);
  
  // ISO 연도의 첫 번째 목요일 (1월 4일이 포함된 주의 목요일)
  const yearStart = new Date(thursday.getFullYear(), 0, 4);
  const firstThursday = new Date(yearStart);
  const firstDayOfWeek = yearStart.getDay() || 7;
  firstThursday.setDate(yearStart.getDate() + 4 - firstDayOfWeek);
  
  // 주차 계산
  const weekNumber = Math.ceil(((thursday.getTime() - firstThursday.getTime()) / 86400000 + 1) / 7);
  
  // 주의 시작일 (월요일) 계산
  const weekStart = new Date(d);
  weekStart.setDate(d.getDate() - dayOfWeek + 1);
  
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
 * 현재 날짜의 ISO 주차 정보를 반환합니다.
 */
export function getCurrentISOWeek(): ISOWeekInfo {
  return getISOWeekFromDate(new Date());
}

/**
 * 해당 연도의 총 주차 수를 계산합니다. (52 또는 53)
 */
export function getWeeksInYear(year: number): number {
  // 12월 28일은 항상 마지막 주에 속함
  const dec28 = new Date(year, 11, 28);
  const weekInfo = getISOWeekFromDate(dec28);
  return weekInfo.week;
}

/**
 * 날짜를 "MM.DD" 형식으로 포맷합니다.
 */
export function formatShortDate(date: Date): string {
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${month}.${day}`;
}

/**
 * 날짜를 "YYYY-MM-DD" 형식으로 포맷합니다.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 주차의 기간을 "MM.DD ~ MM.DD" 형식으로 포맷합니다.
 */
export function formatWeekRange(year: number, week: number): string {
  const { weekStart, weekEnd } = getWeekDateRange(year, week);
  return `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}`;
}

/**
 * 주차의 기간을 "YYYY-MM-DD ~ YYYY-MM-DD" 형식으로 포맷합니다.
 */
export function formatWeekRangeFull(year: number, week: number): string {
  const { weekStart, weekEnd } = getWeekDateRange(year, week);
  return `${formatDate(weekStart)} ~ ${formatDate(weekEnd)}`;
}

/**
 * week_start_date 문자열(YYYY-MM-DD)로 DB 저장용 값을 생성합니다.
 */
export function getWeekStartDateString(year: number, week: number): string {
  const { weekStart } = getWeekDateRange(year, week);
  return formatDate(weekStart);
}

/**
 * week_end_date 문자열(YYYY-MM-DD)로 DB 저장용 값을 생성합니다.
 */
export function getWeekEndDateString(year: number, week: number): string {
  const { weekEnd } = getWeekDateRange(year, week);
  return formatDate(weekEnd);
}

/**
 * 연도 선택 옵션을 생성합니다. (현재 연도 기준 ±2년)
 */
export function getYearOptions(baseYear?: number): number[] {
  const currentYear = baseYear ?? new Date().getFullYear();
  return [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
}

/**
 * 주차 선택 옵션을 생성합니다. (1 ~ 해당 연도 총 주차)
 */
export function getWeekOptions(year: number): number[] {
  const totalWeeks = getWeeksInYear(year);
  return Array.from({ length: totalWeeks }, (_, i) => i + 1);
}

