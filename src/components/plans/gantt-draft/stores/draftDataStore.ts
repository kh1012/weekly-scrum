/**
 * Draft Data Store
 *
 * Rows와 Bars 데이터 관리를 담당
 */

import type { StateCreator } from "zustand";
import type {
  DraftState,
  DraftRow,
  DraftBar,
  PlanStatus,
  DraftAssignee,
  PlanLink,
  UndoAction,
} from "../types";
import { buildFilterIndex } from "../filterCache";

export interface DraftDataState {
  rows: DraftRow[];
  bars: DraftBar[];
  filterIndex?: ReturnType<typeof buildFilterIndex>;
}

export interface DraftDataActions {
  // 초기화/동기화
  hydrate: (rows: DraftRow[], bars: DraftBar[]) => void;
  reset: () => void;
  updateLastSyncAt: () => void;

  // Row 관리
  addRow: (
    project: string,
    module: string,
    feature: string,
    domain?: string,
  ) => DraftRow;
  updateRow: (rowId: string, updates: Partial<Omit<DraftRow, "rowId">>) => void;
  deleteRow: (rowId: string) => void;
  reorderRows: (newOrder: string[]) => void;
  renameNode: (
    type: "project" | "module" | "feature",
    oldName: string,
    newName: string,
    parentProject?: string,
    parentModule?: string,
  ) => void;

  // Bar 관리
  addBar: (params: {
    rowId: string;
    title: string;
    stage: string;
    status: PlanStatus;
    startDate: string;
    endDate: string;
    assignees?: DraftAssignee[];
    description?: string;
    links?: PlanLink[];
    serverId?: string;
    preferredLane?: number;
  }) => DraftBar;
  updateBar: (
    clientUid: string,
    updates: Partial<Omit<DraftBar, "clientUid" | "rowId">>,
  ) => void;
  deleteBar: (clientUid: string) => void;
  restoreBar: (clientUid: string) => void;
  moveBar: (
    clientUid: string,
    newStartDate: string,
    newEndDate: string,
  ) => void;
  resizeBar: (clientUid: string, startDate: string, endDate: string) => void;
  duplicateBar: (clientUid: string) => DraftBar | null;
  moveBarToRow: (
    clientUid: string,
    targetProject: string,
    targetModule: string,
    targetFeature: string,
    targetDomain?: string,
  ) => void;

  // 유틸리티
  getDirtyBars: () => DraftBar[];
  getDeletedBars: () => DraftBar[];
  clearDirtyFlags: () => void;
  hasUnsavedChanges: () => boolean;
  discardAllChanges: () => void;
}

export type DraftDataStore = DraftDataState & DraftDataActions;

export function createRowId(
  project: string,
  module: string,
  feature: string,
): string {
  return `${project}::${module}::${feature}`;
}

const initialDataState: DraftDataState = {
  rows: [],
  bars: [],
  filterIndex: undefined,
};

export const createDraftDataStore: StateCreator<
  DraftDataStore & {
    ui: { expandedNodes: string[]; lastSyncAt?: string };
    undoStack: UndoAction[];
    redoStack: UndoAction[];
  },
  [],
  [],
  DraftDataStore
