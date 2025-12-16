"use client";

import { memo, useRef, useState, useCallback } from "react";
import type { FlatRow, GanttMode, DragType, DragState } from "./types";
import type { BarLayout, MonthGroup } from "./useGanttLayout";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineRow } from "./TimelineRow";
import { DAY_WIDTH, formatDateRange } from "./useGanttLayout";
import { QuickCreatePopover } from "@/components/admin-plans";

interface TimelineGridProps {
  rows: FlatRow[];
  days: Date[];
  months: MonthGroup[];
  totalWidth: number;
  mode: GanttMode;
  rangeStart: Date;
  calculateBarLayout: (
    startDate: string | null,
    endDate: string | null
  ) => BarLayout;
  selectedPlanId?: string;
  onSelectPlan?: (planId: string) => void;
  onCellClick?: (row: FlatRow, date: Date) => void;
  onResizePlan?: (planId: string, startDate: string, endDate: string) => void;
  /** Quick Create 핸들러 (Airbnb 스타일) */
  onQuickCreate?: (context: {
    domain: string;
    project: string;
    module: string;
    feature: string;
    date: Date;
    title: string;
  }) => Promise<void>;
}

/**
 * Quick Create 팝오버 상태
 */
interface PopoverState {
  isOpen: boolean;
  position: { x: number; y: number };
  date: Date;
  context: {
    domain: string;
    project: string;
    module: string;
    feature: string;
  };
}

/**
 * 타임라인 그리드 컴포넌트
 * - Airbnb 스타일 Quick Create 팝오버 지원
 */
