/**
 * 리스크 레벨 타입 (인사이트용)
 * 0 = 없음 (Light Green)
 * 1 = 경미 (Soft Yellow)
 * 2 = 중간 (Orange)
 * 3 = 심각 (Soft Red)
 */
export type InsightRiskLevel = 0 | 1 | 2 | 3;

/**
 * 리스크 항목 타입
 */
export interface RiskItem {
  item: string; // 리스크 또는 reason 요약
  level: InsightRiskLevel; // 0~3
  action: string; // 필요한 조치
}

/**
 * 실행 갭 항목 타입
 */
export interface ExecutionGapItem {
  name: string; // 담당자 이름
  project: string; // 프로젝트명
  gap: number; // progress - plan (음수는 부족)
  reason: string; // 사유
}

/**
 * 사분면 요약 타입
 */
export interface QuadrantSummaryData {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  explanation: string[]; // 사분면 해석 문장
}

/**
 * 인사이트 데이터 타입
 */
export interface InsightData {
  executiveSummary: string[]; // 3~5개의 핵심 요약 문장
  decisionPoints: string[]; // 의사결정 필요 항목
  risks: RiskItem[]; // 리스크 + 조치 테이블 데이터
  executionGap: ExecutionGapItem[]; // 계획 대비 부족 분석
  quadrantSummary: QuadrantSummaryData; // 사분면 데이터
}

/**
 * 주간 인사이트 데이터 타입
 */
export interface WeeklyInsightData {
  year: number;
  month: number;
  week: string;
  range: string;
  insight: InsightData;
}

/**
 * 인사이트 주차 옵션 타입
 */
export interface InsightWeekOption {
  year: number;
  month: number;
  week: string;
  key: string;
  label: string;
  filePath: string;
}

/**
 * 인사이트 선택 모드 타입
 */
export type InsightSelectMode = "single" | "range";

/**
 * 인사이트 상태 타입
 */
export interface InsightState {
  selectMode: InsightSelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;
}


