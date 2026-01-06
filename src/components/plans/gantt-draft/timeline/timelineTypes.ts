/**
 * DraftTimeline 타입 정의
 */

import type {
  DraftRow,
  DraftBar as DraftBarType,
  DraftFlag,
} from "../types";
import type { WorkspaceMemberOption } from "../CreatePlanModal";
import type { FlatTreeNode } from "../laneLayout";

export const DAY_WIDTH = 40;
export const HEADER_HEIGHT = 76; // 38px + 38px (월 + 일, TreePanel 헤더와 동일)

/**
 * 두 날짜 범위가 겹치는지 확인
 */
export function isDateRangeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && end1 >= start2;
}

export interface DraftTimelineProps {
  rangeStart: Date;
  rangeEnd: Date;
  isEditing: boolean;
  isAdmin?: boolean;
  readOnly?: boolean;
  members?: WorkspaceMemberOption[];
  workspaceId?: string;
  /** 드래그 중 기간 정보 콜백 (FloatingDock 표시용) */
  onDragDateChange?: (
    info: { startDate: string; endDate: string } | null
  ) => void;
  /** 액션 발생 시 락 연장 (남은 시간이 절반 이하일 때) */
  onAction?: () => void;
  /** 외부 스크롤 동기화용 (TreePanel에서 전달) */
  scrollTop?: number;
  onScrollChange?: (scrollTop: number) => void;
  /** 가로 스크롤바 높이 변경 콜백 (TreePanel 하단 정렬용) */
  onScrollbarHeightChange?: (height: number) => void;
  /** 하이라이트할 Row ID (timeline focus용) */
  highlightedRowId?: string | null;
}

export interface DragCreateState {
  rowId: string;
  startDate: Date;
  endDate: Date;
  project: string;
  module: string;
  feature: string;
  laneIndex: number; // 드래그 시작한 레인 인덱스
}

export interface DragState {
  isActive: boolean; // 드래그 모드 활성화 여부
  isDragging: boolean; // threshold 초과 후 실제 드래그 중
  startX: number;
  currentX: number;
  rowId: string;
  row: DraftRow;
  laneIndex: number; // merge된 레인의 인덱스
}

export interface HoverInfo {
  rowId: string;
  date: Date;
  x: number; // 스냅된 x 좌표
  laneIndex: number; // 개별 레인 인덱스
  nodeTop: number; // 노드 상단 y 좌표
  nodeHeight: number; // 노드 전체 높이
}

export interface MiddleClickScrollState {
  isActive: boolean;
  startX: number;
  startY: number;
  scrollLeft: number;
  scrollTop: number;
}

export interface LaneContextMenuState {
  rowId: string;
  laneIndex: number;
  position: { x: number; y: number };
}

export interface DeleteLaneConfirmState {
  rowId: string;
  laneIndex: number;
  visibleBarsCount: number;
}

export interface ViewPopoverState {
  bar: DraftBarType;
  position: { x: number; y: number };
}

export interface ModuleSummaryPopoverState {
  node: FlatTreeNode;
  anchorRect: DOMRect;
}

export interface BlockContextMenuState {
  position: { x: number; y: number };
  type: "moduleSummary" | "bar";
  data: any; // node or bar
}

