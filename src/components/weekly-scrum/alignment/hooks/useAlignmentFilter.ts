/**
 * useAlignmentFilter Hook
 * 
 * Alignment items의 필터링 및 정렬 로직을 관리합니다.
 */

import { useMemo } from "react";
import type { AlignmentGanttItem } from "@/lib/data/alignmentGanttData";

export type FilterType = "all" | "plans" | "snapshots";

interface UseAlignmentFilterOptions {
  items: AlignmentGanttItem[];
  filter: FilterType;
}

/**
 * Alignment items를 필터링하고 정렬합니다.
 * 
 * 정렬 순서:
 * 1. Domain
 * 2. Project
 * 3. Module
 * 4. Feature
 * 5. Type (plan → snapshot)
 * 6. Start Date
 */
export function useAlignmentFilter({ items, filter }: UseAlignmentFilterOptions) {
  const filteredItems = useMemo(() => {
    let filtered = items;
    
    // 필터링
    if (filter === "plans") {
      filtered = items.filter((item) => item.type === "plan");
    } else if (filter === "snapshots") {
      filtered = items.filter((item) => item.type === "snapshot");
    }
    
    // 정렬
    return filtered.sort((a, b) => {
      // 1. Domain 비교
      const domainCompare = (a.domain || "").localeCompare(b.domain || "");
      if (domainCompare !== 0) return domainCompare;
      
      // 2. Project 비교
      const projectCompare = (a.project || "").localeCompare(b.project || "");
      if (projectCompare !== 0) return projectCompare;
      
      // 3. Module 비교
      const moduleCompare = (a.module || "").localeCompare(b.module || "");
      if (moduleCompare !== 0) return moduleCompare;
      
      // 4. Feature 비교
      const featureCompare = (a.feature || "").localeCompare(b.feature || "");
      if (featureCompare !== 0) return featureCompare;
      
      // 5. Type 비교 (plan이 먼저)
      if (a.type !== b.type) {
        return a.type === "plan" ? -1 : 1;
      }
      
      // 6. 날짜 비교
      return a.start_date.localeCompare(b.start_date);
    });
  }, [items, filter]);

  // 통계 계산
  const stats = useMemo(() => {
    const plansCount = items.filter((item) => item.type === "plan").length;
    const snapshotsCount = items.filter((item) => item.type === "snapshot").length;
    // authorId를 우선 사용하고, 없으면 authorName 사용 (더 정확한 중복 제거)
    const uniqueAuthors = new Set(
      items
        .filter((item) => item.type === "snapshot" && (item.authorId || item.authorName))
        .map((item) => item.authorId || item.authorName)
    ).size;
    
    return {
      plansCount,
      snapshotsCount,
      uniqueAuthors,
      totalCount: items.length,
    };
  }, [items]);

  return {
    filteredItems,
    stats,
  };
}