export const TimelineGrid = memo(function TimelineGrid({
  rows,
  days,
  months,
  totalWidth,
  mode,
  calculateBarLayout,
  selectedPlanId,
  onSelectPlan,
  onCellClick,
  onResizePlan,
  onQuickCreate,
}: TimelineGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    rowId: string;
    dayIndex: number;
  } | null>(null);

  // Quick Create 팝오버 상태
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Drag state
  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStartXRef = useRef<number>(0);

  // Today index
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIndex = days.findIndex(
    (d) => d.getTime() === today.getTime()
  );

  // Cell hover handler
  const handleCellHover = useCallback(
    (rowId: string, dayIndex: number | null) => {
      if (dayIndex === null) {
        setHoveredCell(null);
      } else {
        setHoveredCell({ rowId, dayIndex });
      }
    },
    []
  );

  // Quick Create 팝오버 열기
  const handleQuickCreate = useCallback(
    (row: FlatRow, date: Date, position: { x: number; y: number }) => {
      if (!row.context) return;
      setPopoverState({
        isOpen: true,
        position,
        date,
        context: row.context,
      });
    },
    []
  );

  // Quick Create 팝오버 닫기
  const handleClosePopover = useCallback(() => {
    setPopoverState(null);
  }, []);

  // Quick Create 생성 핸들러
  const handleCreate = useCallback(
    async (title: string) => {
      if (!popoverState || !onQuickCreate) return;

      setIsCreating(true);
      try {
        await onQuickCreate({
          ...popoverState.context,
          date: popoverState.date,
          title,
        });
        setPopoverState(null);
      } finally {
        setIsCreating(false);
      }
    },
    [popoverState, onQuickCreate]
  );

  // Resize start handler
  const handleResizeStart = useCallback(
    (type: DragType, planId: string) => {
      if (!type) return;

      // Find the plan
      let plan = null;
      for (const row of rows) {
        if (row.node.plans) {
          plan = row.node.plans.find((p) => p.id === planId);
          if (plan) break;
        }
      }

      if (!plan || !plan.start_date || !plan.end_date) return;

      setDragState({
        type,
        planId,
        originalStart: plan.start_date,
        originalEnd: plan.end_date,
        currentStart: plan.start_date,
        currentEnd: plan.end_date,
      });

      dragStartXRef.current = 0; // Will be set in mousemove
    },
    [rows]
  );

  // Mouse move handler for resize
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragState || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left + containerRef.current.scrollLeft;

      if (dragStartXRef.current === 0) {
        dragStartXRef.current = x;
        return;
      }

      const deltaX = x - dragStartXRef.current;
      const deltaDays = Math.round(deltaX / DAY_WIDTH);

      if (deltaDays === 0) return;

      let newStart = dragState.currentStart;
      let newEnd = dragState.currentEnd;

      if (dragState.type === "resize-left") {
        const startDate = new Date(dragState.originalStart);
        startDate.setDate(startDate.getDate() + deltaDays);
        newStart = startDate.toISOString().split("T")[0];

        // Validation: start <= end
        if (new Date(newStart) > new Date(dragState.originalEnd)) {
          newStart = dragState.originalEnd;
        }
      } else if (dragState.type === "resize-right") {
        const endDate = new Date(dragState.originalEnd);
        endDate.setDate(endDate.getDate() + deltaDays);
        newEnd = endDate.toISOString().split("T")[0];

        // Validation: end >= start
        if (new Date(newEnd) < new Date(dragState.originalStart)) {
          newEnd = dragState.originalStart;
        }
      }

      setDragState((prev) =>
        prev
          ? { ...prev, currentStart: newStart, currentEnd: newEnd }
          : null
      );
    },
    [dragState]
  );

  // Mouse up handler for resize
  const handleMouseUp = useCallback(() => {
    if (!dragState) return;

    // Apply the change
    if (
      dragState.currentStart !== dragState.originalStart ||
      dragState.currentEnd !== dragState.originalEnd
    ) {
      onResizePlan?.(
        dragState.planId,
        dragState.currentStart,
        dragState.currentEnd
      );
    }

    setDragState(null);
    dragStartXRef.current = 0;
  }, [dragState, onResizePlan]);

  // Tooltip for drag
  const dragTooltip = dragState
    ? formatDateRange(
        new Date(dragState.currentStart),
        new Date(dragState.currentEnd)
      )
    : null;

  const isAdmin = mode === "admin";

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative"
      onMouseMove={dragState ? handleMouseMove : undefined}
      onMouseUp={dragState ? handleMouseUp : undefined}
      onMouseLeave={dragState ? handleMouseUp : undefined}
      style={{
        cursor: dragState ? "ew-resize" : undefined,
      }}
    >
      {/* Drag Tooltip */}
      {dragState && dragTooltip && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg"
          style={{
            background: "var(--notion-bg-elevated)",
            border: "1px solid var(--notion-border)",
            color: "var(--notion-text)",
          }}
        >
          {dragTooltip}
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-20">
        <TimelineHeader
          days={days}
          months={months}
          totalWidth={totalWidth}
          todayIndex={todayIndex}
        />
      </div>

      {/* Rows */}
      <div>
        {rows.map((row) => (
          <TimelineRow
            key={row.id}
            row={row}
            days={days}
            totalWidth={totalWidth}
            mode={mode}
            calculateBarLayout={calculateBarLayout}
            selectedPlanId={selectedPlanId}
            onSelectPlan={onSelectPlan}
            onResizeStart={handleResizeStart}
            onCellClick={onCellClick}
            onQuickCreate={isAdmin && onQuickCreate ? handleQuickCreate : undefined}
            hoveredCell={hoveredCell}
            onCellHover={handleCellHover}
          />
        ))}
      </div>

      {/* Today Line */}
      {todayIndex >= 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 pointer-events-none z-10"
          style={{
            left: todayIndex * DAY_WIDTH + DAY_WIDTH / 2,
            background: "rgba(239, 68, 68, 0.5)",
          }}
        />
      )}

      {/* Quick Create Popover (Airbnb 스타일) */}
      {popoverState && popoverState.isOpen && (
        <QuickCreatePopover
          position={popoverState.position}
          date={popoverState.date}
          context={popoverState.context}
          onCreate={handleCreate}
          onClose={handleClosePopover}
          isLoading={isCreating}
        />
      )}
    </div>
  );
});
