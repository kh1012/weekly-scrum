"use client";

import { memo, useRef, useState, useCallback } from "react";
import type { FlatRow, GanttMode, DragType, DragState, DraftPlan } from "./types";
import type { BarLayout, MonthGroup } from "./useGanttLayout";
import { TimelineHeader } from "./TimelineHeader";
import { TimelineRow } from "./TimelineRow";
import { DraftTimelineRow } from "./DraftTimelineRow";
import { DAY_WIDTH, ROW_HEIGHT, formatDateRange } from "./useGanttLayout";
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
  /** Plan 이동 핸들러 */
  onMovePlan?: (planId: string, startDate: string, endDate: string) => void;
  /** 인라인 타이틀 수정 핸들러 */
  onTitleUpdate?: (planId: string, newTitle: string) => Promise<void>;
  /** Quick Create 핸들러 (Airbnb 스타일) */
  onQuickCreate?: (context: {
    project: string;
    module: string;
    feature: string;
    date: Date;
    title: string;
  }) => Promise<void>;
  /** 임시 계획 목록 */
  draftPlans?: DraftPlan[];
  /** 임시 계획 -> 실제 생성 핸들러 */
  onCreateFromDraft?: (draft: DraftPlan, startDate: string, endDate: string) => Promise<void>;
}

/**
 * Quick Create 팝오버 상태
 */
interface PopoverState {
  isOpen: boolean;
  position: { x: number; y: number };
  date: Date;
  context: {
    project: string;
    module: string;
    feature: string;
  };
}

/**
 * 타임라인 그리드 컴포넌트
 * - Airbnb 스타일 Quick Create 팝오버 지원
 * - Drag to Move 지원
 * - 인라인 타이틀 편집 지원
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
  onMovePlan,
  onTitleUpdate,
  onQuickCreate,
  draftPlans = [],
  onCreateFromDraft,
}: TimelineGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    rowId: string;
    dayIndex: number;
  } | null>(null);

  // Quick Create 팝오버 상태
  const [popoverState, setPopoverState] = useState<PopoverState | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Drag state (resize + move 통합)
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

  // Plan 찾기 헬퍼
  const findPlan = useCallback(
    (planId: string) => {
      for (const row of rows) {
        if (row.node.plans) {
          const plan = row.node.plans.find((p) => p.id === planId);
          if (plan) return plan;
        }
      }
      return null;
    },
    [rows]
  );

  // Resize/Move 시작 핸들러
  const handleDragStart = useCallback(
    (type: DragType, planId: string) => {
      if (!type) return;

      const plan = findPlan(planId);
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
    [findPlan]
  );

  // Move 시작 핸들러
  const handleMoveStart = useCallback(
    (planId: string) => {
      handleDragStart("move", planId);
    },
    [handleDragStart]
  );

  // Mouse move handler for drag (resize + move)
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

      if (dragState.type === "move") {
        // Move: 시작/종료 날짜 모두 동일하게 이동
        const startDate = new Date(dragState.originalStart);
        const endDate = new Date(dragState.originalEnd);
        startDate.setDate(startDate.getDate() + deltaDays);
        endDate.setDate(endDate.getDate() + deltaDays);
        newStart = startDate.toISOString().split("T")[0];
        newEnd = endDate.toISOString().split("T")[0];
      } else if (dragState.type === "resize-left") {
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

  // Mouse up handler for drag
  const handleMouseUp = useCallback(() => {
    if (!dragState) return;

    // Apply the change
    const hasChanged =
      dragState.currentStart !== dragState.originalStart ||
      dragState.currentEnd !== dragState.originalEnd;

    if (hasChanged) {
      if (dragState.type === "move" && onMovePlan) {
        onMovePlan(
          dragState.planId,
          dragState.currentStart,
          dragState.currentEnd
        );
      } else if (
        (dragState.type === "resize-left" || dragState.type === "resize-right") &&
        onResizePlan
      ) {
        onResizePlan(
          dragState.planId,
          dragState.currentStart,
          dragState.currentEnd
        );
      }
    }

    setDragState(null);
    dragStartXRef.current = 0;
  }, [dragState, onResizePlan, onMovePlan]);

  // Tooltip for drag
  const dragTooltip = dragState
    ? formatDateRange(
        new Date(dragState.currentStart),
        new Date(dragState.currentEnd)
      )
    : null;

  // 드래그 타입에 따른 커서
  const getDragCursor = () => {
    if (!dragState) return undefined;
    if (dragState.type === "move") return "grabbing";
    return "ew-resize";
  };

  const isAdmin = mode === "admin";

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-auto relative"
      onMouseMove={dragState ? handleMouseMove : undefined}
      onMouseUp={dragState ? handleMouseUp : undefined}
      onMouseLeave={dragState ? handleMouseUp : undefined}
      style={{
        cursor: getDragCursor(),
      }}
    >
      {/* Drag Tooltip (Airbnb 스타일) */}
      {dragState && dragTooltip && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm font-medium animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            background: "var(--notion-bg)",
            border: "1px solid var(--notion-border)",
            color: "var(--notion-text)",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
              {dragState.type === "move" ? "📅 이동" : "↔️ 조정"}
            </span>
            <span>{dragTooltip}</span>
          </div>
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
            onResizeStart={handleDragStart}
            onMoveStart={isAdmin && onMovePlan ? handleMoveStart : undefined}
            onTitleUpdate={isAdmin ? onTitleUpdate : undefined}
            onCellClick={onCellClick}
            onQuickCreate={isAdmin && onQuickCreate ? handleQuickCreate : undefined}
            hoveredCell={hoveredCell}
            onCellHover={handleCellHover}
            dragState={dragState}
          />
        ))}

        {/* Draft Plan Rows (임시 계획) */}
        {draftPlans.map((draft) => (
          <DraftTimelineRow
            key={draft.tempId}
            draft={draft}
            days={days}
            totalWidth={totalWidth}
            calculateBarLayout={calculateBarLayout}
            onCreateFromDraft={onCreateFromDraft}
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
