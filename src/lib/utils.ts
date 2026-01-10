/**
 * 공통 유틸리티 함수들
 * 
 * @deprecated 이 파일은 더 이상 직접 수정하지 않습니다.
 * 모든 유틸리티 함수들은 도메인별 모듈로 분리되었습니다:
 * - @/lib/utils/filtering - 필터링 관련 함수
 * - @/lib/utils/stats - 통계 계산 함수
 * - @/lib/utils/collaborators - 협업자 관련 함수
 * 
 * 이 파일은 하위 호환성을 위해 유지되며, 각 함수를 새로운 모듈에서 re-export합니다.
 */

import type { ScrumItem, FilterState } from "@/types/scrum";

// Re-export from stats module
export {
  calculateStats,
  calculateModuleStats,
  calculateAvgProgress,
  calculateAvgPlan,
  calculateAvgAchievement,
  countCompleted,
  countInProgress,
  calculateCompletionRate,
  countAtRisk,
  calculateRiskCounts,
  calculateRiskDistribution,
  countByDomain,
  countByProject,
  countByMember,
  calculateAvgProgressByProject,
} from "./utils/stats";

// Re-export from collaborators module
export {
  calculateCollaboratorStats,
  getTopCollaboratorsByRelation,
  filterByCollaborator,
  filterByCollaboratorRelation,
  filterHasCollaborators,
  extractAllCollaborators,
  extractCollaboratorsByRelation,
  countCollaborators,
  calculateAvgCollaborators,
  buildCollaborationMatrix,
  getCollaborationPartners,
  findFrequentCollaborations,
} from "./utils/collaborators";

// Re-export from filtering module (extractors)
export { extractUniqueValues } from "./utils/filtering";

// ========================================
// Legacy Extractors (Wrapper Functions)
// ========================================

/**
 * 고유 도메인 목록 추출
 * @deprecated Use extractUniqueValues(items, 'domain') instead
 */
export function extractDomains(items: ScrumItem[]): string[] {
  const set = new Set(items.map((item) => item.domain));
  return Array.from(set).sort();
}

/**
 * 고유 프로젝트 목록 추출
 * @deprecated Use extractUniqueValues(items, 'project') instead
 */
export function extractProjects(items: ScrumItem[]): string[] {
  const set = new Set(items.map((item) => item.project));
  return Array.from(set).sort();
}

/**
 * 고유 모듈 목록 추출
 * @deprecated Use extractUniqueValues(items, 'module') instead
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

// ========================================
// Legacy Filter Function
// ========================================

/**
 * 아이템 필터링
 * @deprecated Use applyFilters from @/lib/utils/filtering instead
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
        item.risk?.join(" ") || "",
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
