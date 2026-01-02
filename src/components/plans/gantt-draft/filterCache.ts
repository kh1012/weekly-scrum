/**
 * Gantt 필터링 성능 최적화를 위한 인덱스 캐시
 * 
 * 페이지 로드 시 필터별 인덱스를 미리 생성하여
 * 필터 변경 시 O(1) 조회로 빠른 필터링 제공
 */

import type { DraftBar, DraftRow } from "./types";

export interface FilterIndex {
  // 스테이지별 bar clientUid Set
  byStage: Map<string, Set<string>>;
  // 담당자별 bar clientUid Set
  byAssignee: Map<string, Set<string>>;
  // rowId별 bar clientUid Set
  byRowId: Map<string, Set<string>>;
  // 프로젝트별 rowId Set
  byProject: Map<string, Set<string>>;
  // 모듈별 rowId Set
  byModule: Map<string, Set<string>>;
  // 기능별 rowId Set
  byFeature: Map<string, Set<string>>;
  // 생성 시각
  createdAt: number;
}

/**
 * bars와 rows로부터 필터 인덱스 생성
 */
export function buildFilterIndex(
  bars: DraftBar[],
  rows: DraftRow[]
): FilterIndex {
  const byStage = new Map<string, Set<string>>();
  const byAssignee = new Map<string, Set<string>>();
  const byRowId = new Map<string, Set<string>>();
  const byProject = new Map<string, Set<string>>();
  const byModule = new Map<string, Set<string>>();
  const byFeature = new Map<string, Set<string>>();

  // Bar 인덱싱 (삭제되지 않은 것만)
  for (const bar of bars) {
    if (bar.deleted) continue;

    const barId = bar.clientUid;

    // 스테이지별 인덱싱
    if (bar.stage) {
      if (!byStage.has(bar.stage)) {
        byStage.set(bar.stage, new Set());
      }
      byStage.get(bar.stage)!.add(barId);
    }

    // 담당자별 인덱싱
    for (const assignee of bar.assignees) {
      if (!byAssignee.has(assignee.userId)) {
        byAssignee.set(assignee.userId, new Set());
      }
      byAssignee.get(assignee.userId)!.add(barId);
    }

    // rowId별 인덱싱
    if (!byRowId.has(bar.rowId)) {
      byRowId.set(bar.rowId, new Set());
    }
    byRowId.get(bar.rowId)!.add(barId);
  }

  // Row 인덱싱
  for (const row of rows) {
    // 프로젝트별
    if (row.project) {
      if (!byProject.has(row.project)) {
        byProject.set(row.project, new Set());
      }
      byProject.get(row.project)!.add(row.rowId);
    }

    // 모듈별
    if (row.module) {
      const key = `${row.project}::${row.module}`;
      if (!byModule.has(key)) {
        byModule.set(key, new Set());
      }
      byModule.get(key)!.add(row.rowId);
    }

    // 기능별
    if (row.feature) {
      const key = `${row.project}::${row.module}::${row.feature}`;
      if (!byFeature.has(key)) {
        byFeature.set(key, new Set());
      }
      byFeature.get(key)!.add(row.rowId);
    }
  }

  return {
    byStage,
    byAssignee,
    byRowId,
    byProject,
    byModule,
    byFeature,
    createdAt: Date.now(),
  };
}

/**
 * 인덱스를 사용한 고속 필터링
 */
export function filterBarsWithIndex(
  bars: DraftBar[],
  index: FilterIndex,
  filters: {
    stages: string[];
    assignees: string[];
  }
): DraftBar[] {
  // 필터가 없으면 삭제되지 않은 모든 bars 반환
  if (filters.stages.length === 0 && filters.assignees.length === 0) {
    return bars.filter((b) => !b.deleted);
  }

  // 각 필터 조건에 맞는 barId Set 생성
  let candidateIds: Set<string> | null = null;

  // 스테이지 필터
  if (filters.stages.length > 0) {
    const stageIds = new Set<string>();
    for (const stage of filters.stages) {
      const ids = index.byStage.get(stage);
      if (ids) {
        ids.forEach((id) => stageIds.add(id));
      }
    }
    candidateIds = stageIds;
  }

  // 담당자 필터
  if (filters.assignees.length > 0) {
    const assigneeIds = new Set<string>();
    for (const assigneeId of filters.assignees) {
      const ids = index.byAssignee.get(assigneeId);
      if (ids) {
        ids.forEach((id) => assigneeIds.add(id));
      }
    }

    // 두 필터의 교집합
    if (candidateIds) {
      candidateIds = new Set(
        [...candidateIds].filter((id) => assigneeIds.has(id))
      );
    } else {
      candidateIds = assigneeIds;
    }
  }

  // 최종 필터링
  if (!candidateIds) {
    return bars.filter((b) => !b.deleted);
  }

  return bars.filter((b) => !b.deleted && candidateIds!.has(b.clientUid));
}

/**
 * 인덱스를 사용한 고속 row 필터링
 */
export function filterRowsWithIndex(
  rows: DraftRow[],
  barsInView: Set<string>, // 필터링된 bar의 clientUid Set
  index: FilterIndex,
  filters: {
    projects: string[];
    modules: string[];
    features: string[];
  },
  searchQuery: string
): DraftRow[] {
  return rows.filter((row) => {
    // 로컬에서 생성된 row는 bars 없이도 표시
    if (!row.isLocal) {
      const rowBars = index.byRowId.get(row.rowId);
      // 필터링된 bars 중 이 row에 속한 것이 있는지 확인
      if (!rowBars || ![...rowBars].some((barId) => barsInView.has(barId))) {
        return false;
      }
    }

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
    if (filters.projects.length > 0 && !filters.projects.includes(row.project)) {
      return false;
    }

    // 모듈 필터
    if (filters.modules.length > 0 && !filters.modules.includes(row.module)) {
      return false;
    }

    // 기능 필터
    if (filters.features.length > 0 && !filters.features.includes(row.feature)) {
      return false;
    }

    return true;
  });
}

