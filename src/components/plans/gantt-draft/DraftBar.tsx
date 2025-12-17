/**
 * Draft Bar 컴포넌트
 * - Bar 렌더링
 * - Drag to move / resize
 * - 선택/삭제
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { useDraftStore } from "./store";
import { calculateMovedDates, calculateResizedDates } from "./laneLayout";
import { getStageColor } from "@/lib/ui/stageColor";
import type { BarWithLane } from "./types";

const LANE_HEIGHT = 32;
const RESIZE_HANDLE_WIDTH = 6;

interface DraftBarProps {
  bar: BarWithLane;
  left: number;
  width: number;
  lane: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  dayWidth: number;
  rangeStart: Date;
}

type DragMode = "move" | "resize-left" | "resize-right" | null;

export function DraftBar({
  bar,
  left,
  width,
  lane,
  isSelected,
  isEditing,
  onSelect,
  dayWidth,
  rangeStart,
}: DraftBarProps) {
  const updateBar = useDraftStore((s) => s.updateBar);
  const deleteBar = useDraftStore((s) => s.deleteBar);

  const barRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState({ left: 0, width: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const stageColor = getStageColor(bar.stage);

  // 드래그 시작
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      if (!isEditing) return;

      e.stopPropagation();
      e.preventDefault();

      setDragMode(mode);
      setDragStartX(e.clientX);
      setDragOffset({ left: 0, width: 0 });

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - e.clientX;

        if (mode === "move") {
          setDragOffset({ left: deltaX, width: 0 });
        } else if (mode === "resize-left") {
          setDragOffset({ left: deltaX, width: -deltaX });
        } else if (mode === "resize-right") {
          setDragOffset({ left: 0, width: deltaX });
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        const deltaX = upEvent.clientX - e.clientX;

        if (Math.abs(deltaX) > 10) {
          if (mode === "move") {
            const newDates = calculateMovedDates(bar, deltaX, rangeStart, dayWidth);
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
            });
          } else if (mode === "resize-left") {
            const newDates = calculateResizedDates(bar, "start", deltaX, rangeStart, dayWidth);
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
            });
          } else if (mode === "resize-right") {
            const newDates = calculateResizedDates(bar, "end", deltaX, rangeStart, dayWidth);
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
            });
          }
        }

        setDragMode(null);
        setDragOffset({ left: 0, width: 0 });
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isEditing, bar, updateBar, dayWidth, rangeStart]
  );

  // 클릭 핸들링
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
    },
    [onSelect]
  );

  // 키보드 핸들링 (Delete)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteBar(bar.clientUid);
      }
    },
    [isEditing, deleteBar, bar.clientUid]
  );

  const currentLeft = left + dragOffset.left;
  const currentWidth = Math.max(dayWidth, width + dragOffset.width);

  return (
    <div
      ref={barRef}
      className={`absolute rounded transition-shadow ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-1" : ""
      } ${dragMode ? "cursor-grabbing" : ""}`}
      style={{
        left: currentLeft,
        top: lane * LANE_HEIGHT + 2,
        width: currentWidth,
        height: LANE_HEIGHT - 4,
        background: stageColor.bg,
        borderLeft: `3px solid ${stageColor.border}`,
        boxShadow: isHovered || dragMode ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
        zIndex: isSelected || dragMode ? 10 : 1,
      }}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={isEditing ? 0 : -1}
    >
      {/* 콘텐츠 */}
      <div
        className="flex items-center h-full px-2 overflow-hidden cursor-grab"
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        <span
          className="text-xs font-medium truncate"
          style={{ color: stageColor.text }}
        >
          {bar.title}
        </span>

        {/* 스테이지 뱃지 */}
        {currentWidth > 80 && (
          <span
            className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded flex-shrink-0"
            style={{
              background: `${stageColor.border}20`,
              color: stageColor.border,
            }}
          >
            {bar.stage}
          </span>
        )}

        {/* 상태 표시 */}
        {bar.status === "완료" && currentWidth > 60 && (
          <span className="ml-1 text-[10px]">✓</span>
        )}

        {/* dirty 표시 */}
        {bar.dirty && (
          <span
            className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: "#f59e0b" }}
            title="변경됨"
          />
        )}
      </div>

      {/* 리사이즈 핸들 - 좌측 */}
      {isEditing && (isHovered || isSelected) && (
        <div
          className="absolute top-0 left-0 h-full cursor-ew-resize hover:bg-blue-500/20 transition-colors"
          style={{ width: RESIZE_HANDLE_WIDTH }}
          onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        />
      )}

      {/* 리사이즈 핸들 - 우측 */}
      {isEditing && (isHovered || isSelected) && (
        <div
          className="absolute top-0 right-0 h-full cursor-ew-resize hover:bg-blue-500/20 transition-colors"
          style={{ width: RESIZE_HANDLE_WIDTH }}
          onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        />
      )}
    </div>
  );
}

