/**
 * 통계 계산 유틸리티
 * 
 * Scrum 아이템 및 프로젝트 데이터에 대한 통계 계산 함수들
 */

import type { ScrumItem, ScrumStats, RiskLevel } from "@/types/scrum";
import { getAchievementRate } from "../colorDefines";

// ========================================
// 모듈별 통계
// ========================================

/**
 * 모듈별 통계 계산
 * 각 모듈의 아이템 개수와 평균 진척도를 계산합니다.
 */
export function calculateModuleStats(
  items: ScrumItem[]
): { module: string; count: number; avgProgress: number }[] {
  const stats: Record<string, { count: number; totalProgress: number }> = {};

  items.forEach((item) => {
    const moduleName = item.module || "(모듈 없음)";
    if (!stats[moduleName]) {
      stats[moduleName] = { count: 0, totalProgress: 0 };
    }
    stats[moduleName].count++;
    stats[moduleName].totalProgress += item.progressPercent;
  });

  return Object.entries(stats)
    .map(([module, data]) => ({
      module,
      count: data.count,
      avgProgress: Math.round(data.totalProgress / data.count),
    }))
    .sort((a, b) => b.count - a.count);
}

// ========================================
// 전체 통계 계산
// ========================================

/**
 * Scrum 아이템 전체 통계 계산
 * 진척도, 리스크, 완료 상태 등 다양한 통계를 계산합니다.
 */
export function calculateStats(items: ScrumItem[]): ScrumStats {
  const total = items.length;
  
  const avgProgress = total > 0
    ? Math.round(items.reduce((sum, item) => sum + item.progressPercent, 0) / total)
    : 0;
  
  const avgPlan = total > 0
    ? Math.round(items.reduce((sum, item) => sum + (item.planPercent ?? item.progressPercent), 0) / total)
    : 0;
  
  const avgAchievement = getAchievementRate(avgProgress, avgPlan);
  
  // riskLevel이 null이 아니고 2 이상인 경우만 atRisk로 카운트
  const atRisk = items.filter((item) => item.riskLevel !== null && item.riskLevel >= 2).length;
  const completed = items.filter((item) => item.progressPercent >= 100).length;
  const inProgress = total - completed;

  // 리스크 레벨별 카운트 (unknown = 미정 상태 포함)
  const riskCounts: Record<RiskLevel | "unknown", number> = { 0: 0, 1: 0, 2: 0, 3: 0, unknown: 0 };
  items.forEach((item) => {
    if (item.riskLevel === null) {
      riskCounts.unknown++;
    } else {
      riskCounts[item.riskLevel]++;
    }
  });

  // 고유 도메인, 프로젝트, 멤버, 모듈 목록
  const domains = Array.from(new Set(items.map((item) => item.domain))).sort();
  const projects = Array.from(new Set(items.map((item) => item.project))).sort();
  const members = Array.from(new Set(items.map((item) => item.name))).sort();
  
  // 모듈 추출 (null 제외)
  const modules: string[] = [];
  const moduleSet = new Set<string>();
  items.forEach((item) => {
    if (item.module) {
      moduleSet.add(item.module);
    }
  });
  modules.push(...Array.from(moduleSet).sort());

  return { 
    total, 
    avgProgress, 
    avgPlan,
    avgAchievement,
    atRisk, 
    completed, 
    inProgress,
    riskCounts,
    domains,
    projects,
    members,
    modules,
  };
}

// ========================================
// 진척도 관련 통계
// ========================================

/**
 * 평균 진척도 계산
 */
export function calculateAvgProgress(items: ScrumItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  const total = items.reduce((sum, item) => sum + item.progressPercent, 0);
  return Math.round(total / items.length);
}

/**
 * 평균 계획 진척도 계산
 */
export function calculateAvgPlan(items: ScrumItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  const total = items.reduce((sum, item) => sum + (item.planPercent ?? item.progressPercent), 0);
  return Math.round(total / items.length);
}

