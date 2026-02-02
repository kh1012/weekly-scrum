/**
 * useSaveQueue - 저장 큐 관리 Hook
 * 
 * - 연속 저장 요청을 안전하게 처리
 * - 저장 중 새로운 변경사항이 발생하면 완료 후 자동 재저장
 * - 데이터 무결성 보장
 */

import { useRef, useCallback, useState } from "react";
import {
  showSaveToast,
  updateSaveToast,
  createInitialSaveState,
  updateStepStatus,
  type SaveToastState,
} from "../SaveToast";
import { commitFeaturePlans, commitFlags } from "../commitService";
import { showToast } from "../Toast";
import type { DraftBar, DraftFlag, DraftRow } from "../types";

interface UseSaveQueueProps {
  workspaceId: string;
  rows: DraftRow[];
  getDirtyBars: () => DraftBar[];
  getDeletedBars: () => DraftBar[];
  getDirtyFlags: () => DraftFlag[];
  getDeletedFlags: () => DraftFlag[];
  clearDirtyFlags: () => void;
  clearFlagDirtyFlags: () => void;
  fetchFlags: (workspaceId: string) => Promise<void>;
}

interface SaveQueueResult {
  requestSave: () => Promise<void>;
  isSaving: boolean;
}

export function useSaveQueue({
  workspaceId,
  rows,
  getDirtyBars,
  getDeletedBars,
  getDirtyFlags,
  getDeletedFlags,
  clearDirtyFlags,
  clearFlagDirtyFlags,
  fetchFlags,
}: UseSaveQueueProps): SaveQueueResult {
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const pendingChangesRef = useRef(false);
  const saveStateRef = useRef<SaveToastState | null>(null);

  /**
   * 실제 저장 수행
   */
  const doSave = useCallback(async () => {
    // 저장 시작 시점의 dirty 데이터 스냅샷
    const dirtyBars = getDirtyBars();
    const deletedBars = getDeletedBars();
    const allBars = [...dirtyBars, ...deletedBars];

    const dirtyFlags = getDirtyFlags();
    const deletedFlags = getDeletedFlags();
    const allFlags = [...dirtyFlags, ...deletedFlags];

    // 변경사항 없음
    if (allBars.length === 0 && allFlags.length === 0) {
      showToast("info", "변경사항 없음", "저장할 변경사항이 없습니다.");
      return;
    }

    // 초기 상태 생성 및 Toast 표시
    const hasFlagChanges = allFlags.length > 0;
    const hasPlanChanges = allBars.length > 0;
    let state = createInitialSaveState(hasFlagChanges, hasPlanChanges);
    
    // 라벨에 개수 추가
    state = {
      ...state,
      steps: state.steps.map((step) => {
        if (step.id === "flags") {
          return { ...step, label: `Flags 저장 (${allFlags.length}개)` };
        }
        if (step.id === "plans") {
          return { ...step, label: `Plans 저장 (${allBars.length}개)` };
        }
        return step;
      }),
    };
    
    saveStateRef.current = state;
    showSaveToast(state);

    try {
      // 1. Flags 저장
      if (allFlags.length > 0) {
        // 진행 중 상태로 업데이트
        state = updateStepStatus(state, "flags", "in_progress");
        saveStateRef.current = state;
        updateSaveToast(state);

        const flagResult = await commitFlags({
          workspaceId,
          flags: allFlags,
        });

        if (flagResult.success) {
          const flagCount =
            (flagResult.createdCount || 0) +
            (flagResult.updatedCount || 0) +
            (flagResult.deletedCount || 0);

          state = updateStepStatus(state, "flags", "success", flagCount);
          saveStateRef.current = state;
          updateSaveToast(state);

          // dirty 플래그 클리어 및 최신 데이터 동기화
          clearFlagDirtyFlags();
          await fetchFlags(workspaceId);
        } else {
          state = updateStepStatus(
            state,
            "flags",
            "error",
            undefined,
            flagResult.error
          );
          saveStateRef.current = state;
          updateSaveToast(state);
        }
      }

      // 2. Plans 저장
      if (allBars.length > 0) {
        // 진행 중 상태로 업데이트
        state = updateStepStatus(state, "plans", "in_progress");
        saveStateRef.current = state;
        updateSaveToast(state);

        const payload = {
          workspaceId,
          plans: allBars.map((bar) => {
            const row = rows.find((r) => r.rowId === bar.rowId);
            return {
              clientUid: bar.clientUid,
              serverId: bar.serverId,
              domain: row?.domain,
              project: row?.project || "",
              module: row?.module || "",
              feature: row?.feature || "",
              title: bar.title,
              stage: bar.stage,
              status: bar.status,
              start_date: bar.startDate,
              end_date: bar.endDate,
              assignees: bar.assignees,
              description: bar.description,
              links: bar.links,
              deleted: bar.deleted || false,
              order_index: row?.orderIndex ?? 0,
              lane_hint: bar.preferredLane,
            };
          }),
        };

        const planResult = await commitFeaturePlans(payload);

        if (planResult.success) {
          const planCount =
            (planResult.upsertedCount || 0) + (planResult.deletedCount || 0);

          state = updateStepStatus(state, "plans", "success", planCount);
          saveStateRef.current = state;
          updateSaveToast(state);

          clearDirtyFlags();
        } else {
          state = updateStepStatus(
            state,
            "plans",
            "error",
            undefined,
            planResult.error
          );
          saveStateRef.current = state;
          updateSaveToast(state);
        }
      }
    } catch (err) {
      // 현재 진행 중인 단계를 에러로 표시
      const errorMessage =
        err instanceof Error ? err.message : "알 수 없는 오류 발생";
      
      const inProgressStep = state.steps.find(
        (s) => s.status === "in_progress"
      );
      if (inProgressStep) {
        state = updateStepStatus(
          state,
          inProgressStep.id,
          "error",
          undefined,
          errorMessage
        );
        saveStateRef.current = state;
        updateSaveToast(state);
      }
    }
  }, [
    workspaceId,
    rows,
    getDirtyBars,
    getDeletedBars,
    getDirtyFlags,
    getDeletedFlags,
    clearDirtyFlags,
    clearFlagDirtyFlags,
    fetchFlags,
  ]);

  /**
   * 저장 요청 (큐 처리)
   */
  const requestSave = useCallback(async () => {
    // 이미 저장 중이면 대기 플래그 설정
    if (isSavingRef.current) {
      pendingChangesRef.current = true;
      showToast("info", "저장 대기 중", "현재 저장이 완료된 후 다시 저장됩니다.");
      return;
    }

    // 저장 시작 전 이벤트 발생 (스크롤 위치 저장 등)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("gantt:before-save"));
    }

    // 저장 시작
    isSavingRef.current = true;
    setIsSaving(true);

    try {
      await doSave();
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }

    // 대기 중인 변경사항이 있으면 다시 저장
    if (pendingChangesRef.current) {
      pendingChangesRef.current = false;
      // 약간의 딜레이 후 재저장 (UI 업데이트를 위해)
      setTimeout(() => {
        requestSave();
      }, 500);
    }
  }, [doSave]);

  return {
    requestSave,
    isSaving,
  };
}
