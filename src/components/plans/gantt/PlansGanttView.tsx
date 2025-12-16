"use client";

import { useState, useMemo, useCallback } from "react";
import type { PlansGanttViewProps, FlatRow, DraftPlan } from "./types";
import { useGanttLayout, TREE_WIDTH } from "./useGanttLayout";
import { buildTreeFromPlans, flattenTree, getAllNodeIds } from "./buildTree";
import { TreePanel } from "./TreePanel";
import { TimelineGrid } from "./TimelineGrid";
import { CalendarIcon, ListIcon, LightbulbIcon, CalendarDaysIcon } from "@/components/common/Icons";

/**
 * Plans 간트 뷰 컴포넌트
 * - mode='readonly': 조회만 가능 (/plans)
 * - mode='admin': CRUD + 간트 상호작용 (/admin/plans)
 * - Airbnb 스타일 Quick Create, Drag to Move, Inline Edit 지원
 */
export function PlansGanttView({
  mode,
  rangeStart,
  rangeEnd,
  plans,
  onCreateDraftAtCell,
  onQuickCreate,
  onResizePlan,
  onMovePlan,
  onTitleUpdate,
  onOpenPlan,
  selectedPlanId: externalSelectedPlanId,
  onSelectPlan: externalOnSelectPlan,
  draftPlans = [],
  onAddDraftPlan,
  onCreateFromDraft,
  onRemoveDraftPlan,
  onUpdateDraftPlan,
}: PlansGanttViewProps) {
  // Build tree from plans
  const tree = useMemo(() => buildTreeFromPlans(plans), [plans]);

  // Expanded state (기본: 모두 확장)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    return new Set(getAllNodeIds(tree));
  });

  // Flatten tree for rendering
  const flatRows = useMemo(
    () => flattenTree(tree, expandedIds),
    [tree, expandedIds]
  );

  // Gantt layout
  const layout = useGanttLayout(rangeStart, rangeEnd);

  // Selected plan (내부 상태 또는 외부 제어)
  const [internalSelectedPlanId, setInternalSelectedPlanId] = useState<
    string | undefined
  >();
  const selectedPlanId = externalSelectedPlanId ?? internalSelectedPlanId;

  // Toggle node expand
  const handleToggle = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Select plan
  const handleSelectPlan = useCallback(
    (planId: string) => {
      if (externalOnSelectPlan) {
        externalOnSelectPlan(planId);
      } else {
        setInternalSelectedPlanId(planId);
      }
      onOpenPlan?.(planId);
    },
    [onOpenPlan, externalOnSelectPlan]
  );

  // Cell click (create draft plan - 기존 방식)
  const handleCellClick = useCallback(
    async (row: FlatRow, date: Date) => {
      if (!onCreateDraftAtCell || !row.context) return;
      await onCreateDraftAtCell({
        ...row.context,
        date,
      });
    },
    [onCreateDraftAtCell]
  );

  // Quick Create (Airbnb 스타일 - title 포함)
  const handleQuickCreate = useCallback(
    async (context: {
      project: string;
      module: string;
      feature: string;
      date: Date;
      title: string;
    }) => {
      if (!onQuickCreate) return;
      await onQuickCreate(context);
    },
    [onQuickCreate]
  );

  // Resize plan
  const handleResizePlan = useCallback(
    async (planId: string, startDate: string, endDate: string) => {
      if (!onResizePlan) return;
      await onResizePlan(planId, startDate, endDate);
    },
    [onResizePlan]
  );

  // Move plan (드래그 이동)
  const handleMovePlan = useCallback(
    (planId: string, startDate: string, endDate: string) => {
      if (!onMovePlan) return;
      onMovePlan(planId, startDate, endDate);
    },
    [onMovePlan]
  );

  // Title update (인라인 편집)
  const handleTitleUpdate = useCallback(
    async (planId: string, newTitle: string) => {
      if (!onTitleUpdate) return;
      await onTitleUpdate(planId, newTitle);
    },
    [onTitleUpdate]
  );

  const isAdmin = mode === "admin";

  return (
    <div
      className="flex flex-col rounded-xl overflow-hidden border flex-1"
      style={{
        minHeight: 300,
        background: "var(--notion-bg)",
        borderColor: "var(--notion-border)",
      }}
    >
      {/* Summary Bar */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          background: "var(--notion-bg-secondary)",
          borderColor: "var(--notion-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="text-sm font-medium"
            style={{ color: "var(--notion-text)" }}
          >
            간트 차트
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isAdmin
                ? "rgba(247, 109, 87, 0.1)"
                : "rgba(107, 114, 128, 0.1)",
              color: isAdmin ? "#F76D57" : "#6b7280",
            }}
          >
            {isAdmin ? "관리자" : "조회 전용"}
          </span>
        </div>

        <div
          className="flex items-center gap-4 text-xs"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <span className="flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5" />
            {rangeStart.toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            })}{" "}
            ~{" "}
            {rangeEnd.toLocaleDateString("ko-KR", {
              month: "long",
              day: "numeric",
            })}
          </span>
          <span className="flex items-center gap-1">
            <ListIcon className="w-3.5 h-3.5" />
            {plans.length}개 계획
          </span>
          {isAdmin && (
            <span
              className="flex items-center gap-1 text-[10px]"
              style={{ color: "var(--notion-text-muted)" }}
            >
              <LightbulbIcon className="w-3 h-3" />
              + 클릭 생성 · 드래그 이동 · 더블클릭 편집
            </span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Tree Panel (Sticky Left) */}
        <TreePanel
          rows={flatRows}
          expandedIds={expandedIds}
          onToggle={handleToggle}
          draftPlans={draftPlans}
          onRemoveDraftPlan={onRemoveDraftPlan}
          onUpdateDraftPlan={onUpdateDraftPlan}
          isAdmin={mode === "admin"}
        />

        {/* Timeline Grid */}
        <TimelineGrid
          rows={flatRows}
          days={layout.days}
          months={layout.months}
          totalWidth={layout.totalWidth}
          mode={mode}
          rangeStart={rangeStart}
          calculateBarLayout={layout.calculateBarLayout}
          selectedPlanId={selectedPlanId}
          onSelectPlan={handleSelectPlan}
          onCellClick={isAdmin ? handleCellClick : undefined}
          onResizePlan={isAdmin ? handleResizePlan : undefined}
          onMovePlan={isAdmin && onMovePlan ? handleMovePlan : undefined}
          onTitleUpdate={
            isAdmin && onTitleUpdate ? handleTitleUpdate : undefined
          }
          onQuickCreate={
            isAdmin && onQuickCreate ? handleQuickCreate : undefined
          }
          draftPlans={isAdmin ? draftPlans : undefined}
          onCreateFromDraft={isAdmin ? onCreateFromDraft : undefined}
        />

        {/* Empty State - Timeline 영역 내부에 표시 */}
        {plans.length === 0 && draftPlans.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ left: TREE_WIDTH }}
          >
            <div className="text-center">
              <div
                className="flex justify-center"
                style={{ color: "var(--notion-text-muted)" }}
              >
                <CalendarDaysIcon className="w-8 h-8" />
              </div>
              <p
                className="mt-2 text-sm"
                style={{ color: "var(--notion-text-muted)" }}
              >
                표시할 계획이 없습니다
              </p>
              {isAdmin && (
                <p
                  className="mt-1 text-xs"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  ⌘+K로 임시 계획을 생성하세요
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
