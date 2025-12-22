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
 * 알고리즘:
 * 1. laneHint가 있는 flags를 해당 레인에 우선 배치 (충돌 없으면)
 * 2. 나머지 flags는 greedy로 빈 레인 탐색하여 배치
 * 3. 겹치거나 레인 확장이 필요하면 자동으로 레인 생성
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

  // 각 flag의 dayIndex 미리 계산
  type FlagWithRange = {
    flag: DraftFlag;
    startIndex: number;
    endIndex: number;
  };

  const flagsWithRange: FlagWithRange[] = activeFlags
    .map((flag) => {
      let startIndex = dateToDayIndex(flag.startDate, rangeStart);
      let endIndex = dateToDayIndex(flag.endDate, rangeStart);

      // 범위 밖이면 null 반환
      if (endIndex < 0 || startIndex > rangeEndIndex) {
        return null;
      }

      // Clamping: 가시 범위에 맞게 조정
      startIndex = Math.max(0, startIndex);
      endIndex = Math.min(rangeEndIndex, endIndex);

      return { flag, startIndex, endIndex };
    })
    .filter((f): f is FlagWithRange => f !== null);

  // laneHint가 있는 flags와 없는 flags 분리
  const hintsFlags = flagsWithRange.filter((f) => f.flag.laneHint !== undefined);
  const noHintFlags = flagsWithRange.filter((f) => f.flag.laneHint === undefined);

  // 레인별 점유 구간 추적: laneOccupancy[laneIndex] = [{start, end}, ...]
  const laneOccupancy: Array<Array<{ start: number; end: number }>> = [];
  const items: PackedFlagLaneItem[] = [];

  // 특정 레인에 해당 구간이 비어있는지 확인
  const isLaneFree = (laneIndex: number, startIndex: number, endIndex: number): boolean => {
    if (!laneOccupancy[laneIndex]) return true;
    return !laneOccupancy[laneIndex].some(
      (occ) => !(endIndex < occ.start || startIndex > occ.end)
    );
  };

  // 레인에 구간 점유 등록
  const occupyLane = (laneIndex: number, startIndex: number, endIndex: number) => {
    if (!laneOccupancy[laneIndex]) {
      laneOccupancy[laneIndex] = [];
    }
    laneOccupancy[laneIndex].push({ start: startIndex, end: endIndex });
  };

  // flag를 items에 추가
  const addItem = (flagWithRange: FlagWithRange, assignedLane: number) => {
    const { flag, startIndex, endIndex } = flagWithRange;

    occupyLane(assignedLane, startIndex, endIndex);

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
  };

  // 1단계: laneHint가 있는 flags 먼저 배치
  // laneHint 오름차순 정렬 후 배치 (낮은 레인부터)
  const sortedHintFlags = [...hintsFlags].sort(
    (a, b) => (a.flag.laneHint ?? 0) - (b.flag.laneHint ?? 0)
  );

  for (const flagWithRange of sortedHintFlags) {
    const { flag, startIndex, endIndex } = flagWithRange;
    const desiredLane = flag.laneHint ?? 0;

    // 해당 레인이 비어있으면 그대로 배치
    if (isLaneFree(desiredLane, startIndex, endIndex)) {
      addItem(flagWithRange, desiredLane);
    } else {
      // 충돌 시 noHintFlags로 이동하여 greedy 배치
      noHintFlags.push(flagWithRange);
    }
  }

  // 2단계: laneHint 없는 flags를 orderIndex 순서로 greedy 배치
  const sortedNoHintFlags = [...noHintFlags].sort((a, b) => {
    const orderCompare = a.flag.orderIndex - b.flag.orderIndex;
    if (orderCompare !== 0) return orderCompare;
    return a.flag.clientId.localeCompare(b.flag.clientId);
  });

  for (const flagWithRange of sortedNoHintFlags) {
    const { startIndex, endIndex } = flagWithRange;

    // 빈 레인 찾기 (0번부터 순차 탐색)
    let assignedLane = -1;
    for (let lane = 0; lane < laneOccupancy.length; lane++) {
      if (isLaneFree(lane, startIndex, endIndex)) {
        assignedLane = lane;
        break;
      }
    }

    // 모든 기존 레인이 차있으면 새 레인 생성
    if (assignedLane === -1) {
      assignedLane = laneOccupancy.length;
    }

    addItem(flagWithRange, assignedLane);
  }

  // 최종 레인 개수 계산
  const maxLane = items.reduce((max, item) => Math.max(max, item.laneIndex), -1);

  return {
    laneCount: maxLane + 1,
    items,
  };
}

/**
 * Flag Lane 높이 상수
 */
export const FLAG_LANE_HEIGHT = 24;
