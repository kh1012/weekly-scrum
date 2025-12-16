"use client";

import { memo, useCallback, useState } from "react";
import type { FlatRow, GanttMode, DragType, DragState } from "./types";
import type { BarLayout } from "./useGanttLayout";
import { ROW_HEIGHT, DAY_WIDTH } from "./useGanttLayout";
import { PlanBar } from "./PlanBar";

interface TimelineRowProps {
  row: FlatRow;
  days: Date[];
  totalWidth: number;
  mode: GanttMode;
  calculateBarLayout: (
    startDate: string | null,
    endDate: string | null
  ) => BarLayout;
  selectedPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  onResizeStart?: (type: DragType, planId: string) => void;
  /** 드래그 이동 시작 핸들러 */
  onMoveStart?: (planId: string) => void;
  /** 인라인 타이틀 수정 핸들러 */
  onTitleUpdate?: (planId: string, newTitle: string) => Promise<void>;
  onCellClick?: (row: FlatRow, date: Date) => void;
  /** 빠른 생성 팝오버 트리거 */
  onQuickCreate?: (row: FlatRow, date: Date, position: { x: number; y: number }) => void;
  hoveredCell?: { rowId: string; dayIndex: number } | null;
  onCellHover?: (rowId: string, dayIndex: number | null) => void;
  /** 현재 드래그 상태 (프리뷰용) */
  dragState?: DragState | null;
}

/**
 * 타임라인 Row 컴포넌트
 * - Airbnb 스타일: 호버 시 '+' 버튼 fade-in
 * - Drag to Move 지원
 * - 인라인 타이틀 편집 지원
 */
