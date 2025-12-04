"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import type {
  WeeklySharesData,
  SharesWeekOption,
  SharesSelectMode,
} from "@/types/shares";
import { weekKeyToSortValue } from "@/lib/weekUtils";

// 인라인 병합 함수 (server-only 모듈 사용 불가)
function mergeSharesDataInRangeClient(
  allData: Record<string, WeeklySharesData>,
  sortedKeys: string[],
  startKey: string,
  endKey: string
): string | null {
  const startIdx = sortedKeys.indexOf(startKey);
  const endIdx = sortedKeys.indexOf(endKey);

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const [fromIdx, toIdx] =
    startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

  const keysInRange = sortedKeys.slice(fromIdx, toIdx + 1);
  const dataInRange = keysInRange
    .map((key) => allData[key])
    .filter((d): d is WeeklySharesData => d !== undefined);

  if (dataInRange.length === 0) {
    return null;
  }

  // 범위 내 모든 마크다운 내용을 합침 (주차별 구분자 포함)
  const mergedContent = dataInRange
    .map((data) => {
      const header = `## ${data.year}년 ${data.month}월 ${data.week}\n\n`;
      return header + data.content;
    })
    .join("\n\n---\n\n");

  return mergedContent;
}

interface SharesContextValue {
  // 데이터
  allData: Record<string, WeeklySharesData>;
  weeks: SharesWeekOption[];
  currentData: WeeklySharesData | null;
  currentContent: string | null;

  // 선택 상태
  selectMode: SharesSelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;

  // 파생 데이터
  sortedWeekKeys: string[];
  currentRange: string;

  // 액션
  setSelectMode: (mode: SharesSelectMode) => void;
  setSelectedWeekKey: (key: string) => void;
  setRangeStart: (key: string) => void;
  setRangeEnd: (key: string) => void;
}

const SharesContext = createContext<SharesContextValue | null>(null);

interface SharesProviderProps {
  children: ReactNode;
  allData: Record<string, WeeklySharesData>;
  weeks: SharesWeekOption[];
  initialWeekKey: string;
}

export function SharesProvider({
  children,
  allData,
  weeks,
  initialWeekKey,
}: SharesProviderProps) {
  const [selectMode, setSelectMode] = useState<SharesSelectMode>("single");
  const [selectedWeekKey, setSelectedWeekKey] = useState(initialWeekKey);
  const [rangeStart, setRangeStart] = useState(initialWeekKey);
  const [rangeEnd, setRangeEnd] = useState(initialWeekKey);

  // 정렬된 주차 키 목록
  const sortedWeekKeys = useMemo(() => {
    return Object.keys(allData).sort(
      (a, b) => weekKeyToSortValue(a) - weekKeyToSortValue(b)
    );
  }, [allData]);

  // 현재 데이터 (단일 모드)
  const currentData = useMemo((): WeeklySharesData | null => {
    if (selectMode === "single") {
      return allData[selectedWeekKey] ?? Object.values(allData)[0] ?? null;
    }
    return null;
  }, [selectMode, selectedWeekKey, allData]);

  // 현재 컨텐츠 (단일/범위 모드에 따라)
  const currentContent = useMemo((): string | null => {
    if (selectMode === "single") {
      return currentData?.content ?? null;
    }
    return mergeSharesDataInRangeClient(
      allData,
      sortedWeekKeys,
      rangeStart,
      rangeEnd
    );
  }, [selectMode, currentData, rangeStart, rangeEnd, allData, sortedWeekKeys]);

  // 현재 범위 문자열
  const currentRange = useMemo(() => {
    if (selectMode === "single") {
      if (!currentData) return "";
      return `${currentData.year}년 ${currentData.month}월 ${currentData.week}`;
    }
    const startData = allData[rangeStart];
    const endData = allData[rangeEnd];
    if (!startData || !endData) return "";

    return `${startData.year}년 ${startData.month}월 ${startData.week} ~ ${endData.year}년 ${endData.month}월 ${endData.week}`;
  }, [selectMode, currentData, rangeStart, rangeEnd, allData]);

  const value: SharesContextValue = {
    allData,
    weeks,
    currentData,
    currentContent,
    selectMode,
    selectedWeekKey,
    rangeStart,
    rangeEnd,
    sortedWeekKeys,
    currentRange,
    setSelectMode,
    setSelectedWeekKey,
    setRangeStart,
    setRangeEnd,
  };

  return (
    <SharesContext.Provider value={value}>{children}</SharesContext.Provider>
  );
}

export function useSharesContext() {
  const context = useContext(SharesContext);
  if (!context) {
    throw new Error("useSharesContext must be used within a SharesProvider");
  }
  return context;
}

