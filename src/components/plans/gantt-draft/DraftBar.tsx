/**
 * Draft Bar 컴포넌트
 * - Airbnb 스타일 디자인
 * - 안정적인 드래그 처리 (state 기반)
 */

"use client";

import { useCallback, useRef, useState, memo } from "react";
import { useDraftStore } from "./store";
import {
  calculateMovedDates,
  calculateResizedDates,
  parseLocalDate,
} from "./laneLayout";
import type { BarWithLane } from "./types";
import type { AssigneeRole } from "@/lib/data/plans";

const LANE_HEIGHT = 48;
const RESIZE_HANDLE_WIDTH = 12;

// 역할별 색상 및 라벨 (배경/텍스트 쌍)
const ROLE_CONFIG: Record<
  AssigneeRole,
  { label: string; color: string; bg: string; text: string }
> = {
  planner: {
    label: "기획",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#b45309",
  },
  designer: {
    label: "디자인",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.12)",
    text: "#be185d",
  },
  fe: {
    label: "FE",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    text: "#1d4ed8",
  },
  be: {
    label: "BE",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#047857",
  },
  qa: {
    label: "QA",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    text: "#6d28d9",
  },
};

// 기본 색상 (역할 없을 때)
const DEFAULT_COLOR = {
  color: "#6b7280",
  bg: "rgba(107, 114, 128, 0.08)",
  text: "#374151",
};

interface DraftBarProps {
  bar: BarWithLane;
  left: number;
  width: number;
  lane: number;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onDoubleClick?: (e?: React.MouseEvent) => void;
  dayWidth: number;
  rangeStart: Date;
  /** 드래그 중 기간 정보 콜백 */
  onDragDateChange?: (
    info: { startDate: string; endDate: string } | null
  ) => void;
  /** Bar 위에 마우스가 올라올 때 hover preview 숨김 */
  onClearHover?: () => void;
  /** 현재 Row의 절대 Y offset (다른 Row로 이동 판단용) */
  rowTopOffset?: number;
  /** 드래그 완료 시 절대 Y 위치 콜백 (다른 Row 이동용) */
  onMoveComplete?: (absoluteY: number) => void;
}

type DragMode = "move" | "resize-left" | "resize-right" | null;

/**
 * 날짜 범위 포맷 (짧은 형태: Dec 1-4)
 */
function formatShortDateRange(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  const endMonth = monthNames[end.getMonth()];
  return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
}

