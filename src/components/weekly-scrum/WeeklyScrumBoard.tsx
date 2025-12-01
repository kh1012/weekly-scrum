"use client";

import { useState, useMemo } from "react";
import type { WeeklyScrumData, FilterState, ScrumItem } from "@/types/scrum";
import { ScrumCard } from "./ScrumCard";
import { ProjectGroupView } from "./ProjectGroupView";
import { SummaryView } from "./SummaryView";
import { MatrixView } from "./MatrixView";
import { RiskFocusView } from "./RiskFocusView";

type ViewMode = "cards" | "projects" | "summary" | "matrix" | "risks";
type SelectMode = "single" | "range";

interface WeekOption {
  year: number;
  month: number;
  week: string;
  label: string;
  filePath: string;
}

interface WeeklyScrumBoardProps {
  allData: Record<string, WeeklyScrumData>;
  weeks: WeekOption[];
  initialWeekKey: string;
}

// 주차 키를 정렬 가능한 숫자로 변환
function weekKeyToSortValue(key: string): number {
  const [year, month, week] = key.split("-");
  const weekNum = parseInt(week.replace("W", ""), 10);
  return parseInt(year, 10) * 10000 + parseInt(month, 10) * 100 + weekNum;
}

export function WeeklyScrumBoard({ allData, weeks, initialWeekKey }: WeeklyScrumBoardProps) {
  const [selectMode, setSelectMode] = useState<SelectMode>("single");
  const [selectedWeekKey, setSelectedWeekKey] = useState(initialWeekKey);
  const [rangeStart, setRangeStart] = useState(initialWeekKey);
  const [rangeEnd, setRangeEnd] = useState(initialWeekKey);
  const [viewMode, setViewMode] = useState<ViewMode>("summary");
  const [filters, setFilters] = useState<FilterState>({
    domain: "",
    project: "",
    search: "",
  });

  // 모든 주차 키를 정렬된 순서로
  const sortedWeekKeys = useMemo(() => {
    return Object.keys(allData).sort((a, b) => weekKeyToSortValue(a) - weekKeyToSortValue(b));
  }, [allData]);

  // 단일 모드: 현재 선택된 주차의 데이터
  // 범위 모드: 범위 내 모든 데이터 합치기
  const mergedData = useMemo((): WeeklyScrumData | null => {
    if (selectMode === "single") {
      return allData[selectedWeekKey] ?? Object.values(allData)[0] ?? null;
    }

    // 범위 모드
    const startValue = weekKeyToSortValue(rangeStart);
    const endValue = weekKeyToSortValue(rangeEnd);
    const minValue = Math.min(startValue, endValue);
    const maxValue = Math.max(startValue, endValue);

    const keysInRange = sortedWeekKeys.filter((key) => {
      const value = weekKeyToSortValue(key);
      return value >= minValue && value <= maxValue;
    });

    if (keysInRange.length === 0) {
      return Object.values(allData)[0] ?? null;
    }

    // 범위 내 모든 아이템 합치기
    const allItems: ScrumItem[] = [];
    keysInRange.forEach((key) => {
      const data = allData[key];
      if (data) {
        allItems.push(...data.items);
      }
    });

    // 첫 번째와 마지막 데이터로 범위 정보 생성
    const firstData = allData[keysInRange[0]];
    const lastData = allData[keysInRange[keysInRange.length - 1]];

    return {
      year: firstData.year,
      month: firstData.month,
      week: `${firstData.week} ~ ${lastData.week}`,
      range: `${firstData.range.split(" ~ ")[0]} ~ ${lastData.range.split(" ~ ")[1]}`,
      items: allItems,
    };
  }, [selectMode, selectedWeekKey, rangeStart, rangeEnd, allData, sortedWeekKeys]);

  const data = mergedData;

  // 연도 목록
  const years = useMemo(() => {
    const set = new Set(weeks.map((w) => w.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [weeks]);

  // 선택된 연도에 해당하는 월 목록
  const [selectedYear, setSelectedYear] = useState(data?.year ?? years[0]);
  const months = useMemo(() => {
    const filtered = weeks.filter((w) => w.year === selectedYear);
    const set = new Set(filtered.map((w) => w.month));
    return Array.from(set).sort((a, b) => b - a);
  }, [weeks, selectedYear]);

  // 선택된 연도/월에 해당하는 주차 목록
  const [selectedMonth, setSelectedMonth] = useState(data?.month ?? months[0]);
  const availableWeeks = useMemo(() => {
    return weeks.filter((w) => w.year === selectedYear && w.month === selectedMonth);
  }, [weeks, selectedYear, selectedMonth]);

  // 고유한 도메인 목록 추출
  const domains = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.items.map((item) => item.domain));
    return Array.from(set).sort();
  }, [data]);

  // 고유한 프로젝트 목록 추출
  const projects = useMemo(() => {
    if (!data) return [];
    const set = new Set(data.items.map((item) => item.project));
    return Array.from(set).sort();
  }, [data]);

  // 필터링된 아이템
  const filteredItems = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => {
      if (filters.domain && item.domain !== filters.domain) {
        return false;
      }
      if (filters.project && item.project !== filters.project) {
        return false;
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchTarget = [
          item.name,
          item.topic,
          item.progress,
          item.risk,
          item.next,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchTarget.includes(searchLower)) {
          return false;
        }
      }
      return true;
    });
  }, [data, filters]);

  // 통계 계산
  const stats = useMemo(() => {
    const total = filteredItems.length;
    const avgProgress =
      total > 0
        ? Math.round(
            filteredItems.reduce((sum, item) => sum + item.progressPercent, 0) /
              total
          )
        : 0;
    const atRisk = filteredItems.filter((item) => item.risk && item.risk !== "-").length;

    return { total, avgProgress, atRisk };
  }, [filteredItems]);

  // 연도 변경 핸들러
  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    const newMonths = weeks.filter((w) => w.year === year);
    const monthSet = new Set(newMonths.map((w) => w.month));
    const sortedMonths = Array.from(monthSet).sort((a, b) => b - a);
    const newMonth = sortedMonths[0];
    setSelectedMonth(newMonth);

    const newWeeks = weeks.filter((w) => w.year === year && w.month === newMonth);
    if (newWeeks.length > 0) {
      const newKey = `${year}-${newMonth}-${newWeeks[0].week}`;
      setSelectedWeekKey(newKey);
      if (selectMode === "range") {
        setRangeStart(newKey);
        setRangeEnd(newKey);
      }
    }
  };

  // 월 변경 핸들러
  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    const newWeeks = weeks.filter((w) => w.year === selectedYear && w.month === month);
    if (newWeeks.length > 0) {
      const newKey = `${selectedYear}-${month}-${newWeeks[0].week}`;
      setSelectedWeekKey(newKey);
      if (selectMode === "range") {
        setRangeStart(newKey);
        setRangeEnd(newKey);
      }
    }
  };

  // 주차 변경 핸들러 (단일 모드)
  const handleWeekChange = (week: string) => {
    setSelectedWeekKey(`${selectedYear}-${selectedMonth}-${week}`);
  };

  // 범위 선택 핸들러
  const handleRangeChange = (type: "start" | "end", weekKey: string) => {
    if (type === "start") {
      setRangeStart(weekKey);
    } else {
      setRangeEnd(weekKey);
    }
  };

  // 선택 모드 변경
  const handleSelectModeChange = (mode: SelectMode) => {
    setSelectMode(mode);
    if (mode === "range") {
      setRangeStart(selectedWeekKey);
      setRangeEnd(selectedWeekKey);
    }
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] flex items-center justify-center">
        <p className="text-[#656d76]">데이터가 없습니다.</p>
      </div>
    );
  }

  // 범위 선택용 전체 주차 목록 생성
  const allWeekOptions = sortedWeekKeys.map((key) => {
    const d = allData[key];
    return {
      key,
      label: `${d.year}년 ${d.month}월 ${d.week}`,
    };
  });

  return (
    <div className="min-h-screen bg-[#f6f8fa]">
      {/* Header */}
      <header className="bg-white border-b border-[#d0d7de]">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          {/* 상단: 타이틀 + 주차 선택 + 뷰 전환 + 통계 */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-semibold text-[#1f2328]">
                Weekly Scrum
              </h1>

              {/* 단일/범위 모드 토글 */}
              <div className="flex items-center bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-0.5">
                <button
                  onClick={() => handleSelectModeChange("single")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    selectMode === "single"
                      ? "bg-white text-[#1f2328] shadow-sm"
                      : "text-[#656d76] hover:text-[#1f2328]"
                  }`}
                >
                  단일
                </button>
                <button
                  onClick={() => handleSelectModeChange("range")}
                  className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors ${
                    selectMode === "range"
                      ? "bg-white text-[#1f2328] shadow-sm"
                      : "text-[#656d76] hover:text-[#1f2328]"
                  }`}
                >
                  범위
                </button>
              </div>

              {/* 주차 선택 */}
              {selectMode === "single" ? (
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={(e) => handleYearChange(Number(e.target.value))}
                      className="appearance-none pl-2 pr-6 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}년
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(Number(e.target.value))}
                      className="appearance-none pl-2 pr-6 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
                    >
                      {months.map((month) => (
                        <option key={month} value={month}>
                          {month}월
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <div className="relative">
                    <select
                      value={selectedWeekKey.split("-")[2] || ""}
                      onChange={(e) => handleWeekChange(e.target.value)}
                      className="appearance-none pl-2 pr-6 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
                    >
                      {availableWeeks.map((w) => (
                        <option key={w.week} value={w.week}>
                          {w.week}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="relative">
                    <select
                      value={rangeStart}
                      onChange={(e) => handleRangeChange("start", e.target.value)}
                      className="appearance-none pl-2 pr-6 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
                    >
                      {allWeekOptions.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  <span className="text-xs text-[#656d76]">~</span>
                  <div className="relative">
                    <select
                      value={rangeEnd}
                      onChange={(e) => handleRangeChange("end", e.target.value)}
                      className="appearance-none pl-2 pr-6 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
                    >
                      {allWeekOptions.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <svg className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* 뷰 전환 버튼 */}
              <div className="flex items-center bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-0.5">
                <button
                  onClick={() => setViewMode("summary")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === "summary"
                      ? "bg-white text-[#1f2328] shadow-sm"
                      : "text-[#656d76] hover:text-[#1f2328]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    요약
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("cards")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === "cards"
                      ? "bg-white text-[#1f2328] shadow-sm"
                      : "text-[#656d76] hover:text-[#1f2328]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    카드
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("projects")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === "projects"
                      ? "bg-white text-[#1f2328] shadow-sm"
                      : "text-[#656d76] hover:text-[#1f2328]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    프로젝트
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("matrix")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === "matrix"
                      ? "bg-white text-[#1f2328] shadow-sm"
                      : "text-[#656d76] hover:text-[#1f2328]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    매트릭스
                  </span>
                </button>
                <button
                  onClick={() => setViewMode("risks")}
                  className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                    viewMode === "risks"
                      ? "bg-white text-[#1f2328] shadow-sm"
                      : "text-[#656d76] hover:text-[#1f2328]"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    리스크
                  </span>
                </button>
              </div>
            </div>

            {/* 통계 */}
            <div className="flex items-center gap-2">
              <div className="text-center px-3 py-1 bg-[#f6f8fa] rounded-md border border-[#d0d7de]">
                <span className="text-sm font-semibold text-[#1f2328]">{stats.total}</span>
                <span className="text-xs text-[#656d76] ml-1">항목</span>
              </div>
              <div className="text-center px-3 py-1 bg-[#f6f8fa] rounded-md border border-[#d0d7de]">
                <span className="text-sm font-semibold text-[#1f2328]">{stats.avgProgress}%</span>
                <span className="text-xs text-[#656d76] ml-1">평균</span>
              </div>
              <div className="text-center px-3 py-1 bg-[#f6f8fa] rounded-md border border-[#d0d7de]">
                <span className="text-sm font-semibold text-[#1f2328]">{stats.atRisk}</span>
                <span className="text-xs text-[#656d76] ml-1">리스크</span>
              </div>
            </div>
          </div>

          {/* 날짜 범위 */}
          <p className="text-xs text-[#656d76] mb-3">
            {data.range}
            {selectMode === "range" && (
              <span className="ml-2 px-1.5 py-0.5 bg-[#ddf4ff] text-[#0969da] rounded text-[10px] font-medium">
                누적 보기
              </span>
            )}
          </p>

          {/* 검색창 - 중앙 */}
          <div className="flex justify-center mb-3">
            <div className="relative w-full max-w-md">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#656d76]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="이름, 토픽, 내용 검색..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-9 pr-3 py-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#1f2328] placeholder:text-[#8c959f] focus:outline-none focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* 필터 - 우측 정렬 */}
          <div className="flex justify-end gap-2">
            <div className="relative">
              <select
                value={filters.domain}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, domain: e.target.value }))
                }
                className="appearance-none pl-2.5 pr-7 py-1 bg-white border border-[#d0d7de] rounded-md text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
              >
                <option value="">모든 도메인</option>
                {domains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domain}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <div className="relative">
              <select
                value={filters.project}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, project: e.target.value }))
                }
                className="appearance-none pl-2.5 pr-7 py-1 bg-white border border-[#d0d7de] rounded-md text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
              >
                <option value="">모든 프로젝트</option>
                {projects.map((project) => (
                  <option key={project} value={project}>
                    {project}
                  </option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            {(filters.domain || filters.project || filters.search) && (
              <button
                onClick={() =>
                  setFilters({ domain: "", project: "", search: "" })
                }
                className="px-2 py-1 text-xs text-[#656d76] hover:text-[#1f2328] transition-colors"
              >
                초기화
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
        {/* 요약 뷰 */}
        {viewMode === "summary" && (
          <SummaryView items={filteredItems} />
        )}

        {/* 매트릭스 뷰 */}
        {viewMode === "matrix" && (
          <MatrixView items={filteredItems} />
        )}

        {/* 리스크 뷰 */}
        {viewMode === "risks" && (
          <RiskFocusView items={filteredItems} />
        )}

        {/* 프로젝트 뷰 */}
        {viewMode === "projects" && (
          <ProjectGroupView items={filteredItems} />
        )}

        {/* 카드 뷰 */}
        {viewMode === "cards" && (
          filteredItems.length > 0 ? (
            <div className="space-y-6">
              {/* 진행 중인 항목 */}
              {filteredItems.filter((item) => item.progressPercent < 100).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#0969da]" />
                    <h2 className="text-sm font-semibold text-[#1f2328]">
                      진행 중
                    </h2>
                    <span className="text-xs text-[#656d76]">
                      {filteredItems.filter((item) => item.progressPercent < 100).length}개
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredItems
                      .filter((item) => item.progressPercent < 100)
                      .sort((a, b) => b.progressPercent - a.progressPercent)
                      .map((item, index) => (
                        <ScrumCard
                          key={`progress-${item.name}-${item.project}-${item.topic}-${index}`}
                          item={item}
                          isCompleted={false}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* 완료된 항목 */}
              {filteredItems.filter((item) => item.progressPercent >= 100).length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-[#1a7f37]" />
                    <h2 className="text-sm font-semibold text-[#1f2328]">
                      완료
                    </h2>
                    <span className="text-xs text-[#656d76]">
                      {filteredItems.filter((item) => item.progressPercent >= 100).length}개
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredItems
                      .filter((item) => item.progressPercent >= 100)
                      .map((item, index) => (
                        <ScrumCard
                          key={`completed-${item.name}-${item.project}-${item.topic}-${index}`}
                          item={item}
                          isCompleted={true}
                        />
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-md border border-[#d0d7de]">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-[#8c959f]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <p className="text-[#656d76] font-medium">
                검색 결과가 없습니다
              </p>
              <p className="text-sm text-[#8c959f] mt-1">
                필터 조건을 변경해보세요
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
