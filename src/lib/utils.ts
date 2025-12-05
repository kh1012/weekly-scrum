import type { ScrumItem, FilterState, RiskLevel, ScrumStats } from "@/types/scrum";
import { getAchievementRate } from "./colorDefines";

/**
 * 아이템 필터링
 */
export function filterItems(items: ScrumItem[], filters: FilterState): ScrumItem[] {
  return items.filter((item) => {
    if (filters.domain && item.domain !== filters.domain) {
      return false;
    }
    if (filters.project && item.project !== filters.project) {
      return false;
    }
    if (filters.member && item.name !== filters.member) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const searchTarget = [
        item.name,
        item.domain,
        item.project,
        item.topic,
        item.progress,
        item.risk,
        item.next,
      ]
        .join(" ")
        .toLowerCase();
      if (!searchTarget.includes(searchLower)) {
        return false;
      }
    }
    return true;
  });
}

/**
 * 고유 도메인 목록 추출
 */
export function extractDomains(items: ScrumItem[]): string[] {
  const set = new Set(items.map((item) => item.domain));
  return Array.from(set).sort();
}

/**
 * 고유 프로젝트 목록 추출
 */
export function extractProjects(items: ScrumItem[]): string[] {
  const set = new Set(items.map((item) => item.project));
  return Array.from(set).sort();
}

/**
 * 통계 계산
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
  
  const atRisk = items.filter((item) => (item.riskLevel ?? 0) >= 2).length;
  const completed = items.filter((item) => item.progressPercent >= 100).length;
  const inProgress = total - completed;

  // 리스크 레벨별 카운트
  const riskCounts: Record<RiskLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  items.forEach((item) => {
    const level = (item.riskLevel ?? 0) as RiskLevel;
    riskCounts[level]++;
  });

  // 고유 도메인, 프로젝트, 멤버 목록
  const domains = Array.from(new Set(items.map((item) => item.domain))).sort();
  const projects = Array.from(new Set(items.map((item) => item.project))).sort();
  const members = Array.from(new Set(items.map((item) => item.name))).sort();

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
  };
}