export const TimelineRow = memo(function TimelineRow({
  row,
  days,
  totalWidth,
  mode,
  calculateBarLayout,
  selectedPlanId,
  onSelectPlan,
  onResizeStart,
  onMoveStart,
  onTitleUpdate,
  onCellClick,
  onQuickCreate,
  hoveredCell,
  onCellHover,
  dragState,
}: TimelineRowProps) {
  const isAdmin = mode === "admin";
  const isLeaf = row.isLeaf;
  const plans = row.node.plans || [];

  // '+' 버튼 호버 상태
  const [hoveredPlusBtn, setHoveredPlusBtn] = useState<number | null>(null);

  // Cell 클릭 핸들러 (기존 방식 - fallback)
  const handleCellClick = useCallback(
    (dayIndex: number) => {
      if (!isAdmin || !isLeaf || !onCellClick) return;
      const date = days[dayIndex];
      onCellClick(row, date);
    },
    [isAdmin, isLeaf, onCellClick, days, row]
  );

  // '+' 버튼 클릭 핸들러 (Airbnb 스타일 Quick Create)
  const handlePlusClick = useCallback(
    (e: React.MouseEvent, dayIndex: number) => {
      e.stopPropagation();
      if (!isAdmin || !isLeaf) return;
      const date = days[dayIndex];
      
      if (onQuickCreate) {
        // 팝오버 위치 계산 (버튼 기준)
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        onQuickCreate(row, date, { x: rect.left, y: rect.bottom + 8 });
      } else if (onCellClick) {
        // 팝오버 미지원 시 기존 방식
        onCellClick(row, date);
      }
    },
    [isAdmin, isLeaf, onQuickCreate, onCellClick, days, row]
  );

  // Cell hover 핸들러
  const handleCellMouseEnter = useCallback(
    (dayIndex: number) => {
      if (!isAdmin || !isLeaf) return;
      onCellHover?.(row.id, dayIndex);
    },
    [isAdmin, isLeaf, onCellHover, row.id]
  );

  const handleCellMouseLeave = useCallback(() => {
    onCellHover?.(row.id, null);
  }, [onCellHover, row.id]);

  return (
    <div
      className="relative flex border-b"
      style={{
        width: totalWidth,
        minWidth: totalWidth,
        height: ROW_HEIGHT,
        borderColor: "var(--notion-border)",
        background: isLeaf ? "var(--notion-bg)" : "var(--notion-bg-secondary)",
      }}
    >
      {/* Grid Cells (Admin에서 클릭 가능) */}
      {isAdmin && isLeaf && (
        <div className="absolute inset-0 flex">
          {days.map((day, index) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isHovered =
              hoveredCell?.rowId === row.id &&
              hoveredCell?.dayIndex === index;
            const isPlusBtnHovered = hoveredPlusBtn === index;

            return (
              <div
                key={index}
                className="h-full relative group"
                style={{
                  width: DAY_WIDTH,
                  minWidth: DAY_WIDTH,
                  // Airbnb 스타일: 부드러운 배경색 전환
                  background: isHovered
                    ? "rgba(59, 130, 246, 0.08)"
                    : isWeekend
                      ? "rgba(0, 0, 0, 0.02)"
                      : "transparent",
                  borderRight: "1px solid rgba(0, 0, 0, 0.03)",
                  transition: "background 150ms ease-out",
                }}
                onClick={() => handleCellClick(index)}
                onMouseEnter={() => handleCellMouseEnter(index)}
                onMouseLeave={handleCellMouseLeave}
              >
                {/* Airbnb 스타일 '+' 버튼 */}
                {isHovered && (
                  <button
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      // 버튼 자체의 fade-in + scale 애니메이션
                      animation: "airbnbFadeIn 150ms ease-out",
                    }}
                    onClick={(e) => handlePlusClick(e, index)}
                    onMouseEnter={() => setHoveredPlusBtn(index)}
                    onMouseLeave={() => setHoveredPlusBtn(null)}
                    title="클릭하여 계획 생성"
                  >
                    <span
                      className="flex items-center justify-center rounded-full transition-all duration-150"
                      style={{
                        width: isPlusBtnHovered ? 28 : 24,
                        height: isPlusBtnHovered ? 28 : 24,
                        background: isPlusBtnHovered
                          ? "linear-gradient(135deg, #F76D57, #f9a88b)"
                          : "rgba(59, 130, 246, 0.15)",
                        color: isPlusBtnHovered ? "white" : "#3b82f6",
                        boxShadow: isPlusBtnHovered
                          ? "0 4px 12px rgba(247, 109, 87, 0.3)"
                          : "none",
                        transform: isPlusBtnHovered ? "scale(1.05)" : "scale(1)",
                      }}
                    >
                      <svg
                        className="transition-transform duration-150"
                        style={{
                          width: isPlusBtnHovered ? 14 : 12,
                          height: isPlusBtnHovered ? 14 : 12,
                        }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Non-admin grid background */}
      {(!isAdmin || !isLeaf) && (
        <div className="absolute inset-0 flex pointer-events-none">
          {days.map((day, index) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            return (
              <div
                key={index}
                className="h-full"
                style={{
                  width: DAY_WIDTH,
                  minWidth: DAY_WIDTH,
                  background: isWeekend ? "rgba(0, 0, 0, 0.02)" : "transparent",
                  borderRight: "1px solid rgba(0, 0, 0, 0.03)",
                }}
              />
            );
          })}
        </div>
      )}

      {/* Plan Bars */}
      {plans.map((plan) => {
        // 드래그 중인 Plan이면 현재 드래그 상태의 날짜로 레이아웃 계산
        const isDragging = dragState?.planId === plan.id;
        const startDate = isDragging ? dragState.currentStart : plan.start_date;
        const endDate = isDragging ? dragState.currentEnd : plan.end_date;
        
        const layout = calculateBarLayout(startDate, endDate);
        if (!layout.visible) return null;

        return (
          <PlanBar
            key={plan.id}
            plan={plan}
            left={layout.left}
            width={layout.width}
            mode={mode}
            isSelected={selectedPlanId === plan.id}
            onSelect={() => onSelectPlan?.(plan.id)}
            onResizeStart={onResizeStart}
            onMoveStart={onMoveStart}
            onTitleUpdate={onTitleUpdate}
          />
        );
      })}

      {/* Airbnb 스타일 애니메이션 정의 */}
      <style jsx>{`
        @keyframes airbnbFadeIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
});
