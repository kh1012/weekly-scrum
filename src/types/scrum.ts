/**
 * 스크럼 항목 타입
 */
export interface ScrumItem {
  name: string;
  domain: string;
  project: string;
  topic: string;
  progress: string;
  risk: string;
  next: string;
  progressPercent: number;
}

/**
 * 주간 스크럼 데이터 타입
 */
export interface WeeklyScrumData {
  year: number;
  month: number;
  week: string;
  range: string;
  items: ScrumItem[];
}

/**
 * 필터 상태 타입
 */
export interface FilterState {
  domain: string;
  project: string;
  search: string;
}
