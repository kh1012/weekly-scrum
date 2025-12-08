import type { ScrumItem, FilterState, RiskLevel, ScrumStats, Relation, CollaboratorStat } from "@/types/scrum";
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
    if (filters.module && item.module !== filters.module) {
      return false;
    }
    if (filters.member && item.name !== filters.member) {
      return false;
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      // progress와 next는 배열이므로 join하여 검색
      const searchTarget = [
        item.name,
        item.domain,
        item.project,
        item.module || "",
        item.topic,
        item.progress.join(" "),
        item.risk || "",
        item.next.join(" "),
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
 * 고유 모듈 목록 추출
 */
export function extractModules(items: ScrumItem[]): string[] {
  const set = new Set<string>();
  items.forEach((item) => {
    if (item.module) {
      set.add(item.module);
    }
  });
  return Array.from(set).sort();
}

/**
 * 협업자 통계 계산
 * 각 협업자가 몇 번 언급되었는지, 어떤 관계로 언급되었는지 계산
 */
export function calculateCollaboratorStats(items: ScrumItem[]): CollaboratorStat[] {
  const stats: Record<string, CollaboratorStat> = {};

  items.forEach((item) => {
    if (!item.collaborators) return;

    item.collaborators.forEach((collab) => {
      if (!stats[collab.name]) {
        stats[collab.name] = {
          name: collab.name,
          count: 0,
          relations: {
            pair: 0,
            pre: 0,
            post: 0,
          },
        };
      }
      stats[collab.name].count++;
      stats[collab.name].relations[collab.relation]++;
    });
  });

  return Object.values(stats).sort((a, b) => b.count - a.count);
}

/**
 * 특정 relation 기준 Top N 협업자 추출
 */
export function getTopCollaboratorsByRelation(
  items: ScrumItem[],
  relation: Relation,
  limit: number = 5
): { name: string; count: number }[] {
  const counts: Record<string, number> = {};

  items.forEach((item) => {
    if (!item.collaborators) return;

    item.collaborators.forEach((collab) => {
      if (collab.relation === relation) {
        counts[collab.name] = (counts[collab.name] || 0) + 1;
      }
    });
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/**
 * 모듈별 통계 계산
 */
export function calculateModuleStats(items: ScrumItem[]): { module: string; count: number; avgProgress: number }[] {
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
  const modules = extractModules(items);

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
