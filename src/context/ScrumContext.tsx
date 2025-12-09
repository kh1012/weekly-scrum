"use client";

import { createContext, useContext, useState, useMemo, useCallback, ReactNode } from "react";
import type {
  WeeklyScrumData,
  WeekOption,
  FilterState,
  MultiFilterState,
  FilterOptionState,
  SelectMode,
  ScrumItem,
  ScrumStats,
} from "@/types/scrum";
import { weekKeyToSortValue, mergeDataInRange } from "@/lib/weekUtils";
import { filterItems, calculateStats } from "@/lib/utils";

interface ScrumContextValue {
  // 데이터
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  currentData: WeeklyScrumData | null;
  filteredItems: ScrumItem[];
  stats: ScrumStats;

  // 선택 상태
  selectMode: SelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;
  filters: FilterState;
  multiFilters: MultiFilterState;

  // 파생 데이터
  domains: string[];
  projects: string[];
  members: string[];
  modules: string[];
  features: string[];
  sortedWeekKeys: string[];

  // 필터 옵션 (활성화/비활성화 상태 포함)
  memberOptions: FilterOptionState[];
  domainOptions: FilterOptionState[];
  projectOptions: FilterOptionState[];
  moduleOptions: FilterOptionState[];
  featureOptions: FilterOptionState[];

  // 액션
  setSelectMode: (mode: SelectMode) => void;
  setSelectedWeekKey: (key: string) => void;
  setRangeStart: (key: string) => void;
  setRangeEnd: (key: string) => void;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;

  // 다중 선택 필터 액션
  toggleMultiFilter: (key: keyof Omit<MultiFilterState, "search">, value: string) => void;
  setMultiFilterAll: (key: keyof Omit<MultiFilterState, "search">, values: string[]) => void;
  clearMultiFilter: (key: keyof Omit<MultiFilterState, "search">) => void;
  resetMultiFilters: () => void;
  hasActiveMultiFilters: boolean;
}

const ScrumContext = createContext<ScrumContextValue | null>(null);

interface ScrumProviderProps {
  children: ReactNode;
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  initialWeekKey: string;
}

const defaultMultiFilters: MultiFilterState = {
  members: [],
  domains: [],
  projects: [],
  modules: [],
  features: [],
  search: "",
};

