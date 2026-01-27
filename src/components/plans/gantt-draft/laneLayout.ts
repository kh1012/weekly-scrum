/**
 * Lane 레이아웃 계산
 * - 동일 row의 bars가 겹치면 lane 분리
 * - (startDate asc, duration desc) 정렬 후 가장 위 lane에 배치
 * - 트리 구조 동기화 지원
 */

import type { DraftBar, BarWithLane, RenderRow, DraftRow } from "./types";

/** 트리 노드 타입 */
export interface FlatTreeNode {
  type: "project" | "module" | "feature";
  id: string;
  label: string;
  depth: number;
  row?: DraftRow;
  bars?: BarWithLane[];
  laneCount: number;
  isExpanded?: boolean;
  /** Feature의 원래 bars 개수 (접기/펼치기 아이콘 표시용) */
  originalBarCount?: number;
  /** 모듈 요약 정보 (Summarized 모드용) */
  summary?: {
    featureCount: number;
    features: string[]; // 기능명 리스트
    startDate: string;
    endDate: string;
    uniqueAssignees: Array<{
      userId: string;
      displayName?: string | null;
      role: string;
    }>;
    uniqueAuthors: Array<{
      userId: string;
      displayName?: string;
    }>;
    avgProgress?: number;
    entryCount: number;
    planCount: number;
    isEntryOnly: boolean;
    isMixed: boolean;
  };
}

/** 행 높이 상수 */
export const ROW_HEIGHT = 48;
export const LANE_HEIGHT = 48;

/**
 * 날짜 문자열을 로컬 Date로 파싱 (시간대 문제 방지)
 * "2025-11-04" 형식을 로컬 시간으로 파싱
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 두 기간이 겹치는지 확인
 */
function isOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 <= end2 && end1 >= start2;
}

/**
 * 기간 일수 계산
 */
function getDuration(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return (
    Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );
}

/**
 * 연속된 스냅샷 엔트리를 병합하는 헬퍼 함수
 * - metaKey + authorId가 같은 엔트리를 그룹화
 * - 각 그룹 내에서 연속된 엔트리를 하나로 병합
 */
