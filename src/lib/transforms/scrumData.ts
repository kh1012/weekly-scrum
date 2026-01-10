/**
 * Scrum 데이터 변환 레이어
 * 
 * 다양한 스키마 버전 간의 데이터 변환을 담당합니다:
 * - v1 (레거시): 단순 progress 배열
 * - v2: 구조화된 pastWeek/thisWeek
 * - v3: ISO 주차 기준 + 구조화된 데이터
 */

import type {
  ScrumItem,
  ScrumItemV2,
  WeeklyScrumData,
  WeeklyScrumDataV2,
  WeeklyScrumDataV3,
  RiskLevel,
  Collaborator,
} from "@/types/scrum";

// ========================================
// v2 → v1 변환
// ========================================

/**
 * v2 ScrumItem을 v1 ScrumItem으로 변환
 * v2의 구조화된 데이터를 v1의 평면 구조로 변환
 */
export function convertV2ToV1Item(item: ScrumItemV2): ScrumItem {
  const avgProgress =
    item.pastWeek.tasks.length > 0
      ? Math.round(
          item.pastWeek.tasks.reduce((sum, t) => sum + t.progress, 0) /
            item.pastWeek.tasks.length
        )
      : 0;

  return {
    name: item.name,
    domain: item.domain,
    project: item.project,
    module: item.module || null,
    topic: item.feature, // feature → topic 매핑
    plan: item.pastWeek.tasks.map((t) => `${t.title} (${t.progress}%)`).join(", ") || "",
    planPercent: avgProgress,
    progress: item.pastWeek.tasks.map((t) => `${t.title} (${t.progress}%)`),
    progressPercent: avgProgress,
    reason: "",
    next: item.thisWeek.tasks,
    risk: item.pastWeek.risk,
    riskLevel: item.pastWeek.riskLevel,
    collaborators: item.pastWeek.collaborators,
  };
}

/**
 * v2 WeeklyScrumData를 v1 WeeklyScrumData로 변환
 */
export function convertV2ToV1Data(data: WeeklyScrumDataV2): WeeklyScrumData {
  return {
    year: data.year,
    month: data.month,
    week: data.week,
    range: data.range,
    schemaVersion: 1,
    items: data.items.map(convertV2ToV1Item),
  };
}

// ========================================
// v3 → v1 변환
// ========================================

/**
 * v3 WeeklyScrumData를 v1 WeeklyScrumData로 변환
 * v3는 ISO 주차를 사용하므로 weekStart에서 월을 추출
 */
export function convertV3ToV1Data(data: WeeklyScrumDataV3): WeeklyScrumData {
  // weekStart에서 월 추출
  const [, month] = data.weekStart.split("-").map(Number);
  
  return {
    year: data.year,
    month: month,
    week: data.week,
    range: `${data.weekStart} ~ ${data.weekEnd}`,
    schemaVersion: 1,
    items: data.items.map(convertV2ToV1Item),
  };
}

// ========================================
// 레거시 데이터 마이그레이션
// ========================================

/**
 * 레거시 ScrumItem을 새 스키마로 마이그레이션
 * - progress: string → string[]
 * - next: string → string[]
 * - risk: string → string[] | null (빈 문자열 또는 "?"는 null로)
 * - riskLevel: number → number | null ("?"는 null로)
 */
export function migrateScrumItem(item: Record<string, unknown>): ScrumItem {
  // progress 마이그레이션: string → string[]
  let progress: string[];
  if (Array.isArray(item.progress)) {
    progress = item.progress as string[];
  } else if (typeof item.progress === "string") {
    progress = item.progress.trim() ? [item.progress] : [];
  } else {
    progress = [];
  }

  // next 마이그레이션: string → string[]
  let next: string[];
  if (Array.isArray(item.next)) {
    next = item.next as string[];
  } else if (typeof item.next === "string") {
    next = item.next.trim() ? [item.next] : [];
  } else {
    next = [];
  }

  // risk 마이그레이션: string | string[] → string[] | null
  let risk: string[] | null = null;
  if (Array.isArray(item.risk)) {
    // 이미 배열인 경우
    const filtered = (item.risk as string[]).filter(
      (r) => r && r.trim() !== "" && r.trim() !== "?" && r.trim() !== "-"
    );
    risk = filtered.length > 0 ? filtered : null;
  } else if (typeof item.risk === "string") {
    // 레거시 문자열인 경우 배열로 변환
    const trimmed = item.risk.trim();
    if (trimmed && trimmed !== "?" && trimmed !== "-") {
      risk = [trimmed];
    }
  }

  // riskLevel 마이그레이션: number | string → number | null
  let riskLevel: RiskLevel | null = null;
  if (typeof item.riskLevel === "number") {
    if (item.riskLevel >= 0 && item.riskLevel <= 3) {
      riskLevel = item.riskLevel as RiskLevel;
    }
  } else if (typeof item.riskLevel === "string") {
    const parsed = parseInt(item.riskLevel, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
      riskLevel = parsed as RiskLevel;
    }
  }

  return {
    name: item.name as string,
    domain: item.domain as string,
    project: item.project as string,
    module: (item.module as string | null) || null,
    topic: (item.topic as string) || "",
    plan: (item.plan as string) || "",
    planPercent: (item.planPercent as number) || 0,
    progress,
    progressPercent: (item.progressPercent as number) || 0,
    reason: (item.reason as string) || "",
    next,
    risk,
    riskLevel,
    collaborators: item.collaborators as Collaborator[] | undefined,
  };
}

