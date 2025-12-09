import type { ScrumItem } from "@/types/scrum";

/**
 * 스냅샷 뷰 모드
 */
export type SnapshotViewMode = "all" | "person" | "compare" | "continuity";

/**
 * 스냅샷 비교 상태
 */
export interface CompareState {
  selectedItems: ScrumItem[];
  isCompareMode: boolean;
}

/**
 * 연속성 상태
 */
export type ContinuityStatus = "connected" | "partial" | "broken" | "unknown";

/**
 * 연속성 분석 결과
 */
export interface ContinuityResult {
  key: string; // domain/project/module/feature 조합 키
  person: string;
  domain: string;
  project: string;
  module: string | null;
  feature: string;
  prevWeek: ScrumItem | null;
  currentWeek: ScrumItem | null;
  nextWeek: ScrumItem | null;
  prevToCurrent: ContinuityStatus;
  currentToNext: ContinuityStatus;
}

/**
 * 스냅샷 그룹 (사람별 그룹화)
 */
export interface PersonGroup {
  name: string;
  items: ScrumItem[];
  domains: string[];
  projects: string[];
}

/**
 * 스냅샷 키 생성 (domain/project/module/feature)
 */
export function createSnapshotKey(item: ScrumItem): string {
  const parts = [item.domain, item.project];
  if (item.module) parts.push(item.module);
  parts.push(item.topic);
  return parts.join("/");
}

/**
 * 연속성 분석
 */
export function analyzeContinuity(
  thisWeekContent: string[],
  pastWeekContent: string[]
): ContinuityStatus {
  if (!thisWeekContent.length || !pastWeekContent.length) {
    return "unknown";
  }

  const thisWeekText = thisWeekContent.join(" ").toLowerCase();
  const pastWeekText = pastWeekContent.join(" ").toLowerCase();

  // 간단한 키워드 매칭
  const thisWeekWords = new Set(
    thisWeekText.split(/\s+/).filter((w) => w.length > 2)
  );
  const pastWeekWords = new Set(
    pastWeekText.split(/\s+/).filter((w) => w.length > 2)
  );

  let matchCount = 0;
  thisWeekWords.forEach((word) => {
    if (pastWeekWords.has(word)) matchCount++;
  });

  const matchRatio = matchCount / Math.max(thisWeekWords.size, 1);

  if (matchRatio >= 0.4) return "connected";
  if (matchRatio >= 0.2) return "partial";
  return "broken";
}

