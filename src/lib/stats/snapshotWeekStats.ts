/**
 * 주차별 스냅샷 통계 집계 유틸
 */

import type { Database, PastWeekTask } from "@/lib/supabase/types";

type SnapshotEntryRow = Database["public"]["Tables"]["snapshot_entries"]["Row"];

export interface WeekStats {
  projectCount: number;
  moduleCount: number;
  featureCount: number;
  avgProgress: number | null;
  domainDistribution: Record<string, number>;
  totalEntries: number;
}

/**
 * 엔트리 목록에서 주차 통계를 계산합니다.
 */
export function computeWeekStats(entries: SnapshotEntryRow[]): WeekStats {
  if (entries.length === 0) {
    return {
      projectCount: 0,
      moduleCount: 0,
      featureCount: 0,
      avgProgress: null,
      domainDistribution: {},
      totalEntries: 0,
    };
  }

  const projects = new Set<string>();
  const modules = new Set<string>();
  const features = new Set<string>();
  const domainCounts: Record<string, number> = {};
  
  let totalProgress = 0;
  let progressCount = 0;

  for (const entry of entries) {
    // 프로젝트
    if (entry.project) {
      projects.add(entry.project);
    }

    // 모듈
    if (entry.module) {
      modules.add(entry.module);
    }

    // 기능
    if (entry.feature) {
      features.add(entry.feature);
    }

    // 도메인 분포
    if (entry.domain) {
      domainCounts[entry.domain] = (domainCounts[entry.domain] || 0) + 1;
    }

    // 평균 진행률 계산 (past_week jsonb의 tasks 배열에서 가져옴)
    const tasks = (entry.past_week?.tasks as PastWeekTask[] | undefined) || [];
    if (tasks.length > 0) {
      const entryAvg = tasks.reduce((sum, t) => sum + (t.progress || 0), 0) / tasks.length;
      totalProgress += entryAvg;
      progressCount++;
    }
  }

  return {
    projectCount: projects.size,
    moduleCount: modules.size,
    featureCount: features.size,
    avgProgress: progressCount > 0 ? Math.round(totalProgress / progressCount) : null,
    domainDistribution: domainCounts,
    totalEntries: entries.length,
  };
}

/**
 * 진행률을 퍼센트 문자열로 포맷합니다.
 */
export function formatProgress(progress: number | null): string {
  if (progress === null) {
    return "계산 불가";
  }
  return `${progress}%`;
}

