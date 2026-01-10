/**
 * usePlansDraft Hook
 * 
 * Draft 데이터 관리 (creates/updates/deletes/duplicates)
 * - localStorage 연동
 * - unsaved changes 추적
 */

import { useState, useEffect, useCallback } from "react";
import type {
  DraftPlanItem,
  DraftData,
  PendingUpdate,
  PendingDeleteItem,
} from "../types";
import type { PlanStatus } from "@/lib/data/plans";

const STORAGE_KEY = "plans-draft-data";

const initialDraftData: DraftData = {
  creates: [],
  updates: [],
  deletes: [],
  duplicates: [],
};

export function usePlansDraft() {
  const [draftData, setDraftData] = useState<DraftData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // 기존 형식 호환 (배열 → 객체)
          if (Array.isArray(parsed)) {
            return {
              creates: parsed,
              updates: [],
              deletes: [],
              duplicates: [],
            };
          }
          return {
            creates: parsed.creates || [],
            updates: parsed.updates || [],
            deletes: parsed.deletes || [],
            duplicates: parsed.duplicates || [],
          };
        } catch {
          return initialDraftData;
        }
      }
    }
    return initialDraftData;
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // draftData 변경 시 localStorage 저장 및 unsaved 상태 업데이트
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasChanges =
        draftData.creates.length > 0 ||
        draftData.updates.length > 0 ||
        draftData.deletes.length > 0 ||
        draftData.duplicates.length > 0;

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
        setHasUnsavedChanges(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setHasUnsavedChanges(false);
      }
    }
  }, [draftData]);

  // 페이지 이탈 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // 변경 건수 계산
  const totalChanges =
    draftData.creates.length +
    draftData.updates.length +
    draftData.deletes.length +
    draftData.duplicates.length;

  // 하위 호환을 위한 draftPlans alias
  const draftPlans = draftData.creates;
  const setDraftPlans = useCallback(
    (fn: (prev: DraftPlanItem[]) => DraftPlanItem[]) => {
      setDraftData((prev) => ({
        ...prev,
        creates: typeof fn === "function" ? fn(prev.creates) : fn,
      }));
    },
    []
  );

  // Creates 관리
  const addDraftPlan = useCallback((draft: DraftPlanItem) => {
    setDraftData((prev) => ({
      ...prev,
      creates: [...prev.creates, draft],
    }));
  }, []);

  const removeDraftPlan = useCallback((tempId: string) => {
    setDraftData((prev) => ({
      ...prev,
      creates: prev.creates.filter((d) => d.tempId !== tempId),
    }));
  }, []);

  const updateDraftPlan = useCallback(
    (tempId: string, updates: Partial<DraftPlanItem>) => {
      setDraftData((prev) => ({
        ...prev,
        creates: prev.creates.map((d) =>
          d.tempId === tempId ? { ...d, ...updates } : d
        ),
      }));
    },
    []
  );

  // Updates 관리
  const addOrUpdatePending = useCallback(
    (planId: string, changes: PendingUpdate["changes"]) => {
      setDraftData((prev) => {
        const existingIndex = prev.updates.findIndex(
          (u) => u.planId === planId
        );

        if (existingIndex !== -1) {
          const updates = [...prev.updates];
          updates[existingIndex] = {
            ...updates[existingIndex],
            changes: {
              ...updates[existingIndex].changes,
              ...changes,
            },
          };
          return { ...prev, updates };
        }

        return {
          ...prev,
          updates: [...prev.updates, { planId, changes }],
        };
      });
    },
    []
  );

  // Deletes 관리
  const addDelete = useCallback((item: PendingDeleteItem) => {
    setDraftData((prev) => ({
      ...prev,
      deletes: [...prev.deletes, item],
    }));
  }, []);

  const removeDelete = useCallback((planId: string) => {
    setDraftData((prev) => ({
      ...prev,
      deletes: prev.deletes.filter((d) => d.planId !== planId),
    }));
  }, []);

  // Duplicates 관리
  const addDuplicate = useCallback((planId: string) => {
    setDraftData((prev) => ({
      ...prev,
      duplicates: [...prev.duplicates, planId],
    }));
  }, []);

  // 전체 리셋
  const resetDrafts = useCallback(() => {
    setDraftData(initialDraftData);
    localStorage.removeItem(STORAGE_KEY);
    setHasUnsavedChanges(false);
  }, []);

  // 저장 후 정리
  const clearDrafts = useCallback(() => {
    setDraftData(initialDraftData);
    localStorage.removeItem(STORAGE_KEY);
    setHasUnsavedChanges(false);
  }, []);

  return {
    draftData,
    setDraftData,
    hasUnsavedChanges,
    totalChanges,
    draftPlans,
    setDraftPlans,
    addDraftPlan,
    removeDraftPlan,
    updateDraftPlan,
    addOrUpdatePending,
    addDelete,
    removeDelete,
    addDuplicate,
    resetDrafts,
    clearDrafts,
  };
}
