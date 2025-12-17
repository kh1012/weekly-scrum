/**
 * Draft-first Gantt 타입 정의
 * Feature 타입 Plan만 대상
 */

import type { AssigneeRole } from "@/lib/data/plans";

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
  endDate: string;   // YYYY-MM-DD
  assignees: DraftAssignee[];
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
    deleted: boolean;
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

