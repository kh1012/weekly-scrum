/**
 * Scrum 필터 관리 Hook
 * 
 * 다중 선택 필터와 검색 기능을 제공
 * localStorage에 필터 상태를 저장하여 페이지 새로고침 시에도 유지
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import type {
  WeeklyScrumData,
  FilterState,
  MultiFilterState,
  FilterOptionState,
  ScrumItem,
  ScrumStats,
} from "@/types/scrum";
import { filterItems, calculateStats, extractUniqueValues } from "@/lib/utils";
import { getItem, setItem } from "@/lib/utils/storage";

const FILTER_STORAGE_KEY = "scrum-filter-state";

const defaultMultiFilters: MultiFilterState = {
  members: [],
  domains: [],
  projects: [],
  modules: [],
  features: [],
  search: "",
};

interface StoredFilterState {
  multiFilters: MultiFilterState;
}

export interface UseScrumFiltersProps {
  currentData: WeeklyScrumData | null;
}

export interface UseScrumFiltersReturn {
  // 필터 상태
  filters: FilterState;
  multiFilters: MultiFilterState;
  
  // 필터링된 데이터
  filteredItems: ScrumItem[];
  stats: ScrumStats;
  
  // 사용 가능한 값 목록
  domains: string[];
  projects: string[];
  members: string[];
  modules: string[];
  features: string[];
  
  // 필터 옵션 (활성화/비활성화 상태 포함)
  memberOptions: FilterOptionState[];
  domainOptions: FilterOptionState[];
  projectOptions: FilterOptionState[];
  moduleOptions: FilterOptionState[];
  featureOptions: FilterOptionState[];
  
  // 필터 액션
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
  
  // 다중 선택 필터 액션
  toggleMultiFilter: (key: keyof Omit<MultiFilterState, "search">, value: string) => void;
  setMultiFilterAll: (key: keyof Omit<MultiFilterState, "search">, values: string[]) => void;
  clearMultiFilter: (key: keyof Omit<MultiFilterState, "search">) => void;
  resetMultiFilters: () => void;
  setSearchTerm: (search: string) => void;
  hasActiveMultiFilters: boolean;
}

/**
 * Scrum 필터 관리 Hook
 */
