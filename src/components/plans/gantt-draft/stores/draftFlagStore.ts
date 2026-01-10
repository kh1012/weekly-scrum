/**
 * Draft Flag Store
 * 
 * Gantt Flag 관리 (생성, 수정, 삭제, 동기화)
 */

import type { StateCreator } from "zustand";
import { v4 as uuidv4 } from "uuid";
import type { DraftFlag, PlanLink, DraftUIState, HighlightDateRange } from "../types";
import { listFlags } from "../flagService";

interface FlagDraft {
  start: Date | null;
  end: Date | null;
  laneIndex?: number;
}

export interface DraftFlagState {
  flags: DraftFlag[];
  pendingFlag: FlagDraft;
  selectedFlagId: string | null;
  isFlagsLoading: boolean;
}

export interface DraftFlagActions {
  // Flag 조회/관리
  fetchFlags: (workspaceId: string) => Promise<void>;
  
  // Pending flag (드래그로 생성 중)
  startPendingFlag: (date: Date, laneIndex?: number) => void;
  endPendingFlag: (date: Date) => void;
  clearPendingFlag: () => void;
  
  // Flag 선택
  selectFlag: (id: string | null) => void;
  
  // Flag CRUD (로컬 상태만 변경)
  addFlag: (payload: {
    workspaceId: string;
    title: string;
    startDate: string;
    endDate: string;
    color?: string | null;
    description?: string;
    links?: PlanLink[];
    laneHint?: number;
  }) => DraftFlag;
  updateFlagLocal: (
    clientId: string,
    updates: Partial<
      Pick<
        DraftFlag,
        | "title"
        | "startDate"
        | "endDate"
        | "orderIndex"
        | "color"
        | "laneHint"
        | "description"
        | "links"
      >
    >
  ) => void;
  deleteFlag: (clientId: string) => void;
  
  // 유틸리티
  getDirtyFlags: () => DraftFlag[];
  getDeletedFlags: () => DraftFlag[];
  clearFlagDirtyFlags: () => void;
  hasFlagChanges: () => boolean;
  discardFlagChanges: () => void;
}

export type DraftFlagStore = DraftFlagState & DraftFlagActions;

const initialFlagState: DraftFlagState = {
  flags: [],
  pendingFlag: { start: null, end: null },
  selectedFlagId: null,
  isFlagsLoading: false,
};

export const createDraftFlagStore: StateCreator<
  DraftFlagStore & { ui: DraftUIState },
  [],
  [],
  DraftFlagStore
