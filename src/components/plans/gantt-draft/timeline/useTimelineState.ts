/**
 * DraftTimeline 상태 관리 커스텀 훅
 */

import { useState } from "react";
import type {
  DragCreateState,
  DragState,
  HoverInfo,
  MiddleClickScrollState,
  LaneContextMenuState,
  DeleteLaneConfirmState,
  ViewPopoverState,
  ModuleSummaryPopoverState,
  BlockContextMenuState,
} from "./timelineTypes";
import type { DraftBar as DraftBarType, DraftFlag } from "../types";

export function useTimelineState() {
  // Flag 모달 상태
  const [showCreateFlagModal, setShowCreateFlagModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<DraftFlag | null>(null);

  // Flag 스크롤 동기화를 위한 scrollLeft 상태
  const [headerScrollLeft, setHeaderScrollLeft] = useState(0);

  // 호버 정보 - 개별 레인에 스냅
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);

  // 드래그 생성 상태
  const [dragCreate, setDragCreate] = useState<DragState | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState<DragCreateState | null>(null);
  const [showEditModal, setShowEditModal] = useState<DraftBarType | null>(null);

  // readOnly 모드에서 Plan 보기 팝오버 상태
  const [viewPopover, setViewPopover] = useState<ViewPopoverState | null>(null);

  // ModuleSummaryBar 팝오버 상태
  const [moduleSummaryPopover, setModuleSummaryPopover] =
    useState<ModuleSummaryPopoverState | null>(null);

  // 휠 클릭 스크롤 상태
  const [middleClickScroll, setMiddleClickScroll] =
    useState<MiddleClickScrollState | null>(null);

  // 레인 컨텍스트 메뉴 상태
  const [laneContextMenu, setLaneContextMenu] =
    useState<LaneContextMenuState | null>(null);

  // 레인 삭제 확인 모달 상태
  const [deleteLaneConfirm, setDeleteLaneConfirm] =
    useState<DeleteLaneConfirmState | null>(null);

  // 블록 컨텍스트 메뉴 상태
  const [blockContextMenu, setBlockContextMenu] =
    useState<BlockContextMenuState | null>(null);

  return {
    // Flag 모달
    showCreateFlagModal,
    setShowCreateFlagModal,
    editingFlag,
    setEditingFlag,

    // 스크롤
    headerScrollLeft,
    setHeaderScrollLeft,

    // 호버
    hoverInfo,
    setHoverInfo,

    // 드래그 생성
    dragCreate,
    setDragCreate,

    // 생성/수정 모달
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,

    // 팝오버
    viewPopover,
    setViewPopover,
    moduleSummaryPopover,
    setModuleSummaryPopover,

    // 휠 클릭
    middleClickScroll,
    setMiddleClickScroll,

    // 레인 메뉴
    laneContextMenu,
    setLaneContextMenu,
    deleteLaneConfirm,
    setDeleteLaneConfirm,

    // 블록 컨텍스트 메뉴
    blockContextMenu,
    setBlockContextMenu,
  };
}

