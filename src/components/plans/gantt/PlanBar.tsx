"use client";

import { memo, useState, useCallback } from "react";
import type { PlanWithAssignees } from "@/lib/data/plans";
import type { GanttMode, DragType } from "./types";
import { getStageColor } from "@/lib/ui/stageColor";
import { ROW_HEIGHT } from "./useGanttLayout";

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
 * 날짜 범위 포맷 (짧은 형태: Dec 1-4)
 */
function formatShortDateRange(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();
  
  // 같은 달이면 "Dec 1-4", 다른 달이면 "Dec 1-Jan 4"
  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  const endMonth = monthNames[end.getMonth()];
  return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
}

/**
 * Plan type에 따른 배경색
 */
function getTypeStyle(type: string) {
  switch (type) {
    case "sprint":
      return { bg: "rgba(139, 92, 246, 0.15)", border: "rgba(139, 92, 246, 0.3)", text: "#8b5cf6" };
    case "release":
      return { bg: "rgba(236, 72, 153, 0.15)", border: "rgba(236, 72, 153, 0.3)", text: "#ec4899" };
    default: // feature
      return null; // stage color 사용
  }
}

/**
 * Plan 막대 컴포넌트
 * - 상단: 도메인/기간 표시
 * - 하단: 타이틀 표시
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
  const typeStyle = getTypeStyle(plan.type);
  const isAdmin = mode === "admin";
  
  // type에 따라 스타일 결정
  const colorStyle = typeStyle || stageColor;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: DragType) => {
      if (!isAdmin || !onResizeStart) return;
      e.stopPropagation();
      e.preventDefault();
      onResizeStart(type, plan.id);
    },
    [isAdmin, onResizeStart, plan.id]
  );

  // 날짜 범위 (짧은 형태)
  const dateLabel = formatShortDateRange(plan.start_date, plan.end_date);
  
  // 도메인 라벨 (sprint/release는 type 표시)
  const domainLabel = plan.type === "feature" 
    ? (plan.domain || "") 
    : plan.type === "sprint" ? "Sprint" : "Release";

  return (
    <div
      className="absolute flex flex-col justify-center px-2 py-1 rounded cursor-pointer transition-all group"
      style={{
        left,
        width,
        height: ROW_HEIGHT - 6,
        top: 3,
        background: colorStyle.bg,
        border: `1px solid ${isSelected ? colorStyle.text : colorStyle.border}`,
        boxShadow: isSelected
          ? `0 0 0 2px ${colorStyle.text}40`
          : isHovered
            ? `0 2px 8px rgba(0, 0, 0, 0.12)`
            : "none",
        zIndex: isSelected ? 10 : isHovered ? 5 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
    >
      {/* Left Resize Handle (Admin only) */}
      {isAdmin && (
        <div
          className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-l"
          style={{ background: `${colorStyle.text}30` }}
          onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        />
      )}

      {/* 상단: 도메인/기간 */}
      <div className="flex items-center justify-between gap-1">
        {width > 60 && domainLabel && (
          <span
            className="text-[9px] font-semibold uppercase tracking-wide truncate"
            style={{ color: colorStyle.text, opacity: 0.8 }}
          >
            {domainLabel}
          </span>
        )}
        {width > 80 && dateLabel && (
          <span
            className="text-[9px] font-medium truncate shrink-0"
            style={{ color: colorStyle.text, opacity: 0.7 }}
          >
            {dateLabel}
          </span>
        )}
      </div>

      {/* 하단: 타이틀 */}
      <span
        className="truncate text-xs font-medium leading-tight"
        style={{ color: colorStyle.text }}
      >
        {plan.title}
      </span>

      {/* Right Resize Handle (Admin only) */}
      {isAdmin && (
        <div
          className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-opacity rounded-r"
          style={{ background: `${colorStyle.text}30` }}
          onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        />
      )}
    </div>
  );
});

