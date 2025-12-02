"use client";

import { createContext, useContext, useState, useMemo, ReactNode } from "react";
import type {
  WeeklyInsightData,
  InsightWeekOption,
  InsightSelectMode,
  InsightData,
} from "@/types/insight";
import { weekKeyToSortValue } from "@/lib/weekUtils";

// 인라인 병합 함수 (server-only 모듈 사용 불가)
function mergeInsightDataInRangeClient(
  allData: Record<string, WeeklyInsightData>,
  sortedKeys: string[],
  startKey: string,
  endKey: string
): InsightData | null {
  const startIdx = sortedKeys.indexOf(startKey);
  const endIdx = sortedKeys.indexOf(endKey);

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const [fromIdx, toIdx] =
    startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

  const keysInRange = sortedKeys.slice(fromIdx, toIdx + 1);
  const dataInRange = keysInRange
    .map((key) => allData[key]?.insight)
    .filter((d): d is InsightData => d !== undefined);

  if (dataInRange.length === 0) {
    return null;
  }

  const mergedSummary: string[] = [];
  const mergedDecisionPoints: string[] = [];
  const mergedRisks: InsightData["risks"] = [];
  const mergedExecutionGap: InsightData["executionGap"] = [];
  const mergedQuadrant: InsightData["quadrantSummary"] = {
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    explanation: [],
  };

  for (const data of dataInRange) {
    data.executiveSummary.forEach((s) => {
      if (!mergedSummary.includes(s)) {
        mergedSummary.push(s);
      }
    });

    data.decisionPoints.forEach((d) => {
      if (!mergedDecisionPoints.includes(d)) {
        mergedDecisionPoints.push(d);
      }
    });

    data.risks.forEach((r) => {
      const exists = mergedRisks.some(
        (mr) => mr.item === r.item && mr.action === r.action
      );
      if (!exists) {
        mergedRisks.push(r);
      }
    });

    data.executionGap.forEach((e) => {
      const exists = mergedExecutionGap.some(
        (me) => me.name === e.name && me.project === e.project
      );
      if (!exists) {
        mergedExecutionGap.push(e);
      }
    });

    mergedQuadrant.q1 += data.quadrantSummary.q1;
    mergedQuadrant.q2 += data.quadrantSummary.q2;
    mergedQuadrant.q3 += data.quadrantSummary.q3;
    mergedQuadrant.q4 += data.quadrantSummary.q4;
    data.quadrantSummary.explanation.forEach((e) => {
      if (!mergedQuadrant.explanation.includes(e)) {
        mergedQuadrant.explanation.push(e);
      }
    });
  }

  return {
    executiveSummary: mergedSummary,
    decisionPoints: mergedDecisionPoints,
    risks: mergedRisks,
    executionGap: mergedExecutionGap,
    quadrantSummary: mergedQuadrant,
  };
}

interface InsightContextValue {
  // 데이터
  allData: Record<string, WeeklyInsightData>;
  weeks: InsightWeekOption[];
  currentData: WeeklyInsightData | null;
  currentInsight: InsightData | null;

  // 선택 상태
  selectMode: InsightSelectMode;
  selectedWeekKey: string;
  rangeStart: string;
  rangeEnd: string;

  // 파생 데이터
  sortedWeekKeys: string[];
  currentRange: string;

  // 액션
  setSelectMode: (mode: InsightSelectMode) => void;
  setSelectedWeekKey: (key: string) => void;
  setRangeStart: (key: string) => void;
  setRangeEnd: (key: string) => void;
}

const InsightContext = createContext<InsightContextValue | null>(null);

interface InsightProviderProps {
  children: ReactNode;
  allData: Record<string, WeeklyInsightData>;
  weeks: InsightWeekOption[];
  initialWeekKey: string;
}

export function InsightProvider({
  children,
  allData,
  weeks,
  initialWeekKey,
}: InsightProviderProps) {
  const [selectMode, setSelectMode] = useState<InsightSelectMode>("single");
  const [selectedWeekKey, setSelectedWeekKey] = useState(initialWeekKey);
  const [rangeStart, setRangeStart] = useState(initialWeekKey);
  const [rangeEnd, setRangeEnd] = useState(initialWeekKey);

  // 정렬된 주차 키 목록
  const sortedWeekKeys = useMemo(() => {
    return Object.keys(allData).sort(
      (a, b) => weekKeyToSortValue(a) - weekKeyToSortValue(b)
    );
  }, [allData]);

  // 현재 데이터 (단일/범위 모드에 따라)
  const currentData = useMemo((): WeeklyInsightData | null => {
    if (selectMode === "single") {
      return allData[selectedWeekKey] ?? Object.values(allData)[0] ?? null;
    }
    // 범위 모드에서는 첫 번째 주차의 메타 데이터 사용
    const startData = allData[rangeStart];
    if (!startData) return null;
    
    const mergedInsight = mergeInsightDataInRangeClient(
      allData,
      sortedWeekKeys,
      rangeStart,
      rangeEnd
    );
    
    if (!mergedInsight) return null;
    
    return {
      ...startData,
      insight: mergedInsight,
    };
  }, [selectMode, selectedWeekKey, rangeStart, rangeEnd, allData, sortedWeekKeys]);

  // 현재 인사이트 데이터
  const currentInsight = useMemo(() => {
    return currentData?.insight ?? null;
  }, [currentData]);

  // 현재 범위 문자열
  const currentRange = useMemo(() => {
    if (selectMode === "single") {
      return currentData?.range ?? "";
    }
    const startData = allData[rangeStart];
    const endData = allData[rangeEnd];
    if (!startData || !endData) return "";
    
    const startDate = startData.range.split("~")[0]?.trim() ?? "";
    const endDate = endData.range.split("~")[1]?.trim() ?? "";
    return `${startDate} ~ ${endDate}`;
  }, [selectMode, currentData, rangeStart, rangeEnd, allData]);

  const value: InsightContextValue = {
    allData,
    weeks,
    currentData,
    currentInsight,
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
    <InsightContext.Provider value={value}>{children}</InsightContext.Provider>
  );
}

export function useInsightContext() {
  const context = useContext(InsightContext);
  if (!context) {
    throw new Error("useInsightContext must be used within an InsightProvider");
  }
  return context;
}