export function useScrumFilters({
  currentData,
}: UseScrumFiltersProps): UseScrumFiltersReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    domain: "",
    project: "",
    module: "",
    member: "",
    search: "",
  });
  const [multiFilters, setMultiFilters] = useState<MultiFilterState>(defaultMultiFilters);

  // 초기 상태 복원 (localStorage에서)
  useEffect(() => {
    const stored = getItem<StoredFilterState>(FILTER_STORAGE_KEY);
    
    if (stored?.multiFilters) {
      setMultiFilters(stored.multiFilters);
    }
    
    setIsInitialized(true);
  }, []);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isInitialized) return;
    
    setItem<StoredFilterState>(FILTER_STORAGE_KEY, {
      multiFilters,
    });
  }, [isInitialized, multiFilters]);

  // 사용 가능한 값 목록 추출
  const domains = useMemo(() => {
    if (!currentData) return [];
    return extractUniqueValues(currentData.items, "domain");
  }, [currentData]);

  const projects = useMemo(() => {
    if (!currentData) return [];
    return extractUniqueValues(currentData.items, "project");
  }, [currentData]);

  const members = useMemo(() => {
    if (!currentData) return [];
    return extractUniqueValues(currentData.items, "name");
  }, [currentData]);

  const modules = useMemo(() => {
    if (!currentData) return [];
    return extractUniqueValues(currentData.items, "module", { excludeEmpty: true });
  }, [currentData]);

  const features = useMemo(() => {
    if (!currentData) return [];
    return extractUniqueValues(currentData.items, "topic", { excludeEmpty: true });
  }, [currentData]);

  // 필터링된 아이템 (기존 filters + multiFilters 적용)
  const filteredItems = useMemo(() => {
    if (!currentData) return [];
    
    // 기존 filters 적용
    let items = filterItems(currentData.items, filters);
    
    // multiFilters 적용
    return items.filter((item) => {
      // 멤버 필터 (빈 배열 = 모든 항목 표시)
      if (multiFilters.members.length > 0 && !multiFilters.members.includes(item.name)) {
        return false;
      }
      // 도메인 필터
      if (multiFilters.domains.length > 0 && !multiFilters.domains.includes(item.domain)) {
        return false;
      }
      // 프로젝트 필터
      if (multiFilters.projects.length > 0 && !multiFilters.projects.includes(item.project)) {
        return false;
      }
      // 모듈 필터
      if (multiFilters.modules.length > 0 && (!item.module || !multiFilters.modules.includes(item.module))) {
        return false;
      }
      // 피쳐 필터
      if (multiFilters.features.length > 0 && !multiFilters.features.includes(item.topic)) {
        return false;
      }
      return true;
    });
  }, [currentData, filters, multiFilters]);

  // 통계
  const stats = useMemo(() => calculateStats(filteredItems), [filteredItems]);

  // 필터 옵션 계산 함수
  const computeFilterOptions = useCallback(
    (
      key: keyof Omit<MultiFilterState, "search">,
      allValues: string[],
      getItemValue: (item: ScrumItem) => string | null | undefined
    ): FilterOptionState[] => {
      if (!currentData) return [];

      // 현재 필터 상태에서 해당 키를 제외한 필터 적용
      const otherFilters = { ...multiFilters, [key]: [] };
      const filteredByOthers = currentData.items.filter((item) => {
        if (otherFilters.members.length > 0 && !otherFilters.members.includes(item.name)) return false;
        if (otherFilters.domains.length > 0 && !otherFilters.domains.includes(item.domain)) return false;
        if (otherFilters.projects.length > 0 && !otherFilters.projects.includes(item.project)) return false;
        if (otherFilters.modules.length > 0 && (!item.module || !otherFilters.modules.includes(item.module))) return false;
        if (otherFilters.features.length > 0 && !otherFilters.features.includes(item.topic)) return false;
        return true;
      });

      // 각 값의 활성화 여부와 개수 계산
      return allValues.map((value) => {
        const matchingItems = filteredByOthers.filter((item) => getItemValue(item) === value);
        return {
          value,
          enabled: matchingItems.length > 0,
          count: matchingItems.length,
        };
      });
    },
    [currentData, multiFilters]
  );

  // 필터 옵션들
  const memberOptions = useMemo(
    () => computeFilterOptions("members", members, (item) => item.name),
    [computeFilterOptions, members]
  );

  const domainOptions = useMemo(
    () => computeFilterOptions("domains", domains, (item) => item.domain),
    [computeFilterOptions, domains]
  );

  const projectOptions = useMemo(
    () => computeFilterOptions("projects", projects, (item) => item.project),
    [computeFilterOptions, projects]
  );

  const moduleOptions = useMemo(
    () => computeFilterOptions("modules", modules, (item) => item.module),
    [computeFilterOptions, modules]
  );

  const featureOptions = useMemo(
    () => computeFilterOptions("features", features, (item) => item.topic),
    [computeFilterOptions, features]
  );

  // 필터 액션들
  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ domain: "", project: "", module: "", member: "", search: "" });
  }, []);

  const toggleMultiFilter = useCallback(
    (key: keyof Omit<MultiFilterState, "search">, value: string) => {
      setMultiFilters((prev) => {
        const current = prev[key];
        const updated = current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value];
        return { ...prev, [key]: updated };
      });
    },
    []
  );

  const setMultiFilterAll = useCallback(
    (key: keyof Omit<MultiFilterState, "search">, values: string[]) => {
      setMultiFilters((prev) => ({ ...prev, [key]: values }));
    },
    []
  );

  const clearMultiFilter = useCallback(
    (key: keyof Omit<MultiFilterState, "search">) => {
      setMultiFilters((prev) => ({ ...prev, [key]: [] }));
    },
    []
  );

  const resetMultiFilters = useCallback(() => {
    setMultiFilters(defaultMultiFilters);
  }, []);

  const setSearchTerm = useCallback((search: string) => {
    setMultiFilters((prev) => ({ ...prev, search }));
  }, []);

  // 활성화된 다중 필터 여부
  const hasActiveMultiFilters = useMemo(
    () =>
      multiFilters.members.length > 0 ||
      multiFilters.domains.length > 0 ||
      multiFilters.projects.length > 0 ||
      multiFilters.modules.length > 0 ||
      multiFilters.features.length > 0 ||
      multiFilters.search !== "",
    [multiFilters]
  );

  return {
    filters,
    multiFilters,
    filteredItems,
    stats,
    domains,
    projects,
    members,
    modules,
    features,
    memberOptions,
    domainOptions,
    projectOptions,
    moduleOptions,
    featureOptions,
    setFilters,
    updateFilter,
    resetFilters,
    toggleMultiFilter,
    setMultiFilterAll,
    clearMultiFilter,
    resetMultiFilters,
    setSearchTerm,
    hasActiveMultiFilters,
  };
}
