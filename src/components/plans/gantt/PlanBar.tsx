"use client";

import { memo, useState, useCallback } from "react";
import type { PlanWithAssignees } from "@/lib/data/plans";
import type { GanttMode, DragType } from "./types";
import { getStageColor } from "@/lib/ui/stageColor";
import { ROW_HEIGHT, formatDateRange } from "./useGanttLayout";

interface PlanBarProps {
  plan: PlanWithAssignees;
  left: number;
  width: number;
  mode: GanttMode;
  isSelected?: boolean;
  onSelect?: () => void;
  onResizeStart?: (type: DragType, planId: string) => void;
}

/**
 * Plan 막대 컴포넌트
 */
export const PlanBar = memo(function PlanBar({
  plan,
  left,
  width,
  mode,
  isSelected,
  onSelect,
  onResizeStart,
}: PlanBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const stageColor = getStageColor(plan.stage);
  const isAdmin = mode === "admin";

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: DragType) => {
      if (!isAdmin || !onResizeStart) return;
      e.stopPropagation();
      e.preventDefault();
      onResizeStart(type, plan.id);
    },
    [isAdmin, onResizeStart, plan.id]
  );

  // 날짜 범위 툴팁
  const tooltip =
    plan.start_date && plan.end_date
      ? formatDateRange(new Date(plan.start_date), new Date(plan.end_date))
      : "일정 미지정";

  return (
    <div
      className="absolute flex items-center gap-1 px-2 rounded cursor-pointer transition-all group"
      style={{
        left,
        width,
        height: ROW_HEIGHT - 8,
        top: 4,
        background: stageColor.bg,
        border: `1px solid ${isSelected ? stageColor.text : stageColor.border}`,
        boxShadow: isSelected
          ? `0 0 0 2px ${stageColor.text}40`
          : isHovered
            ? `0 2px 8px rgba(0, 0, 0, 0.1)`
            : "none",
        zIndex: isSelected ? 10 : isHovered ? 5 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      title={tooltip}
    >
      {/* Left Resize Handle (Admin only) */}
      {isAdmin && (
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `${stageColor.text}30` }}
          onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        />
      )}

      {/* Title */}
      <span
        className="flex-1 truncate text-xs font-medium"
        style={{ color: stageColor.text }}
      >
        {plan.title}
      </span>

      {/* Stage Badge */}
      {width > 80 && (
        <span
          className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded"
          style={{
            background: stageColor.text + "20",
            color: stageColor.text,
          }}
        >
          {plan.stage}
        </span>
      )}

      {/* Right Resize Handle (Admin only) */}
      {isAdmin && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: `${stageColor.text}30` }}
          onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        />
      )}
    </div>
  );
});

