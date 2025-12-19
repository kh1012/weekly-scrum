/**
 * Draft-first Gantt 타입 정의
 * Feature 타입 Plan만 대상
 */

import type { AssigneeRole } from "@/lib/data/plans";

/**
 * ISO 날짜 문자열 타입 (YYYY-MM-DD)
 */
export type ISODate = string;

/**
 * Gantt Flag (마일스톤/범위 이벤트) - 서버에서 로드된 원본 타입
 * - Point flag: startDate === endDate → 수직선 + 타이틀
 * - Range flag: startDate < endDate → 시작/끝 수직선 + 상단 블록 + 타이틀
 */
export interface GanttFlag {
  id: string;
  workspaceId: string;
  title: string;
  startDate: ISODate;
  endDate: ISODate; // start === end => point flag
  color?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
}

/**
 * Draft Flag (로컬 편집용)
 * - DraftBar와 유사하게 dirty/deleted 플래그 포함
 * - clientId: 로컬에서 생성된 Flag의 임시 ID
 */
export interface DraftFlag {
  clientId: string; // 로컬 임시 ID (UUID)
  serverId?: string; // 서버 ID (기존 flag인 경우)
  workspaceId: string;
  title: string;
  startDate: ISODate;
  endDate: ISODate;
  color?: string | null;
  orderIndex: number;
  /** 변경됨 플래그 */
  dirty: boolean;
  /** 삭제됨 플래그 (undo 위해 유지) */
  deleted?: boolean;
  /** 생성 시간 (로컬) */
  createdAtLocal: string;
  /** 수정 시간 (로컬) */
  updatedAtLocal: string;
}

/**
 * Lane packing 후 Flag 아이템
 */
export interface PackedFlagLaneItem {
  flagId: string;
  laneIndex: number; // 0..N-1
  startDate: ISODate;
  endDate: ISODate;
  startX: number; // px
  width: number; // px
  isPoint: boolean;
}

/**
 * Plan 상태
 */
export type PlanStatus = "진행중" | "완료" | "보류" | "취소";

/**
 * 담당자 정보
 */
export interface DraftAssignee {
  userId: string;
  role: AssigneeRole;
  displayName?: string;
}

/**
 * 링크 정보
 */
export interface PlanLink {
  url: string;
  label?: string;
}

/**
 * Draft Row (좌측 트리 행)
 * - rowId = `${project}::${module}::${feature}` 형식
 */
export interface DraftRow {
  rowId: string;
  project: string;
  module: string;
  feature: string;
  domain?: string;
  orderIndex: number;
  expanded?: boolean;
  /** 로컬에서 생성된 row (bars 없어도 표시) */
  isLocal?: boolean;
}

/**
 * Draft Bar (Plan 막대)
 * - clientUid: 클라이언트 생성 UUID
 * - rowId: 소속 row
 */
export interface DraftBar {
  clientUid: string;
  rowId: string;
  /** 서버 ID (기존 plan인 경우) */
  serverId?: string;
  title: string;
  stage: string;
  status: PlanStatus;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  assignees: DraftAssignee[];
  /** 상세 설명 (선택사항) */
  description?: string;
  /** 관련 링크 목록 (선택사항) */
  links?: PlanLink[];
  /** 변경됨 플래그 */
  dirty: boolean;
  /** 삭제됨 플래그 (undo 위해 유지) */
  deleted?: boolean;
  /** 생성 시간 (로컬) */
  createdAtLocal: string;
  /** 수정 시간 (로컬) */
  updatedAtLocal: string;
  /** 사용자가 지정한 레인 (수동 배치) */
  preferredLane?: number;
}

/**
 * Lock 상태
 */
export interface LockState {
  isLocked: boolean;
  lockedBy?: string;
  lockedByName?: string;
  expiresAt?: string;
  isMyLock?: boolean;
}

/**
 * 기간 강조 표시 정보
 */
