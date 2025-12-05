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

  // 모바일 레이아웃
  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {/* 상단: 모드 토글 + 날짜 범위 */}
        <div className="flex items-center justify-between">
          <div 
            className="flex items-center p-0.5 rounded"
            style={{ background: 'var(--notion-bg-secondary)' }}
          >
            <button
              onClick={() => handleModeChange("single")}
              className={`px-2 py-1 text-xs rounded transition-all ${
                selectMode === "single" ? "font-medium" : ""
              }`}
              style={{
                background: selectMode === "single" ? 'var(--notion-bg)' : 'transparent',
                color: selectMode === "single" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
                boxShadow: selectMode === "single" ? 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px' : 'none',
              }}
            >
              주차
            </button>
            <button
              onClick={() => handleModeChange("range")}
              className={`px-2 py-1 text-xs rounded transition-all ${
                selectMode === "range" ? "font-medium" : ""
              }`}
              style={{
                background: selectMode === "range" ? 'var(--notion-bg)' : 'transparent',
                color: selectMode === "range" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
                boxShadow: selectMode === "range" ? 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px' : 'none',
              }}
            >
              범위
            </button>
          </div>
          
          {/* 날짜 범위 표시 */}
          <div 
            className="flex items-center gap-1.5 text-xs"
            style={{ color: 'var(--notion-text-secondary)' }}
          >
            <span className="truncate max-w-[140px]">{currentData?.range}</span>
            {selectMode === "range" && (
              <span className="notion-badge-blue text-[10px]">누적</span>
            )}
          </div>
        </div>

        {/* 하단: 셀렉터 */}
        {selectMode === "single" ? (
          <div className="flex items-center gap-1.5">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="notion-select text-xs py-1 flex-1 min-w-0"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="notion-select text-xs py-1 w-16"
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
            <select
              value={selectedWeekKey.split("-")[2] || ""}
              onChange={(e) => handleWeekChange(e.target.value)}
              className="notion-select text-xs py-1 w-16"
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
              className="notion-select text-xs py-1 flex-1 min-w-0"
            >
              {allWeekOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>~</span>
            <select
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="notion-select text-xs py-1 flex-1 min-w-0"
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
      <div 
        className="flex items-center p-0.5 rounded"
        style={{ background: 'var(--notion-bg-secondary)' }}
      >
        <button
          onClick={() => handleModeChange("single")}
          className={`px-2.5 py-1 text-xs rounded transition-all ${
            selectMode === "single" ? "font-medium" : ""
          }`}
          style={{
            background: selectMode === "single" ? 'var(--notion-bg)' : 'transparent',
            color: selectMode === "single" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
            boxShadow: selectMode === "single" ? 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px' : 'none',
          }}
        >
          주차
        </button>
        <button
          onClick={() => handleModeChange("range")}
          className={`px-2.5 py-1 text-xs rounded transition-all ${
            selectMode === "range" ? "font-medium" : ""
          }`}
          style={{
            background: selectMode === "range" ? 'var(--notion-bg)' : 'transparent',
            color: selectMode === "range" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
            boxShadow: selectMode === "range" ? 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px' : 'none',
          }}
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
            className="notion-select"
          >
            {years.map((year) => (
              <option key={year} value={year}>{year}년</option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => handleMonthChange(Number(e.target.value))}
            className="notion-select"
          >
            {months.map((month) => (
              <option key={month} value={month}>{month}월</option>
            ))}
          </select>
          <select
            value={selectedWeekKey.split("-")[2] || ""}
            onChange={(e) => handleWeekChange(e.target.value)}
            className="notion-select"
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
            className="notion-select max-w-[140px]"
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>~</span>
          <select
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="notion-select max-w-[140px]"
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜 범위 표시 */}
      <div 
        className="hidden xl:flex items-center gap-1.5 text-xs ml-1"
        style={{ color: 'var(--notion-text-secondary)' }}
      >
        <span>{currentData?.range}</span>
        {selectMode === "range" && (
          <span className="notion-badge-blue text-[10px]">누적</span>
        )}
      </div>
    </div>
  );
}
