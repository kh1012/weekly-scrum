"use client";

import { useMemo } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import type { SelectMode } from "@/types/scrum";

interface WeekSelectorProps {
  isMobile?: boolean;
}

export function WeekSelector({ isMobile = false }: WeekSelectorProps) {
  const {
    allData,
    weeks,
    currentData,
    selectMode,
    selectedWeekKey,
    rangeStart,
    rangeEnd,
    sortedWeekKeys,
    setSelectMode,
    setSelectedWeekKey,
    setRangeStart,
    setRangeEnd,
  } = useScrumContext();

  const years = useMemo(() => {
    const set = new Set(weeks.map((w) => w.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [weeks]);

  const selectedYear = currentData?.year ?? years[0];

  const months = useMemo(() => {
    const filtered = weeks.filter((w) => w.year === selectedYear);
    const set = new Set(filtered.map((w) => w.month));
    return Array.from(set).sort((a, b) => b - a);
  }, [weeks, selectedYear]);

  const selectedMonth = currentData?.month ?? months[0];

  const availableWeeks = useMemo(() => {
    return weeks.filter((w) => w.year === selectedYear && w.month === selectedMonth);
  }, [weeks, selectedYear, selectedMonth]);

  const allWeekOptions = sortedWeekKeys.map((key) => {
    const d = allData[key];
    return { key, label: `${d.year}년 ${d.month}월 ${d.week}` };
  });

  const handleModeChange = (mode: SelectMode) => {
    setSelectMode(mode);
    if (mode === "range") {
      setRangeStart(selectedWeekKey);
      setRangeEnd(selectedWeekKey);
    }
  };

  const handleYearChange = (year: number) => {
    const newMonths = weeks.filter((w) => w.year === year);
    const monthSet = new Set(newMonths.map((w) => w.month));
    const sortedMonths = Array.from(monthSet).sort((a, b) => b - a);
    const newMonth = sortedMonths[0];
    const newWeeks = weeks.filter((w) => w.year === year && w.month === newMonth);
    if (newWeeks.length > 0) {
      setSelectedWeekKey(newWeeks[0].key);
    }
  };

  const handleMonthChange = (month: number) => {
    const newWeeks = weeks.filter((w) => w.year === selectedYear && w.month === month);
    if (newWeeks.length > 0) {
      setSelectedWeekKey(newWeeks[0].key);
    }
  };

  const handleWeekChange = (week: string) => {
    setSelectedWeekKey(`${selectedYear}-${selectedMonth}-${week}`);
  };

  const selectBaseClass = `
    appearance-none bg-white border border-slate-200 rounded-md
    text-slate-700 font-medium
    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
    cursor-pointer transition-all
    hover:border-slate-300 hover:bg-slate-50
  `;

  const selectSizeClass = isMobile 
    ? "px-2.5 py-1.5 text-xs pr-7" 
    : "px-3 py-1.5 text-sm pr-8";

  const toggleBaseClass = `px-2.5 py-1 text-xs font-medium rounded transition-all`;

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {/* 상단: 모드 토글 + 날짜 범위 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
            <button
              onClick={() => handleModeChange("single")}
              className={`${toggleBaseClass} ${
                selectMode === "single"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              주차
            </button>
            <button
              onClick={() => handleModeChange("range")}
              className={`${toggleBaseClass} ${
                selectMode === "range"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500"
              }`}
            >
              범위
            </button>
          </div>
          
          {/* 날짜 범위 표시 */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="truncate max-w-[140px]">{currentData?.range}</span>
            {selectMode === "range" && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium shrink-0">
                누적
              </span>
            )}
          </div>
        </div>

        {/* 하단: 셀렉터 */}
        {selectMode === "single" ? (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className={`${selectBaseClass} ${selectSizeClass} flex-1 min-w-0`}
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className={`${selectBaseClass} ${selectSizeClass} w-16`}
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
            <select
              value={selectedWeekKey.split("-")[2] || ""}
              onChange={(e) => handleWeekChange(e.target.value)}
              className={`${selectBaseClass} ${selectSizeClass} w-16`}
            >
              {availableWeeks.map((w) => (
                <option key={w.week} value={w.week}>{w.week}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <select
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className={`${selectBaseClass} ${selectSizeClass} flex-1 min-w-0`}
            >
              {allWeekOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400 shrink-0">~</span>
            <select
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className={`${selectBaseClass} ${selectSizeClass} flex-1 min-w-0`}
            >
              {allWeekOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // 데스크탑 레이아웃
  return (
    <div className="flex items-center gap-2">
      {/* 단일/범위 토글 */}
      <div className="flex items-center bg-slate-100 p-0.5 rounded-md">
        <button
          onClick={() => handleModeChange("single")}
          className={`${toggleBaseClass} ${
            selectMode === "single"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          주차
        </button>
        <button
          onClick={() => handleModeChange("range")}
          className={`${toggleBaseClass} ${
            selectMode === "range"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          범위
        </button>
      </div>

      {/* 주차 셀렉터 */}
      {selectMode === "single" ? (
        <div className="flex items-center gap-1.5">
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className={`${selectBaseClass} ${selectSizeClass}`}
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className={`${selectBaseClass} ${selectSizeClass}`}
          >
            {months.map((month) => (
              <option key={month} value={month}>{month}월</option>
            ))}
          </select>
          <select
            value={selectedWeekKey.split("-")[2] || ""}
            onChange={(e) => handleWeekChange(e.target.value)}
            className={`${selectBaseClass} ${selectSizeClass}`}
          >
            {availableWeeks.map((w) => (
              <option key={w.week} value={w.week}>{w.week}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <select
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className={`${selectBaseClass} ${selectSizeClass} max-w-[140px]`}
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <span className="text-xs text-slate-400">~</span>
          <select
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className={`${selectBaseClass} ${selectSizeClass} max-w-[140px]`}
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜 범위 표시 */}
      <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 ml-1">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{currentData?.range}</span>
        {selectMode === "range" && (
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-medium">
            누적
          </span>
        )}
      </div>
    </div>
  );
}