/**
 * 평균 달성률 계산
 */
export function calculateAvgAchievement(items: ScrumItem[]): number {
  const avgProgress = calculateAvgProgress(items);
  const avgPlan = calculateAvgPlan(items);
  return getAchievementRate(avgProgress, avgPlan);
}

// ========================================
// 완료/진행 상태 통계
// ========================================

/**
 * 완료된 아이템 개수
 */
export function countCompleted(items: ScrumItem[]): number {
  return items.filter((item) => item.progressPercent >= 100).length;
}

/**
 * 진행 중인 아이템 개수
 */
export function countInProgress(items: ScrumItem[]): number {
  const completed = countCompleted(items);
  return items.length - completed;
}

/**
 * 완료율 계산
 */
export function calculateCompletionRate(items: ScrumItem[]): number {
  if (items.length === 0) {
    return 0;
  }
  const completed = countCompleted(items);
  return Math.round((completed / items.length) * 100);
}

// ========================================
// 리스크 관련 통계
// ========================================

/**
 * 리스크가 있는 아이템 개수 (level 2 이상)
 */
export function countAtRisk(items: ScrumItem[]): number {
  return items.filter((item) => item.riskLevel !== null && item.riskLevel >= 2).length;
}

/**
 * 리스크 레벨별 카운트
 */
export function calculateRiskCounts(items: ScrumItem[]): Record<RiskLevel | "unknown", number> {
  const counts: Record<RiskLevel | "unknown", number> = { 0: 0, 1: 0, 2: 0, 3: 0, unknown: 0 };
  
  items.forEach((item) => {
    if (item.riskLevel === null) {
      counts.unknown++;
    } else {
      counts[item.riskLevel]++;
    }
  });
  
  return counts;
}

/**
 * 리스크 분포 비율 계산
 */
export function calculateRiskDistribution(items: ScrumItem[]): Record<RiskLevel | "unknown", number> {
  const counts = calculateRiskCounts(items);
  const total = items.length;
  
  if (total === 0) {
    return { 0: 0, 1: 0, 2: 0, 3: 0, unknown: 0 };
  }
  
  const distribution: Record<RiskLevel | "unknown", number> = { 0: 0, 1: 0, 2: 0, 3: 0, unknown: 0 };
  
  Object.entries(counts).forEach(([level, count]) => {
    distribution[level as RiskLevel | "unknown"] = Math.round((count / total) * 100);
  });
  
  return distribution;
}

// ========================================
// 도메인/프로젝트별 통계
// ========================================

/**
 * 도메인별 아이템 개수
 */
export function countByDomain(items: ScrumItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  items.forEach((item) => {
    counts[item.domain] = (counts[item.domain] || 0) + 1;
  });
  
  return counts;
}

/**
 * 프로젝트별 아이템 개수
 */
export function countByProject(items: ScrumItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  items.forEach((item) => {
    counts[item.project] = (counts[item.project] || 0) + 1;
  });
  
  return counts;
}

/**
 * 멤버별 아이템 개수
 */
export function countByMember(items: ScrumItem[]): Record<string, number> {
  const counts: Record<string, number> = {};
  
  items.forEach((item) => {
    counts[item.name] = (counts[item.name] || 0) + 1;
  });
  
  return counts;
}

/**
 * 프로젝트별 평균 진척도
 */
export function calculateAvgProgressByProject(items: ScrumItem[]): Record<string, number> {
  const stats: Record<string, { total: number; count: number }> = {};
  
  items.forEach((item) => {
    if (!stats[item.project]) {
      stats[item.project] = { total: 0, count: 0 };
    }
    stats[item.project].total += item.progressPercent;
    stats[item.project].count++;
  });
  
  const avgByProject: Record<string, number> = {};
  Object.entries(stats).forEach(([project, data]) => {
    avgByProject[project] = Math.round(data.total / data.count);
  });
  
  return avgByProject;
}
