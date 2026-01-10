/**
 * Draft Store for Gantt View
 * 
 * 5개의 독립적인 store slice로 분리됨:
 * - draftDataStore: rows/bars 데이터 관리
 * - draftUIStore: UI 상태 관리
 * - draftFlagStore: flag 관리
 * - draftUndoStore: undo/redo 관리
 * 
 * 이 파일은 하위 호환성을 위해 re-export만 담당
 */

import type { DraftState, DraftRow, DraftBar } from "./types";

// Main store re-export
export { useDraftStore, createRowId, pushUndo } from "./stores";
export type { DraftStore } from "./stores";

// Types re-export
export type {
  DraftDataStore,
  DraftDataActions,
  DraftUIStore,
  DraftUIActions,
  DraftFlagStore,
  DraftFlagActions,
  DraftUndoStore,
  DraftUndoActions,
} from "./stores";

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
    const { stages, assignees } = state.ui.filters;
    if (stages.length > 0 && !stages.includes(bar.stage)) {
      return false;
    }

    // 담당자 필터 (assignees 배열에 선택된 userId가 포함되어 있는지 확인)
    if (assignees.length > 0) {
      const barAssigneeIds = bar.assignees.map((a) => a.userId);
      const hasMatchingAssignee = assignees.some((userId) =>
        barAssigneeIds.includes(userId)
      );
      if (!hasMatchingAssignee) {
        return false;
      }
    }

    return true;
  });
};
