/**
 * Scrum Context
 * 
 * 3개의 Hook을 조합하여 Scrum 관련 상태를 제공:
 * - useScrumData: 데이터 관리
 * - useScrumSelection: 주차 선택 관리
 * - useScrumFilters: 필터 관리
 */

"use client";

import { createContext, useContext, ReactNode } from "react";
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
import { useScrumData } from "@/hooks/useScrumData";
import { useScrumSelection } from "@/hooks/useScrumSelection";
import { useScrumFilters } from "@/hooks/useScrumFilters";

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
  setSearchTerm: (search: string) => void;
  hasActiveMultiFilters: boolean;
}

const ScrumContext = createContext<ScrumContextValue | null>(null);

interface ScrumProviderProps {
  children: ReactNode;
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  initialWeekKey: string;
}

/**
 * Scrum Provider
 * 3개의 독립적인 Hook을 조합하여 Context를 제공
 */
export function ScrumProvider({
  children,
  allData,
  weeks,
  initialWeekKey,
}: ScrumProviderProps) {
  // 1. 주차 선택 관리
  const selection = useScrumSelection({
    initialWeekKey,
    allData,
  });

  // 2. 데이터 관리
  const data = useScrumData({
    allData,
    weeks,
    selectMode: selection.selectMode,
    selectedWeekKey: selection.selectedWeekKey,
    rangeStart: selection.rangeStart,
    rangeEnd: selection.rangeEnd,
  });

  // 3. 필터 관리
  const filters = useScrumFilters({
    currentData: data.currentData,
  });

  // Context value 조합
  const value: ScrumContextValue = {
    // 데이터
    allData: data.allData,
    weeks: data.weeks,
    currentData: data.currentData,
    filteredItems: filters.filteredItems,
    stats: filters.stats,

    // 선택 상태
    selectMode: selection.selectMode,
    selectedWeekKey: selection.selectedWeekKey,
    rangeStart: selection.rangeStart,
    rangeEnd: selection.rangeEnd,
    filters: filters.filters,
    multiFilters: filters.multiFilters,

    // 파생 데이터
    domains: filters.domains,
    projects: filters.projects,
    members: filters.members,
    modules: filters.modules,
    features: filters.features,
    sortedWeekKeys: data.sortedWeekKeys,

    // 필터 옵션
    memberOptions: filters.memberOptions,
    domainOptions: filters.domainOptions,
    projectOptions: filters.projectOptions,
    moduleOptions: filters.moduleOptions,
    featureOptions: filters.featureOptions,

    // 액션
    setSelectMode: selection.setSelectMode,
    setSelectedWeekKey: selection.setSelectedWeekKey,
    setRangeStart: selection.setRangeStart,
    setRangeEnd: selection.setRangeEnd,
    setFilters: filters.setFilters,
    updateFilter: filters.updateFilter,
    resetFilters: filters.resetFilters,
    toggleMultiFilter: filters.toggleMultiFilter,
    setMultiFilterAll: filters.setMultiFilterAll,
    clearMultiFilter: filters.clearMultiFilter,
    resetMultiFilters: filters.resetMultiFilters,
    setSearchTerm: filters.setSearchTerm,
    hasActiveMultiFilters: filters.hasActiveMultiFilters,
  };

  return (
    <ScrumContext.Provider value={value}>{children}</ScrumContext.Provider>
  );
}

/**
 * Scrum Context Hook
 */
export function useScrumContext() {
  const context = useContext(ScrumContext);
  if (!context) {
    throw new Error("useScrumContext must be used within a ScrumProvider");
  }
  return context;
}
