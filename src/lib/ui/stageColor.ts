/**
 * Stage별 색상 매핑
 * - UI 레벨에서만 사용 (DB 저장 X)
 */

export interface StageColorConfig {
  bg: string;
  border: string;
  text: string;
}

const STAGE_COLORS: Record<string, StageColorConfig> = {
  "컨셉 기획": {
    bg: "rgba(139, 92, 246, 0.15)",
    border: "rgba(139, 92, 246, 0.4)",
    text: "#7c3aed",
  },
  "상세 기획": {
    bg: "rgba(99, 102, 241, 0.15)",
    border: "rgba(99, 102, 241, 0.4)",
    text: "#4f46e5",
  },
  "디자인": {
    bg: "rgba(236, 72, 153, 0.15)",
    border: "rgba(236, 72, 153, 0.4)",
    text: "#db2777",
  },
  "BE 개발": {
    bg: "rgba(34, 197, 94, 0.15)",
    border: "rgba(34, 197, 94, 0.4)",
    text: "#16a34a",
  },
  "FE 개발": {
    bg: "rgba(59, 130, 246, 0.15)",
    border: "rgba(59, 130, 246, 0.4)",
    text: "#2563eb",
  },
  "QA": {
    bg: "rgba(245, 158, 11, 0.15)",
    border: "rgba(245, 158, 11, 0.4)",
    text: "#d97706",
  },
  "릴리즈": {
    bg: "rgba(239, 68, 68, 0.15)",
    border: "rgba(239, 68, 68, 0.4)",
    text: "#dc2626",
  },
};

const DEFAULT_COLOR: StageColorConfig = {
  bg: "rgba(107, 114, 128, 0.15)",
  border: "rgba(107, 114, 128, 0.4)",
  text: "#4b5563",
};

/**
 * Stage 문자열에서 색상 설정 반환
 */
export function getStageColor(stage: string | null | undefined): StageColorConfig {
  if (!stage) return DEFAULT_COLOR;
  return STAGE_COLORS[stage] || DEFAULT_COLOR;
}

/**
 * Stage 목록 (순서대로)
 */
export const STAGE_LIST = [
  "컨셉 기획",
  "상세 기획",
  "디자인",
  "BE 개발",
  "FE 개발",
  "QA",
  "릴리즈",
];

/**
 * Status별 색상 매핑
 */
export interface StatusColorConfig {
  bg: string;
  text: string;
}

const STATUS_COLORS: Record<string, StatusColorConfig> = {
  "진행중": { bg: "rgba(59, 130, 246, 0.15)", text: "#2563eb" },
  "완료": { bg: "rgba(34, 197, 94, 0.15)", text: "#16a34a" },
  "보류": { bg: "rgba(245, 158, 11, 0.15)", text: "#d97706" },
  "취소": { bg: "rgba(239, 68, 68, 0.15)", text: "#dc2626" },
};

const DEFAULT_STATUS_COLOR: StatusColorConfig = {
  bg: "rgba(107, 114, 128, 0.15)",
  text: "#4b5563",
};

export function getStatusColor(status: string | null | undefined): StatusColorConfig {
  if (!status) return DEFAULT_STATUS_COLOR;
  return STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
}