export const DraftBar = memo(function DraftBar({
  bar,
  left,
  width,
  lane,
  isSelected,
  isEditing,
  onSelect,
  onDoubleClick,
  dayWidth,
  rangeStart,
  onDragDateChange,
  onClearHover,
  rowTopOffset,
  onMoveComplete,
}: DraftBarProps) {
  const updateBar = useDraftStore((s) => s.updateBar);
  const deleteBar = useDraftStore((s) => s.deleteBar);

  const barRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragOffset, setDragOffset] = useState({ left: 0, width: 0, top: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // 첫 번째 담당자의 역할 기반 색상 (없으면 기본 회색)
  const primaryRole = bar.assignees?.[0]?.role;
  const roleColor = primaryRole ? ROLE_CONFIG[primaryRole] : null;
  const barColor = roleColor || DEFAULT_COLOR;

  // 드래그 시작
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      if (!isEditing) return;

      e.stopPropagation();
      e.preventDefault();

      setDragMode(mode);
      setDragOffset({ left: 0, width: 0, top: 0 });

      const startX = e.clientX;
      const startY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        if (mode === "move") {
          setDragOffset({ left: deltaX, width: 0, top: deltaY });
          // 실시간 기간 정보 전달
          const newDates = calculateMovedDates(
            bar,
            deltaX,
            rangeStart,
            dayWidth
          );
          onDragDateChange?.(newDates);
        } else if (mode === "resize-left") {
          setDragOffset({ left: deltaX, width: -deltaX, top: 0 });
          const newDates = calculateResizedDates(
            bar,
            "start",
            deltaX,
            rangeStart,
            dayWidth
          );
          onDragDateChange?.(newDates);
        } else if (mode === "resize-right") {
          setDragOffset({ left: 0, width: deltaX, top: 0 });
          const newDates = calculateResizedDates(
            bar,
            "end",
            deltaX,
            rangeStart,
            dayWidth
          );
          onDragDateChange?.(newDates);
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        const deltaX = upEvent.clientX - startX;
        const deltaY = upEvent.clientY - startY;
        const laneDelta = Math.round(deltaY / LANE_HEIGHT);

        if (Math.abs(deltaX) > 10 || Math.abs(laneDelta) >= 1) {
          if (mode === "move") {
            const newDates = calculateMovedDates(
              bar,
              deltaX,
              rangeStart,
              dayWidth
            );
            const newPreferredLane = Math.max(0, lane + laneDelta);

            // 다른 Row로 이동 체크: onMoveComplete 콜백이 있고 Y 이동이 크면
            // 절대 Y 위치를 전달하여 DraftTimeline에서 타겟 Row 판단
            if (onMoveComplete && rowTopOffset !== undefined) {
              const absoluteY = upEvent.clientY;
              onMoveComplete(absoluteY);
            }

            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
              preferredLane: newPreferredLane,
            });
          } else if (mode === "resize-left") {
            const newDates = calculateResizedDates(
              bar,
              "start",
              deltaX,
              rangeStart,
              dayWidth
            );
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
            });
          } else if (mode === "resize-right") {
            const newDates = calculateResizedDates(
              bar,
              "end",
              deltaX,
              rangeStart,
              dayWidth
            );
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
            });
          }
        }

        setDragMode(null);
        setDragOffset({ left: 0, width: 0, top: 0 });
        onDragDateChange?.(null); // 드래그 종료 시 초기화
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isEditing, bar, updateBar, dayWidth, rangeStart, lane, onDragDateChange]
  );

  // 클릭 핸들링
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
      barRef.current?.focus();
    },
    [onSelect]
  );

  // 더블클릭 핸들링 (수정 모달/팝오버 열기)
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDoubleClick) {
        // isEditing 여부와 관계없이 항상 호출 (readOnly 모드에서도 팝오버 표시)
        onDoubleClick(e);
      }
    },
    [onDoubleClick]
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

  const isDragging = dragMode !== null;
  const dateLabel = formatShortDateRange(bar.startDate, bar.endDate);

  // 드래그 중 위치/크기 계산
  const currentLeft = left + dragOffset.left;
  const currentWidth = Math.max(dayWidth, width + dragOffset.width);
  const currentTop = lane * LANE_HEIGHT + 4 + dragOffset.top;

  return (
    <div
      ref={barRef}
      className="absolute flex flex-col justify-center group outline-none"
      style={{
        left: currentLeft,
        width: currentWidth,
        height: LANE_HEIGHT - 8,
        top: currentTop,
        // Airbnb 스타일: 더 둥근 끝
        borderRadius: 10,
        // 역할 기반 배경색
        background: barColor.bg,
        border: `1px solid ${
          isSelected ? barColor.color : `${barColor.color}30`
        }`,
        // 호버/선택 시 그림자 & lift 효과
        boxShadow: isSelected
          ? `0 2px 12px ${barColor.color}25, 0 0 0 2px ${barColor.color}30`
          : isHovered
          ? `0 4px 16px rgba(0, 0, 0, 0.1)`
          : `0 1px 3px rgba(0, 0, 0, 0.04)`,
        // Airbnb 스타일: 호버 시 lift
        transform:
          isHovered && !isDragging ? "translateY(-1px)" : "translateY(0)",
        // 드래그 중에는 transition 없음
        transition: isDragging
          ? "none"
          : "transform 150ms ease-out, box-shadow 150ms ease-out",
        // z-index
        zIndex: isDragging ? 100 : isSelected ? 10 : isHovered ? 5 : 1,
        // 커서
        cursor: isEditing ? (isDragging ? "grabbing" : "grab") : "pointer",
        // 드래그 중 반투명
        opacity: isDragging ? 0.9 : 1,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        onClearHover?.();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => e.stopPropagation()} // 부모의 hover line 표시 방지
      onKeyDown={handleKeyDown}
      tabIndex={isEditing ? 0 : -1}
    >
      {/* 좌측 리사이즈 핸들 */}
      {isEditing && (
        <div
          className="absolute left-0 top-0 bottom-0 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
          style={{
            width: RESIZE_HANDLE_WIDTH,
            borderRadius: "8px 0 0 8px",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        >
          <div
            className="w-1 h-4 rounded-full transition-all duration-150"
            style={{
              background: isHovered ? barColor.color : `${barColor.color}50`,
              opacity: isHovered ? 0.8 : 0.4,
            }}
          />
        </div>
      )}

      {/* 콘텐츠 영역 - 2행 레이아웃 */}
      <div
        className="px-2 py-0.5 flex flex-col justify-center min-w-0 gap-0.5"
        onMouseDown={(e) => handleMouseDown(e, "move")}
      >
        {/* 1행: 좌측(역할 태그 + 담당자 이름 + 스테이지) / 우측(기간) */}
        <div className="flex items-center justify-between gap-1 min-w-0">
          {/* 좌측 그룹 */}
          <div className="flex items-center gap-1 min-w-0">
            {/* 역할 태그 (항상 표시) */}
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {bar.assignees && bar.assignees.length > 0 ? (
                <>
                  {bar.assignees.slice(0, 1).map((assignee, idx) => {
                    const config = ROLE_CONFIG[assignee.role];
                    return (
                      <span
                        key={assignee.userId || idx}
                        className="px-1.5 py-0.5 text-[9px] font-bold rounded"
                        style={{
                          background: config?.color || "#6b7280",
                          color: "white",
                        }}
                        title={assignee.displayName || assignee.userId}
                      >
                        {config?.label || assignee.role}
                      </span>
                    );
                  })}
                </>
              ) : (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-medium rounded"
                  style={{ background: "#e5e7eb", color: "#6b7280" }}
                >
                  미지정
                </span>
              )}
            </div>

            {/* 담당자 이름 (너비 > 160) */}
            {currentWidth > 160 &&
              bar.assignees &&
              bar.assignees.length > 0 && (
                <span
                  className="text-[9px] font-medium truncate"
                  style={{ color: barColor.text, opacity: 0.8 }}
                  title={bar.assignees
                    .map((a) => a.displayName || a.userId)
                    .join(", ")}
                >
                  {bar.assignees[0]?.displayName ||
                    bar.assignees[0]?.userId?.slice(0, 8)}
                  {bar.assignees.length > 1 && ` +${bar.assignees.length - 1}`}
                </span>
              )}

            {/* 스테이지 (너비 > 240) */}
            {currentWidth > 240 && bar.stage && (
              <span
                className="px-1 py-0.5 text-[8px] font-medium rounded shrink-0"
                style={{
                  background: "rgba(0, 0, 0, 0.06)",
                  color: barColor.text,
                  opacity: 0.7,
                }}
              >
                {bar.stage}
              </span>
            )}
          </div>

          {/* 우측: 기간 표시 (너비 > 100) */}
          {currentWidth > 100 && (
            <span
              className="text-[9px] font-medium shrink-0"
              style={{ color: barColor.text, opacity: 0.7 }}
            >
              {dateLabel}
            </span>
          )}
        </div>

        {/* 2행: 타이틀 */}
        <span
          className="truncate text-[11px] font-medium leading-tight"
          style={{ color: barColor.text }}
          title={bar.title}
        >
          {bar.title}
        </span>
      </div>

      {/* 우측 리사이즈 핸들 */}
      {isEditing && (
        <div
          className="absolute right-0 top-0 bottom-0 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
          style={{
            width: RESIZE_HANDLE_WIDTH,
            borderRadius: "0 8px 8px 0",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        >
          <div
            className="w-1 h-4 rounded-full transition-all duration-150"
            style={{
              background: isHovered ? barColor.color : `${barColor.color}50`,
              opacity: isHovered ? 0.8 : 0.4,
            }}
          />
        </div>
      )}

      {/* 변경됨 표시 */}
      {bar.dirty && (
        <div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{ background: "#f59e0b" }}
          title="변경됨"
        />
      )}
    </div>
  );
});
