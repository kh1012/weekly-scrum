/**
 * FlagLane Component
 * - Timeline 헤더 아래 Flag 오버레이 레이어
 * - Lane packing으로 겹치는 flags 자동 배치
 * - 마우스 드래그로 flag 생성
 * - 호버 프리뷰 표시
 */

"use client";

import { useMemo, useCallback, useState, useRef } from "react";
import { useDraftStore } from "./store";
import { packFlagsIntoLanes, FLAG_LANE_HEIGHT } from "./flagLayout";
import { FlagBar } from "./FlagBar";
import type { DraftFlag } from "./types";

interface FlagLaneProps {
  rangeStart: Date;
  rangeEnd: Date;
  dayWidth: number;
  totalWidth: number;
  isEditing: boolean;
  scrollLeft: number;
  onOpenCreateModal: () => void;
  onOpenEditModal: (flag: DraftFlag) => void;
  /** Bar에서 호버/선택 시 프리뷰 숨김용 */
  onClearHover?: () => void;
}

export function FlagLane({
  rangeStart,
  rangeEnd,
  dayWidth,
  totalWidth,
  isEditing,
  scrollLeft,
  onOpenCreateModal,
  onOpenEditModal,
  onClearHover,
}: FlagLaneProps) {
  const flags = useDraftStore((s) => s.flags);
  const selectedFlagId = useDraftStore((s) => s.selectedFlagId);
  const selectFlag = useDraftStore((s) => s.selectFlag);
  const pendingFlag = useDraftStore((s) => s.pendingFlag);
  const startPendingFlag = useDraftStore((s) => s.startPendingFlag);
  const endPendingFlag = useDraftStore((s) => s.endPendingFlag);
  const updateFlagLocal = useDraftStore((s) => s.updateFlagLocal);

  // 호버 및 드래그 상태
  const [hoverDayIndex, setHoverDayIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lane packing 계산
  const { laneCount, items } = useMemo(
    () =>
      packFlagsIntoLanes({
        flags,
        rangeStart,
        rangeEnd,
        dayWidth,
      }),
    [flags, rangeStart, rangeEnd, dayWidth]
  );

  // 최소 1개 lane 보장 (빈 상태에서도 영역 표시)
  const effectiveLaneCount = Math.max(1, laneCount);
  const totalHeight = effectiveLaneCount * FLAG_LANE_HEIGHT;

  // 레인 스왑 핸들러: 해당 Flag의 orderIndex를 변경하여 다른 레인으로 이동
  const handleSwapOrder = useCallback(
    (flagId: string, currentLaneIndex: number, targetLaneIndex: number) => {
      // 타겟 레인에 있는 Flag 찾기
      const targetItem = items.find(
        (item) => item.laneIndex === targetLaneIndex
      );
      const currentFlag = flags.find((f) => f.clientId === flagId);

      if (!currentFlag) return;

      if (targetItem) {
        // 타겟 레인에 Flag가 있으면 orderIndex 스왑
        const targetFlag = flags.find((f) => f.clientId === targetItem.flagId);
        if (targetFlag) {
          const tempOrder = currentFlag.orderIndex;
          updateFlagLocal(currentFlag.clientId, {
            orderIndex: targetFlag.orderIndex,
          });
          updateFlagLocal(targetFlag.clientId, { orderIndex: tempOrder });
        }
      } else {
        // 타겟 레인이 비어있으면 orderIndex 조정
        // 위로 이동 시 orderIndex 감소, 아래로 이동 시 증가
        const delta = targetLaneIndex - currentLaneIndex;
        const newOrderIndex = currentFlag.orderIndex + delta;
        updateFlagLocal(currentFlag.clientId, {
          orderIndex: Math.max(0, newOrderIndex),
        });
      }
    },
    [items, flags, updateFlagLocal]
  );

  // 날짜 인덱스 계산 헬퍼
  const getDayIndexFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      // FlagLane 부모가 스크롤되므로 rect.left가 자동으로 올바른 위치 반환
      const x = e.clientX - rect.left;
      return Math.floor(x / dayWidth);
    },
    [dayWidth]
  );

  // 날짜 인덱스에서 Date 객체 생성
  const getDateFromIndex = useCallback(
    (index: number) => {
      const date = new Date(rangeStart);
      date.setDate(date.getDate() + index);
      return date;
    },
    [rangeStart]
  );

  // 마우스 이동 (호버)
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditing) return;

      if (isDragging && dragStart !== null) {
        // 드래그 중 - 끝점 업데이트
        const dayIndex = getDayIndexFromEvent(e);
        setDragEnd(dayIndex);
      } else {
        // FlagBar 위에 있으면 호버 프리뷰 숨김
        if (e.target !== e.currentTarget) {
          setHoverDayIndex(null);
          return;
        }
        // 호버 프리뷰
        const dayIndex = getDayIndexFromEvent(e);
        setHoverDayIndex(dayIndex);
      }
    },
    [isEditing, isDragging, dragStart, getDayIndexFromEvent]
  );

  // 마우스 나감
  const handleMouseLeave = useCallback(() => {
    if (!isDragging) {
      setHoverDayIndex(null);
    }
  }, [isDragging]);

  // 마우스 다운 (드래그 시작)
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isEditing) return;
      // FlagBar 클릭은 무시
      if (e.target !== e.currentTarget) return;

      e.preventDefault();
      const dayIndex = getDayIndexFromEvent(e);
      setIsDragging(true);
      setDragStart(dayIndex);
      setDragEnd(dayIndex);
      setHoverDayIndex(null);
    },
    [isEditing, getDayIndexFromEvent]
  );

  // 마우스 업 (드래그 종료 -> Flag 생성)
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || dragStart === null) return;

      const endIndex = getDayIndexFromEvent(e);
      const minIndex = Math.min(dragStart, endIndex);
      const maxIndex = Math.max(dragStart, endIndex);

      // pendingFlag 설정 후 모달 열기
      const startDate = getDateFromIndex(minIndex);
      const endDate = getDateFromIndex(maxIndex);

      startPendingFlag(startDate);
      endPendingFlag(endDate);
      onOpenCreateModal();

      // 상태 초기화
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    },
    [
      isDragging,
      dragStart,
      getDayIndexFromEvent,
      getDateFromIndex,
      startPendingFlag,
      endPendingFlag,
      onOpenCreateModal,
    ]
  );

  // 영역 클릭 시 선택 해제 (드래그 아닐 때만)
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      // FlagBar 클릭이 아닌 경우에만 선택 해제
      if (e.target === e.currentTarget && !isDragging) {
        selectFlag(null);
      }
    },
    [selectFlag, isDragging]
  );

  // Pending flag 프리뷰 계산
  const pendingPreview = useMemo(() => {
    if (!pendingFlag.start) return null;

    const rangeStartMidnight = new Date(
      rangeStart.getFullYear(),
      rangeStart.getMonth(),
      rangeStart.getDate()
    );

    const startIndex = Math.round(
      (pendingFlag.start.getTime() - rangeStartMidnight.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    // end가 있으면 범위, 없으면 포인트
    if (pendingFlag.end) {
      const endIndex = Math.round(
        (pendingFlag.end.getTime() - rangeStartMidnight.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const minIdx = Math.min(startIndex, endIndex);
      const maxIdx = Math.max(startIndex, endIndex);
      return {
        left: minIdx * dayWidth,
        width: (maxIdx - minIdx + 1) * dayWidth,
        isPoint: false,
      };
    }

    // 시작점만 있을 때 (포인트)
    return {
      left: startIndex * dayWidth + dayWidth / 2 - 1,
      width: 2,
      isPoint: true,
    };
  }, [pendingFlag, rangeStart, dayWidth]);

  // 드래그 프리뷰 계산
  const dragPreview = useMemo(() => {
    if (!isDragging || dragStart === null || dragEnd === null) return null;
    const minIndex = Math.min(dragStart, dragEnd);
    const maxIndex = Math.max(dragStart, dragEnd);
    return {
      left: minIndex * dayWidth,
      width: (maxIndex - minIndex + 1) * dayWidth,
    };
  }, [isDragging, dragStart, dragEnd, dayWidth]);

  // 호버 프리뷰 계산
  const hoverPreview = useMemo(() => {
    if (isDragging || hoverDayIndex === null) return null;
    return {
      left: hoverDayIndex * dayWidth,
      width: dayWidth,
    };
  }, [isDragging, hoverDayIndex, dayWidth]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        height: totalHeight,
        width: totalWidth,
        background:
          "linear-gradient(180deg, rgba(248, 249, 250, 0.8) 0%, rgba(243, 244, 246, 0.6) 100%)",
        cursor: isEditing ? "crosshair" : "default",
      }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {/* 상단 border - 별도 div로 처리 */}
      <div
        className="absolute left-0 right-0 top-0 pointer-events-none"
        style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}
      />
      {/* 하단 border - 별도 div로 처리하여 트리 패널과 높이 일치 */}
      <div
        className="absolute left-0 right-0 bottom-0 pointer-events-none"
        style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
      />
      {/* Flag bars */}
      {items.map((item) => {
        const flag = flags.find((f) => f.clientId === item.flagId);
        if (!flag || flag.deleted) return null;

        return (
          <FlagBar
            key={flag.clientId}
            flag={flag}
            item={item}
            isSelected={selectedFlagId === flag.clientId}
            isEditing={isEditing}
            onSelect={() => selectFlag(flag.clientId)}
            onDoubleClick={() => onOpenEditModal(flag)}
            dayWidth={dayWidth}
            rangeStart={rangeStart}
            laneCount={effectiveLaneCount}
            onSwapOrder={(targetLane) =>
              handleSwapOrder(flag.clientId, item.laneIndex, targetLane)
            }
          />
        );
      })}

      {/* 호버 프리뷰 */}
      {isEditing && hoverPreview && (
        <div
          className="absolute pointer-events-none transition-opacity duration-100"
          style={{
            left: hoverPreview.left,
            top: 3,
            width: hoverPreview.width,
            height: FLAG_LANE_HEIGHT - 6,
            background: "rgba(239, 68, 68, 0.1)",
            border: "1px dashed rgba(239, 68, 68, 0.4)",
            borderRadius: 4,
          }}
        />
      )}

      {/* 드래그 프리뷰 */}
      {isEditing && dragPreview && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: dragPreview.left,
            top: 3,
            width: dragPreview.width,
            height: FLAG_LANE_HEIGHT - 6,
            background: "rgba(239, 68, 68, 0.2)",
            border: "2px dashed #ef4444",
            borderRadius: 4,
          }}
        />
      )}

      {/* Pending flag 프리뷰 (레거시 - 모달에서 사용) */}
      {isEditing && pendingPreview && !isDragging && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: pendingPreview.left,
            top: 3,
            width: pendingPreview.width,
            height: FLAG_LANE_HEIGHT - 6,
            background: pendingPreview.isPoint
              ? "#ef4444"
              : "rgba(239, 68, 68, 0.2)",
            border: pendingPreview.isPoint ? "none" : "2px dashed #ef4444",
            borderRadius: pendingPreview.isPoint ? 0 : 4,
          }}
        />
      )}

      {/* 빈 상태 안내 */}
      {flags.filter((f) => !f.deleted).length === 0 &&
        isEditing &&
        !isDragging &&
        !hoverPreview && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[10px] text-gray-400">
              드래그하여 Flag 추가
            </span>
          </div>
        )}
    </div>
  );
}

export { FLAG_LANE_HEIGHT };
