/**
 * Draft Undo Store
 * 
 * Undo/Redo 기능 관리
 */

import type { StateCreator } from "zustand";
import type { UndoAction, DraftRow, DraftBar } from "../types";

const MAX_UNDO_STACK = 20;

export interface DraftUndoState {
  undoStack: UndoAction[];
  redoStack: UndoAction[];
}

export interface DraftUndoActions {
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export type DraftUndoStore = DraftUndoState & DraftUndoActions;

const initialUndoState: DraftUndoState = {
  undoStack: [],
  redoStack: [],
};

export const createDraftUndoStore: StateCreator<
  DraftUndoStore & { rows: DraftRow[]; bars: DraftBar[] },
  [],
  [],
  DraftUndoStore
> = (set, get) => ({
  ...initialUndoState,
  
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
});

/**
 * Undo 액션 추가 헬퍼 (스택 제한)
 */
export function pushUndo(state: DraftUndoState, action: UndoAction): Partial<DraftUndoState> {
  const newStack = [...state.undoStack, action];
  if (newStack.length > MAX_UNDO_STACK) {
    newStack.shift();
  }
  return {
    undoStack: newStack,
    redoStack: [],
  };
}
