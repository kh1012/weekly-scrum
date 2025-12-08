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
 * pair: 실시간 공동 협업 (pair partner)
 * pre: 앞단 협업자 - 내 작업에 필요한 선행 입력 제공 (pre partner)
 * post: 후단 협업자 - 내 결과물을 받아 다음 단계 수행 (post partner)
 */
export type Relation = "pair" | "pre" | "post";

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
  progress: string[]; // 멀티라인 지원 (배열)
  progressPercent: number;
  reason: string; // 계획 대비 실행 미비 시 부연 설명
  next: string[]; // 멀티라인 지원 (배열)
  risk: string | null; // null = 미정 ("?" 입력 시)
  riskLevel: RiskLevel | null; // null = 미정 ("?" 입력 시)
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
  module: string;
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
 * 협업자 통계 항목 타입
 */
export interface CollaboratorStat {
  name: string;
  count: number;
  relations: {
    pair: number;
    pre: number;
    post: number;
  };
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
  riskCounts: Record<RiskLevel | "unknown", number>; // unknown = 리스크 미정
  domains: string[];
  projects: string[];
  members: string[];
  modules: string[];
}