/**
 * WeeklyScrumData를 마이그레이션
 * v3/v2 스키마일 경우 v1으로 변환
 */
export function migrateWeeklyScrumData(data: Record<string, unknown>): WeeklyScrumData {
  // v3 스키마 감지 (ISO 주차 기준)
  if (data.schemaVersion === 3) {
    const v3Data = data as unknown as WeeklyScrumDataV3;
    return convertV3ToV1Data(v3Data);
  }
  
  // v2 스키마 감지
  if (data.schemaVersion === 2) {
    const v2Data = data as unknown as WeeklyScrumDataV2;
    return convertV2ToV1Data(v2Data);
  }

  // v1 또는 레거시 스키마
  const items = (data.items as Record<string, unknown>[]).map(migrateScrumItem);
  return {
    year: data.year as number,
    month: data.month as number,
    week: data.week as string,
    range: data.range as string,
    items,
  };
}

// ========================================
// Supabase 엔트리 변환
// ========================================

/**
 * Supabase snapshot entry를 ScrumItem으로 변환
 */
export interface SnapshotEntryRaw {
  name: string;
  domain: string;
  project: string;
  module?: string | null;
  feature?: string | null;
  past_week?: {
    tasks?: Array<{ title: string; progress: number }>;
  };
  this_week?: {
    tasks?: string[];
  };
  risk?: string[] | null;
  risk_level?: number | null;
  collaborators?: Collaborator[];
}

export function convertEntryToScrumItem(
  entry: SnapshotEntryRaw,
  authorName?: string
): ScrumItem {
  const tasks = entry.past_week?.tasks || [];
  const avgProgress =
    tasks.length > 0
      ? Math.round(tasks.reduce((sum: number, t) => sum + t.progress, 0) / tasks.length)
      : 0;

  return {
    name: authorName || entry.name,
    domain: entry.domain,
    project: entry.project,
    module: entry.module || null,
    topic: entry.feature || "",
    plan: tasks.map((t) => `${t.title} (${t.progress}%)`).join(", ") || "",
    planPercent: avgProgress,
    progress: tasks.map((t) => `${t.title} (${t.progress}%)`),
    progressPercent: avgProgress,
    reason: "",
    next: entry.this_week?.tasks || [],
    risk: entry.risk ?? null,
    riskLevel: entry.risk_level !== null && entry.risk_level !== undefined 
      ? (entry.risk_level as RiskLevel)
      : null,
    collaborators: entry.collaborators,
  };
}

// ========================================
// Calendar 집계용 변환
// ========================================

/**
 * Calendar view를 위한 raw snapshot 타입
 */
export interface RawSnapshot {
  id: string;
  year: number;
  weekIndex: number;
  weekStart: string;
  weekEnd: string;
  domain: string;
  project: string;
  module: string;
  feature: string;
  memberName: string;
  pastWeekTasks: Array<{ title: string; progress: number }>;
  thisWeekTasks: string[];
}

/**
 * task 문자열에서 완료율(progress)을 추출
 */
export function parseTaskCompletionRate(taskText: string): number {
  // % 패턴 추출: "작업 내용 (80%)" 또는 "작업 내용 80%"
  const percentMatch = taskText.match(/(\d+)\s*%/);
  if (percentMatch) {
    return Math.min(parseInt(percentMatch[1], 10), 100) / 100;
  }

  // 키워드 기반
  const upperText = taskText.toUpperCase();
  if (
    upperText.includes("(DONE)") ||
    upperText.includes("[DONE]") ||
    upperText.includes("완료")
  ) {
    return 1.0;
  }
  if (
    upperText.includes("(HALF)") ||
    upperText.includes("[HALF]") ||
    upperText.includes("진행중")
  ) {
    return 0.5;
  }
  if (
    upperText.includes("(TODO)") ||
    upperText.includes("[TODO]") ||
    upperText.includes("예정")
  ) {
    return 0.0;
  }

  return 0;
}

// ========================================
// 편의 함수
// ========================================

/**
 * 평균 진척도 계산 (여러 태스크의 평균)
 */
export function calculateAvgProgress(tasks: Array<{ progress: number }>): number {
  if (tasks.length === 0) {
    return 0;
  }
  return Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length);
}

/**
 * progress 배열을 문자열로 포맷팅
 */
export function formatProgressTasks(
  tasks: Array<{ title: string; progress: number }>
): string[] {
  return tasks.map((t) => `${t.title} (${t.progress}%)`);
}