export interface HighlightDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: "node" | "flag"; // 노드 선택 vs 플래그 선택
  color?: string; // 강조 색상 (선택사항)
  nodeId?: string; // 강조 중인 노드 ID (아이콘 색상 변경용)
}

/**
 * UI 상태
 */
export interface DraftUIState {
  selectedBarId?: string;
  selectedRowId?: string;
  zoom: "week" | "month" | "quarter";
  searchQuery: string;
  filters: {
    projects: string[];
    modules: string[];
    features: string[];
    stages: string[];
  };
  lockState: LockState;
  lastSyncAt?: string;
  isEditing: boolean;
  /** 펼쳐진 트리 노드 ID 목록 */
  expandedNodes: string[];
  /** 타임라인에서 강조 표시할 기간 */
  highlightDateRange?: HighlightDateRange | null;
  /** 마지막 활동 시간 (ISO 문자열) - 비활성 타임아웃 계산용 */
  lastActivityAt?: string;
}

/**
 * Undo/Redo 액션 타입
 */
export type UndoAction =
  | { type: "ADD_BAR"; bar: DraftBar }
  | { type: "UPDATE_BAR"; barId: string; prevBar: DraftBar; nextBar: DraftBar }
  | { type: "DELETE_BAR"; bar: DraftBar }
  | { type: "RESTORE_BAR"; bar: DraftBar }
  | { type: "ADD_ROW"; row: DraftRow }
  | { type: "UPDATE_ROW"; rowId: string; prevRow: DraftRow; nextRow: DraftRow }
  | { type: "REORDER_ROWS"; prevOrder: DraftRow[]; nextOrder: DraftRow[] };

/**
 * Draft Store 전체 상태
 */
export interface DraftState {
  rows: DraftRow[];
  bars: DraftBar[];
  ui: DraftUIState;
  undoStack: UndoAction[];
  redoStack: UndoAction[];
}

/**
 * Commit Payload (서버 전송용)
 */
export interface CommitPayload {
  workspaceId: string;
  plans: Array<{
    clientUid: string;
    domain?: string;
    project: string;
    module: string;
    feature: string;
    title: string;
    stage: string;
    status: PlanStatus;
    start_date: string;
    end_date: string;
    assignees: DraftAssignee[];
    /** 상세 설명 (선택사항) */
    description?: string;
    /** 관련 링크 목록 (선택사항) */
    links?: PlanLink[];
    deleted: boolean;
    order_index: number; // 트리 순서 (row orderIndex 기반)
  }>;
}

/**
 * Gantt 뷰 Props
 */
export interface GanttViewProps {
  workspaceId: string;
  rangeStart: Date;
  rangeEnd: Date;
}

/**
 * Lane 계산 결과
 */
export interface BarWithLane extends DraftBar {
  lane: number;
}

/**
 * Row 렌더링 정보
 */
export interface RenderRow extends DraftRow {
  bars: BarWithLane[];
  laneCount: number;
}

/**
 * Ready 상태 정보 (Spec/Design)
 */
export interface ReadyInfo {
  value: string; // 날짜 또는 "READY" 또는 "데이터 없음"
  title?: string; // bar의 title (구분용)
  endDate?: string; // 원본 종료일 (색상 판단용)
}

/**
 * Release Doc 행 (Flag 클릭 시 표시되는 계획 요약)
 */
export interface ReleaseDocRow {
  planId: string;
  rowId: string; // project::module::feature 형태의 rowId
  epic: string; // "프로젝트 > 모듈 > 기능" or fallback title
  planners: string[]; // 기획자 목록 (여러명 가능)
  specReadyList: ReadyInfo[]; // 여러 개 가능
  designReadyList: ReadyInfo[]; // 여러 개 가능
  // 스크롤 이동용 날짜 범위
  minStartDate: string; // YYYY-MM-DD
  maxEndDate: string; // YYYY-MM-DD
}
