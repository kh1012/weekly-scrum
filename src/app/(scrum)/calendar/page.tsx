"use client";

import { useMemo } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { CalendarView } from "@/components/weekly-scrum/calendar";
import type { WeeklyScrumDataUnion } from "@/types/scrum";

export default function CalendarPage() {
  const { allData, filteredItems, hasActiveMultiFilters } = useScrumContext();

  // Record<string, WeeklyScrumData>를 배열로 변환
  const weeklyDataList = useMemo<WeeklyScrumDataUnion[]>(() => {
    return Object.values(allData);
  }, [allData]);

  return (
    <CalendarView
      weeklyDataList={weeklyDataList}
      filteredItems={hasActiveMultiFilters ? filteredItems : undefined}
    />
  );
}

