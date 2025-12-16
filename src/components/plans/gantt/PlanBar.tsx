"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
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
  onMoveStart?: (planId: string) => void;
  /** 인라인 타이틀 수정 */
  onTitleUpdate?: (planId: string, newTitle: string) => Promise<void>;
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
 * Airbnb 스타일 Plan 막대 컴포넌트
 * - 호버 시 lift 효과 (translateY -1px)
 * - 드래그로 이동 가능
 * - 더블클릭으로 인라인 편집
 * - 리사이즈 핸들 (좌/우)
 */
export const PlanBar = memo(function PlanBar({
  plan,
  left,
  width,
  mode,
  isSelected,
  onSelect,
  onResizeStart,
  onMoveStart,
  onTitleUpdate,
}: PlanBarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(plan.title);
  const [isSaving, setIsSaving] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  
  const stageColor = getStageColor(plan.stage);
  const typeStyle = getTypeStyle(plan.type);
  const isAdmin = mode === "admin";
  
  // type에 따라 스타일 결정
  const colorStyle = typeStyle || stageColor;

  // 인라인 에디트 시작 시 focus
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 리사이즈 시작
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, type: DragType) => {
      if (!isAdmin || !onResizeStart) return;
      e.stopPropagation();
      e.preventDefault();
      onResizeStart(type, plan.id);
    },
    [isAdmin, onResizeStart, plan.id]
  );

  // 드래그 이동 시작
  const handleMoveMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!isAdmin || !onMoveStart) return;
      // 리사이즈 핸들 영역이면 무시
      const target = e.target as HTMLElement;
      if (target.dataset.resizeHandle) return;
      
      e.stopPropagation();
      e.preventDefault();
      setIsDragging(true);
      onMoveStart(plan.id);
    },
    [isAdmin, onMoveStart, plan.id]
  );

  // 드래그 종료
  useEffect(() => {
    if (isDragging) {
      const handleMouseUp = () => setIsDragging(false);
      window.addEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    }
  }, [isDragging]);

  // 더블클릭 → 인라인 편집
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isAdmin || !onTitleUpdate) return;
      e.stopPropagation();
      e.preventDefault();
      setEditTitle(plan.title);
      setIsEditing(true);
    },
    [isAdmin, onTitleUpdate, plan.title]
  );

  // 인라인 편집 저장
  const handleSaveTitle = useCallback(async () => {
    if (!onTitleUpdate || editTitle.trim() === plan.title) {
      setIsEditing(false);
      return;
    }

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setEditTitle(plan.title);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onTitleUpdate(plan.id, trimmedTitle);
      setIsEditing(false);
    } catch {
      // 실패 시 원래 값으로 복원
      setEditTitle(plan.title);
    } finally {
      setIsSaving(false);
    }
  }, [onTitleUpdate, editTitle, plan.id, plan.title]);

  // 인라인 편집 취소
  const handleCancelEdit = useCallback(() => {
    setEditTitle(plan.title);
    setIsEditing(false);
  }, [plan.title]);

  // 키보드 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSaveTitle();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handleCancelEdit();
      }
    },
    [handleSaveTitle, handleCancelEdit]
  );

  // 날짜 범위 (짧은 형태)
  const dateLabel = formatShortDateRange(plan.start_date, plan.end_date);
  
  // 도메인 라벨 (sprint/release는 type 표시)
  const domainLabel = plan.type === "feature" 
    ? (plan.domain || "") 
    : plan.type === "sprint" ? "Sprint" : "Release";

  return (
    <div
      ref={barRef}
      className="absolute flex flex-col justify-center group"
      style={{
        left,
        width,
        height: ROW_HEIGHT - 8,
        top: 4,
        // Airbnb 스타일: 더 둥근 끝
        borderRadius: 10,
        // 부드러운 배경
        background: colorStyle.bg,
        border: `1px solid ${isSelected ? colorStyle.text : colorStyle.border}`,
        // 호버/선택 시 그림자 & lift 효과
        boxShadow: isSelected
          ? `0 2px 12px ${colorStyle.text}30, 0 0 0 2px ${colorStyle.text}40`
          : isHovered
            ? `0 4px 16px rgba(0, 0, 0, 0.12)`
            : `0 1px 3px rgba(0, 0, 0, 0.04)`,
        // Airbnb 스타일: 호버 시 lift
        transform: isHovered && !isDragging ? "translateY(-1px)" : "translateY(0)",
        // 부드러운 전환
        transition: isDragging 
          ? "none" 
          : "transform 150ms ease-out, box-shadow 150ms ease-out",
        // z-index
        zIndex: isDragging ? 100 : isSelected ? 10 : isHovered ? 5 : 1,
        // 커서
        cursor: isAdmin && onMoveStart 
          ? (isDragging ? "grabbing" : "grab") 
          : "pointer",
        // 드래그 중 반투명
        opacity: isDragging ? 0.9 : 1,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMoveMouseDown}
      onDoubleClick={handleDoubleClick}
      onClick={(e) => {
        e.stopPropagation();
        if (!isEditing) {
          onSelect?.();
        }
      }}
    >
      {/* Left Resize Handle (Admin only) - Airbnb 스타일 */}
      {isAdmin && onResizeStart && (
        <div
          data-resize-handle="left"
          className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
          style={{ 
            borderRadius: "10px 0 0 10px",
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, "resize-left")}
        >
          <div
            className="w-1 h-4 rounded-full transition-all duration-150"
            style={{ 
              background: isHovered ? colorStyle.text : `${colorStyle.text}50`,
              opacity: isHovered ? 0.8 : 0.4,
            }}
          />
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="px-2.5 py-1 flex flex-col justify-center min-w-0">
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

        {/* 하단: 타이틀 (인라인 편집 가능) */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleSaveTitle}
            disabled={isSaving}
            className="w-full text-xs font-medium bg-transparent outline-none border-none p-0 m-0"
            style={{ 
              color: colorStyle.text,
              caretColor: colorStyle.text,
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="truncate text-xs font-medium leading-tight"
            style={{ color: colorStyle.text }}
            title={isAdmin && onTitleUpdate ? "더블클릭하여 제목 수정" : undefined}
          >
            {plan.title}
          </span>
        )}
      </div>

      {/* Right Resize Handle (Admin only) - Airbnb 스타일 */}
      {isAdmin && onResizeStart && (
        <div
          data-resize-handle="right"
          className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
          style={{ 
            borderRadius: "0 10px 10px 0",
          }}
          onMouseDown={(e) => handleResizeMouseDown(e, "resize-right")}
        >
          <div
            className="w-1 h-4 rounded-full transition-all duration-150"
            style={{ 
              background: isHovered ? colorStyle.text : `${colorStyle.text}50`,
              opacity: isHovered ? 0.8 : 0.4,
            }}
          />
        </div>
      )}

      {/* 저장 중 인디케이터 */}
      {isSaving && (
        <div 
          className="absolute inset-0 flex items-center justify-center rounded-[10px]"
          style={{ background: `${colorStyle.bg}90` }}
        >
          <svg
            className="w-4 h-4 animate-spin"
            style={{ color: colorStyle.text }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
    </div>
  );
});
