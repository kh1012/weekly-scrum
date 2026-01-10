/**
 * usePlansSave Hook
 * 
 * Plans 저장 로직
 * - handleSaveAll: 모든 임시 변경사항을 서버에 저장
 */

import { useState, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { DraftData } from "../types";
import {
  updatePlanStatusAction,
  resizePlanAction,
  createPlanAction,
  updatePlanTitleAction,
  deletePlanAction,
  duplicatePlanAction,
  updatePlanStageAction,
} from "@/lib/actions/plans";

interface UsePlansSaveProps {
  draftData: DraftData;
  totalChanges: number;
  clearDrafts: () => void;
  onSaveSuccess: (message: string) => void;
}

export function usePlansSave({
  draftData,
  totalChanges,
  clearDrafts,
  onSaveSuccess,
}: UsePlansSaveProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveAll = useCallback(async () => {
    if (totalChanges === 0) return;

    setIsSaving(true);

    try {
      let savedCount = 0;

      // 1. 삭제 처리
      for (const del of draftData.deletes) {
        const result = await deletePlanAction(del.planId);
        if (result.success) savedCount++;
      }

      // 2. 수정 처리
      for (const update of draftData.updates) {
        const { planId, changes } = update;

        // 상태 변경
        if (changes.status) {
          await updatePlanStatusAction(planId, changes.status);
        }
        // 스테이지 변경
        if (changes.stage) {
          await updatePlanStageAction(planId, changes.stage);
        }
        // 제목 변경
        if (changes.title) {
          await updatePlanTitleAction(planId, changes.title);
        }
        // 기간 변경 (리사이즈/이동)
        if (changes.start_date || changes.end_date) {
          await resizePlanAction({
            planId,
            start_date: changes.start_date!,
            end_date: changes.end_date!,
          });
        }
        savedCount++;
      }

      // 3. 복제 처리
      for (const planId of draftData.duplicates) {
        const result = await duplicatePlanAction(planId);
        if (result.success) savedCount++;
      }

      // 4. 새 계획 생성
      for (const draft of draftData.creates) {
        // 날짜가 설정된 것만 생성
        if (draft.start_date && draft.end_date) {
          const isFeature = draft.type === "feature";
          await createPlanAction({
            type: draft.type,
            title: draft.title,
            stage: isFeature ? draft.stage || "" : "",
            project: isFeature ? draft.project || "" : undefined,
            module: isFeature ? draft.module || "" : undefined,
            feature: isFeature ? draft.feature || "" : undefined,
            start_date: draft.start_date,
            end_date: draft.end_date,
          });
          savedCount++;
        }
      }

      // 임시 데이터 비우기
      clearDrafts();

      // 새로고침
      startTransition(() => {
        router.refresh();
      });

      // 성공 메시지
      onSaveSuccess(`${savedCount}개 변경 사항이 저장되었습니다`);
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [draftData, totalChanges, clearDrafts, router, onSaveSuccess]);

  return {
    isSaving,
    isPending,
    handleSaveAll,
  };
}
