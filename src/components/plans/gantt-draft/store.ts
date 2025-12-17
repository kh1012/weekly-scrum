/**
 * Draft Store for Gantt View
 * - zustand + persist (localStorage)
 * - Undo/Redo 지원 (최대 20 step)
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";
import type {
  DraftState,
  DraftRow,
  DraftBar,
  DraftUIState,
  UndoAction,
  LockState,
  PlanStatus,
  DraftAssignee,
} from "./types";

const MAX_UNDO_STACK = 20;

/**
 * 초기 UI 상태
 */
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
  },
  lockState: {
    isLocked: false,
    isMyLock: false,
  },
  lastSyncAt: undefined,
  isEditing: false,
  expandedNodes: [],
};

/**
 * 초기 Draft 상태
 */
const initialState: DraftState = {
  rows: [],
  bars: [],
  ui: initialUIState,
  undoStack: [],
  redoStack: [],
};

/**
 * rowId 생성 헬퍼
 */
export function createRowId(
  project: string,
  module: string,
  feature: string
): string {
  return `${project}::${module}::${feature}`;
}

/**
 * Draft Store Actions
 */
interface DraftActions {
  // === 초기화/동기화 ===
  /** 서버 데이터로 Draft 초기화 (hydrate) */
  hydrate: (rows: DraftRow[], bars: DraftBar[]) => void;
  /** Draft 전체 리셋 */
  reset: () => void;
  /** 마지막 동기화 시간 업데이트 */
  updateLastSyncAt: () => void;

  // === Row 관리 ===
  /** Row 추가 (동일 row identity면 기존 row 반환) */
  addRow: (
    project: string,
    module: string,
    feature: string,
    domain?: string
  ) => DraftRow;
  /** Row 업데이트 */
  updateRow: (rowId: string, updates: Partial<Omit<DraftRow, "rowId">>) => void;
  /** Row 삭제 (해당 row의 bars도 함께 삭제) */
  deleteRow: (rowId: string) => void;
  /** Row 순서 변경 (reorder) */
  reorderRows: (newOrder: string[]) => void;
  /** 프로젝트/모듈/기능 이름 변경 */
  renameNode: (
    type: "project" | "module" | "feature",
    oldName: string,
    newName: string,
    parentProject?: string,
    parentModule?: string
  ) => void;

  // === Bar (Plan) 관리 ===
  /** Bar 추가 */
  addBar: (params: {
    rowId: string;
    title: string;
    stage: string;
    status: PlanStatus;
    startDate: string;
    endDate: string;
    assignees?: DraftAssignee[];
    serverId?: string;
  }) => DraftBar;
  /** Bar 업데이트 */
  updateBar: (
    clientUid: string,
    updates: Partial<Omit<DraftBar, "clientUid" | "rowId">>
  ) => void;
  /** Bar 삭제 (soft delete) */
  deleteBar: (clientUid: string) => void;
  /** Bar 복원 */
  restoreBar: (clientUid: string) => void;
  /** Bar 이동 (날짜 변경, 기간 유지) */
  moveBar: (
    clientUid: string,
    newStartDate: string,
    newEndDate: string
  ) => void;
  /** Bar 리사이즈 (시작/종료일 개별 변경) */
  resizeBar: (clientUid: string, startDate: string, endDate: string) => void;
  /** Bar 복제 (선택된 bar 우측에 동일한 bar 생성) */
  duplicateBar: (clientUid: string) => DraftBar | null;

  // === UI 상태 ===
  /** Bar 선택 */
  selectBar: (clientUid: string | undefined) => void;
  /** Row 선택 */
  selectRow: (rowId: string | undefined) => void;
  /** Zoom 변경 */
  setZoom: (zoom: "week" | "month" | "quarter") => void;
  /** 검색어 설정 */
  setSearchQuery: (query: string) => void;
  /** 필터 설정 */
  setFilters: (filters: Partial<DraftUIState["filters"]>) => void;
  /** 필터 초기화 */
  resetFilters: () => void;
  /** Lock 상태 설정 */
  setLockState: (lockState: LockState) => void;
  /** 편집 모드 설정 */
  setEditing: (isEditing: boolean) => void;
  /** 트리 노드 토글 (펼침/접힘) */
  toggleNode: (nodeId: string) => void;
  /** 모든 노드 펼치기 */
  expandAllNodes: () => void;
  /** 모든 노드 접기 */
  collapseAllNodes: () => void;
  /** 특정 레벨까지만 펼치기 (0: 프로젝트만, 1: 모듈까지, 2: 기능까지) */
  expandToLevel: (level: 0 | 1 | 2) => void;

