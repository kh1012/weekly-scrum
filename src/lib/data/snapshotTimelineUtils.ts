/**
 * Snapshot Timeline 유틸리티
 * 
 * - Week Axis 생성
 * - Meta 그룹핑
 * - 연속성 화살표 계산
 */

import type { SnapshotTimelineEntry } from "./mySnapshotTimeline";

/**
 * 주차 축 항목
 */
export interface WeekAxisItem {
  year: number;
  week: string; // W01, W02, ...
  weekKey: string; // YYYY-WXX
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string;
  label: string; // 표시용 레이블
}

/**
 * Meta 그룹 (domain/project/module/feature 조합)
 */
export interface MetaGroup {
  metaKey: string; // domain/project/module/feature
  domain: string;
  project: string;
  module: string | null;
  feature: string;
  /** 주차별 엔트리 맵 (weekKey -> entries) */
  entriesByWeek: Map<string, SnapshotTimelineEntry[]>;
  /** 최초 등장 주차 (정렬용) */
  firstWeekKey: string;
  /** 최근 등장 주차 */
  lastWeekKey: string;
  /** 총 엔트리 수 */
  totalCount: number;
}

/**
 * 연속성 화살표
 */
export interface ContinuityArrow {
  metaKey: string;
  fromWeekKey: string;
  toWeekKey: string;
  /** 화살표 타입: normal (연속), gap (주차 간격 있음) */
  type: "normal" | "gap";
  /** 간격이 있는 경우 주차 수 */
  gapWeeks?: number;
}

/**
 * 주차 키 생성 (YYYY-WXX)
 */
function createWeekKey(year: number, week: string): string {
  return `${year}-${week}`;
}

/**
 * Meta 키 생성 (domain/project/module/feature)
 */
function createMetaKey(entry: {
  domain: string;
  project: string;
  module: string | null;
  feature: string;
}): string {
  const parts = [entry.domain, entry.project];
  if (entry.module) parts.push(entry.module);
  parts.push(entry.feature);
  return parts.join("/");
}

/**
 * Week Axis 생성
 * 
 * @param entries 스냅샷 엔트리 배열
 * @returns 주차 축 배열 (시간 순서대로 정렬)
 */
export function buildWeekAxis(entries: SnapshotTimelineEntry[]): WeekAxisItem[] {
  const weekMap = new Map<string, WeekAxisItem>();

  for (const entry of entries) {
    const weekKey = createWeekKey(entry.year, entry.week);
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        year: entry.year,
        week: entry.week,
        weekKey,
        weekStartDate: entry.weekStartDate,
        weekEndDate: entry.weekEndDate,
        label: `${entry.year} ${entry.week}`,
      });
    }
  }

  // 시간 순서대로 정렬
  const weeks = Array.from(weekMap.values()).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    const aWeekNum = parseInt(a.week.replace("W", ""), 10);
    const bWeekNum = parseInt(b.week.replace("W", ""), 10);
    return aWeekNum - bWeekNum;
  });

  return weeks;
}

/**
 * Meta별로 엔트리 그룹핑
 * 
 * @param entries 스냅샷 엔트리 배열
 * @returns Meta 그룹 배열 (최근 활동순으로 정렬)
 */
export function groupEntriesByMeta(entries: SnapshotTimelineEntry[]): MetaGroup[] {
  const metaMap = new Map<string, MetaGroup>();

  for (const entry of entries) {
    const metaKey = createMetaKey(entry);
    const weekKey = createWeekKey(entry.year, entry.week);

    if (!metaMap.has(metaKey)) {
      metaMap.set(metaKey, {
        metaKey,
        domain: entry.domain,
        project: entry.project,
        module: entry.module,
        feature: entry.feature,
        entriesByWeek: new Map(),
        firstWeekKey: weekKey,
        lastWeekKey: weekKey,
        totalCount: 0,
      });
    }

    const group = metaMap.get(metaKey)!;
    
    if (!group.entriesByWeek.has(weekKey)) {
      group.entriesByWeek.set(weekKey, []);
    }
    
    group.entriesByWeek.get(weekKey)!.push(entry);
    group.totalCount++;

    // firstWeekKey / lastWeekKey 업데이트
    if (compareWeekKeys(weekKey, group.firstWeekKey) < 0) {
      group.firstWeekKey = weekKey;
    }
    if (compareWeekKeys(weekKey, group.lastWeekKey) > 0) {
      group.lastWeekKey = weekKey;
    }
  }

  // 최근 활동순 → 총 엔트리 수 내림차순으로 정렬
  const groups = Array.from(metaMap.values()).sort((a, b) => {
    // 1. 최근 활동 우선
    const cmp = compareWeekKeys(b.lastWeekKey, a.lastWeekKey);
    if (cmp !== 0) return cmp;
    // 2. 총 엔트리 수 내림차순
    return b.totalCount - a.totalCount;
  });

  return groups;
}

/**
 * 주차 키 비교 (YYYY-WXX 형식)
 * 
 * @returns -1 (a < b), 0 (a === b), 1 (a > b)
 */
function compareWeekKeys(a: string, b: string): number {
  const parseWeek = (key: string) => {
    const match = key.match(/^(\d{4})-W(\d{2})$/);
    if (!match) throw new Error(`Invalid week key: ${key}`);
    return { year: parseInt(match[1], 10), week: parseInt(match[2], 10) };
  };

  const aParsed = parseWeek(a);
  const bParsed = parseWeek(b);

  if (aParsed.year !== bParsed.year) {
    return aParsed.year - bParsed.year;
  }
  return aParsed.week - bParsed.week;
}

/**
 * 연속성 화살표 계산
 * 
 * @param group Meta 그룹
 * @param weekAxis 주차 축 (전체)
 * @returns 화살표 배열
 */
export function computeArrows(group: MetaGroup, weekAxis: WeekAxisItem[]): ContinuityArrow[] {
  const arrows: ContinuityArrow[] = [];

  // 그룹이 등장하는 주차들만 추출
  const presentWeeks = weekAxis.filter((week) =>
    group.entriesByWeek.has(week.weekKey)
  );

  if (presentWeeks.length <= 1) {
    // 1개 이하의 주차에만 존재하면 화살표 없음
    return arrows;
  }

  // 인접한 주차 간 화살표 생성
  for (let i = 0; i < presentWeeks.length - 1; i++) {
    const fromWeek = presentWeeks[i];
    const toWeek = presentWeeks[i + 1];

    // 전체 주차 축에서 두 주차 사이의 간격 계산
    const fromIdx = weekAxis.findIndex((w) => w.weekKey === fromWeek.weekKey);
    const toIdx = weekAxis.findIndex((w) => w.weekKey === toWeek.weekKey);
    const gap = toIdx - fromIdx;

    arrows.push({
      metaKey: group.metaKey,
      fromWeekKey: fromWeek.weekKey,
      toWeekKey: toWeek.weekKey,
      type: gap === 1 ? "normal" : "gap",
      gapWeeks: gap > 1 ? gap - 1 : undefined,
    });
  }

  return arrows;
}

/**
 * 모든 Meta 그룹의 화살표 계산
 * 
 * @param groups Meta 그룹 배열
 * @param weekAxis 주차 축
 * @returns 전체 화살표 배열
 */
export function computeAllArrows(
  groups: MetaGroup[],
  weekAxis: WeekAxisItem[]
): ContinuityArrow[] {
  const allArrows: ContinuityArrow[] = [];

  for (const group of groups) {
    const arrows = computeArrows(group, weekAxis);
    allArrows.push(...arrows);
  }

  return allArrows;
}

