/**
 * 리스크 레벨 타입
 * 0 = 없음
 * 1 = 경미 (업무 외적 부담, 일정 영향 없음)
 * 2 = 중간 (병목 가능성 있음, 일정 영향 가능)
 * 3 = 심각 (즉각적인 논의 필요, 일정 지연 확정)
 */
export type RiskLevel = 0 | 1 | 2 | 3;

/**
 * 스크럼 항목 타입
 */
export interface ScrumItem {
  name: string;
  domain: string;
  project: string;
  topic: string;
  plan: string;
  planPercent: number;
  progress: string;
  progressPercent: number;
  reason: string; // 계획 대비 실행 미비 시 부연 설명
  next: string;
  risk: string;
  riskLevel: RiskLevel;
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
  member: string;
  search: string;
}

/**
 * 주차 옵션 타입
 */
export interface WeekOption {
  year: number;
  month: number;
  week: string;
  key: string;
  label: string;
  filePath: string;
}

/**
 * 선택 모드 타입
 */
export type SelectMode = "single" | "range";

/**
 * 뷰 모드 타입
 */
export type ViewMode = "summary" | "cards" | "projects" | "matrix" | "risks";

/**
 * 스크럼 상태 타입
 */
export interface ScrumState {
  selectMode: SelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;
  filters: FilterState;
  currentData: WeeklyScrumData | null;
}

/**
 * 통계 타입
 */
export interface ScrumStats {
  total: number;
  avgProgress: number;
  avgPlan: number;
  avgAchievement: number;
  atRisk: number;
  completed: number;
  inProgress: number;
  riskCounts: Record<RiskLevel, number>;
  domains: string[];
  projects: string[];
  members: string[];
}