export function ScrumProvider({
  children,
  allData,
  weeks,
  initialWeekKey,
}: ScrumProviderProps) {
  const [selectMode, setSelectMode] = useState<SelectMode>("single");
  const [selectedWeekKey, setSelectedWeekKey] = useState(initialWeekKey);
  const [rangeStart, setRangeStart] = useState(initialWeekKey);
  const [rangeEnd, setRangeEnd] = useState(initialWeekKey);
  const [filters, setFilters] = useState<FilterState>({
    domain: "",
    project: "",
    module: "",
    member: "",
    search: "",
  });
  const [multiFilters, setMultiFilters] = useState<MultiFilterState>(defaultMultiFilters);

  // 정렬된 주차 키 목록
  const sortedWeekKeys = useMemo(() => {
    return Object.keys(allData).sort(
      (a, b) => weekKeyToSortValue(a) - weekKeyToSortValue(b)
    );
  }, [allData]);

  // 현재 데이터 (단일/범위 모드에 따라)
  const currentData = useMemo((): WeeklyScrumData | null => {
    if (selectMode === "single") {
      return allData[selectedWeekKey] ?? Object.values(allData)[0] ?? null;
    }
    return mergeDataInRange(allData, sortedWeekKeys, rangeStart, rangeEnd);
  }, [selectMode, selectedWeekKey, rangeStart, rangeEnd, allData, sortedWeekKeys]);

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    if (!currentData) return [];
    return filterItems(currentData.items, filters);
  }, [currentData, filters]);

  // 통계
  const stats = useMemo(() => calculateStats(filteredItems), [filteredItems]);

  // 도메인 목록
  const domains = useMemo(() => {
    if (!currentData) return [];
    const set = new Set(currentData.items.map((item) => item.domain));
    return Array.from(set).sort();
  }, [currentData]);

  // 프로젝트 목록
  const projects = useMemo(() => {
    if (!currentData) return [];
    const set = new Set(currentData.items.map((item) => item.project));
    return Array.from(set).sort();
  }, [currentData]);

  // 멤버 목록
  const members = useMemo(() => {
    if (!currentData) return [];
    const set = new Set(currentData.items.map((item) => item.name));
    return Array.from(set).sort();
  }, [currentData]);

  // 모듈 목록
  const modules = useMemo(() => {
    if (!currentData) return [];
    const set = new Set<string>();
    currentData.items.forEach((item) => {
      if (item.module) {
        set.add(item.module);
      }
    });
    return Array.from(set).sort();
  }, [currentData]);

  // 피쳐(topic) 목록
  const features = useMemo(() => {
    if (!currentData) return [];
    const set = new Set<string>();
    currentData.items.forEach((item) => {
      if (item.topic) {
        set.add(item.topic);
      }
    });
    return Array.from(set).sort();
  }, [currentData]);

  // 다중 필터가 적용된 아이템
  const multiFilteredItems = useMemo(() => {
    if (!currentData) return [];
    return currentData.items.filter((item) => {
      // 멤버 필터
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
      // 검색 필터
      if (multiFilters.search) {
        const searchLower = multiFilters.search.toLowerCase();
        const searchTarget = [
          item.name,
          item.domain,
          item.project,
          item.module || "",
          item.topic,
          item.plan,
          ...item.progress,
          ...item.next,
        ].join(" ").toLowerCase();
        if (!searchTarget.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [currentData, multiFilters]);

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

  // 멤버 옵션
  const memberOptions = useMemo(
    () => computeFilterOptions("members", members, (item) => item.name),
    [computeFilterOptions, members]
  );

  // 도메인 옵션
  const domainOptions = useMemo(
    () => computeFilterOptions("domains", domains, (item) => item.domain),
    [computeFilterOptions, domains]
  );

  // 프로젝트 옵션
  const projectOptions = useMemo(
    () => computeFilterOptions("projects", projects, (item) => item.project),
    [computeFilterOptions, projects]
  );

  // 모듈 옵션
  const moduleOptions = useMemo(
    () => computeFilterOptions("modules", modules, (item) => item.module),
    [computeFilterOptions, modules]
  );

  // 피쳐 옵션
  const featureOptions = useMemo(
    () => computeFilterOptions("features", features, (item) => item.topic),
    [computeFilterOptions, features]
  );

  // 필터 업데이트
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({ domain: "", project: "", module: "", member: "", search: "" });
  };

  // 다중 선택 필터 토글
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

  // 다중 선택 필터 전체 설정
  const setMultiFilterAll = useCallback(
    (key: keyof Omit<MultiFilterState, "search">, values: string[]) => {
      setMultiFilters((prev) => ({ ...prev, [key]: values }));
    },
    []
  );

  // 다중 선택 필터 초기화 (특정 키)
  const clearMultiFilter = useCallback(
    (key: keyof Omit<MultiFilterState, "search">) => {
      setMultiFilters((prev) => ({ ...prev, [key]: [] }));
    },
    []
  );

  // 다중 선택 필터 전체 초기화
  const resetMultiFilters = useCallback(() => {
    setMultiFilters(defaultMultiFilters);
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

  const value: ScrumContextValue = {
    allData,
    weeks,
    currentData,
    filteredItems,
    stats,
    selectMode,
    selectedWeekKey,
    rangeStart,
    rangeEnd,
    filters,
    multiFilters,
    domains,
    projects,
    members,
    modules,
    features,
    sortedWeekKeys,
    memberOptions,
    domainOptions,
    projectOptions,
    moduleOptions,
    featureOptions,
    setSelectMode,
    setSelectedWeekKey,
    setRangeStart,
    setRangeEnd,
    setFilters,
    updateFilter,
    resetFilters,
    toggleMultiFilter,
    setMultiFilterAll,
    clearMultiFilter,
    resetMultiFilters,
    hasActiveMultiFilters,
  };

  return (
    <ScrumContext.Provider value={value}>{children}</ScrumContext.Provider>
  );
}

export function useScrumContext() {
  const context = useContext(ScrumContext);
  if (!context) {
    throw new Error("useScrumContext must be used within a ScrumProvider");
  }
  return context;
}

