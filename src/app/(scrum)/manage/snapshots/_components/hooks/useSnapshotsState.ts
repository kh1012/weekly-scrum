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
    console.log('[useSnapshotsState] Initializing with current week:', currentWeek);
    
    try {
      const savedState = localStorage.getItem(SNAPSHOTS_STATE_KEY);
      console.log('[useSnapshotsState] Saved state from localStorage:', savedState);
      
      if (savedState) {
        const parsed: SnapshotsViewState = JSON.parse(savedState);
        console.log('[useSnapshotsState] Parsed state:', parsed);
        
        // 저장된 주차가 현재 주차보다 미래이면 현재 주차로 리셋
        const savedDate = new Date(parsed.selectedYear, 0, 1 + (parsed.selectedWeek - 1) * 7);
        const currentDate = new Date(currentWeek.year, 0, 1 + (currentWeek.week - 1) * 7);
        
        if (savedDate > currentDate) {
          console.log('[useSnapshotsState] Saved week is in the future, resetting to current week');
          setSelectedYear(currentWeek.year);
          setSelectedWeek(currentWeek.week);
          // 미래 주차를 저장하지 않도록 localStorage 초기화
          localStorage.removeItem(SNAPSHOTS_STATE_KEY);
        } else {
          if (parsed.selectedYear) setSelectedYear(parsed.selectedYear);
          if (parsed.selectedWeek) setSelectedWeek(parsed.selectedWeek);
        }
        
        if (parsed.viewMode) setViewMode(parsed.viewMode);
      } else {
        // localStorage에 저장된 값이 없으면 현재 주차로 설정
        console.log('[useSnapshotsState] No saved state, using current week');
        setSelectedYear(currentWeek.year);
        setSelectedWeek(currentWeek.week);
      }
    } catch (error) {
      console.error('[useSnapshotsState] Error loading state:', error);
      // 에러 발생 시 현재 주차로 리셋
      setSelectedYear(currentWeek.year);
      setSelectedWeek(currentWeek.week);
    }
    setIsStateInitialized(true);
  }, []);

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
