/**
 * Calendar View 타입 정의
 *
 * 주 단위 스냅샷 데이터를 달력 형태로 집계하여
 * 프로젝트/멤버 집중도를 시각화하기 위한 타입들
 */

import type { WeeklyScrumDataUnion, ScrumItemV2, ScrumItem } from "./scrum";

// ========================================
// 기본 타입
// ========================================

/**
 * 캘린더 모드 타입
 * - project: 프로젝트 집중도 뷰
 * - member: 멤버 집중도 뷰
 */
export type CalendarMode = "project" | "member";

/**
 * 주 단위 키
 */
export interface WeekKey {
  year: number;
  weekIndex: number;
}

// ========================================
// Raw Snapshot 입력 타입 (집계용)
// ========================================

/**
 * 집계용 Raw Snapshot 타입
 * 기존 ScrumItemV2를 기반으로 주차 정보 추가
 */
export interface RawSnapshot {
  id: string;
  year: number;
  weekIndex: number;
  weekStart: string; // YYYY-MM-DD
  weekEnd: string; // YYYY-MM-DD
  domain: string;
  project: string; // initiative로 매핑
  module: string;
  feature: string;
  memberName: string;
  pastWeekTasks: { title: string; progress: number }[];
  thisWeekTasks: string[];
}

// ========================================
// 주 단위 집계 모델
// ========================================

/**
 * 프로젝트(이니셔티브) 집계 - 해당 주 기준
 */
export interface InitiativeAggregation {
  initiativeName: string;
  domains: Set<string>;
  modules: Set<string>;
  features: Set<string>;
  members: Set<string>;
  plannedTaskCount: number;
  doneTaskCount: number;
  avgCompletionRate: number; // 0~1
  focusScore: number;
}

/**
 * 멤버 집계 - 해당 주 기준
 */
export interface MemberAggregation {
  memberName: string;
  initiatives: Set<string>;
  domains: Set<string>;
  modules: Set<string>;
  features: Set<string>;
  plannedTaskCount: number;
  doneTaskCount: number;
  avgCompletionRate: number; // 0~1
  focusScore: number;
}

/**
 * 주 단위 집계 모델
 */
export interface WeekAggregation {
  key: WeekKey;
  weekStart: string;
  weekEnd: string;
  initiatives: InitiativeAggregation[];
  members: MemberAggregation[];
  totalInitiativeFocus: number;
  totalMemberFocus: number;
}

// ========================================
// 기간(월/범위) 집계 모델
// ========================================

/**
 * 기간 요약 기본 타입
 */
export interface RangeSummaryBase {
  rangeStart: string;
  rangeEnd: string;
  weekCount: number;
}

/**
 * 프로젝트 집중도 기간 요약 - 개별 프로젝트 정보
 */
export interface ProjectFocusItem {
  initiativeName: string;
  weekCount: number;
  doneTaskCount: number;
  plannedTaskCount: number;
  modules: Set<string>;
  features: Set<string>;
  members: Set<string>;
  focusScore: number;
  avgCompletionRate: number;
}

/**
 * 프로젝트 집중도 기간 요약
 */
export interface ProjectFocusRangeSummary extends RangeSummaryBase {
  mode: "project";
  initiatives: ProjectFocusItem[];
  totalInitiativeCount: number;
  totalModuleCount: number;
  totalFeatureCount: number;
  totalMemberCount: number;
  totalDoneTaskCount: number;
  totalPlannedTaskCount: number;
}

/**
 * 멤버 집중도 기간 요약 - 개별 멤버 정보
 */
export interface MemberFocusItem {
  memberName: string;
  weekCount: number;
  initiatives: Set<string>;
  modules: Set<string>;
  features: Set<string>;
  doneTaskCount: number;
  plannedTaskCount: number;
  focusScore: number;
  avgCompletionRate: number;
}

/**
 * 멤버 집중도 기간 요약
 */
export interface MemberFocusRangeSummary extends RangeSummaryBase {
  mode: "member";
  members: MemberFocusItem[];
  totalMemberCount: number;
  totalInitiativeCount: number;
  totalModuleCount: number;
  totalFeatureCount: number;
  totalDoneTaskCount: number;
  totalPlannedTaskCount: number;
}

// ========================================
// UI 상태 타입
// ========================================

/**
 * Calendar View 상태
 */
export interface CalendarViewState {
  mode: CalendarMode;
  selectedMonth: string; // "YYYY-MM"
  selectedWeek: WeekKey | null;
  selectedInitiative: string | null;
  selectedMember: string | null;
}

// ========================================
// 유틸리티 함수 타입
// ========================================

/**
 * 기존 WeeklyScrumData를 RawSnapshot[]으로 변환하는 함수 타입
 */
export type ConvertToRawSnapshots = (
  weeklyData: WeeklyScrumDataUnion[],
) => RawSnapshot[];

/**
 * Set을 배열로 변환하는 헬퍼 (직렬화용)
 */
export function setToArray<T>(set: Set<T>): T[] {
  return Array.from(set);
}

/**
 * 배열을 Set으로 변환하는 헬퍼
 */
export function arrayToSet<T>(arr: T[]): Set<T> {
  return new Set(arr);
}

// ========================================
// 직렬화 가능한 버전 (JSON 저장/전송용)
// ========================================

/**
 * 직렬화 가능한 InitiativeAggregation
 */
export interface SerializableInitiativeAggregation {
  initiativeName: string;
  domains: string[];
  modules: string[];
  features: string[];
  members: string[];
  plannedTaskCount: number;
  doneTaskCount: number;
  avgCompletionRate: number;
  focusScore: number;
}

/**
 * 직렬화 가능한 MemberAggregation
 */
export interface SerializableMemberAggregation {
  memberName: string;
  initiatives: string[];
  domains: string[];
  modules: string[];
  features: string[];
  plannedTaskCount: number;
  doneTaskCount: number;
  avgCompletionRate: number;
  focusScore: number;
}

