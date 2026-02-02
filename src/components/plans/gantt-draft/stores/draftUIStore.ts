/**
 * Draft UI Store
 * 
 * UI 상태 관리 (선택, 필터, 줌, 트리 노드 펼침 등)
 */

import type { StateCreator } from "zustand";
import type { DraftUIState, DraftRow, LockState, HighlightDateRange } from "../types";

export interface DraftUIActions {
  // 선택 상태
  selectBar: (clientUid: string | undefined) => void;
  selectRow: (rowId: string | undefined) => void;
  
  // 뷰 설정
  setZoom: (zoom: "week" | "month" | "quarter") => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<DraftUIState["filters"]>) => void;
  resetFilters: () => void;
  setViewMode: (mode: "detailed" | "summarized") => void;
  
  // Lock 상태
  setLockState: (lockState: LockState) => void;
  
  // 편집/활동
  setEditing: (isEditing: boolean) => void;
  setHighlightDateRange: (range: HighlightDateRange | null) => void;
  recordActivity: () => void;
  
  // 트리 노드
  toggleNode: (nodeId: string) => void;
  expandAllNodes: () => void;
  collapseAllNodes: () => void;
  expandToLevel: (level: 0 | 1 | 2) => void;
  setExpandedNodes: (nodes: string[]) => void;
}

export type DraftUIStore = { ui: DraftUIState } & DraftUIActions;

const initialUIState: DraftUIState = {
  selectedBarId: undefined,
  selectedRowId: undefined,
  zoom: "week",
  searchQuery: "",
  filters: {
    projects: [],
    modules: [],
    features: [],
    stages: [],
    assignees: [],
    flagIds: [],
  },
  lockState: {
    isLocked: false,
    isMyLock: false,
  },
  lastSyncAt: undefined,
  isEditing: false,
  expandedNodes: [],
  highlightDateRange: null,
  lastActivityAt: undefined,
  viewMode: "detailed",
};

export const createDraftUIStore: StateCreator<
  DraftUIStore & { rows: DraftRow[] },
  [],
  [],
  DraftUIStore
> = (set, get) => ({
  ui: initialUIState,
  
  selectBar: (clientUid) => {
    set({ ui: { ...get().ui, selectedBarId: clientUid } });
  },
  
  selectRow: (rowId) => {
    set({ ui: { ...get().ui, selectedRowId: rowId } });
  },
  
  setZoom: (zoom) => {
    set({ ui: { ...get().ui, zoom } });
  },
  
  setSearchQuery: (query) => {
    set({ ui: { ...get().ui, searchQuery: query } });
  },
  
  setFilters: (filters) => {
    set({
      ui: {
        ...get().ui,
        filters: { ...get().ui.filters, ...filters },
      },
    });
  },
  
  resetFilters: () => {
    set({
      ui: {
        ...get().ui,
        filters: {
          projects: [],
          modules: [],
          features: [],
          stages: [],
          assignees: [],
          flagIds: [],
        },
      },
    });
  },
  
  setViewMode: (mode) => {
    set({ ui: { ...get().ui, viewMode: mode } });
  },
  
  setLockState: (lockState) => {
    set({
      ui: {
        ...get().ui,
        lockState,
      },
    });
  },
  
  setEditing: (isEditing) => {
    set({ ui: { ...get().ui, isEditing } });
  },
  
  setHighlightDateRange: (range) => {
    set({ ui: { ...get().ui, highlightDateRange: range } });
  },
  
  recordActivity: () => {
    set({
      ui: {
        ...get().ui,
        lastActivityAt: new Date().toISOString(),
      },
    });
  },
  
  toggleNode: (nodeId) => {
    const state = get();
    const expanded = state.ui.expandedNodes;
    const isExpanded = expanded.includes(nodeId);
    
    set({
      ui: {
        ...state.ui,
        expandedNodes: isExpanded
          ? expanded.filter((id) => id !== nodeId)
          : [...expanded, nodeId],
      },
    });
  },
  
  expandAllNodes: () => {
    const state = get();
    const allNodeIds: string[] = [];
    const projects = [...new Set(state.rows.map((r) => r.project))];
    
    for (const project of projects) {
      allNodeIds.push(project);
      const modules = [
        ...new Set(
          state.rows
            .filter((r) => r.project === project)
            .map((r) => r.module)
        ),
      ];
      for (const module of modules) {
        const moduleId = `${project}::${module}`;
        allNodeIds.push(moduleId);
        
        // Feature 레벨까지 모두 펼치기
        const features = state.rows.filter(
          (r) => r.project === project && r.module === module
        );
        for (const feature of features) {
          allNodeIds.push(feature.rowId);
        }
      }
    }
    
    set({
      ui: {
        ...state.ui,
        expandedNodes: allNodeIds,
      },
    });
  },
  
  collapseAllNodes: () => {
    set({
      ui: {
        ...get().ui,
        expandedNodes: [],
      },
    });
  },
  
  expandToLevel: (level) => {
    const state = get();
    const expandedNodes: string[] = [];
    const projects = [...new Set(state.rows.map((r) => r.project))];
    
    if (level >= 0) {
      projects.forEach((project) => {
        expandedNodes.push(project);
        
        if (level >= 1) {
          const modules = [
            ...new Set(
              state.rows
                .filter((r) => r.project === project)
                .map((r) => r.module)
            ),
          ];
          modules.forEach((module) => {
            const moduleId = `${project}::${module}`;
            expandedNodes.push(moduleId);
            
            if (level >= 2) {
              // Feature 레벨까지 펼치기
              const features = state.rows.filter(
                (r) => r.project === project && r.module === module
              );
              features.forEach((feature) => {
                expandedNodes.push(feature.rowId);
              });
            }
          });
        }
      });
    }
    
    set({
      ui: {
        ...state.ui,
        expandedNodes,
      },
    });
  },
  
  setExpandedNodes: (nodes) => {
    set({
      ui: {
        ...get().ui,
        expandedNodes: nodes,
      },
    });
  },
});
