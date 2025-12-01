/**
 * 전역 색상 정의
 * 이 파일에서 색상을 변경하면 전체 앱에 적용됩니다.
 */

// 진행률 색상 (파스텔톤)
export const PROGRESS_COLORS = {
  // 완료 (100%)
  completed: {
    text: "#52b788",
    bg: "#e9f5ec",
    border: "#b7e4c7",
  },
  // 높음 (70%+)
  high: {
    text: "#64b5f6",
    bg: "#e8f4fc",
    border: "#a8d4f5",
  },
  // 중간 (40-70%)
  medium: {
    text: "#dda15e",
    bg: "#fef6e9",
    border: "#f5d9a8",
  },
  // 낮음 (<40%)
  low: {
    text: "#e57373",
    bg: "#fceaea",
    border: "#f5b8b8",
  },
};

// 도메인별 색상 (파스텔톤)
export const DOMAIN_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // Frontend 계열 - 파스텔 블루
  fe: { bg: "#e8f4fc", text: "#64b5f6", border: "#a8d4f5" },
  frontend: { bg: "#e8f4fc", text: "#64b5f6", border: "#a8d4f5" },

  // Backend 계열 - 파스텔 그린
  be: { bg: "#e9f5ec", text: "#81c784", border: "#b7e4c7" },
  backend: { bg: "#e9f5ec", text: "#81c784", border: "#b7e4c7" },

  // Planning / 기획 - 파스텔 퍼플
  planning: { bg: "#f3e8f5", text: "#ba68c8", border: "#d4a8e0" },

  // Design / 디자인 - 파스텔 핑크
  design: { bg: "#fce8ed", text: "#f48fb1", border: "#f5b8c8" },

  // Analysis / 분석 - 파스텔 시안
  analysis: { bg: "#e6f7f8", text: "#4dd0e1", border: "#a8e6ef" },

  // Writing / 문서화 - 파스텔 오렌지
  writing: { bg: "#fef3e6", text: "#ffb74d", border: "#ffd699" },

  // QA / 품질 - 파스텔 옐로우
  qa: { bg: "#fefce8", text: "#dce775", border: "#f0eca8" },

  // DevOps / Infra - 파스텔 레드/코랄
  devops: { bg: "#fceaea", text: "#e57373", border: "#f5b8b8" },
  infra: { bg: "#fceaea", text: "#e57373", border: "#f5b8b8" },
};

// UI 기본 색상
export const UI_COLORS = {
  // 배경
  bgPrimary: "#ffffff",
  bgSecondary: "#f8f9fa",
  bgTertiary: "#f1f3f5",

  // 텍스트
  textPrimary: "#212529",
  textSecondary: "#495057",
  textMuted: "#868e96",
  textLight: "#adb5bd",

  // 테두리
  border: "#dee2e6",
  borderLight: "#e9ecef",
  borderDark: "#ced4da",

  // 강조
  accent: "#4dabf7",
  accentHover: "#339af0",
};

// 상태 색상
export const STATUS_COLORS = {
  // 진행 중
  inProgress: {
    dot: "#90caf9",
    text: "#64b5f6",
  },
  // 완료
  completed: {
    dot: "#a5d6a7",
    text: "#81c784",
  },
  // 리스크
  risk: {
    dot: "#ffcc80",
    text: "#ffb74d",
  },
};

// 리스크 레벨 색상
export const RISK_LEVEL_COLORS = {
  0: { bg: "#e8f5e9", text: "#7CB342", border: "#aed581", label: "없음", description: "리스크 없음" },
  1: { bg: "#fff8e1", text: "#FBC02D", border: "#ffd54f", label: "경미", description: "업무 외적 부담, 일정 영향 없음" },
  2: { bg: "#fff3e0", text: "#FB8C00", border: "#ffb74d", label: "중간", description: "병목 가능성 있음, 일정 영향 가능" },
  3: { bg: "#ffebee", text: "#E53935", border: "#ef9a9a", label: "심각", description: "즉각적인 논의 필요, 일정 지연 확정" },
} as const;

/**
 * 리스크 레벨에 따른 색상 반환
 */
export function getRiskLevelColor(level: 0 | 1 | 2 | 3) {
  return RISK_LEVEL_COLORS[level];
}

/**
 * 달성률 계산 (Progress / Plan)
 */
export function getAchievementRate(progressPercent: number, planPercent: number): number {
  if (planPercent === 0) return progressPercent > 0 ? 100 : 0;
  return Math.round((progressPercent / planPercent) * 100);
}

/**
 * 달성률에 따른 상태 반환
 */
export function getAchievementStatus(rate: number): "exceeded" | "normal" | "delayed" {
  if (rate >= 100) return "exceeded";
  if (rate >= 80) return "normal";
  return "delayed";
}

/**
 * 달성률 상태 색상
 */
export const ACHIEVEMENT_COLORS = {
  exceeded: { bg: "#dafbe1", text: "#1a7f37", border: "#4ac26b", label: "초과달성" },
  normal: { bg: "#ddf4ff", text: "#0969da", border: "#54aeff", label: "정상" },
  delayed: { bg: "#ffebe9", text: "#cf222e", border: "#ff8182", label: "지연" },
} as const;

/**
 * 진행률에 따른 색상 반환
 */
export function getProgressColor(percent: number): string {
  if (percent >= 100) return PROGRESS_COLORS.completed.text;
  if (percent >= 70) return PROGRESS_COLORS.high.text;
  if (percent >= 40) return PROGRESS_COLORS.medium.text;
  return PROGRESS_COLORS.low.text;
}

/**
 * 진행률에 따른 배경 색상 반환
 */
export function getProgressBgColor(percent: number): string {
  if (percent >= 100) return PROGRESS_COLORS.completed.bg;
  if (percent >= 70) return PROGRESS_COLORS.high.bg;
  if (percent >= 40) return PROGRESS_COLORS.medium.bg;
  return PROGRESS_COLORS.low.bg;
}

/**
 * 진행률에 따른 테두리 색상 반환
 */
export function getProgressBorderColor(percent: number): string {
  if (percent >= 100) return PROGRESS_COLORS.completed.border;
  if (percent >= 70) return PROGRESS_COLORS.high.border;
  if (percent >= 40) return PROGRESS_COLORS.medium.border;
  return PROGRESS_COLORS.low.border;
}

/**
 * 문자열 해시 함수 (미등록 도메인용)
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * 해시 기반 파스텔 색상 생성
 */
function getHashBasedColor(domain: string): { bg: string; text: string; border: string } {
  const hash = hashString(domain);
  const hue = hash % 360;
  return {
    bg: `hsl(${hue}, 60%, 92%)`,
    text: `hsl(${hue}, 50%, 35%)`,
    border: `hsl(${hue}, 50%, 75%)`,
  };
}

/**
 * 도메인별 색상 반환
 */
export function getDomainColor(domain: string): { bg: string; text: string; border: string } {
  const normalized = domain.toLowerCase();
  return DOMAIN_COLORS[normalized] ?? getHashBasedColor(normalized);
}

