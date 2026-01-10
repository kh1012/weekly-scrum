/**
 * useSnapshotsState Hook
 * 
 * Snapshots 상태 및 localStorage 관리
 */

import { useState, useEffect } from "react";
import { getCurrentISOWeek } from "@/lib/utils/date";

const SNAPSHOTS_STATE_KEY = "snapshots-main-view-state";

interface SnapshotsViewState {
  selectedYear: number;
  selectedWeek: number;
  viewMode: "grid" | "list";
}

export function useSnapshotsState() {
  const currentWeek = getCurrentISOWeek();
  const [isStateInitialized, setIsStateInitialized] = useState(false);

  // 주차 선택 상태
  const [selectedYear, setSelectedYear] = useState(currentWeek.year);
  const [selectedWeek, setSelectedWeek] = useState(currentWeek.week);

  // 뷰 모드
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // 전체 펼치기/접기 상태
  const [allExpanded, setAllExpanded] = useState(true);

  // 선택 모드 상태
  const [isSelectMode, setIsSelectMode] = useState(false);

  // localStorage에서 상태 복원
  useEffect(() => {
    try {
      const savedState = localStorage.getItem(SNAPSHOTS_STATE_KEY);
      if (savedState) {
        const parsed: SnapshotsViewState = JSON.parse(savedState);
        if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
        if (parsed.selectedWeek) setSelectedWeek(parsed.selectedWeek);
        if (parsed.viewMode) setViewMode(parsed.viewMode);
      }
    } catch {
      // 무시
    }
    setIsStateInitialized(true);
  }, []);

  // 컴포넌트 마운트 시 현재 주차로 자동 선택
  useEffect(() => {
    if (!isStateInitialized) return;

    // localStorage에 저장된 값이 없으면 현재 주차로 설정
    const savedState = localStorage.getItem(SNAPSHOTS_STATE_KEY);
    if (!savedState) {
      setSelectedYear(currentWeek.year);
      setSelectedWeek(currentWeek.week);
    }
  }, [isStateInitialized, currentWeek.year, currentWeek.week]);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isStateInitialized) return;
    try {
      const stateToSave: SnapshotsViewState = {
        selectedYear,
        selectedWeek,
        viewMode,
      };
      localStorage.setItem(SNAPSHOTS_STATE_KEY, JSON.stringify(stateToSave));
    } catch {
      // 무시
    }
  }, [selectedYear, selectedWeek, viewMode, isStateInitialized]);

  return {
    isStateInitialized,
    selectedYear,
    setSelectedYear,
    selectedWeek,
    setSelectedWeek,
    viewMode,
    setViewMode,
    allExpanded,
    setAllExpanded,
    isSelectMode,
    setIsSelectMode,
  };
}
