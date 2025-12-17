import { useMemo } from "react";

/**
 * 간트 차트 레이아웃 상수
 */
export const DAY_WIDTH = 24; // px per day
export const ROW_HEIGHT = 36; // px per row
export const TREE_WIDTH = 280; // px for tree panel

/**
 * 날짜 범위 정보
 */
export interface DateRange {
  start: Date;
  end: Date;
  days: number;
  totalWidth: number;
}

/**
 * 날짜 배열 생성
 */
export function getDaysInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  
  while (current <= endDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
}

/**
 * 월별 그룹 생성
 */
export interface MonthGroup {
  year: number;
  month: number;
  label: string;
  startIndex: number;
  days: number;
  width: number;
}

export function getMonthGroups(days: Date[]): MonthGroup[] {
  if (days.length === 0) return [];
  
  const groups: MonthGroup[] = [];
  let currentGroup: MonthGroup | null = null;
  
  days.forEach((day, index) => {
    const year = day.getFullYear();
    const month = day.getMonth();
    
    if (!currentGroup || currentGroup.year !== year || currentGroup.month !== month) {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = {
        year,
        month,
        label: `${year}년 ${month + 1}월`,
        startIndex: index,
        days: 1,
        width: DAY_WIDTH,
      };
    } else {
      currentGroup.days++;
      currentGroup.width = currentGroup.days * DAY_WIDTH;
    }
  });
  
  if (currentGroup) {
    groups.push(currentGroup);
  }
  
  return groups;
}

/**
 * 날짜를 X 좌표(px)로 변환
 */
export function dateToX(date: Date | string | null, rangeStart: Date): number {
  if (!date) return 0;
  
  const d = typeof date === "string" ? new Date(date) : date;
  const start = new Date(rangeStart);
  start.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  
  const diffTime = d.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays * DAY_WIDTH;
}

/**
 * X 좌표(px)를 날짜로 변환
 */
export function xToDate(x: number, rangeStart: Date): Date {
  const days = Math.floor(x / DAY_WIDTH);
  const result = new Date(rangeStart);
  result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Plan Bar의 위치/크기 계산
 */
export interface BarLayout {
  left: number;
  width: number;
  visible: boolean;
}

export function calculateBarLayout(
  startDate: string | null,
  endDate: string | null,
  rangeStart: Date,
  rangeEnd: Date
): BarLayout {
  if (!startDate || !endDate) {
    return { left: 0, width: 0, visible: false };
  }
  
  const planStart = new Date(startDate);
  const planEnd = new Date(endDate);
  
  // 범위 밖이면 표시 안함
  if (planEnd < rangeStart || planStart > rangeEnd) {
    return { left: 0, width: 0, visible: false };
  }
  
  // 범위 내로 클램핑
  const visibleStart = planStart < rangeStart ? rangeStart : planStart;
  const visibleEnd = planEnd > rangeEnd ? rangeEnd : planEnd;
  
  const left = dateToX(visibleStart, rangeStart);
  const endX = dateToX(visibleEnd, rangeStart) + DAY_WIDTH; // end_date 포함
  const width = Math.max(endX - left, DAY_WIDTH);
  
  return { left, width, visible: true };
}

/**
 * Gantt Layout Hook
 */
export function useGanttLayout(rangeStart: Date, rangeEnd: Date) {
  return useMemo(() => {
    const days = getDaysInRange(rangeStart, rangeEnd);
    const months = getMonthGroups(days);
    const totalWidth = days.length * DAY_WIDTH;
    
    return {
      days,
      months,
      totalWidth,
      dayWidth: DAY_WIDTH,
      rowHeight: ROW_HEIGHT,
      treeWidth: TREE_WIDTH,
      
      // Helper functions
      dateToX: (date: Date | string | null) => dateToX(date, rangeStart),
      xToDate: (x: number) => xToDate(x, rangeStart),
      calculateBarLayout: (startDate: string | null, endDate: string | null) =>
        calculateBarLayout(startDate, endDate, rangeStart, rangeEnd),
    };
  }, [rangeStart, rangeEnd]);
}

/**
 * 날짜 포맷팅
 */
export function formatDate(date: Date): string {
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

/**
 * 날짜를 로컬 YYYY-MM-DD 문자열로 변환 (UTC 변환 문제 방지)
 */
export function formatLocalDateStr(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatDateRange(start: Date, end: Date): string {
  const diffTime = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return `${formatDate(start)} ~ ${formatDate(end)} (${diffDays}일)`;
}