function mergeConsecutiveEntries(entryBars: DraftBar[]): DraftBar[] {
  if (entryBars.length === 0) return [];

  // metaKey + authorId로 그룹화
  const groupedByMetaAndAuthor = new Map<string, DraftBar[]>();
  
  for (const bar of entryBars) {
    const metaKey = bar.metaKey || "";
    const authorId = bar.authorId || "unknown";
    const groupKey = `${metaKey}::${authorId}`;
    
    if (!groupedByMetaAndAuthor.has(groupKey)) {
      groupedByMetaAndAuthor.set(groupKey, []);
    }
    groupedByMetaAndAuthor.get(groupKey)!.push(bar);
  }

  const mergedEntries: DraftBar[] = [];

  // 각 그룹별로 연속된 엔트리 병합
  for (const group of groupedByMetaAndAuthor.values()) {
    // startDate 기준 정렬
    const sorted = [...group].sort((a, b) => a.startDate.localeCompare(b.startDate));

    let i = 0;
    while (i < sorted.length) {
      const current = sorted[i];
      const consecutiveEntries = [current];
      let lastEndDate = current.endDate;

      // 연속된 엔트리 찾기
      for (let j = i + 1; j < sorted.length; j++) {
        const next = sorted[j];
        const lastEnd = new Date(lastEndDate);
        const nextStart = new Date(next.startDate);
        
        // 이전 엔트리의 endDate 다음날부터 2일 이내에 시작하면 연속으로 간주
        // (바로 이어지거나 하루 정도 공백만 허용, 1주 건너뛴 경우 제외)
        const daysDiff = Math.ceil((nextStart.getTime() - lastEnd.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff >= 0 && daysDiff <= 2) {
          // 연속된 엔트리
          consecutiveEntries.push(next);
          lastEndDate = next.endDate;
        } else {
          // 연속성 끊김
          break;
        }
      }

      // 연속된 엔트리가 2개 이상이면 병합
      if (consecutiveEntries.length >= 2) {
        const firstEntry = consecutiveEntries[0];
        const lastEntry = consecutiveEntries[consecutiveEntries.length - 1];
        
        const mergedWeeks = consecutiveEntries.map((entry) => ({
          year: entry.year || 0,
          week: entry.week || "",
        }));

        // 병합된 엔트리 생성
        mergedEntries.push({
          ...firstEntry,
          endDate: lastEntry.endDate,
          isMerged: true,
          mergedWeeks,
        });
      } else {
        // 연속되지 않은 단일 엔트리는 그대로 유지
        mergedEntries.push(current);
      }

      i += consecutiveEntries.length;
    }
  }

  return mergedEntries;
}

/**
 * bars를 lane에 배치
 * - preferredLane이 있으면 우선 사용 (겹치지 않으면)
 * - 가장 위(lane=0)부터 시도, 겹치면 다음 lane
 * - 플랜과 엔트리를 분리된 레인에 배치 (플랜 레인 아래에 엔트리 레인)
 */
export function assignLanesToBars(bars: DraftBar[]): BarWithLane[] {
  if (bars.length === 0) return [];

  // 플랜과 엔트리 분리
  const planBars = bars.filter((b) => !b.isSnapshot);
  const entryBars = bars.filter((b) => b.isSnapshot);

  // 엔트리 bars 병합 처리
  const mergedEntryBars = mergeConsecutiveEntries(entryBars);

  // 플랜 bars 처리 (기존 로직)
  const planResult = assignBarsToLanes(planBars, 0);

  // 플랜의 최대 레인 수 계산
  const maxPlanLane = planResult.length > 0 
    ? Math.max(...planResult.map((b) => b.lane)) + 1 
    : 0;

  // 병합된 엔트리 bars 처리 (플랜 레인 수만큼 오프셋)
  const entryResult = assignBarsToLanes(mergedEntryBars, maxPlanLane);

  // 결과 합치기
  return [...planResult, ...entryResult];
}

/**
 * 주어진 bars를 레인에 배치하는 헬퍼 함수
 * @param bars 배치할 bars
 * @param laneOffset 레인 시작 오프셋
 */
function assignBarsToLanes(bars: DraftBar[], laneOffset: number): BarWithLane[] {
  if (bars.length === 0) return [];

  // preferredLane이 있는 bars 먼저 처리, 그 다음 시작일 순
  const sorted = [...bars].sort((a, b) => {
    // preferredLane이 있는 것 우선
    const aHasPreferred = a.preferredLane !== undefined;
    const bHasPreferred = b.preferredLane !== undefined;
    if (aHasPreferred && !bHasPreferred) return -1;
    if (!aHasPreferred && bHasPreferred) return 1;

    // preferredLane 순서
    if (aHasPreferred && bHasPreferred) {
      return (a.preferredLane || 0) - (b.preferredLane || 0);
    }

    // 시작일 순
    const startCompare = a.startDate.localeCompare(b.startDate);
    if (startCompare !== 0) return startCompare;

    // 동일 시작일이면 기간이 긴 것 먼저
    const durationA = getDuration(a.startDate, a.endDate);
    const durationB = getDuration(b.startDate, b.endDate);
    return durationB - durationA;
  });

  const result: BarWithLane[] = [];
  const lanes: Array<{ end: string; start: string }[]> = []; // lanes[laneIdx] = [{start, end}]

  for (const bar of sorted) {
    let assignedLane = -1;

    // preferredLane이 있으면 해당 레인에 배치 시도
    if (bar.preferredLane !== undefined) {
      const preferredLane = bar.preferredLane;

      // 필요한 레인 수만큼 확장
      while (lanes.length <= preferredLane) {
        lanes.push([]);
      }

      // 해당 레인에 겹치는 bar가 있는지 확인
      const hasOverlap = result
        .filter((r) => r.lane === preferredLane)
        .some((r) =>
          isOverlapping(bar.startDate, bar.endDate, r.startDate, r.endDate)
        );

      if (!hasOverlap) {
        assignedLane = preferredLane;
      }
    }

    // preferredLane에 배치 못했으면 빈 레인 찾기
    if (assignedLane === -1) {
      for (let lane = 0; lane < lanes.length; lane++) {
        const hasOverlap = result
          .filter((r) => r.lane === lane)
          .some((r) =>
            isOverlapping(bar.startDate, bar.endDate, r.startDate, r.endDate)
          );

        if (!hasOverlap) {
          assignedLane = lane;
          break;
        }
      }
    }

    // 새 lane 필요
    if (assignedLane === -1) {
      assignedLane = lanes.length;
      lanes.push([]);
    }

    lanes[assignedLane].push({ start: bar.startDate, end: bar.endDate });
    // laneOffset을 적용하여 최종 레인 번호 결정
    result.push({ ...bar, lane: assignedLane + laneOffset });
  }

  return result;
}

/**
 * Row별 bars 그룹핑 + lane 계산
 */
export function buildRenderRows(
  rows: DraftRow[],
  bars: DraftBar[]
): RenderRow[] {
  // rowId별 bars 그룹핑
  const barsByRow = new Map<string, DraftBar[]>();

  for (const bar of bars) {
    if (bar.deleted) continue;

    const existing = barsByRow.get(bar.rowId) || [];
    existing.push(bar);
    barsByRow.set(bar.rowId, existing);
  }

  // 각 row에 대해 lane 계산
  return rows.map((row) => {
    const rowBars = barsByRow.get(row.rowId) || [];
    const barsWithLane = assignLanesToBars(rowBars);
    const laneCount =
      barsWithLane.length > 0
        ? Math.max(...barsWithLane.map((b) => b.lane)) + 1
        : 1;

    return {
      ...row,
      bars: barsWithLane,
      laneCount,
    };
  });
}

/**
 * 트리 구조를 플랫 리스트로 변환 (좌우 동기화용)
 * - expandedNodes: 펼쳐진 노드 ID Set
 * - orderIndex 순서를 유지하여 드래그앤드롭으로 변경한 순서 반영
 */
export function buildFlatTree(
  rows: DraftRow[],
  bars: DraftBar[],
  expandedNodes: Set<string>
): FlatTreeNode[] {
  // rowId별 bars 그룹핑
  const barsByRow = new Map<string, DraftBar[]>();
  for (const bar of bars) {
    if (bar.deleted) continue;
    const existing = barsByRow.get(bar.rowId) || [];
    existing.push(bar);
    barsByRow.set(bar.rowId, existing);
  }

  // orderIndex 순서대로 정렬된 rows 사용 (드래그앤드롭 순서 유지)
  const sortedRows = [...rows].sort((a, b) => a.orderIndex - b.orderIndex);

  // 프로젝트 > 모듈 > 기능 트리 구성 (삽입 순서 유지)
  const projectMap = new Map<string, Map<string, DraftRow[]>>();
  for (const row of sortedRows) {
    if (!projectMap.has(row.project)) {
      projectMap.set(row.project, new Map());
    }
    const moduleMap = projectMap.get(row.project)!;
    if (!moduleMap.has(row.module)) {
      moduleMap.set(row.module, []);
    }
    moduleMap.get(row.module)!.push(row);
  }

  const result: FlatTreeNode[] = [];

  for (const [project, moduleMap] of projectMap) {
    const projectId = project;
    const isProjectExpanded = expandedNodes.has(projectId);

    // 프로젝트 노드
    result.push({
      type: "project",
      id: projectId,
      label: project,
      depth: 0,
      laneCount: 1,
      isExpanded: isProjectExpanded,
    });

    if (!isProjectExpanded) continue;

    for (const [module, features] of moduleMap) {
      const moduleId = `${project}::${module}`;
      const isModuleExpanded = expandedNodes.has(moduleId);

      // 모듈 노드
      result.push({
        type: "module",
        id: moduleId,
        label: module,
        depth: 1,
        laneCount: 1,
        isExpanded: isModuleExpanded,
      });

      if (!isModuleExpanded) continue;

      for (const row of features) {
        const rowId = row.rowId;
        const isFeatureExpanded = expandedNodes.has(rowId);
        const rowBars = barsByRow.get(rowId) || [];
        const originalBarCount = rowBars.length; // 원래 bars 개수 저장
        const barsWithLane = isFeatureExpanded
          ? assignLanesToBars(rowBars)
          : []; // 접혀있으면 bars를 빈 배열로
        const laneCount =
          barsWithLane.length > 0
            ? Math.max(...barsWithLane.map((b) => b.lane)) + 1
            : 1;

        // 기능 노드
        result.push({
          type: "feature",
          id: rowId,
          label: row.feature,
          depth: 2,
          row,
          bars: barsWithLane,
          laneCount,
          isExpanded: isFeatureExpanded,
          originalBarCount, // 원래 bars 개수 저장
        });
      }
    }
  }

  return result;
}

/**
 * FlatTreeNode 리스트에서 각 노드의 Y 위치 계산
 */
export function calculateNodePositions(
  nodes: FlatTreeNode[],
  viewMode: "detailed" | "summarized" = "detailed"
): Array<{ node: FlatTreeNode; top: number; height: number }> {
  const result: Array<{ node: FlatTreeNode; top: number; height: number }> = [];
  let currentTop = 0;

  for (const node of nodes) {
    // feature 노드는 laneCount에 따라 높이 결정
    // project/module 노드는 더 컴팩트한 높이 (20px, 여백 없이)
    // summarized 모드에서 module은 요약 블록 높이에 맞춰 48px (36px bar + 6px top + 6px bottom)
    // feature가 접혀있을 때는 project/module과 동일한 높이 (20px)
    let height: number;
    if (node.type === "feature") {
      // 접혀있으면 프로젝트/모듈과 동일한 높이
      const isCollapsed = node.isExpanded === false;
      height = isCollapsed ? 20 : Math.max(1, node.laneCount) * LANE_HEIGHT;
    } else if (node.type === "module" && viewMode === "summarized") {
      height = 48; // 요약 블록 높이 (36px) + 상하 여백 (12px)
    } else if (node.type === "project" || node.type === "module") {
      height = 20; // 프로젝트/모듈은 더 컴팩트하게 (여백 없이)
    } else {
      height = ROW_HEIGHT;
    }

    result.push({ node, top: currentTop, height });
    currentTop += height;
  }

  return result;
}

/**
 * 날짜 범위 내에 있는지 확인
 */
export function isBarInRange(
  bar: DraftBar,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  const barStart = parseLocalDate(bar.startDate);
  const barEnd = parseLocalDate(bar.endDate);

  // bar가 range와 겹치는지 확인
  return barStart <= rangeEnd && barEnd >= rangeStart;
}

/**
 * bar의 렌더링 위치 계산
 */
export function calculateBarPosition(
  bar: DraftBar,
  rangeStart: Date,
  dayWidth: number
): { left: number; width: number } {
  const barStart = parseLocalDate(bar.startDate);
  const barEnd = parseLocalDate(bar.endDate);

  // rangeStart도 자정으로 정규화하여 비교
  const rangeStartMidnight = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate()
  );

  // rangeStart 기준 offset (일 단위)
  const startOffset = Math.round(
    (barStart.getTime() - rangeStartMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
  const endOffset = Math.round(
    (barEnd.getTime() - rangeStartMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );

  const left = startOffset * dayWidth;
  const width = (endOffset - startOffset + 1) * dayWidth;

  return { left, width };
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 변환
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * X 좌표를 날짜로 변환
 */
export function xToDate(x: number, rangeStart: Date, dayWidth: number): Date {
  const dayOffset = Math.floor(x / dayWidth);
  const result = new Date(rangeStart);
  result.setDate(result.getDate() + dayOffset);
  return result;
}

/**
 * bar 이동 시 새 날짜 계산 (기간 유지)
 */
export function calculateMovedDates(
  bar: DraftBar,
  deltaX: number,
  rangeStart: Date,
  dayWidth: number
): { startDate: string; endDate: string } {
  const daysDelta = Math.round(deltaX / dayWidth);

  const originalStart = parseLocalDate(bar.startDate);
  const originalEnd = parseLocalDate(bar.endDate);

  const newStart = new Date(originalStart);
  newStart.setDate(newStart.getDate() + daysDelta);

  const newEnd = new Date(originalEnd);
  newEnd.setDate(newEnd.getDate() + daysDelta);

  return {
    startDate: formatDate(newStart),
    endDate: formatDate(newEnd),
  };
}

/**
 * bar 리사이즈 시 새 날짜 계산
 */
export function calculateResizedDates(
  bar: DraftBar,
  edge: "start" | "end",
  deltaX: number,
  rangeStart: Date,
  dayWidth: number
): { startDate: string; endDate: string } {
  const daysDelta = Math.round(deltaX / dayWidth);

  const originalStart = parseLocalDate(bar.startDate);
  const originalEnd = parseLocalDate(bar.endDate);

  let newStart = new Date(originalStart);
  let newEnd = new Date(originalEnd);

  if (edge === "start") {
    newStart.setDate(newStart.getDate() + daysDelta);
    // 최소 1일 보장
    if (newStart >= newEnd) {
      newStart = new Date(newEnd);
      newStart.setDate(newStart.getDate() - 1);
    }
  } else {
    newEnd.setDate(newEnd.getDate() + daysDelta);
    // 최소 1일 보장
    if (newEnd <= newStart) {
      newEnd = new Date(newStart);
      newEnd.setDate(newEnd.getDate() + 1);
    }
  }

  return {
    startDate: formatDate(newStart),
    endDate: formatDate(newEnd),
  };
}

/**
 * 프로젝트/모듈 노드의 하위 feature들의 bars에서 전체 기간 범위 계산
 * - flatNodes 기반이 아닌 전체 rows/bars 기반으로 계산 (접힌 노드도 포함)
 * @param node 프로젝트 또는 모듈 노드
 * @param allRows 전체 rows
 * @param allBars 전체 bars (삭제되지 않은 것만)
 * @returns { minStart, maxEnd } 또는 null (bars가 없는 경우)
 */
export function getNodeDateRange(
  node: FlatTreeNode,
  allRows: DraftRow[],
  allBars: DraftBar[]
): { minStart: string; maxEnd: string } | null {
  // 프로젝트/모듈/기능에 해당하는 rowIds 찾기
  const matchingRowIds: string[] = [];

  for (const row of allRows) {
    if (node.type === "project" && row.project === node.label) {
      matchingRowIds.push(row.rowId);
    } else if (node.type === "module") {
      // 모듈 ID 형식: "프로젝트::모듈"
      const [project, module] = node.id.split("::");
      if (row.project === project && row.module === module) {
        matchingRowIds.push(row.rowId);
      }
    } else if (node.type === "feature") {
      // 기능 ID 형식: "프로젝트::모듈::기능"
      const [project, module, feature] = node.id.split("::");
      if (
        row.project === project &&
        row.module === module &&
        row.feature === feature
      ) {
        matchingRowIds.push(row.rowId);
      }
    }
  }

  if (matchingRowIds.length === 0) return null;

  // 해당 rows의 bars에서 범위 추출
  let minStart: string | null = null;
  let maxEnd: string | null = null;

  for (const bar of allBars) {
    if (!matchingRowIds.includes(bar.rowId)) continue;
    if (bar.deleted) continue;

    if (!minStart || bar.startDate < minStart) {
      minStart = bar.startDate;
    }
    if (!maxEnd || bar.endDate > maxEnd) {
      maxEnd = bar.endDate;
    }
  }

  if (!minStart || !maxEnd) return null;

  return { minStart, maxEnd };
}

/**
 * Summarized 모드용 트리 생성
 * - 프로젝트 → 모듈까지만 표시
 * - 각 모듈 노드에 요약 정보 포함
 */
export function buildSummarizedTree(
  rows: DraftRow[],
  bars: DraftBar[],
  expandedProjects: Set<string>
): FlatTreeNode[] {
  // rowId별 bars 그룹핑
  const barsByRow = new Map<string, DraftBar[]>();
  for (const bar of bars) {
    if (bar.deleted) continue;
    const existing = barsByRow.get(bar.rowId) || [];
    existing.push(bar);
    barsByRow.set(bar.rowId, existing);
  }

  // orderIndex 순서대로 정렬된 rows 사용
  const sortedRows = [...rows].sort((a, b) => a.orderIndex - b.orderIndex);

  // 프로젝트 > 모듈 트리 구성
  const projectMap = new Map<string, Map<string, DraftRow[]>>();
  for (const row of sortedRows) {
    if (!projectMap.has(row.project)) {
      projectMap.set(row.project, new Map());
    }
    const moduleMap = projectMap.get(row.project)!;
    if (!moduleMap.has(row.module)) {
      moduleMap.set(row.module, []);
    }
    moduleMap.get(row.module)!.push(row);
  }

  const result: FlatTreeNode[] = [];

  for (const [project, moduleMap] of projectMap) {
    const projectId = project;
    // Summarized 모드에서는 모든 프로젝트를 펼친 상태로 표시
    const isProjectExpanded = true;

    // 프로젝트 노드
    result.push({
      type: "project",
      id: projectId,
      label: project,
      depth: 0,
      laneCount: 1,
      isExpanded: isProjectExpanded,
    });

    // isProjectExpanded는 항상 true이므로 continue 불필요

    for (const [module, features] of moduleMap) {
      const moduleId = `${project}::${module}`;

      // 모듈별 요약 정보 계산
      let minStartDate: string | null = null;
      let maxEndDate: string | null = null;
      const featureCount = features.length;
      const featureNames: string[] = [];
      const assigneeSet = new Map<
        string,
        { userId: string; displayName?: string | null; role: string }
      >();
      const authorSet = new Map<
        string,
        { userId: string; displayName?: string }
      >();
      
      // 진행률 및 entry/plan 카운트
      let progressSum = 0;
      let progressCount = 0;
      let entryCount = 0;
      let planCount = 0;

      for (const row of features) {
        // 기능명 수집
        featureNames.push(row.feature);

        const rowBars = barsByRow.get(row.rowId) || [];
        for (const bar of rowBars) {
          // 날짜 범위
          if (!minStartDate || bar.startDate < minStartDate) {
            minStartDate = bar.startDate;
          }
          if (!maxEndDate || bar.endDate > maxEndDate) {
            maxEndDate = bar.endDate;
          }

          // entry/plan 카운트
          if (bar.isSnapshot) {
            entryCount++;
            
            // entry 작성자 수집
            if (bar.authorId) {
              if (!authorSet.has(bar.authorId)) {
                authorSet.set(bar.authorId, {
                  userId: bar.authorId,
                  displayName: bar.authorName,
                });
              }
            }
            
            // 진행률 수집
            if (bar.avgProgress !== undefined && bar.avgProgress !== null) {
              progressSum += bar.avgProgress;
              progressCount++;
            }
          } else {
            planCount++;
          }

          // 담당자 수집 (중복 제거)
          for (const assignee of bar.assignees) {
            if (!assigneeSet.has(assignee.userId)) {
              assigneeSet.set(assignee.userId, {
                userId: assignee.userId,
                displayName: assignee.displayName,
                role: assignee.role,
              });
            }
          }
        }
      }

      // 평균 진행률 계산
      const avgProgress = progressCount > 0 ? progressSum / progressCount : undefined;
      const isEntryOnly = entryCount > 0 && planCount === 0;
      const isMixed = entryCount > 0 && planCount > 0;

      // 모듈 노드 (요약 정보 포함)
      result.push({
        type: "module",
        id: moduleId,
        label: module,
        depth: 1,
        laneCount: 1,
        isExpanded: false, // Summarized 모드에서는 항상 접힌 상태
        summary: {
          featureCount,
          features: featureNames,
          startDate: minStartDate || "",
          endDate: maxEndDate || "",
          uniqueAssignees: Array.from(assigneeSet.values()),
          uniqueAuthors: Array.from(authorSet.values()),
          avgProgress,
          entryCount,
          planCount,
          isEntryOnly,
          isMixed,
        },
      });
    }
  }

  return result;
}
