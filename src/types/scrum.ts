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
 * 협업자 타입 (통합)
 * - relation: 단일 값 (기존 코드 호환)
 * - relations: 배열 (v2, 복수 선택 지원)
 */
export interface Collaborator {
  name: string;
  /** @deprecated - relations 배열을 사용하세요 */
  relation?: Relation;
  /** 복수 관계 선택 */
  relations?: Relation[];
}

/**
 * 리스크 항목 타입 (통합)
 */
export interface RiskItem {
  title?: string;
  note?: string;
  level?: string;
}

/**
 * Past Week Task 타입 (통합)
 * - DB 및 대부분의 코드에서 사용
 */
export interface PastWeekTask {
  title: string;
  progress: number; // 0-100
}

/**
 * Past Week Task 타입 (확장, teamFeed용)
 * - progress와 note가 선택적일 수 있는 경우
 */
export interface PastWeekTaskExtended extends PastWeekTask {
  progress: number;
  note?: string;
}

/**
 * Past Week Task 타입 (느슨한 버전, 파싱용)
 * - teamFeed에서 다양한 형식을 처리할 때 사용
 */
export interface PastWeekTaskLoose {
  title: string;
  progress?: number;
  note?: string;
}

/**
 * v2 Past Week 블록 타입
 */
export interface PastWeek {
  tasks: PastWeekTask[];
  risk: string[] | null;
  riskLevel: RiskLevel | null;
  collaborators: Collaborator[];
}

/**
 * v2 This Week 블록 타입
 */
export interface ThisWeek {
  tasks: string[];
}

/**
 * v2 스크럼 항목 타입
 */
export interface ScrumItemV2 {
  name: string;
  domain: string;
  project: string;
  module: string;
  feature: string;
  pastWeek: PastWeek;
  thisWeek: ThisWeek;
}

/**
 * v1 스크럼 항목 타입 (하위 호환성 유지)
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
  risk: string[] | null; // 멀티라인 지원 (배열), null = 미정 ("?" 입력 시)
  riskLevel: RiskLevel | null; // null = 미정 ("?" 입력 시)
  collaborators?: Collaborator[]; // 협업자 목록 (선택)
}

/**
 * v3 주간 스크럼 데이터 타입 (ISO 주차 기준)
 * - 폴더 구조: data/scrum/YYYY/YYYY-WXX.json
 * - week: ISO 연간 주차 (W01 ~ W53)
 */
export interface WeeklyScrumDataV3 {
  year: number;           // ISO 주차가 속한 연도
  week: string;           // ISO 주차 (W01 ~ W53)
  weekStart: string;      // 주 시작일 (YYYY-MM-DD, 월요일)
  weekEnd: string;        // 주 종료일 (YYYY-MM-DD, 일요일)
  schemaVersion: 3;
  items: ScrumItemV2[];
}

/**
 * v2 주간 스크럼 데이터 타입 (레거시 - 월 내 주차)
 * - 폴더 구조: data/scrum/YYYY/MM/YYYY-MM-WXX.json
 * - week: 월 내 주차 (W01 ~ W05)
 */
export interface WeeklyScrumDataV2 {
  year: number;
  month: number;
  week: string;
  range: string;
  schemaVersion: 2;
  items: ScrumItemV2[];
}

/**
 * v1 주간 스크럼 데이터 타입 (하위 호환성 유지)
 */
export interface WeeklyScrumData {
  year: number;
  month: number;
  week: string;
  range: string;
  schemaVersion?: 1;
  items: ScrumItem[];
}

/**
 * 통합 주간 스크럼 데이터 타입 (v1, v2, v3)
 */
export type WeeklyScrumDataUnion = WeeklyScrumData | WeeklyScrumDataV2 | WeeklyScrumDataV3;

/**
 * 필터 상태 타입 (단일 선택 - 레거시)
 */
export interface FilterState {
  domain: string;
  project: string;
  module: string;
  member: string;
  search: string;
}

/**
 * 다중 선택 필터 상태 타입
 */
export interface MultiFilterState {
  members: string[];
  domains: string[];
  projects: string[];
  modules: string[];
  features: string[];
  search: string;
}

/**
 * 필터 옵션 상태 (활성화/비활성화 포함)
 */
export interface FilterOptionState {
  value: string;
  enabled: boolean;
  count: number;
}

/**
 * 주차 옵션 타입 (v3 - ISO 주차 기준)
 */
export interface WeekOption {
  id?: string;            // snapshot_weeks.id (UUID) - 전체 뷰 모드에서 사용
  year: number;           // ISO 연도
  week: string;           // ISO 주차 (W01 ~ W53)
  weekStart: string;      // 주 시작일 (YYYY-MM-DD)
  weekEnd: string;        // 주 종료일 (YYYY-MM-DD)
  key: string;            // 고유 키 (YYYY-WXX)
  label: string;          // 표시 레이블
  filePath: string;       // 파일 경로
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

// ========================================
// v2/v3 → v1 변환 유틸리티 (하위 호환성)
// ========================================

/**
 * @deprecated 이 파일의 변환 함수들은 @/lib/transforms/scrumData로 이동되었습니다.
 * 하위 호환성을 위해 re-export합니다.
 */
export {
  convertV2ToV1Item,
  convertV2ToV1Data,
  convertV3ToV1Data,
  migrateScrumItem,
  migrateWeeklyScrumData,
  convertEntryToScrumItem,
  parseTaskCompletionRate,
  calculateAvgProgress,
  formatProgressTasks,
} from "../lib/transforms/scrumData";

export type { SnapshotEntryRaw, RawSnapshot } from "../lib/transforms/scrumData";

/**
 * 데이터가 v2 스키마인지 확인
 */
export function isV2Data(data: WeeklyScrumDataUnion): data is WeeklyScrumDataV2 {
  return data.schemaVersion === 2;
}

/**
 * 데이터가 v3 스키마인지 확인
 */
export function isV3Data(data: WeeklyScrumDataUnion): data is WeeklyScrumDataV3 {
  return data.schemaVersion === 3;
}

/**
 * 데이터를 v1 형태로 정규화 (v1이면 그대로, v2/v3면 변환)
 */
export function normalizeToV1(data: WeeklyScrumDataUnion): WeeklyScrumData {
  if (isV3Data(data)) {
    return convertV3ToV1Data(data);
  }
  if (isV2Data(data)) {
    return convertV2ToV1Data(data);
  }
  return data;
}
