/**
 * 협업자 관련 유틸리티
 * 
 * Scrum 아이템의 협업자 정보를 분석하고 통계를 계산하는 함수들
 */

import type { ScrumItem, CollaboratorStat, Relation } from "@/types/scrum";

// ========================================
// 협업자 통계
// ========================================

/**
 * 협업자 통계 계산
 * 각 협업자가 몇 번 언급되었는지, 어떤 관계로 언급되었는지 계산
 */
export function calculateCollaboratorStats(items: ScrumItem[]): CollaboratorStat[] {
  const stats: Record<string, CollaboratorStat> = {};

  items.forEach((item) => {
    if (!item.collaborators) return;

    item.collaborators.forEach((collab) => {
      // relations 우선, relation은 fallback
      const rels = collab.relations || (collab.relation ? [collab.relation] : []);
      
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
      
      // 모든 relations에 대해 카운트 증가
      rels.forEach((rel) => {
        if (rel in stats[collab.name].relations) {
          stats[collab.name].relations[rel]++;
        }
      });
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
      // relations 배열 지원 (새로운 스키마)
      const rels = collab.relations || (collab.relation ? [collab.relation] : []);
      
      if (rels.includes(relation)) {
        counts[collab.name] = (counts[collab.name] || 0) + 1;
      }
    });
  });

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

// ========================================
// 협업자 필터링
// ========================================

/**
 * 특정 협업자가 포함된 아이템만 필터링
 */
export function filterByCollaborator(
  items: ScrumItem[],
  collaboratorName: string
): ScrumItem[] {
  return items.filter((item) => {
    if (!item.collaborators) return false;
    return item.collaborators.some((collab) => collab.name === collaboratorName);
  });
}

/**
 * 특정 relation을 가진 협업자가 포함된 아이템만 필터링
 */
export function filterByCollaboratorRelation(
  items: ScrumItem[],
  relation: Relation
): ScrumItem[] {
  return items.filter((item) => {
    if (!item.collaborators) return false;
    return item.collaborators.some((collab) => {
      const rels = collab.relations || (collab.relation ? [collab.relation] : []);
      return rels.includes(relation);
    });
  });
}

/**
 * 협업자가 있는 아이템만 필터링
 */
export function filterHasCollaborators(items: ScrumItem[]): ScrumItem[] {
  return items.filter((item) => item.collaborators && item.collaborators.length > 0);
}

// ========================================
// 협업자 분석
// ========================================

/**
 * 전체 고유 협업자 목록 추출
 */
export function extractAllCollaborators(items: ScrumItem[]): string[] {
  const collaboratorSet = new Set<string>();
  
  items.forEach((item) => {
    if (!item.collaborators) return;
    item.collaborators.forEach((collab) => {
      collaboratorSet.add(collab.name);
    });
  });
  
  return Array.from(collaboratorSet).sort();
}

/**
 * Relation별 협업자 목록 추출
 */
export function extractCollaboratorsByRelation(
  items: ScrumItem[],
  relation: Relation
): string[] {
  const collaboratorSet = new Set<string>();
  
  items.forEach((item) => {
    if (!item.collaborators) return;
    item.collaborators.forEach((collab) => {
      const rels = collab.relations || (collab.relation ? [collab.relation] : []);
      if (rels.includes(relation)) {
        collaboratorSet.add(collab.name);
      }
    });
  });
  
  return Array.from(collaboratorSet).sort();
}

/**
 * 협업자 수 계산
 */
export function countCollaborators(item: ScrumItem): number {
  return item.collaborators ? item.collaborators.length : 0;
}

/**
 * 평균 협업자 수 계산
 */
export function calculateAvgCollaborators(items: ScrumItem[]): number {
  const itemsWithCollaborators = items.filter((item) => item.collaborators && item.collaborators.length > 0);
  
  if (itemsWithCollaborators.length === 0) {
    return 0;
  }
  
  const total = itemsWithCollaborators.reduce((sum, item) => sum + countCollaborators(item), 0);
  return Math.round((total / itemsWithCollaborators.length) * 10) / 10; // 소수점 1자리
}

// ========================================
// 협업 네트워크 분석
// ========================================

/**
 * 멤버 간 협업 매트릭스 생성
 * 각 멤버가 어떤 멤버들과 협업했는지 매트릭스 형태로 반환
 */
export function buildCollaborationMatrix(
  items: ScrumItem[]
): Record<string, Record<string, number>> {
  const matrix: Record<string, Record<string, number>> = {};
  
  items.forEach((item) => {
    if (!item.collaborators || item.collaborators.length === 0) return;
    
    const memberName = item.name;
    
    if (!matrix[memberName]) {
      matrix[memberName] = {};
    }
    
    item.collaborators.forEach((collab) => {
      matrix[memberName][collab.name] = (matrix[memberName][collab.name] || 0) + 1;
    });
  });
  
  return matrix;
}

/**
 * 특정 멤버의 협업 파트너 목록 (빈도순)
 */
export function getCollaborationPartners(
  items: ScrumItem[],
  memberName: string,
  limit?: number
): { name: string; count: number }[] {
  const memberItems = items.filter((item) => item.name === memberName);
  const counts: Record<string, number> = {};
  
  memberItems.forEach((item) => {
    if (!item.collaborators) return;
    item.collaborators.forEach((collab) => {
      counts[collab.name] = (counts[collab.name] || 0) + 1;
    });
  });
  
  const partners = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  
  return limit ? partners.slice(0, limit) : partners;
}

/**
 * 협업 빈도가 높은 멤버 쌍 찾기
 */
export function findFrequentCollaborations(
  items: ScrumItem[],
  minCount: number = 2
): Array<{ member: string; collaborator: string; count: number }> {
  const matrix = buildCollaborationMatrix(items);
  const pairs: Array<{ member: string; collaborator: string; count: number }> = [];
  
  Object.entries(matrix).forEach(([member, collaborators]) => {
    Object.entries(collaborators).forEach(([collaborator, count]) => {
      if (count >= minCount) {
        pairs.push({ member, collaborator, count });
      }
    });
  });
  
  return pairs.sort((a, b) => b.count - a.count);
}
