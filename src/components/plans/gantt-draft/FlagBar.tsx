/**
 * FlagBar Component
 * - Point flag: 수직선 + 타이틀
 * - Range flag: 시작/끝 수직선 + 상단 블록 + 타이틀
 * - 드래그로 이동 (일별 스냅)
 * - 리사이즈로 기간 수정
 */

"use client";

import { memo, useCallback, useState, useRef } from "react";
import { useDraftStore } from "./store";
import type { DraftFlag, PackedFlagLaneItem } from "./types";
import { FLAG_LANE_HEIGHT } from "./flagLayout";
import { formatDate, parseLocalDate } from "./laneLayout";

const RESIZE_HANDLE_WIDTH = 8;
const MIN_WIDTH = 20; // 최소 너비 (point flag용)

interface FlagBarProps {
  flag: DraftFlag;
  item: PackedFlagLaneItem;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  dayWidth: number;
  rangeStart: Date;
  /** 현재 레인 개수 (위아래 이동 범위 제한용) */
  laneCount: number;
  /** 같은 레인의 다른 Flag들과 orderIndex 스왑 콜백 */
  onSwapOrder?: (targetLaneIndex: number) => void;
}

type DragMode = "move" | "resize-left" | "resize-right" | null;

export const FlagBar = memo(function FlagBar({
  flag,
  item,
  isSelected,
  isEditing,
  onSelect,
  onDoubleClick,
  dayWidth,
  rangeStart,
  laneCount,
  onSwapOrder,
}: FlagBarProps) {
  const { startX, width, isPoint, laneIndex } = item;
  const top = laneIndex * FLAG_LANE_HEIGHT;

  const updateFlagLocal = useDraftStore((s) => s.updateFlagLocal);
  const setHighlightDateRange = useDraftStore((s) => s.setHighlightDateRange);

  const barRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragOffset, setDragOffset] = useState({ left: 0, width: 0, top: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 색상 결정 (기본값: 빨간색 계열)
  const flagColor = flag.color || "#ef4444";

  // 드래그 시작
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      if (!isEditing) return;

      e.stopPropagation();
      e.preventDefault();

      setDragMode(mode);
      setDragOffset({ left: 0, width: 0, top: 0 });

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startMouseX;
        const deltaY = moveEvent.clientY - startMouseY;
        // 일 단위로 스냅
        const snappedDeltaX = Math.round(deltaX / dayWidth) * dayWidth;
        // 레인 단위로 스냅
        const snappedDeltaY =
          Math.round(deltaY / FLAG_LANE_HEIGHT) * FLAG_LANE_HEIGHT;

        if (mode === "move") {
          setDragOffset({ left: snappedDeltaX, width: 0, top: snappedDeltaY });
        } else if (mode === "resize-left") {
          setDragOffset({ left: snappedDeltaX, width: -snappedDeltaX, top: 0 });
        } else if (mode === "resize-right") {
          setDragOffset({ left: 0, width: snappedDeltaX, top: 0 });
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        const deltaX = upEvent.clientX - startMouseX;
        const deltaY = upEvent.clientY - startMouseY;
        const daysDelta = Math.round(deltaX / dayWidth);
        const laneDelta = Math.round(deltaY / FLAG_LANE_HEIGHT);

        // X축 이동 (날짜 변경)
        if (daysDelta !== 0 && mode === "move") {
          const originalStart = parseLocalDate(flag.startDate);
          const originalEnd = parseLocalDate(flag.endDate);

          const newStart = new Date(originalStart);
          newStart.setDate(newStart.getDate() + daysDelta);
          const newEnd = new Date(originalEnd);
          newEnd.setDate(newEnd.getDate() + daysDelta);

          updateFlagLocal(flag.clientId, {
            startDate: formatDate(newStart),
            endDate: formatDate(newEnd),
          });
        }

        // Y축 이동 (레인 스왑)
        if (laneDelta !== 0 && mode === "move" && onSwapOrder) {
          const targetLane = laneIndex + laneDelta;
          // 범위 체크
          if (targetLane >= 0 && targetLane < laneCount) {
            onSwapOrder(targetLane);
          }
        }

        // 리사이즈 처리
        if (mode === "resize-left" && daysDelta !== 0) {
          const originalStart = parseLocalDate(flag.startDate);
          const originalEnd = parseLocalDate(flag.endDate);
          const newStart = new Date(originalStart);
          newStart.setDate(newStart.getDate() + daysDelta);

          if (newStart <= originalEnd) {
            updateFlagLocal(flag.clientId, {
              startDate: formatDate(newStart),
            });
          }
        } else if (mode === "resize-right" && daysDelta !== 0) {
          const originalStart = parseLocalDate(flag.startDate);
          const originalEnd = parseLocalDate(flag.endDate);
          const newEnd = new Date(originalEnd);
          newEnd.setDate(newEnd.getDate() + daysDelta);

          if (newEnd >= originalStart) {
            updateFlagLocal(flag.clientId, {
              endDate: formatDate(newEnd),
            });
          }
        }

        setDragMode(null);
        setDragOffset({ left: 0, width: 0, top: 0 });
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [
      isEditing,
      flag,
      updateFlagLocal,
      dayWidth,
      laneIndex,
      laneCount,
      onSwapOrder,
    ]
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
    },
    [onSelect]
  );

  const handleDoubleClickEvent = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      // 더블 클릭 시 강조 표시 활성화
      setHighlightDateRange({
        startDate: flag.startDate,
        endDate: flag.endDate,
        type: "flag",
        color: flag.color || "#ef4444",
        nodeId: flag.clientId,
      });
      if (isEditing) {
        onDoubleClick();
      }
    },
    [isEditing, onDoubleClick, flag, setHighlightDateRange]
  );

  const isDragging = dragMode !== null;
  const currentLeft = startX + dragOffset.left;
  const currentWidth = Math.max(MIN_WIDTH, width + dragOffset.width);
  const currentTop = top + dragOffset.top;

  if (isPoint) {
    // Point flag: 수직선 + 타이틀 라벨 (드래그 가능)
    return (
      <div
        ref={barRef}
        className="absolute cursor-pointer group"
        style={{
          left: currentLeft + currentWidth / 2 - 1,
          top: currentTop,
          height: FLAG_LANE_HEIGHT,
          zIndex: isSelected ? 20 : isDragging ? 15 : 10,
          cursor: isEditing ? (isDragging ? "grabbing" : "grab") : "pointer",
        }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClickEvent}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* 수직선 */}
        <div
          className="absolute h-full transition-all duration-150"
          style={{
            left: 0,
            width: 2,
            background: flagColor,
            boxShadow: isSelected ? `0 0 6px ${flagColor}` : "none",
          }}
        />

        {/* 상단 마커 (다이아몬드 모양) */}
        <div
          className="absolute transition-transform duration-150"
          style={{
            left: -5,
            top: 2,
            width: 12,
            height: 12,
            background: flagColor,
            transform: `rotate(45deg) ${isHovered ? "scale(1.1)" : "scale(1)"}`,
            boxShadow: isSelected
              ? `0 0 8px ${flagColor}`
              : "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />

        {/* 타이틀 라벨 (마커 옆) */}
        <div
          className="absolute whitespace-nowrap text-[10px] font-medium px-1.5 py-0.5 rounded transition-all duration-150"
          style={{
            left: 10,
            top: 3,
            color: flagColor,
            background: isSelected
              ? `${flagColor}15`
              : isHovered
              ? `${flagColor}10`
              : "transparent",
            maxWidth: 120,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
          title={flag.title}
        >
          {flag.title}
        </div>

        {/* 클릭 가능 영역 확장 (hitbox) */}
        <div
          className="absolute opacity-0"
          style={{
            left: -12,
            top: 0,
            width: 24,
            height: FLAG_LANE_HEIGHT,
          }}
        />
      </div>
    );
  }

  // Range flag: 시작/끝 수직선 + 상단 블록 + 타이틀
  return (
    <div
      ref={barRef}
      className="absolute group"
      style={{
        left: currentLeft,
        top: currentTop,
        width: currentWidth,
        height: FLAG_LANE_HEIGHT,
        zIndex: isSelected ? 20 : isDragging ? 15 : 10,
        cursor: isEditing ? (isDragging ? "grabbing" : "grab") : "pointer",
        transform:
          isHovered && !isDragging ? "translateY(-1px)" : "translateY(0)",
        transition: isDragging ? "none" : "transform 150ms ease-out",
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClickEvent}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 시작 수직선 */}
      <div
        className="absolute h-full"
        style={{
          left: 0,
          width: 2,
          background: flagColor,
          opacity: 0.7,
        }}
      />

      {/* 끝 수직선 */}
      <div
        className="absolute h-full"
        style={{
          right: 0,
          width: 2,
          background: flagColor,
          opacity: 0.7,
        }}
      />

      {/* 상단 블록 (타이틀 포함) - 드래그 영역 */}
      <div
        className="absolute rounded-sm flex items-center justify-center px-2 transition-all duration-150"
        style={{
          left: 2,
          right: 2,
          top: 3,
          height: FLAG_LANE_HEIGHT - 6,
          background: `${flagColor}20`,
          border: `1px solid ${flagColor}50`,
          boxShadow: isSelected
            ? `0 0 8px ${flagColor}40, inset 0 0 0 1px ${flagColor}`
            : isHovered
            ? `0 2px 8px ${flagColor}30`
            : "0 1px 2px rgba(0,0,0,0.1)",
        }}
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        <span
          className="text-[10px] font-medium truncate text-center"
          style={{ color: flagColor }}
          title={flag.title}
        >
          {flag.title}
        </span>
      </div>

      {/* 좌측 리사이즈 핸들 */}
      {isEditing && (
        <div
          className="absolute left-0 top-0 bottom-0 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center"
          style={{ width: RESIZE_HANDLE_WIDTH }}
          onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        >
          <div
            className="w-0.5 h-3 rounded-full"
            style={{ background: flagColor, opacity: 0.7 }}
          />
        </div>
      )}

      {/* 우측 리사이즈 핸들 */}
      {isEditing && (
        <div
          className="absolute right-0 top-0 bottom-0 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center"
          style={{ width: RESIZE_HANDLE_WIDTH }}
          onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        >
          <div
            className="w-0.5 h-3 rounded-full"
            style={{ background: flagColor, opacity: 0.7 }}
          />
        </div>
      )}
    </div>
  );
});
