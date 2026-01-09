/**
 * 날짜 유틸리티 통합
 * 
 * 프로젝트 전반에 걸쳐 사용되는 날짜 포맷팅 및 계산 함수를 통합합니다.
 * 
 * ISO 8601 기준:
 * - 주의 시작: 월요일
 * - 주의 종료: 일요일
 * - 연도의 첫 주: 해당 연도의 첫 번째 목요일이 포함된 주
 */

// ========================================
// 기본 날짜 포맷팅
// ========================================

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷팅
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 날짜를 MM.DD 형식으로 포맷팅
 */
export function formatShortDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

/**
 * 날짜를 MM.DD (요일) 형식으로 포맷팅
 */
export function formatDateWithDay(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const weekDay = weekDays[d.getDay()];
  return `${month}.${day} (${weekDay})`;
}

/**
 * 날짜 범위를 YYYY.MM.DD ~ YYYY.MM.DD 형식으로 포맷팅
 */
export function formatDateRange(start: Date | string, end: Date | string): string {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  
  const formatWithDots = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}.${month}.${day}`;
  };
  
  return `${formatWithDots(startDate)} ~ ${formatWithDots(endDate)}`;
}

/**
 * 상대 시간 포맷팅 ("3분 전", "2시간 전", "3일 전" 등)
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) {
    return "방금 전";
  } else if (diffMin < 60) {
    return `${diffMin}분 전`;
  } else if (diffHour < 24) {
    return `${diffHour}시간 전`;
  } else if (diffDay < 7) {
    return `${diffDay}일 전`;
  } else if (diffDay < 30) {
    const weeks = Math.floor(diffDay / 7);
    return `${weeks}주 전`;
  } else if (diffDay < 365) {
    const months = Math.floor(diffDay / 30);
    return `${months}개월 전`;
  } else {
    const years = Math.floor(diffDay / 365);
    return `${years}년 전`;
  }
}

/**
 * 주차 범위를 문자열로 포맷팅 (MM.DD ~ MM.DD 형식)
 * @deprecated Use formatWeekRangeShort instead
 */
export function formatWeekRange(year: number, week: number): string {
  return formatWeekRangeShort(year, week);
}

/**
 * ISO 주차 정보 가져오기 (문자열 날짜 포함)
 * 주로 기존 코드와의 호환성을 위해 사용됩니다.
 */
export function getISOWeekInfo(date: Date): {
  year: number;
  week: string;
  weekStart: string;
  weekEnd: string;
} {
  const info = getISOWeekFromDate(date);
  return {
    year: info.year,
    week: String(info.week).padStart(2, "0"),
    weekStart: formatDate(info.weekStart),
    weekEnd: formatDate(info.weekEnd),
  };
}

/**
 * ISO 주차 키 가져오기 (YYYY-WXX 형식)
 */
export function getISOWeekKey(date: Date): string {
  const { year, week } = getISOWeekInfo(date);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

/**
 * 컴팩트 날짜/시간 포맷팅 (25.12.19 PM07:06 형식)
 */
export function formatCompactDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = String(d.getFullYear()).slice(-2);
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = String(hours % 12 || 12).padStart(2, "0");
  
  return `${year}.${month}.${day} ${ampm}${displayHours}:${minutes}`;
}

/**
 * 로컬 날짜 문자열을 ISO 날짜 문자열로 변환 (YYYY-MM-DD)
 */
export function formatLocalDateStr(date: string): string {
  // 이미 YYYY-MM-DD 형식이면 그대로 반환
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  
  // Date 객체로 파싱 후 포맷팅
  return formatDate(new Date(date));
}

// ========================================
// ISO 주차 계산 및 변환
// ========================================

/**
 * ISO 주차 정보 인터페이스
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
 * Date 객체를 포함한 전체 정보를 반환합니다.
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

// ========================================
// 주차 범위 포맷팅
// ========================================

/**
 * 주차의 기간을 "MM.DD ~ MM.DD" 형식으로 포맷합니다.
 * (기존 formatWeekRange와 호환성 유지)
 */
export function formatWeekRangeShort(year: number, week: number): string {
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
 * 주차의 기간을 "YY.MM.DD ~ YY.MM.DD" 형식으로 포맷합니다.
 */
export function formatWeekRangeCompact(year: number, week: number): string {
  const { weekStart, weekEnd } = getWeekDateRange(year, week);
  const formatCompact = (d: Date) => {
    const yy = d.getFullYear().toString().slice(2);
    const mm = (d.getMonth() + 1).toString().padStart(2, "0");
    const dd = d.getDate().toString().padStart(2, "0");
    return `${yy}.${mm}.${dd}`;
  };
  return `${formatCompact(weekStart)} ~ ${formatCompact(weekEnd)}`;
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

// ========================================
// 주차/연도 선택 옵션
// ========================================

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

/**
 * 이전 주차 정보를 반환합니다. (ISO week rollover 처리)
 * W01의 이전 주 = 이전 연도의 마지막 주
 */
export function getPreviousISOWeek(year: number, week: number): { year: number; week: number } {
  if (week > 1) {
    return { year, week: week - 1 };
  }
  
  // W01의 이전 주는 이전 연도의 마지막 주
  const previousYear = year - 1;
  const weeksInPreviousYear = getWeeksInYear(previousYear);
  return { year: previousYear, week: weeksInPreviousYear };
}
