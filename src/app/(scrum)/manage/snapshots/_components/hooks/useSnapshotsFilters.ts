/**
 * useSnapshotsFilters Hook
 * 
 * Snapshots 필터링 로직
 */

import { useState, useMemo, useCallback } from "react";
import type { SnapshotSummary } from "../SnapshotsMainView";

export function useSnapshotsFilters(snapshots: SnapshotSummary[]) {
  // 필터 상태 (다중 선택)
  const [projectFilters, setProjectFilters] = useState<Set<string>>(new Set());
  const [moduleFilters, setModuleFilters] = useState<Set<string>>(new Set());
  const [featureFilters, setFeatureFilters] = useState<Set<string>>(new Set());

  // 필터 드롭다운 상태
  const [isProjectFilterOpen, setIsProjectFilterOpen] = useState(false);
  const [isModuleFilterOpen, setIsModuleFilterOpen] = useState(false);
  const [isFeatureFilterOpen, setIsFeatureFilterOpen] = useState(false);

  // 필터 토글 함수
  const toggleProjectFilter = useCallback((project: string) => {
    setProjectFilters((prev) => {
      const next = new Set(prev);
      if (next.has(project)) next.delete(project);
      else next.add(project);
      return next;
    });
  }, []);

  const toggleModuleFilter = useCallback((module: string) => {
    setModuleFilters((prev) => {
      const next = new Set(prev);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });
  }, []);

  const toggleFeatureFilter = useCallback((feature: string) => {
    setFeatureFilters((prev) => {
      const next = new Set(prev);
      if (next.has(feature)) next.delete(feature);
      else next.add(feature);
      return next;
    });
  }, []);

  // 필터 옵션 계산
  const filterOptions = useMemo(() => {
    const projects = new Set<string>();
    const modules = new Set<string>();
    const features = new Set<string>();

    snapshots.forEach((snapshot) => {
      snapshot.entries.forEach((entry) => {
        projects.add(entry.project);
        if (entry.module) modules.add(entry.module);
        if (entry.feature) features.add(entry.feature);
      });
    });

    return {
      projects: Array.from(projects).sort(),
      modules: Array.from(modules).sort(),
      features: Array.from(features).sort(),
    };
  }, [snapshots]);

  // 필터링된 스냅샷
  const filteredSnapshots = useMemo(() => {
    return snapshots.map((snapshot) => {
      const matchesProject =
        projectFilters.size === 0 ||
        snapshot.entries.some((e) => projectFilters.has(e.project));
      const matchesModule =
        moduleFilters.size === 0 ||
        snapshot.entries.some((e) => e.module && moduleFilters.has(e.module));
      const matchesFeature =
        featureFilters.size === 0 ||
        snapshot.entries.some((e) => e.feature && featureFilters.has(e.feature));

      return matchesProject && matchesModule && matchesFeature ? snapshot : null;
    }).filter((s): s is SnapshotSummary => s !== null);
  }, [snapshots, projectFilters, moduleFilters, featureFilters]);

  // 필터 초기화
  const clearFilters = useCallback(() => {
    setProjectFilters(new Set());
    setModuleFilters(new Set());
    setFeatureFilters(new Set());
  }, []);

  // 필터 카운트
  const totalFilterCount =
    projectFilters.size + moduleFilters.size + featureFilters.size;
  const hasActiveFilters = totalFilterCount > 0;

  return {
    projectFilters,
    moduleFilters,
    featureFilters,
    isProjectFilterOpen,
    setIsProjectFilterOpen,
    isModuleFilterOpen,
    setIsModuleFilterOpen,
    isFeatureFilterOpen,
    setIsFeatureFilterOpen,
    toggleProjectFilter,
    toggleModuleFilter,
    toggleFeatureFilter,
    filterOptions,
    filteredSnapshots,
    clearFilters,
    totalFilterCount,
    hasActiveFilters,
  };
}