  // === Undo/Redo ===
  /** Undo */
  undo: () => void;
  /** Redo */
  redo: () => void;
  /** Undo 가능 여부 */
  canUndo: () => boolean;
  /** Redo 가능 여부 */
  canRedo: () => boolean;

  // === 유틸리티 ===
  /** dirty bars 조회 */
  getDirtyBars: () => DraftBar[];
  /** deleted bars 조회 */
  getDeletedBars: () => DraftBar[];
  /** Commit 후 dirty/deleted 정리 */
  clearDirtyFlags: () => void;
  /** 변경 사항 존재 여부 */
  hasUnsavedChanges: () => boolean;
  /** 모든 변경사항 폐기 (초기 상태로 복원) */
  discardAllChanges: () => void;
}

type DraftStore = DraftState & DraftActions;

/**
 * Undo 액션 추가 헬퍼 (스택 제한)
 */
function pushUndo(state: DraftState, action: UndoAction): Partial<DraftState> {
  const newStack = [...state.undoStack, action];
  if (newStack.length > MAX_UNDO_STACK) {
    newStack.shift();
  }
  return {
    undoStack: newStack,
    redoStack: [], // redo 스택 초기화
  };
}

/**
 * Draft Store 생성
 */
export const useDraftStore = create<DraftStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // === 초기화/동기화 ===
      hydrate: (rows, bars) => {
        // 모든 프로젝트와 모듈 ID를 수집하여 펼친 상태로 설정
        const expandedNodes: string[] = [];
        const projects = [...new Set(rows.map((r) => r.project))];

        for (const project of projects) {
          expandedNodes.push(project);
          const modules = [
            ...new Set(
              rows.filter((r) => r.project === project).map((r) => r.module)
            ),
          ];
          for (const module of modules) {
            expandedNodes.push(`${project}::${module}`);
          }
        }

        set({
          rows,
          bars,
          undoStack: [],
          redoStack: [],
          ui: {
            ...get().ui,
            lastSyncAt: new Date().toISOString(),
            expandedNodes,
          },
        });
      },

      reset: () => {
        set(initialState);
      },

      updateLastSyncAt: () => {
        set({
          ui: {
            ...get().ui,
            lastSyncAt: new Date().toISOString(),
          },
        });
      },

      // === Row 관리 ===
      addRow: (project, module, feature, domain) => {
        const state = get();
        const rowId = createRowId(project, module, feature);

        // 기존 row 확인
        const existing = state.rows.find((r) => r.rowId === rowId);
        if (existing) return existing;

        const newRow: DraftRow = {
          rowId,
          project,
          module,
          feature,
          domain,
          orderIndex: state.rows.length,
          expanded: true,
          isLocal: true, // 로컬에서 생성됨 (bars 없어도 표시)
        };

        // 새 row 추가 시 프로젝트와 모듈도 펼친 상태로 설정
        const projectId = project;
        const moduleId = `${project}::${module}`;
        const currentExpanded = state.ui.expandedNodes;
        const newExpandedNodes = [...currentExpanded];

        if (!newExpandedNodes.includes(projectId)) {
          newExpandedNodes.push(projectId);
        }
        if (!newExpandedNodes.includes(moduleId)) {
          newExpandedNodes.push(moduleId);
        }

        set({
          rows: [...state.rows, newRow],
          ui: {
            ...state.ui,
            expandedNodes: newExpandedNodes,
          },
          ...pushUndo(state, { type: "ADD_ROW", row: newRow }),
        });

        return newRow;
      },

      updateRow: (rowId, updates) => {
        const state = get();
        const rowIndex = state.rows.findIndex((r) => r.rowId === rowId);
        if (rowIndex === -1) return;

        const prevRow = state.rows[rowIndex];
        const nextRow = { ...prevRow, ...updates };

        const newRows = [...state.rows];
        newRows[rowIndex] = nextRow;

        set({
          rows: newRows,
          ...pushUndo(state, { type: "UPDATE_ROW", rowId, prevRow, nextRow }),
        });
      },

      reorderRows: (newOrder) => {
        const state = get();
        const prevOrder = [...state.rows];

        const reordered = newOrder
          .map((rowId, idx) => {
            const row = state.rows.find((r) => r.rowId === rowId);
            return row ? { ...row, orderIndex: idx } : null;
          })
          .filter((r): r is DraftRow => r !== null);

        set({
          rows: reordered,
          ...pushUndo(state, {
            type: "REORDER_ROWS",
            prevOrder,
            nextOrder: reordered,
          }),
        });
      },

      renameNode: (type, oldName, newName, parentProject, parentModule) => {
        if (oldName === newName || !newName.trim()) return;

        const state = get();
        const newRows = state.rows.map((row) => {
          let shouldUpdate = false;
          const updated = { ...row };

          if (type === "project" && row.project === oldName) {
            updated.project = newName;
            shouldUpdate = true;
          } else if (
            type === "module" &&
            row.project === parentProject &&
            row.module === oldName
          ) {
            updated.module = newName;
            shouldUpdate = true;
          } else if (
            type === "feature" &&
            row.project === parentProject &&
            row.module === parentModule &&
            row.feature === oldName
          ) {
            updated.feature = newName;
            shouldUpdate = true;
          }

          if (shouldUpdate) {
            // rowId는 project/module/feature 조합이므로 새로 생성
            updated.rowId = createRowId(
              updated.project,
              updated.module,
              updated.feature
            );
          }

          return shouldUpdate ? updated : row;
        });

        // bars의 rowId도 업데이트
        const oldRowIds = new Set<string>();
        const rowIdMap = new Map<string, string>();

        state.rows.forEach((row, i) => {
          if (newRows[i].rowId !== row.rowId) {
            oldRowIds.add(row.rowId);
            rowIdMap.set(row.rowId, newRows[i].rowId);
          }
        });

        const newBars = state.bars.map((bar) => {
          const newRowId = rowIdMap.get(bar.rowId);
          if (newRowId) {
            return {
              ...bar,
              rowId: newRowId,
              dirty: true,
              updatedAtLocal: new Date().toISOString(),
            };
          }
          return bar;
        });

        // expandedNodes도 업데이트 (프로젝트/모듈 이름 변경 시)
        let newExpandedNodes = [...state.ui.expandedNodes];
        if (type === "project") {
          // 프로젝트 이름 변경: "oldName" -> "newName"
          // 모듈 ID도 변경: "oldName::module" -> "newName::module"
          newExpandedNodes = newExpandedNodes.map((nodeId) => {
            if (nodeId === oldName) {
              return newName;
            }
            if (nodeId.startsWith(`${oldName}::`)) {
              return nodeId.replace(`${oldName}::`, `${newName}::`);
            }
            return nodeId;
          });
        } else if (type === "module" && parentProject) {
          // 모듈 이름 변경: "project::oldName" -> "project::newName"
          const oldModuleId = `${parentProject}::${oldName}`;
          const newModuleId = `${parentProject}::${newName}`;
          newExpandedNodes = newExpandedNodes.map((nodeId) =>
            nodeId === oldModuleId ? newModuleId : nodeId
          );
        }

        set({
          rows: newRows,
          bars: newBars,
          ui: {
            ...state.ui,
            expandedNodes: newExpandedNodes,
          },
        });
      },

      deleteRow: (rowId) => {
        const state = get();
        const row = state.rows.find((r) => r.rowId === rowId);
        if (!row) return;

        // 해당 row에 연결된 bars도 soft delete
        const newBars = state.bars.map((bar) =>
          bar.rowId === rowId
            ? {
                ...bar,
                deleted: true,
                dirty: true,
                updatedAtLocal: new Date().toISOString(),
              }
            : bar
        );

        // row 삭제
        const newRows = state.rows.filter((r) => r.rowId !== rowId);

        set({
          rows: newRows,
          bars: newBars,
          ui: {
            ...state.ui,
            selectedRowId:
              state.ui.selectedRowId === rowId
                ? undefined
                : state.ui.selectedRowId,
          },
        });
      },

      // === Bar 관리 ===
      addBar: (params) => {
        const state = get();
        const now = new Date().toISOString();

        const newBar: DraftBar = {
          clientUid: uuidv4(),
          rowId: params.rowId,
          serverId: params.serverId,
          title: params.title,
          stage: params.stage,
          status: params.status,
          startDate: params.startDate,
          endDate: params.endDate,
          assignees: params.assignees || [],
          dirty: true,
          deleted: false,
          createdAtLocal: now,
          updatedAtLocal: now,
        };

        set({
          bars: [...state.bars, newBar],
          ...pushUndo(state, { type: "ADD_BAR", bar: newBar }),
        });

        return newBar;
      },

      updateBar: (clientUid, updates) => {
        const state = get();
        const barIndex = state.bars.findIndex((b) => b.clientUid === clientUid);
        if (barIndex === -1) return;

        const prevBar = state.bars[barIndex];
        const nextBar: DraftBar = {
          ...prevBar,
          ...updates,
          dirty: true,
          updatedAtLocal: new Date().toISOString(),
        };

        const newBars = [...state.bars];
        newBars[barIndex] = nextBar;

        set({
          bars: newBars,
          ...pushUndo(state, {
            type: "UPDATE_BAR",
            barId: clientUid,
            prevBar,
            nextBar,
          }),
        });
      },

      deleteBar: (clientUid) => {
        const state = get();
        const bar = state.bars.find((b) => b.clientUid === clientUid);
        if (!bar) return;

        const newBars = state.bars.map((b) =>
          b.clientUid === clientUid
            ? {
                ...b,
                deleted: true,
                dirty: true,
                updatedAtLocal: new Date().toISOString(),
              }
            : b
        );

        set({
          bars: newBars,
          ui: {
            ...state.ui,
            selectedBarId:
              state.ui.selectedBarId === clientUid
                ? undefined
                : state.ui.selectedBarId,
          },
          ...pushUndo(state, { type: "DELETE_BAR", bar }),
        });
      },

      restoreBar: (clientUid) => {
        const state = get();
        const bar = state.bars.find((b) => b.clientUid === clientUid);
        if (!bar) return;

        const newBars = state.bars.map((b) =>
          b.clientUid === clientUid
            ? {
                ...b,
                deleted: false,
                dirty: true,
                updatedAtLocal: new Date().toISOString(),
              }
            : b
        );

        set({
          bars: newBars,
          ...pushUndo(state, { type: "RESTORE_BAR", bar }),
        });
      },

      moveBar: (clientUid, newStartDate, newEndDate) => {
        get().updateBar(clientUid, {
          startDate: newStartDate,
          endDate: newEndDate,
        });
      },

      resizeBar: (clientUid, startDate, endDate) => {
        get().updateBar(clientUid, { startDate, endDate });
      },

      duplicateBar: (clientUid) => {
        const state = get();
        const sourceBar = state.bars.find(
          (b) => b.clientUid === clientUid && !b.deleted
        );
        if (!sourceBar) return null;

        // 기간 계산 (원본 bar 우측에 배치)
        const sourceStart = new Date(sourceBar.startDate);
        const sourceEnd = new Date(sourceBar.endDate);
        const duration = sourceEnd.getTime() - sourceStart.getTime();

        // 새 bar는 원본 종료일 다음날부터 시작
        const newStart = new Date(sourceEnd);
        newStart.setDate(newStart.getDate() + 1);
        const newEnd = new Date(newStart.getTime() + duration);

        const newBar: DraftBar = {
          clientUid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          rowId: sourceBar.rowId,
          title: `${sourceBar.title} (복사)`,
          stage: sourceBar.stage,
          status: sourceBar.status,
          startDate: newStart.toISOString().split("T")[0],
          endDate: newEnd.toISOString().split("T")[0],
          assignees: [...sourceBar.assignees],
          dirty: true,
          deleted: false,
          createdAtLocal: new Date().toISOString(),
          updatedAtLocal: new Date().toISOString(),
        };

        set({
          bars: [...state.bars, newBar],
          ui: { ...state.ui, selectedBarId: newBar.clientUid },
          ...pushUndo(state, { type: "ADD_BAR", bar: newBar }),
        });

        return newBar;
      },

      // === UI 상태 ===
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
        // 모든 프로젝트와 모듈 ID를 수집
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
            allNodeIds.push(`${project}::${module}`);
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
        const allNodeIds: string[] = [];
        const projects = [...new Set(state.rows.map((r) => r.project))];

        if (level >= 0) {
          // 레벨 0: 프로젝트만 (프로젝트 노드를 펼치면 모듈이 보임)
          for (const project of projects) {
            allNodeIds.push(project);
          }
        }

        if (level >= 1) {
          // 레벨 1: 모듈까지 (모듈 노드를 펼치면 기능이 보임)
          for (const project of projects) {
            const modules = [
              ...new Set(
                state.rows
                  .filter((r) => r.project === project)
                  .map((r) => r.module)
              ),
            ];
            for (const module of modules) {
              allNodeIds.push(`${project}::${module}`);
            }
          }
        }

        // 레벨 2는 모든 노드 펼치기와 동일 (이미 위에서 처리됨)

        set({
          ui: {
            ...state.ui,
            expandedNodes: allNodeIds,
          },
        });
      },

      resetFilters: () => {
        set({
          ui: {
            ...get().ui,
            searchQuery: "",
            filters: { projects: [], modules: [], features: [], stages: [] },
          },
        });
      },

      setLockState: (lockState) => {
        set({ ui: { ...get().ui, lockState } });
      },

      setEditing: (isEditing) => {
        set({ ui: { ...get().ui, isEditing } });
      },

      // === Undo/Redo ===
      undo: () => {
        const state = get();
        if (state.undoStack.length === 0) return;

        const action = state.undoStack[state.undoStack.length - 1];
        const newUndoStack = state.undoStack.slice(0, -1);
        const newRedoStack = [...state.redoStack, action];

        let newBars = state.bars;
        let newRows = state.rows;

        switch (action.type) {
          case "ADD_BAR":
            newBars = newBars.filter(
              (b) => b.clientUid !== action.bar.clientUid
            );
            break;
          case "UPDATE_BAR":
            newBars = newBars.map((b) =>
              b.clientUid === action.barId ? action.prevBar : b
            );
            break;
          case "DELETE_BAR":
            newBars = newBars.map((b) =>
              b.clientUid === action.bar.clientUid
                ? { ...action.bar, deleted: false }
                : b
            );
            break;
          case "RESTORE_BAR":
            newBars = newBars.map((b) =>
              b.clientUid === action.bar.clientUid
                ? { ...action.bar, deleted: true }
                : b
            );
            break;
          case "ADD_ROW":
            newRows = newRows.filter((r) => r.rowId !== action.row.rowId);
            break;
          case "UPDATE_ROW":
            newRows = newRows.map((r) =>
              r.rowId === action.rowId ? action.prevRow : r
            );
            break;
          case "REORDER_ROWS":
            newRows = action.prevOrder;
            break;
        }

        set({
          bars: newBars,
          rows: newRows,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        });
      },

      redo: () => {
        const state = get();
        if (state.redoStack.length === 0) return;

        const action = state.redoStack[state.redoStack.length - 1];
        const newRedoStack = state.redoStack.slice(0, -1);
        const newUndoStack = [...state.undoStack, action];

        let newBars = state.bars;
        let newRows = state.rows;

        switch (action.type) {
          case "ADD_BAR":
            newBars = [...newBars, action.bar];
            break;
          case "UPDATE_BAR":
            newBars = newBars.map((b) =>
              b.clientUid === action.barId ? action.nextBar : b
            );
            break;
          case "DELETE_BAR":
            newBars = newBars.map((b) =>
              b.clientUid === action.bar.clientUid ? { ...b, deleted: true } : b
            );
            break;
          case "RESTORE_BAR":
            newBars = newBars.map((b) =>
              b.clientUid === action.bar.clientUid
                ? { ...b, deleted: false }
                : b
            );
            break;
          case "ADD_ROW":
            newRows = [...newRows, action.row];
            break;
          case "UPDATE_ROW":
            newRows = newRows.map((r) =>
              r.rowId === action.rowId ? action.nextRow : r
            );
            break;
          case "REORDER_ROWS":
            newRows = action.nextOrder;
            break;
        }

        set({
          bars: newBars,
          rows: newRows,
          undoStack: newUndoStack,
          redoStack: newRedoStack,
        });
      },

      canUndo: () => get().undoStack.length > 0,
      canRedo: () => get().redoStack.length > 0,

      // === 유틸리티 ===
      getDirtyBars: () => get().bars.filter((b) => b.dirty && !b.deleted),
      getDeletedBars: () => get().bars.filter((b) => b.deleted && b.serverId),

      clearDirtyFlags: () => {
        const state = get();
        // 삭제된 bar 중 서버에 반영된 것은 제거
        // dirty 플래그만 false로
        const newBars = state.bars
          .filter((b) => !b.deleted)
          .map((b) => ({ ...b, dirty: false }));

        set({
          bars: newBars,
          undoStack: [],
          redoStack: [],
        });
      },

      hasUnsavedChanges: () => {
        const state = get();
        return state.bars.some((b) => b.dirty);
      },

      discardAllChanges: () => {
        const state = get();

        // 1. 새로 생성된 bar (serverId 없음)는 제거
        // 2. 삭제 표시된 bar는 복원
        // 3. 수정된 bar는 dirty 플래그만 제거 (원본으로 완전 복원은 어려움)
        const newBars = state.bars
          .filter((b) => b.serverId !== undefined) // 새로 생성된 것 제거
          .map((b) => ({
            ...b,
            deleted: false,
            dirty: false,
          }));

        // 새로 생성된 row도 제거
        const newRows = state.rows.filter((r) => !r.isLocal);

        set({
          bars: newBars,
          rows: newRows,
          undoStack: [],
          redoStack: [],
        });
      },
    }),
    {
      name: "gantt-draft-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        rows: state.rows,
        bars: state.bars,
        ui: {
          zoom: state.ui.zoom,
          filters: state.ui.filters,
          searchQuery: state.ui.searchQuery,
        },
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<DraftState> | undefined;
        return {
          ...currentState,
          rows: persisted?.rows ?? currentState.rows,
          bars: persisted?.bars ?? currentState.bars,
          ui: {
            ...currentState.ui,
            zoom: persisted?.ui?.zoom ?? currentState.ui.zoom,
            filters: persisted?.ui?.filters ?? currentState.ui.filters,
            searchQuery:
              persisted?.ui?.searchQuery ?? currentState.ui.searchQuery,
          },
        };
      },
    }
  )
);

