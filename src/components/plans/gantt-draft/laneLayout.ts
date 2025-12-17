/**
 * Lane 레이아웃 계산
 * - 동일 row의 bars가 겹치면 lane 분리
 * - (startDate asc, duration desc) 정렬 후 가장 위 lane에 배치
 */

import type { DraftBar, BarWithLane, RenderRow, DraftRow } from "./types";

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
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * bars를 lane에 배치
 * - 가장 위(lane=0)부터 시도, 겹치면 다음 lane
 */
export function assignLanesToBars(bars: DraftBar[]): BarWithLane[] {
  if (bars.length === 0) return [];

  // (startDate asc, duration desc) 정렬
  const sorted = [...bars].sort((a, b) => {
    const startCompare = a.startDate.localeCompare(b.startDate);
    if (startCompare !== 0) return startCompare;

    // 동일 시작일이면 기간이 긴 것 먼저
    const durationA = getDuration(a.startDate, a.endDate);
    const durationB = getDuration(b.startDate, b.endDate);
    return durationB - durationA;
  });

  const result: BarWithLane[] = [];
  const lanes: Array<{ end: string }[]> = []; // lanes[laneIdx] = [{end: 'YYYY-MM-DD'}]

  for (const bar of sorted) {
    let assignedLane = -1;

    // 배치 가능한 가장 위 lane 찾기
    for (let lane = 0; lane < lanes.length; lane++) {
      const laneOccupants = lanes[lane];
      const canFit = laneOccupants.every(
        (occupant) => !isOverlapping(bar.startDate, bar.endDate, bar.startDate, occupant.end)
      );

      if (canFit) {
        // 더 정확한 겹침 검사
        const hasOverlap = result
          .filter((r) => r.lane === lane)
          .some((r) => isOverlapping(bar.startDate, bar.endDate, r.startDate, r.endDate));

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

    lanes[assignedLane].push({ end: bar.endDate });
    result.push({ ...bar, lane: assignedLane });
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
    const laneCount = barsWithLane.length > 0 
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
 * 날짜 범위 내에 있는지 확인
 */
export function isBarInRange(
  bar: DraftBar,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  const barStart = new Date(bar.startDate);
  const barEnd = new Date(bar.endDate);
  
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
  const barStart = new Date(bar.startDate);
  const barEnd = new Date(bar.endDate);

  // rangeStart 기준 offset (일 단위)
  const startOffset = Math.floor(
    (barStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
  );
  const endOffset = Math.floor(
    (barEnd.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
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
export function xToDate(
  x: number,
  rangeStart: Date,
  dayWidth: number
): Date {
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

  const originalStart = new Date(bar.startDate);
  const originalEnd = new Date(bar.endDate);

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

  const originalStart = new Date(bar.startDate);
  const originalEnd = new Date(bar.endDate);

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

