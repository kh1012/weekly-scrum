/**
 * Scrum 주차 선택 관리 Hook
 * 
 * 단일/범위 선택 모드와 선택된 주차 상태를 관리
 * localStorage에 상태를 저장하여 페이지 새로고침 시에도 유지
 */

import { useState, useCallback, useEffect } from "react";
import type { SelectMode, WeeklyScrumData } from "@/types/scrum";
import { getItem, setItem } from "@/lib/utils/storage";

const SELECTION_STORAGE_KEY = "scrum-selection-state";

interface StoredSelectionState {
  selectMode: SelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;
}

export interface UseScrumSelectionProps {
  initialWeekKey: string;
  allData: Record<string, WeeklyScrumData>;
}

export interface UseScrumSelectionReturn {
  selectMode: SelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;
  setSelectMode: (mode: SelectMode) => void;
  setSelectedWeekKey: (key: string) => void;
  setRangeStart: (key: string) => void;
  setRangeEnd: (key: string) => void;
}

/**
 * Scrum 주차 선택 상태 관리 Hook
 */
export function useScrumSelection({
  initialWeekKey,
  allData,
}: UseScrumSelectionProps): UseScrumSelectionReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectMode, setSelectModeState] = useState<SelectMode>("single");
  const [selectedWeekKey, setSelectedWeekKeyState] = useState(initialWeekKey);
  const [rangeStart, setRangeStartState] = useState(initialWeekKey);
  const [rangeEnd, setRangeEndState] = useState(initialWeekKey);

  // 초기 상태 복원 (localStorage에서)
  useEffect(() => {
    const stored = getItem<StoredSelectionState>(SELECTION_STORAGE_KEY);
    
    if (stored) {
      if (stored.selectMode) {
        setSelectModeState(stored.selectMode);
      }
      if (stored.selectedWeekKey && allData[stored.selectedWeekKey]) {
        setSelectedWeekKeyState(stored.selectedWeekKey);
      }
      if (stored.rangeStart && allData[stored.rangeStart]) {
        setRangeStartState(stored.rangeStart);
      }
      if (stored.rangeEnd && allData[stored.rangeEnd]) {
        setRangeEndState(stored.rangeEnd);
      }
    }
    
    setIsInitialized(true);
  }, [allData]);

  // 상태 변경 시 localStorage에 저장
  useEffect(() => {
    if (!isInitialized) return;
    
    setItem<StoredSelectionState>(SELECTION_STORAGE_KEY, {
      selectMode,
      selectedWeekKey,
      rangeStart,
      rangeEnd,
    });
  }, [isInitialized, selectMode, selectedWeekKey, rangeStart, rangeEnd]);

  // Wrapper 함수들 (상태 변경 + 저장)
  const setSelectMode = useCallback((mode: SelectMode) => {
    setSelectModeState(mode);
  }, []);

  const setSelectedWeekKey = useCallback((key: string) => {
    setSelectedWeekKeyState(key);
  }, []);

  const setRangeStart = useCallback((key: string) => {
    setRangeStartState(key);
  }, []);

  const setRangeEnd = useCallback((key: string) => {
    setRangeEndState(key);
  }, []);

  return {
    selectMode,
    selectedWeekKey,
    rangeStart,
    rangeEnd,
    setSelectMode,
    setSelectedWeekKey,
    setRangeStart,
    setRangeEnd,
  };
}
