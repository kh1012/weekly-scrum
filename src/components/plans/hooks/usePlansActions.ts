/**
 * usePlansActions Hook
 * 
 * Plans CRUD 액션들
 * - handleStatusChange, handleStageChange, handleTitleUpdate
 * - handleResizePlan, handleMovePlan
 * - handleCreateDraftAtCell, handleQuickCreate
 * - handleDeletePlan, handleDuplicatePlan
 */

import { useCallback } from "react";
import type { DraftPlanItem, PendingUpdate } from "../types";
import type { PlanStatus } from "@/lib/data/plans";
import { formatLocalDateStr } from "../gantt/useGanttLayout";

interface UsePlansActionsProps {
  isAdmin: boolean;
  addOrUpdatePending: (planId: string, changes: PendingUpdate["changes"]) => void;
  addDraftPlan: (draft: DraftPlanItem) => void;
  addDelete: (item: { planId: string; planTitle: string }) => void;
  addDuplicate: (planId: string) => void;
}

export function usePlansActions({
  isAdmin,
  addOrUpdatePending,
  addDraftPlan,
  addDelete,
  addDuplicate,
}: UsePlansActionsProps) {
  // 상태 변경
  const handleStatusChange = useCallback(
    (planId: string, status: PlanStatus) => {
      if (!isAdmin) return;
      addOrUpdatePending(planId, { status });
    },
    [isAdmin, addOrUpdatePending]
  );

  // 스테이지 변경
  const handleStageChange = useCallback(
    (planId: string, stage: string) => {
      if (!isAdmin) return;
      addOrUpdatePending(planId, { stage });
    },
    [isAdmin, addOrUpdatePending]
  );

  // 제목 변경
  const handleTitleUpdate = useCallback(
    (planId: string, newTitle: string) => {
      if (!isAdmin || !newTitle.trim()) return;
      addOrUpdatePending(planId, { title: newTitle });
    },
    [isAdmin, addOrUpdatePending]
  );

  // 간트에서 셀 더블클릭 시 draft 생성
  const handleCreateDraftAtCell = useCallback(
    (context: {
      project: string;
      module: string;
      feature: string;
      date: Date;
    }) => {
      if (!isAdmin) return;

      const dateStr = formatLocalDateStr(context.date);
      const newDraft: DraftPlanItem = {
        tempId: crypto.randomUUID(),
        type: "feature",
        title: "",
        project: context.project,
        module: context.module,
        feature: context.feature,
        stage: "",
        start_date: dateStr,
        end_date: dateStr,
      };

      addDraftPlan(newDraft);
    },
    [isAdmin, addDraftPlan]
  );

  // 간트에서 드래그로 빠르게 생성
  const handleQuickCreate = useCallback(
    (context: {
      project: string;
      module: string;
      feature: string;
      date: Date;
      title: string;
    }) => {
      if (!isAdmin) return;

      const dateStr = formatLocalDateStr(context.date);
      const newDraft: DraftPlanItem = {
        tempId: crypto.randomUUID(),
        type: "feature",
        title: context.title,
        project: context.project,
        module: context.module,
        feature: context.feature,
        stage: "",
        start_date: dateStr,
        end_date: dateStr,
      };

      addDraftPlan(newDraft);
    },
    [isAdmin, addDraftPlan]
  );

  // Plan 리사이즈
  const handleResizePlan = useCallback(
    (planId: string, startDate: string, endDate: string) => {
      if (!isAdmin) return;
      addOrUpdatePending(planId, {
        start_date: startDate,
        end_date: endDate,
      });
    },
    [isAdmin, addOrUpdatePending]
  );

  // Plan 이동 (기간 변경)
  const handleMovePlan = useCallback(
    (planId: string, startDate: string, endDate: string) => {
      if (!isAdmin) return;
      addOrUpdatePending(planId, {
        start_date: startDate,
        end_date: endDate,
      });
    },
    [isAdmin, addOrUpdatePending]
  );

  // Plan 삭제
  const handleDeletePlan = useCallback(
    (planId: string, planTitle: string) => {
      if (!isAdmin) return;
      addDelete({ planId, planTitle });
    },
    [isAdmin, addDelete]
  );

  // Plan 복제
  const handleDuplicatePlan = useCallback(
    (planId: string) => {
      if (!isAdmin) return;
      addDuplicate(planId);
    },
    [isAdmin, addDuplicate]
  );

  return {
    handleStatusChange,
    handleStageChange,
    handleTitleUpdate,
    handleCreateDraftAtCell,
    handleQuickCreate,
    handleResizePlan,
    handleMovePlan,
    handleDeletePlan,
    handleDuplicatePlan,
  };
}
