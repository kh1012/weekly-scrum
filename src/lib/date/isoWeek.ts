/**
 * ISO 주차 유틸리티
 * 
 * @deprecated 이 파일은 더 이상 사용되지 않습니다.
 * 모든 날짜 유틸리티는 @/lib/utils/date로 통합되었습니다.
 * 
 * ISO 8601 기준:
 * - 주의 시작: 월요일
 * - 주의 종료: 일요일
 * - 연도의 첫 주: 해당 연도의 첫 번째 목요일이 포함된 주
 */

// Re-export all functions from the consolidated date utilities module
export type { ISOWeekInfo } from "@/lib/utils/date";
export {
  getWeekDateRange,
  getISOWeekFromDate,
  getCurrentISOWeek,
  getWeeksInYear,
  formatShortDate,
  formatDate,
  formatWeekRange,
  formatWeekRangeFull,
  formatWeekRangeCompact,
  getWeekStartDateString,
  getWeekEndDateString,
  getYearOptions,
  getWeekOptions,
  getPreviousISOWeek,
} from "@/lib/utils/date";

