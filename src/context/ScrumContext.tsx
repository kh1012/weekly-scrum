"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import type {
  WeeklyScrumData,
  WeekOption,
  FilterState,
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

  // 파생 데이터
  domains: string[];
  projects: string[];
  sortedWeekKeys: string[];

  // 액션
  setSelectMode: (mode: SelectMode) => void;
  setSelectedWeekKey: (key: string) => void;
  setRangeStart: (key: string) => void;
  setRangeEnd: (key: string) => void;
  setFilters: (filters: FilterState) => void;
  updateFilter: (key: keyof FilterState, value: string) => void;
  resetFilters: () => void;
}

const ScrumContext = createContext<ScrumContextValue | null>(null);

interface ScrumProviderProps {
  children: ReactNode;
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  initialWeekKey: string;
}

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
    search: "",
  });

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

  // 필터 업데이트
  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // 필터 초기화
  const resetFilters = () => {
    setFilters({ domain: "", project: "", search: "" });
  };

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
    domains,
    projects,
    sortedWeekKeys,
    setSelectMode,
    setSelectedWeekKey,
    setRangeStart,
    setRangeEnd,
    setFilters,
    updateFilter,
    resetFilters,
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

