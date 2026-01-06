/**
 * DraftTimeline 드래그 생성 로직
 */

import { useCallback, useRef, useMemo } from "react";
import { xToDate, formatDate } from "../laneLayout";
import type { DraftRow, PlanStatus, DraftAssignee, PlanLink } from "../types";
import type { DragState, DragCreateState } from "./timelineTypes";
import { DAY_WIDTH } from "./timelineTypes";

interface UseTimelineDragCreateProps {
  isEditing: boolean;
  rangeStart: Date;
  dragCreate: DragState | null;
  setDragCreate: React.Dispatch<React.SetStateAction<DragState | null>>;
  setHoverInfo: (info: any) => void;
  setShowCreateModal: (state: DragCreateState | null) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onAction?: () => void;
  addBar: (data: any) => void;
  middleClickScroll: { isActive: boolean } | null;
  setMiddleClickScroll: (state: any) => void;
}

export function useTimelineDragCreate({
  isEditing,
  rangeStart,
  dragCreate,
  setDragCreate,
  setHoverInfo,
  setShowCreateModal,
  containerRef,
  onAction,
  addBar,
  middleClickScroll,
  setMiddleClickScroll,
}: UseTimelineDragCreateProps) {
  // 드래그 상태를 ref로 관리 (성능 최적화 - 렌더링 최소화)
  const dragCreateRef = useRef(dragCreate);
  dragCreateRef.current = dragCreate;

  // Drag create 핸들링 - 일 단위로 스냅
  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      rowId: string,
      row: DraftRow,
      laneIndex: number = 0
    ) => {
      // 좌클릭만 허용
      if (e.button !== 0) return;

      // 편집 모드가 아니면 무시
      if (!isEditing) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX =
        e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
      // 일 단위로 스냅 (클릭한 셀의 시작점)
      const snappedX = Math.floor(rawX / DAY_WIDTH) * DAY_WIDTH;

      // 호버 프리뷰 숨기기
      setHoverInfo(null);

      // 액션 발생 - 락 연장 트리거
      onAction?.();

      // mouse down 시 바로 프리뷰 표시 (파란색 블록)
      setDragCreate({
        isActive: true,
        isDragging: false,
        startX: snappedX,
        currentX: snappedX,
        rowId,
        row,
        laneIndex,
      });
    },
    [isEditing, onAction, containerRef, setDragCreate, setHoverInfo]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const current = dragCreateRef.current;
      if (!current?.isActive) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX =
        e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
      // 일 단위로 스냅 (드래그 중에도 셀 경계에 맞춤)
      const snappedX = Math.floor(rawX / DAY_WIDTH) * DAY_WIDTH;

      // 같은 위치면 업데이트 안함 (성능 최적화)
      if (snappedX === current.currentX) return;

      const distance = Math.abs(snappedX - current.startX);
      const shouldDrag = distance >= DAY_WIDTH; // 1일 이상 이동 시 드래그

      setDragCreate((prev) =>
        prev
          ? {
              ...prev,
              currentX: snappedX,
              isDragging: shouldDrag || prev.isDragging,
            }
          : null
      );
    },
    [containerRef, setDragCreate]
  );

  const handleMouseUp = useCallback(() => {
    // 휠 클릭 스크롤 종료
    if (middleClickScroll?.isActive) {
      setMiddleClickScroll(null);
      return;
    }

    if (!dragCreate?.isActive) return;

    const startX = Math.min(dragCreate.startX, dragCreate.currentX);
    const endX = Math.max(dragCreate.startX, dragCreate.currentX);

    // 드래그 모드인 경우: 범위 선택
    if (dragCreate.isDragging) {
      const startDate = xToDate(startX, rangeStart, DAY_WIDTH);
      const endDate = xToDate(endX, rangeStart, DAY_WIDTH);

      setShowCreateModal({
        rowId: dragCreate.rowId,
        startDate,
        endDate,
        project: dragCreate.row.project,
        module: dragCreate.row.module,
        feature: dragCreate.row.feature,
        laneIndex: dragCreate.laneIndex,
      });
    } else {
      // 클릭인 경우: 1일짜리 기간 즉시 생성
      const clickDate = xToDate(dragCreate.startX, rangeStart, DAY_WIDTH);

      setShowCreateModal({
        rowId: dragCreate.rowId,
        startDate: clickDate,
        endDate: clickDate, // 같은 날짜 = 1일
        project: dragCreate.row.project,
        module: dragCreate.row.module,
        feature: dragCreate.row.feature,
        laneIndex: dragCreate.laneIndex,
      });
    }

    setDragCreate(null);
  }, [
    dragCreate,
    rangeStart,
    middleClickScroll,
    setShowCreateModal,
    setDragCreate,
    setMiddleClickScroll,
  ]);

  // 생성 모달 완료
  const handleCreatePlan = useCallback(
    (
      showCreateModal: DragCreateState | null,
      data: {
        title: string;
        stage: string;
        status: PlanStatus;
        assignees: DraftAssignee[];
        description?: string;
        links?: PlanLink[];
      }
    ) => {
      if (!showCreateModal) return;

      addBar({
        rowId: showCreateModal.rowId,
        title: data.title,
        stage: data.stage,
        status: data.status,
        startDate: formatDate(showCreateModal.startDate),
        endDate: formatDate(showCreateModal.endDate),
        assignees: data.assignees,
        description: data.description,
        links: data.links,
        preferredLane: showCreateModal.laneIndex,
      });

      setShowCreateModal(null);
    },
    [addBar, setShowCreateModal]
  );

  // 드래그 프리뷰 계산 - isActive이면 표시 (마우스 다운 즉시)
  const dragPreview = useMemo(() => {
    if (!dragCreate?.isActive) return null;

    const startX = Math.min(dragCreate.startX, dragCreate.currentX);
    const endX = Math.max(dragCreate.startX, dragCreate.currentX);
    // 너비는 끝점 + 1일 너비 (포함)
    const width = endX - startX + DAY_WIDTH;

    return { left: startX, width };
  }, [dragCreate]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleCreatePlan,
    dragPreview,
  };
}

