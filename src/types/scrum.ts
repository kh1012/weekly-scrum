/**
 * 리스크 레벨 타입
 * 0 = 없음
 * 1 = 경미 (업무 외적 부담, 일정 영향 없음)
 * 2 = 중간 (병목 가능성 있음, 일정 영향 가능)
 * 3 = 심각 (즉각적인 논의 필요, 일정 지연 확정)
 */
export type RiskLevel = 0 | 1 | 2 | 3;

/**
 * 협업 관계 타입
 * waiting-on: 해당 사람의 작업/응답을 기다리는 중
 * pair: 함께 페어 프로그래밍 또는 협업 중
 * review: 코드 리뷰 또는 검토 요청
 * handoff: 작업 인수인계
 */
export type Relation = "waiting-on" | "pair" | "review" | "handoff";

/**
 * 협업자 타입
 */
export interface Collaborator {
  name: string;
  relation: Relation;
}

/**
 * 스크럼 항목 타입
 */
export interface ScrumItem {
  name: string;
  domain: string;
  project: string;
  module?: string | null; // 모듈 (선택, 프로젝트에 종속되지 않음)
  topic: string;
  plan: string;
  planPercent: number;
  progress: string;
  progressPercent: number;
  reason: string; // 계획 대비 실행 미비 시 부연 설명
  next: string;
  risk: string;
  riskLevel: RiskLevel;
  collaborators?: Collaborator[]; // 협업자 목록 (선택)
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
