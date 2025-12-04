/**
 * Shares 주차 옵션 타입
 */
export interface SharesWeekOption {
  year: number;
  month: number;
  week: string;
  key: string;
  label: string;
  filePath: string;
}

/**
 * Shares 선택 모드 타입
 */
export type SharesSelectMode = "single" | "range";

/**
 * Shares 상태 타입
 */
export interface SharesState {
  selectMode: SharesSelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;
}

/**
 * 주간 Shares 데이터 타입
 */
export interface WeeklySharesData {
  year: number;
  month: number;
  week: string;
  key: string;
  content: string; // 마크다운 내용
}

