"use client";

import { useMemo } from "react";
import { useInsightContext } from "@/context/InsightContext";
import type { InsightSelectMode } from "@/types/insight";

interface InsightWeekSelectorProps {
  isMobile?: boolean;
}

export function InsightWeekSelector({ isMobile }: InsightWeekSelectorProps) {
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

  if (isMobile) {
    return (
      <div className="flex flex-col gap-2">
        {/* 모드 토글 + 날짜 범위 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-0.5 p-0.5 rounded" style={{ background: 'var(--notion-bg-secondary)' }}>
            <button
              onClick={() => handleModeChange("single")}
              className="px-2 py-1 text-xs font-medium rounded transition-all"
              style={{
                background: selectMode === "single" ? 'var(--notion-bg)' : 'transparent',
                color: selectMode === "single" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
                boxShadow: selectMode === "single" ? 'var(--notion-shadow-sm)' : 'none',
              }}
            >
              주차
            </button>
            <button
              onClick={() => handleModeChange("range")}
              className="px-2 py-1 text-xs font-medium rounded transition-all"
              style={{
                background: selectMode === "range" ? 'var(--notion-bg)' : 'transparent',
                color: selectMode === "range" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
                boxShadow: selectMode === "range" ? 'var(--notion-shadow-sm)' : 'none',
              }}
            >
              범위
            </button>
          </div>
          <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>
            {currentRange}
            {selectMode === "range" && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--notion-blue-bg)', color: 'var(--notion-blue)' }}>
                누적
              </span>
            )}
          </span>
        </div>

        {/* 셀렉터 */}
        {selectMode === "single" ? (
          <div className="flex items-center gap-1">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="notion-select flex-1"
            >
              {years.map((year) => (
                <option key={year} value={year}>{year}년</option>
              ))}
            </select>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(Number(e.target.value))}
              className="notion-select flex-1"
            >
              {months.map((month) => (
                <option key={month} value={month}>{month}월</option>
              ))}
            </select>
            <select
              value={selectedWeekKey.split("-")[2] || ""}
              onChange={(e) => handleWeekChange(e.target.value)}
              className="notion-select flex-1"
            >
              {availableWeeks.map((w) => (
                <option key={w.week} value={w.week}>{w.week}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <select
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="notion-select flex-1 text-xs"
            >
              {allWeekOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>{opt.label}</option>
              ))}
            </select>
            <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>~</span>
            <select
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="notion-select flex-1 text-xs"
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

  return (
    <div className="flex items-center gap-2">
      {/* 단일/범위 토글 */}
      <div className="flex items-center gap-0.5 p-0.5 rounded" style={{ background: 'var(--notion-bg-secondary)' }}>
        <button
          onClick={() => handleModeChange("single")}
          className="px-2 py-1 text-xs font-medium rounded transition-all"
          style={{
            background: selectMode === "single" ? 'var(--notion-bg)' : 'transparent',
            color: selectMode === "single" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
            boxShadow: selectMode === "single" ? 'var(--notion-shadow-sm)' : 'none',
          }}
        >
          주차
        </button>
        <button
          onClick={() => handleModeChange("range")}
          className="px-2 py-1 text-xs font-medium rounded transition-all"
          style={{
            background: selectMode === "range" ? 'var(--notion-bg)' : 'transparent',
            color: selectMode === "range" ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
            boxShadow: selectMode === "range" ? 'var(--notion-shadow-sm)' : 'none',
          }}
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
            className="notion-select text-xs"
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
          <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>~</span>
          <select
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="notion-select text-xs"
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>{opt.label}</option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜 범위 표시 */}
      <span className="text-xs ml-2" style={{ color: 'var(--notion-text-muted)' }}>
        {currentRange}
        {selectMode === "range" && (
          <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: 'var(--notion-blue-bg)', color: 'var(--notion-blue)' }}>
            누적
          </span>
        )}
      </span>
    </div>
  );
}
