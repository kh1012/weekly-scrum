/**
 * Flag Lane Packing Layout
 * - 겹치는 flags를 여러 서브 레인에 자동 배치
 * - Greedy 알고리즘 사용
 */

import type { DraftFlag, PackedFlagLaneItem, ISODate } from "./types";

/**
 * 날짜를 rangeStart 기준 dayIndex로 변환
 */
function dateToDayIndex(dateStr: ISODate, rangeStart: Date): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const rangeStartMidnight = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate()
  );
  return Math.round(
    (date.getTime() - rangeStartMidnight.getTime()) / (1000 * 60 * 60 * 24)
  );
}

/**
 * Point flag인지 확인 (startDate === endDate)
 */
export function isPointFlag(flag: DraftFlag): boolean {
  return flag.startDate === flag.endDate;
}

/**
 * Flag들을 Lane에 packing
 *
 * 알고리즘 (greedy):
 * 1. flags를 startDate asc → endDate asc → orderIndex asc → clientId asc 정렬
 * 2. 각 flag에 대해:
 *    - 첫 번째로 빈 lane 찾기 (laneEndIndex < flag.startIndex)
 *    - 없으면 새 lane 생성
 *    - laneEndIndex 업데이트
 *
 * @returns { laneCount, items }
 */
export function packFlagsIntoLanes(args: {
  flags: DraftFlag[];
  rangeStart: Date;
  rangeEnd: Date;
  dayWidth: number;
}): {
  laneCount: number;
  items: PackedFlagLaneItem[];
} {
  const { flags, rangeStart, rangeEnd, dayWidth } = args;

  // deleted flags는 제외
  const activeFlags = flags.filter((f) => !f.deleted);

  if (activeFlags.length === 0) {
    return { laneCount: 0, items: [] };
  }

  // rangeEnd의 dayIndex 계산 (clamping용)
  const rangeEndIndex = dateToDayIndex(
    `${rangeEnd.getFullYear()}-${String(rangeEnd.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(rangeEnd.getDate()).padStart(2, "0")}`,
    rangeStart
  );

  // activeFlags 정렬: orderIndex asc → clientId asc (사용자 의도 기반 순서)
  // 기존의 startDate/endDate 기반 정렬 규칙 제거 - 사용자가 드래그로 순서 조정 가능
  const sorted = [...activeFlags].sort((a, b) => {
    const orderCompare = a.orderIndex - b.orderIndex;
    if (orderCompare !== 0) return orderCompare;

    return a.clientId.localeCompare(b.clientId);
  });

  // 각 레인의 마지막 점유 endIndex를 추적
  const laneEndIndices: number[] = [];
  const items: PackedFlagLaneItem[] = [];

  for (const flag of sorted) {
    // dayIndex 계산 (clamping 포함)
    let startIndex = dateToDayIndex(flag.startDate, rangeStart);
    let endIndex = dateToDayIndex(flag.endDate, rangeStart);

    // 범위 밖이면 skip (완전히 범위 밖인 경우)
    if (endIndex < 0 || startIndex > rangeEndIndex) {
      continue;
    }

    // Clamping: 가시 범위에 맞게 조정
    startIndex = Math.max(0, startIndex);
    endIndex = Math.min(rangeEndIndex, endIndex);

    // 빈 lane 찾기 (laneEndIndex < startIndex - 1)
    // Point flag도 공간 필요하므로 startIndex와 같은 날에 끝나는 것은 겹침
    let assignedLane = -1;
    for (let lane = 0; lane < laneEndIndices.length; lane++) {
      if (laneEndIndices[lane] < startIndex) {
        assignedLane = lane;
        break;
      }
    }

    // 새 lane 필요
    if (assignedLane === -1) {
      assignedLane = laneEndIndices.length;
      laneEndIndices.push(-1); // 초기값
    }

    // laneEndIndex 업데이트
    laneEndIndices[assignedLane] = endIndex;

    // 픽셀 계산
    const startX = startIndex * dayWidth;
    const endX = (endIndex + 1) * dayWidth;
    const width = endX - startX;
    const isPoint = flag.startDate === flag.endDate;

    items.push({
      flagId: flag.clientId,
      laneIndex: assignedLane,
      startDate: flag.startDate,
      endDate: flag.endDate,
      startX,
      width,
      isPoint,
    });
  }

  return {
    laneCount: laneEndIndices.length,
    items,
  };
}

/**
 * Flag Lane 높이 상수
 */
export const FLAG_LANE_HEIGHT = 24;
