"use client";

import { memo, useCallback } from "react";
import type { PlanWithAssignees } from "@/lib/data/plans";
import type { FlatRow, GanttMode, DragType } from "./types";
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
  onCellClick?: (row: FlatRow, date: Date) => void;
  hoveredCell?: { rowId: string; dayIndex: number } | null;
  onCellHover?: (rowId: string, dayIndex: number | null) => void;
}

/**
 * 타임라인 Row 컴포넌트
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
  onCellClick,
  hoveredCell,
  onCellHover,
}: TimelineRowProps) {
  const isAdmin = mode === "admin";
  const isLeaf = row.isLeaf;
  const plans = row.node.plans || [];

  // Cell 클릭 핸들러
  const handleCellClick = useCallback(
    (dayIndex: number) => {
      if (!isAdmin || !isLeaf || !onCellClick) return;
      const date = days[dayIndex];
      onCellClick(row, date);
    },
    [isAdmin, isLeaf, onCellClick, days, row]
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

            return (
              <div
                key={index}
                className="h-full transition-colors cursor-pointer"
                style={{
                  width: DAY_WIDTH,
                  minWidth: DAY_WIDTH,
                  background: isHovered
                    ? "rgba(59, 130, 246, 0.15)"
                    : isWeekend
                      ? "rgba(0, 0, 0, 0.02)"
                      : "transparent",
                  borderRight: "1px solid rgba(0, 0, 0, 0.03)",
                }}
                onClick={() => handleCellClick(index)}
                onMouseEnter={() => handleCellMouseEnter(index)}
                onMouseLeave={handleCellMouseLeave}
                title={isHovered ? "클릭하여 계획 생성" : undefined}
              />
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
        const layout = calculateBarLayout(plan.start_date, plan.end_date);
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
          />
        );
      })}
    </div>
  );
});