> = (set, get) => ({
  ...initialFlagState,
  
  fetchFlags: async (workspaceId) => {
    set({ isFlagsLoading: true });
    try {
      const result = await listFlags(workspaceId);
      if (result.success && result.flags) {
        const draftFlags: DraftFlag[] = result.flags.map((f) => ({
          clientId: f.id,
          serverId: f.id,
          workspaceId: f.workspaceId,
          title: f.title,
          startDate: f.startDate,
          endDate: f.endDate,
          color: f.color,
          orderIndex: f.orderIndex,
          laneHint: f.laneHint ?? undefined,
          description: f.description,
          links: f.links,
          dirty: false,
          deleted: false,
          createdAtLocal: f.createdAt,
          updatedAtLocal: f.updatedAt,
        }));
        set({ flags: draftFlags, isFlagsLoading: false });
      } else {
        console.error("[fetchFlags] Error:", result.error);
        set({ isFlagsLoading: false });
      }
    } catch (err) {
      console.error("[fetchFlags] Unexpected error:", err);
      set({ isFlagsLoading: false });
    }
  },
  
  startPendingFlag: (date, laneIndex) => {
    set({
      pendingFlag: { start: date, end: null, laneIndex },
    });
  },
  
  endPendingFlag: (date) => {
    const state = get();
    const { start, laneIndex } = state.pendingFlag;
    if (!start) {
      set({ pendingFlag: { start: date, end: null, laneIndex } });
      return;
    }
    
    let finalStart = start;
    let finalEnd = date;
    if (start > date) {
      finalStart = date;
      finalEnd = start;
    }
    
    set({
      pendingFlag: { start: finalStart, end: finalEnd, laneIndex },
    });
  },
  
  clearPendingFlag: () => {
    set({
      pendingFlag: { start: null, end: null, laneIndex: undefined },
    });
  },
  
  selectFlag: (id) => {
    const state = get();
    const flag = id
      ? state.flags.find((f) => f.clientId === id && !f.deleted)
      : null;
    
    set({
      selectedFlagId: id,
      ui: {
        ...state.ui,
        selectedBarId: undefined,
        highlightDateRange: flag
          ? {
              startDate: flag.startDate,
              endDate: flag.endDate,
              type: "flag" as const,
              color: flag.color || "#ef4444",
            }
          : null,
      },
    });
  },
  
  addFlag: (payload) => {
    const state = get();
    const now = new Date().toISOString();
    
    const maxOrderIndex = state.flags.reduce(
      (max, f) => Math.max(max, f.orderIndex),
      -1
    );
    
    const newFlag: DraftFlag = {
      clientId: uuidv4(),
      workspaceId: payload.workspaceId,
      title: payload.title,
      startDate: payload.startDate,
      endDate: payload.endDate,
      color: payload.color || null,
      description: payload.description,
      links: payload.links,
      laneHint: payload.laneHint,
      orderIndex: maxOrderIndex + 1,
      dirty: true,
      deleted: false,
      createdAtLocal: now,
      updatedAtLocal: now,
    };
    
    set({
      flags: [...state.flags, newFlag].sort((a, b) => {
        const startCompare = a.startDate.localeCompare(b.startDate);
        if (startCompare !== 0) return startCompare;
        return a.orderIndex - b.orderIndex;
      }),
      pendingFlag: { start: null, end: null, laneIndex: undefined },
    });
    
    return newFlag;
  },
  
  updateFlagLocal: (clientId, updates) => {
    const state = get();
    const flagIndex = state.flags.findIndex((f) => f.clientId === clientId);
    if (flagIndex === -1) return;
    
    const prevFlag = state.flags[flagIndex];
    const nextFlag = {
      ...prevFlag,
      ...updates,
      dirty: true,
      updatedAtLocal: new Date().toISOString(),
    };
    
    const newFlags = [...state.flags];
    newFlags[flagIndex] = nextFlag;
    
    set({ flags: newFlags });
  },
  
  deleteFlag: (clientId) => {
    const state = get();
    const flag = state.flags.find((f) => f.clientId === clientId);
    if (!flag) return;
    
    const newFlags = state.flags.map((f) =>
      f.clientId === clientId
        ? {
            ...f,
            deleted: true,
            dirty: true,
            updatedAtLocal: new Date().toISOString(),
          }
        : f
    );
    
    set({
      flags: newFlags,
      selectedFlagId: state.selectedFlagId === clientId ? null : state.selectedFlagId,
      ui: {
        ...state.ui,
        highlightDateRange: state.selectedFlagId === clientId ? null : state.ui.highlightDateRange,
      },
    });
  },
  
  getDirtyFlags: () => get().flags.filter((f) => f.dirty && !f.deleted),
  
  getDeletedFlags: () => get().flags.filter((f) => f.deleted && f.serverId),
  
  clearFlagDirtyFlags: () => {
    const state = get();
    const newFlags = state.flags
      .filter((f) => !f.deleted)
      .map((f) => ({ ...f, dirty: false }));
    
    set({ flags: newFlags });
  },
  
  hasFlagChanges: () => {
    return get().flags.some((f) => f.dirty);
  },
  
  discardFlagChanges: () => {
    const state = get();
    const newFlags = state.flags
      .filter((f) => f.serverId !== undefined)
      .map((f) => ({
        ...f,
        deleted: false,
        dirty: false,
      }));
    
    set({ flags: newFlags });
  },
});
