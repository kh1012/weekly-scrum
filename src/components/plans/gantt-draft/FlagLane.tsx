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
import { FlagViewPopover } from "./FlagViewPopover";
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
  const [hoverLaneIndex, setHoverLaneIndex] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [dragLaneIndex, setDragLaneIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // 팝오버 상태 (readOnly 모드에서 더블클릭 시 표시)
  const [viewPopover, setViewPopover] = useState<{
    flag: DraftFlag;
    position: { x: number; y: number };
  } | null>(null);

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

  // 레인 스왑 핸들러: 드래그로 다른 레인으로 이동 시 겹침 처리
  const handleSwapOrder = useCallback(
    (flagId: string, currentLaneIndex: number, targetLaneIndex: number) => {
      const currentItem = items.find((item) => item.flagId === flagId);
      const currentFlag = flags.find((f) => f.clientId === flagId);

      if (!currentFlag || !currentItem) return;

      // 드래그 중인 flag를 타겟 레인에 배치
      updateFlagLocal(currentFlag.clientId, {
        laneHint: targetLaneIndex,
      });

      // 겹침 처리: 연쇄적으로 충돌 해결
      // 레인별로 flag 아이템 그룹화
      const itemsByLane = new Map<number, typeof items>();
      items.forEach((item) => {
        if (item.flagId === flagId) return; // 드래그 flag 제외
        const lane = item.laneIndex;
        if (!itemsByLane.has(lane)) {
          itemsByLane.set(lane, []);
        }
        itemsByLane.get(lane)!.push(item);
      });

      // 타겟 레인부터 아래로 순회하며 연쇄적으로 밀기
      const maxLane = Math.max(...Array.from(itemsByLane.keys()), targetLaneIndex);
      const flagsToMove = new Map<string, number>(); // flagId -> 새 레인
      
      for (let currentLane = targetLaneIndex; currentLane <= maxLane + 1; currentLane++) {
        const itemsInCurrentLane = itemsByLane.get(currentLane) || [];
        
        // 이 레인에 이동해야 할 flag가 있는지 확인 (이전 단계에서 밀린 flag)
        const incomingItems = Array.from(flagsToMove.entries())
          .filter(([_, targetLn]) => targetLn === currentLane)
          .map(([flagId, _]) => items.find((item) => item.flagId === flagId)!)
          .filter(Boolean);
        
        // 드래그 flag가 이 레인에 배치되는지 확인
        const isDraggedFlagHere = currentLane === targetLaneIndex;
        
        // 현재 레인에 있는 flag들 중 날짜가 겹치는 것이 있는지 확인
        const hasConflict = itemsInCurrentLane.some((existingItem) => {
          // 이미 이동 예정인 flag는 제외
          if (flagsToMove.has(existingItem.flagId)) return false;
          
          const existingStart = new Date(existingItem.startDate).getTime();
          const existingEnd = new Date(existingItem.endDate).getTime();
          
          // 드래그 flag와의 충돌 검사
          if (isDraggedFlagHere) {
            const dragStart = new Date(currentItem.startDate).getTime();
            const dragEnd = new Date(currentItem.endDate).getTime();
            if (!(dragEnd < existingStart || dragStart > existingEnd)) {
              return true;
            }
          }
          
          // 위에서 밀려온 flag들과의 충돌 검사
          return incomingItems.some((incomingItem) => {
            const incomingStart = new Date(incomingItem.startDate).getTime();
            const incomingEnd = new Date(incomingItem.endDate).getTime();
            return !(incomingEnd < existingStart || incomingStart > existingEnd);
          });
        });
        
        // 충돌이 있으면 현재 레인의 flag들을 한 칸 아래로 이동 예약
        if (hasConflict) {
          itemsInCurrentLane.forEach((item) => {
            if (!flagsToMove.has(item.flagId)) {
              flagsToMove.set(item.flagId, currentLane + 1);
            }
          });
        }
      }
      
      // 예약된 모든 flag 이동 실행
      flagsToMove.forEach((newLane, flagId) => {
        updateFlagLocal(flagId, {
          laneHint: newLane,
        });
      });
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

  // 레인 인덱스 계산 헬퍼
  const getLaneIndexFromEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      if (!containerRef.current) return 0;
      const rect = containerRef.current.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const laneIdx = Math.floor(y / FLAG_LANE_HEIGHT);
      return Math.max(0, Math.min(laneIdx, effectiveLaneCount - 1));
    },
    [effectiveLaneCount]
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
        // 호버 프리뷰 - 날짜와 레인 모두 추적
        const dayIndex = getDayIndexFromEvent(e);
        const laneIndex = getLaneIndexFromEvent(e);
        setHoverDayIndex(dayIndex);
        setHoverLaneIndex(laneIndex);
      }
    },
    [isEditing, isDragging, dragStart, getDayIndexFromEvent, getLaneIndexFromEvent]
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
      // 좌클릭만 허용
      if (e.button !== 0) return;
      
      if (!isEditing) return;
      // FlagBar 클릭은 무시
      if (e.target !== e.currentTarget) return;

      e.preventDefault();
      const dayIndex = getDayIndexFromEvent(e);
      const laneIndex = getLaneIndexFromEvent(e);
      setIsDragging(true);
      setDragStart(dayIndex);
      setDragEnd(dayIndex);
      setDragLaneIndex(laneIndex);
      setHoverDayIndex(null);
    },
    [isEditing, getDayIndexFromEvent, getLaneIndexFromEvent]
  );

  // 마우스 업 (드래그 종료 -> Flag 생성)
  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || dragStart === null) return;

      const endIndex = getDayIndexFromEvent(e);
      const minIndex = Math.min(dragStart, endIndex);
      const maxIndex = Math.max(dragStart, endIndex);

      // pendingFlag 설정 후 모달 열기 (레인 정보 포함)
      const startDate = getDateFromIndex(minIndex);
      const endDate = getDateFromIndex(maxIndex);

      startPendingFlag(startDate, dragLaneIndex ?? undefined);
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
      top: dragLaneIndex * FLAG_LANE_HEIGHT + 3,
      width: (maxIndex - minIndex + 1) * dayWidth,
      height: FLAG_LANE_HEIGHT - 6,
    };
  }, [isDragging, dragStart, dragEnd, dragLaneIndex, dayWidth]);

  // 호버 프리뷰 계산
  const hoverPreview = useMemo(() => {
    if (isDragging || hoverDayIndex === null) return null;
    return {
      left: hoverDayIndex * dayWidth,
      top: hoverLaneIndex * FLAG_LANE_HEIGHT + 3,
      width: dayWidth,
      height: FLAG_LANE_HEIGHT - 6,
    };
  }, [isDragging, hoverDayIndex, hoverLaneIndex, dayWidth]);

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
            onDoubleClick={(e) => {
              // 기존 팝오버가 열려있으면 닫기
              setViewPopover(null);
              
              if (!isEditing && e) {
                // 편집 모드가 아닐 때: 팝오버 표시 (읽기 전용)
                setViewPopover({
                  flag,
                  position: { x: e.clientX, y: e.clientY },
                });
              } else if (isEditing) {
                // 편집 모드: 모달 열기
                onOpenEditModal(flag);
              }
            }}
            dayWidth={dayWidth}
            rangeStart={rangeStart}
            laneCount={effectiveLaneCount}
            onSwapOrder={(targetLane) =>
              handleSwapOrder(flag.clientId, item.laneIndex, targetLane)
            }
            allItems={items}
          />
        );
      })}

      {/* 호버 프리뷰 */}
      {isEditing && hoverPreview && (
        <div
          className="absolute pointer-events-none transition-opacity duration-100"
          style={{
            left: hoverPreview.left,
            top: hoverPreview.top,
            width: hoverPreview.width,
            height: hoverPreview.height,
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
            top: dragPreview.top,
            width: dragPreview.width,
            height: dragPreview.height,
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

      {/* readOnly 모드: Flag 상세 팝오버 */}
      {viewPopover && (
        <FlagViewPopover
          flag={viewPopover.flag}
          anchorPosition={viewPopover.position}
          onClose={() => setViewPopover(null)}
        />
      )}
    </div>
  );
}

export { FLAG_LANE_HEIGHT };
