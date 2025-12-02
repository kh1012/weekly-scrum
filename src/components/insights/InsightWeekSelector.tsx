"use client";

import { useMemo } from "react";
import { useInsightContext } from "@/context/InsightContext";
import type { InsightSelectMode } from "@/types/insight";

export function InsightWeekSelector() {
  const {
    allData,
    weeks,
    currentData,
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
  } = useInsightContext();

  // 연도 목록
  const years = useMemo(() => {
    const set = new Set(weeks.map((w) => w.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [weeks]);

  // 선택된 연도
  const selectedYear = currentData?.year ?? years[0];

  // 선택된 연도에 해당하는 월 목록
  const months = useMemo(() => {
    const filtered = weeks.filter((w) => w.year === selectedYear);
    const set = new Set(filtered.map((w) => w.month));
    return Array.from(set).sort((a, b) => b - a);
  }, [weeks, selectedYear]);

  // 선택된 월
  const selectedMonth = currentData?.month ?? months[0];

  // 선택된 연도/월에 해당하는 주차 목록
  const availableWeeks = useMemo(() => {
    return weeks.filter((w) => w.year === selectedYear && w.month === selectedMonth);
  }, [weeks, selectedYear, selectedMonth]);

  // 범위 선택용 전체 주차 목록
  const allWeekOptions = sortedWeekKeys.map((key) => {
    const d = allData[key];
    return { key, label: `${d.year}년 ${d.month}월 ${d.week}` };
  });

  const handleModeChange = (mode: InsightSelectMode) => {
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

  return (
    <div className="flex items-center gap-2">
      {/* 단일/범위 토글 */}
      <div className="flex items-center bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-0.5">
        <button
          onClick={() => handleModeChange("single")}
          className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
            selectMode === "single"
              ? "bg-white text-[#1f2328] shadow-sm"
              : "text-[#656d76] hover:text-[#1f2328]"
          }`}
        >
          주차
        </button>
        <button
          onClick={() => handleModeChange("range")}
          className={`px-2 py-0.5 text-xs font-medium rounded transition-colors ${
            selectMode === "range"
              ? "bg-white text-[#1f2328] shadow-sm"
              : "text-[#656d76] hover:text-[#1f2328]"
          }`}
        >
          범위
        </button>
      </div>

      {/* 주차 셀렉터 */}
      {selectMode === "single" ? (
        <div className="flex items-center gap-1">
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="appearance-none px-2 py-1 bg-white border border-[#d0d7de] rounded-md text-sm text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}년
              </option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="appearance-none px-2 py-1 bg-white border border-[#d0d7de] rounded-md text-sm text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
          >
            {months.map((month) => (
              <option key={month} value={month}>
                {month}월
              </option>
            ))}
          </select>
          <select
            value={selectedWeekKey.split("-")[2] || ""}
            onChange={(e) => handleWeekChange(e.target.value)}
            className="appearance-none px-2 py-1 bg-white border border-[#d0d7de] rounded-md text-sm text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
          >
            {availableWeeks.map((w) => (
              <option key={w.week} value={w.week}>
                {w.week}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-1.5">
          <select
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="appearance-none px-2 py-1 bg-white border border-[#d0d7de] rounded-md text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-[#656d76]">~</span>
          <select
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="appearance-none px-2 py-1 bg-white border border-[#d0d7de] rounded-md text-xs text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜 범위 표시 */}
      <span className="text-xs text-[#8c959f] ml-2">
        {currentRange}
        {selectMode === "range" && (
          <span className="ml-1.5 px-1.5 py-0.5 bg-[#e8f4fc] text-[#64b5f6] rounded text-[10px] font-medium">
            누적
          </span>
        )}
      </span>
    </div>
  );
}

