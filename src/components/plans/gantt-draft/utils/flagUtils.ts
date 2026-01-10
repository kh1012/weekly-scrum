import type { DraftFlag } from "../types";

export type FlagSortType = "name" | "date";

/**
 * 특수 이름 정렬 우선순위
 * Release가 Sprint보다 앞서게
 */
function getFlagNamePriority(title: string): number {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.startsWith("release") || lowerTitle.startsWith("릴리즈"))
    return 0;
  if (lowerTitle.startsWith("sprint") || lowerTitle.startsWith("스프린트"))
    return 1;
  return 2;
}

/**
 * 이름 순 정렬 (Release > Sprint > 기타)
 */
export function sortByName(a: DraftFlag, b: DraftFlag): number {
  const priorityA = getFlagNamePriority(a.title);
  const priorityB = getFlagNamePriority(b.title);

  if (priorityA !== priorityB) return priorityA - priorityB;

  return a.title.localeCompare(b.title, "ko");
}

/**
 * 기간 순 정렬
 */
export function sortByDate(a: DraftFlag, b: DraftFlag): number {
  return a.startDate.localeCompare(b.startDate);
}

/**
 * 두 날짜 범위가 겹치는지 확인
 */
export function isDateRangeOverlapping(
  start1: string,
  end1: string,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  return s1 <= rangeEnd && e1 >= rangeStart;
}