> = (set, get) => ({
  ...initialDataState,

  hydrate: (rows, bars) => {
    const filterIndex = buildFilterIndex(bars, rows);
    set({
      rows,
      bars,
      filterIndex,
      undoStack: [],
      redoStack: [],
    });
  },

  reset: () => {
    set(initialDataState);
  },

  updateLastSyncAt: () => {
    set({
      ui: {
        ...get().ui,
        lastSyncAt: new Date().toISOString(),
      },
    });
  },

  addRow: (project, module, feature, domain) => {
    const state = get();
    const rowId = createRowId(project, module, feature);

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
      isLocal: true,
    };

    const projectId = project;
    const moduleId = `${project}::${module}`;
    const currentExpanded = state.ui.expandedNodes;
    const newExpandedNodes = [...currentExpanded];

    // 프로젝트, 모듈, 기능(feature) 모두 펼쳐진 상태로 추가
    if (!newExpandedNodes.includes(projectId)) {
      newExpandedNodes.push(projectId);
    }
    if (!newExpandedNodes.includes(moduleId)) {
      newExpandedNodes.push(moduleId);
    }
    // 새로 생성된 feature도 펼쳐진 상태로 추가 (계획 블록 추가 가능)
    if (!newExpandedNodes.includes(rowId)) {
      newExpandedNodes.push(rowId);
    }

    set({
      rows: [...state.rows, newRow],
      ui: {
        ...state.ui,
        expandedNodes: newExpandedNodes,
      },
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

    set({ rows: newRows });
  },

  deleteRow: (rowId) => {
    const state = get();
    // 1. 해당 rowId를 가진 모든 bars를 deleted로 마킹
    const newBars = state.bars.map((b) =>
      b.rowId === rowId && !b.deleted
        ? {
            ...b,
            deleted: true,
            dirty: true,
            updatedAtLocal: new Date().toISOString(),
          }
        : b,
    );

    // 2. rows 배열에서 해당 rowId를 가진 row 제거
    const newRows = state.rows.filter((r) => r.rowId !== rowId);

    // 3. filterIndex를 새로운 rows와 newBars로 재구성
    const filterIndex = buildFilterIndex(newBars, newRows);

    set({
      bars: newBars,
      rows: newRows,
      filterIndex,
    });
  },

  reorderRows: (newOrder) => {
    const state = get();
    const prevOrder = [...state.rows];
    const changedRowIds = new Set<string>();

    const reordered = newOrder
      .map((rowId, idx) => {
        const row = state.rows.find((r) => r.rowId === rowId);
        if (!row) return null;

        if (row.orderIndex !== idx) {
          changedRowIds.add(rowId);
        }

        return { ...row, orderIndex: idx };
      })
      .filter((r): r is DraftRow => r !== null);

    const newBars = state.bars.map((bar) => {
      if (changedRowIds.has(bar.rowId) && !bar.deleted) {
        return { ...bar, dirty: true };
      }
      return bar;
    });

    set({
      rows: reordered,
      bars: newBars,
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
        updated.rowId = createRowId(
          updated.project,
          updated.module,
          updated.feature,
        );
      }

      return shouldUpdate ? updated : row;
    });

    const oldToNewRowId = new Map<string, string>();
    state.rows.forEach((oldRow, idx) => {
      const newRow = newRows[idx];
      if (oldRow.rowId !== newRow.rowId) {
        oldToNewRowId.set(oldRow.rowId, newRow.rowId);
      }
    });

    const newBars = state.bars.map((bar) => {
      const newRowId = oldToNewRowId.get(bar.rowId);
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

    const filterIndex = buildFilterIndex(newBars, newRows);

    set({
      rows: newRows,
      bars: newBars,
      filterIndex,
    });
  },

  addBar: (params) => {
    const state = get();
    const now = new Date().toISOString();

    const newBar: DraftBar = {
      clientUid: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      rowId: params.rowId,
      title: params.title,
      stage: params.stage,
      status: params.status,
      startDate: params.startDate,
      endDate: params.endDate,
      assignees: params.assignees ?? [],
      description: params.description,
      links: params.links,
      serverId: params.serverId,
      preferredLane: params.preferredLane,
      dirty: !params.serverId,
      deleted: false,
      createdAtLocal: now,
      updatedAtLocal: now,
    };

    set({
      bars: [...state.bars, newBar],
    });

    return newBar;
  },

  updateBar: (clientUid, updates) => {
    const state = get();
    const barIndex = state.bars.findIndex((b) => b.clientUid === clientUid);
    if (barIndex === -1) return;

    const prevBar = state.bars[barIndex];
    const nextBar = {
      ...prevBar,
      ...updates,
      dirty: true,
      updatedAtLocal: new Date().toISOString(),
    };

    const newBars = [...state.bars];
    newBars[barIndex] = nextBar;

    set({ bars: newBars });
  },

  deleteBar: (clientUid) => {
    const state = get();
    const bar = state.bars.find((b) => b.clientUid === clientUid);
    if (!bar || bar.deleted) return;

    let newBars: DraftBar[];

    // 서버에 저장되지 않은 임시 데이터는 완전히 제거
    // 서버에 저장된 데이터는 deleted: true로 표시
    if (!bar.serverId) {
      // 임시 데이터: 배열에서 완전히 제거
      newBars = state.bars.filter((b) => b.clientUid !== clientUid);
    } else {
      // 서버 데이터: deleted 플래그 설정
      newBars = state.bars.map((b) =>
        b.clientUid === clientUid
          ? {
              ...b,
              deleted: true,
              dirty: true,
              updatedAtLocal: new Date().toISOString(),
            }
          : b,
      );
    }

    const filterIndex = buildFilterIndex(newBars, state.rows);

    set({
      bars: newBars,
      filterIndex,
    });
  },

  restoreBar: (clientUid) => {
    const state = get();
    const bar = state.bars.find((b) => b.clientUid === clientUid && b.deleted);
    if (!bar) return;

    const newBars = state.bars.map((b) =>
      b.clientUid === clientUid
        ? {
            ...b,
            deleted: false,
            dirty: true,
            updatedAtLocal: new Date().toISOString(),
          }
        : b,
    );

    const filterIndex = buildFilterIndex(newBars, state.rows);

    set({
      bars: newBars,
      filterIndex,
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
      (b) => b.clientUid === clientUid && !b.deleted,
    );
    if (!sourceBar) return null;

    const sourceStart = new Date(sourceBar.startDate);
    const sourceEnd = new Date(sourceBar.endDate);
    const duration = sourceEnd.getTime() - sourceStart.getTime();

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
      description: sourceBar.description,
      links: sourceBar.links ? [...sourceBar.links] : undefined,
      preferredLane: sourceBar.preferredLane,
      dirty: true,
      deleted: false,
      createdAtLocal: new Date().toISOString(),
      updatedAtLocal: new Date().toISOString(),
    };

    set({
      bars: [...state.bars, newBar],
    });

    return newBar;
  },

  moveBarToRow: (
    clientUid,
    targetProject,
    targetModule,
    targetFeature,
    targetDomain,
  ) => {
    const state = get();
    const barIndex = state.bars.findIndex((b) => b.clientUid === clientUid);
    if (barIndex === -1) return;

    const prevBar = state.bars[barIndex];
    const newRowId = createRowId(targetProject, targetModule, targetFeature);

    if (prevBar.rowId === newRowId) return;

    let newRows = [...state.rows];
    const targetRowExists = state.rows.some((r) => r.rowId === newRowId);

    if (!targetRowExists) {
      const maxOrderIndex = Math.max(0, ...state.rows.map((r) => r.orderIndex));
      const newRow: DraftRow = {
        rowId: newRowId,
        project: targetProject,
        module: targetModule,
        feature: targetFeature,
        domain: targetDomain,
        orderIndex: maxOrderIndex + 1,
        isLocal: true,
      };
      newRows = [...newRows, newRow];
    }

    const nextBar: DraftBar = {
      ...prevBar,
      rowId: newRowId,
      dirty: true,
      updatedAtLocal: new Date().toISOString(),
    };

    const newBars = [...state.bars];
    newBars[barIndex] = nextBar;

    set({
      rows: newRows,
      bars: newBars,
    });
  },

  getDirtyBars: () => get().bars.filter((b) => b.dirty && !b.deleted),

  getDeletedBars: () => get().bars.filter((b) => b.deleted && b.serverId),

  clearDirtyFlags: () => {
    const state = get();
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
    return get().bars.some((b) => b.dirty);
  },

  discardAllChanges: () => {
    const state = get();

    const newBars = state.bars
      .filter((b) => b.serverId !== undefined)
      .map((b) => ({
        ...b,
        deleted: false,
        dirty: false,
      }));

    const newRows = state.rows.filter((r) => !r.isLocal);

    set({
      bars: newBars,
      rows: newRows,
      undoStack: [],
      redoStack: [],
    });
  },
});