/**
 * Store 외부에서 사용할 수 있는 선택자
 */
export const selectFilteredRows = (state: DraftState): DraftRow[] => {
  const { rows, ui } = state;
  const { searchQuery, filters } = ui;

  return rows.filter((row) => {
    // 검색어 필터
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        row.project.toLowerCase().includes(q) ||
        row.module.toLowerCase().includes(q) ||
        row.feature.toLowerCase().includes(q);
      if (!match) return false;
    }

    // 프로젝트 필터
    if (
      filters.projects.length > 0 &&
      !filters.projects.includes(row.project)
    ) {
      return false;
    }

    // 모듈 필터
    if (filters.modules.length > 0 && !filters.modules.includes(row.module)) {
      return false;
    }

    // 기능 필터
    if (
      filters.features.length > 0 &&
      !filters.features.includes(row.feature)
    ) {
      return false;
    }

    return true;
  });
};

export const selectVisibleBars = (state: DraftState): DraftBar[] => {
  const filteredRows = selectFilteredRows(state);
  const rowIds = new Set(filteredRows.map((r) => r.rowId));

  return state.bars.filter((bar) => {
    // 삭제된 bar 제외
    if (bar.deleted) return false;
    // 필터된 row에 속한 bar만
    if (!rowIds.has(bar.rowId)) return false;

    // 스테이지 필터
    const { stages } = state.ui.filters;
    if (stages.length > 0 && !stages.includes(bar.stage)) {
      return false;
    }

    return true;
  });
};
