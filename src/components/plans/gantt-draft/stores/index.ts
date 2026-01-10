/**
 * Draft Store - Main Entry
 * 
 * 5개의 독립적인 store slice를 조합
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createDraftDataStore, type DraftDataStore } from "./draftDataStore";
import { createDraftUIStore, type DraftUIStore } from "./draftUIStore";
import { createDraftFlagStore, type DraftFlagStore } from "./draftFlagStore";
import { createDraftUndoStore, type DraftUndoStore } from "./draftUndoStore";

export type DraftStore = DraftDataStore & DraftUIStore & DraftFlagStore & DraftUndoStore;

/**
 * Draft Store 생성
 * 
 * 5개의 독립적인 slice를 조합하여 하나의 store로 제공
 */
export const useDraftStore = create<DraftStore>()(
  persist(
    (...args) => ({
      ...createDraftDataStore(...args),
      ...createDraftUIStore(...args),
      ...createDraftFlagStore(...args),
      ...createDraftUndoStore(...args),
    }),
    {
      name: "draft-gantt-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // UI 상태만 persist (데이터는 서버에서 로드)
        ui: state.ui,
      }),
    }
  )
);

// Selectors는 상위 store.ts에 정의되어 있음 (순환 참조 방지)

// Re-export types
export type { DraftDataStore, DraftDataActions } from "./draftDataStore";
export type { DraftUIStore, DraftUIActions } from "./draftUIStore";
export type { DraftFlagStore, DraftFlagActions } from "./draftFlagStore";
export type { DraftUndoStore, DraftUndoActions } from "./draftUndoStore";
export { createRowId } from "./draftDataStore";
export { pushUndo } from "./draftUndoStore";
