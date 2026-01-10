/**
 * usePlansFilters Hook
 * 
 * Plans 필터링 및 URL 상태 관리
 */

import { useState, useCallback, useMemo } from "react";
import type { FilterState, GroupByOption, PlansBoardMode } from "../types";
import type { GanttFilterState } from "../GanttFilters";
import { defaultGanttFilters } from "../GanttFilters";

interface UsePlansFiltersProps {
  mode: PlansBoardMode;
  initialFilters?: FilterState;
  initialMonth: string;
}

export function usePlansFilters({
  mode,
  initialFilters = {},
  initialMonth,
}: UsePlansFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [ganttFilters, setGanttFilters] =
    useState<GanttFilterState>(defaultGanttFilters);

  // 기간 설정 (기본: 현재 월 기준 3개월)
  const [startMonth, setStartMonth] = useState(() => {
    const [y, m] = initialMonth.split("-").map(Number);
    const start = new Date(y, m - 2, 1); // 1개월 전부터
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  const [endMonth, setEndMonth] = useState(() => {
    const [y, m] = initialMonth.split("-").map(Number);
    const end = new Date(y, m, 1); // 1개월 후까지
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  // URL 파라미터 빌드
  const buildUrlWithParams = useCallback(
    (newFilters: FilterState) => {
      const basePath = mode === "admin" ? "/admin/plans" : "/works/plans";
      const params = new URLSearchParams();

      if (newFilters.type) params.set("type", newFilters.type);
      if (newFilters.project) params.set("project", newFilters.project);
      if (newFilters.module) params.set("module", newFilters.module);
      if (newFilters.feature) params.set("feature", newFilters.feature);
      if (newFilters.status) params.set("status", newFilters.status);
      if (newFilters.stage) params.set("stage", newFilters.stage);
      if (newFilters.assigneeUserId)
        params.set("assignee", newFilters.assigneeUserId);

      const queryString = params.toString();
      return queryString ? `${basePath}?${queryString}` : basePath;
    },
    [mode]
  );

  // 필터 변경 핸들러
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      const url = buildUrlWithParams(newFilters);
      window.history.pushState({}, "", url);
    },
    [buildUrlWithParams]
  );

  return {
    filters,
    setFilters,
    groupBy,
    setGroupBy,
    ganttFilters,
    setGanttFilters,
    startMonth,
    setStartMonth,
    endMonth,
    setEndMonth,
    buildUrlWithParams,
    handleFiltersChange,
  };
}
