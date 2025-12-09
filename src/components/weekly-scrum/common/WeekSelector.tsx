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
    return weeks.filter(
      (w) => w.year === selectedYear && w.month === selectedMonth
    );
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
    const newWeeks = weeks.filter(
      (w) => w.year === year && w.month === newMonth
    );
    if (newWeeks.length > 0) {
      setSelectedWeekKey(newWeeks[0].key);
    }
  };

  const handleMonthChange = (month: number) => {
    const newWeeks = weeks.filter(
      (w) => w.year === selectedYear && w.month === month
    );
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
      <div className="flex flex-col gap-3">
        {/* 상단: 모드 토글 + 날짜 범위 */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center p-1 rounded-xl"
            style={{ 
              background: "var(--notion-bg-secondary)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
            }}
          >
            <button
              onClick={() => handleModeChange("single")}
              className="px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
              style={{
                background:
                  selectMode === "single" ? "white" : "transparent",
                color:
                  selectMode === "single"
                    ? "#3b82f6"
                    : "var(--notion-text-secondary)",
                boxShadow:
                  selectMode === "single"
                    ? "0 1px 4px rgba(0,0,0,0.06)"
                    : "none",
                fontWeight: selectMode === "single" ? 600 : 500,
              }}
            >
              주차
            </button>
            <button
              onClick={() => handleModeChange("range")}
              className="px-3 py-1.5 text-xs rounded-lg transition-all duration-200"
              style={{
                background:
                  selectMode === "range" ? "white" : "transparent",
                color:
                  selectMode === "range"
                    ? "#3b82f6"
                    : "var(--notion-text-secondary)",
                boxShadow:
                  selectMode === "range"
                    ? "0 1px 4px rgba(0,0,0,0.06)"
                    : "none",
                fontWeight: selectMode === "range" ? 600 : 500,
              }}
            >
              범위
            </button>
          </div>

          {/* 날짜 범위 표시 */}
          <div
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl"
            style={{ 
              color: "var(--notion-text-secondary)",
              background: "var(--notion-bg-secondary)",
            }}
          >
            <span>📅</span>
            <span className="truncate max-w-[120px] font-medium">{currentData?.range}</span>
            {selectMode === "range" && (
              <span 
                className="text-[10px] py-0.5 px-1.5 rounded-lg font-semibold"
                style={{
                  background: "rgba(59, 130, 246, 0.15)",
                  color: "#3b82f6",
                }}
              >
                누적
              </span>
            )}
          </div>
        </div>

        {/* 하단: 셀렉터 */}
        {selectMode === "single" ? (
          <div className="flex items-center gap-2">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(Number(e.target.value))}
              className="notion-select text-xs py-2 px-3 flex-1 min-w-0 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
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
              className="notion-select text-xs py-2 px-3 w-20 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
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
              className="notion-select text-xs py-2 px-3 w-20 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
            >
              {availableWeeks.map((w) => (
                <option key={w.week} value={w.week}>
                  {w.week}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <select
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              className="notion-select text-xs py-2 px-3 flex-1 min-w-0 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
            >
              {allWeekOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span
              className="text-xs font-medium px-1"
              style={{ color: "var(--notion-text-muted)" }}
            >
              →
            </span>
            <select
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              className="notion-select text-xs py-2 px-3 flex-1 min-w-0 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
            >
              {allWeekOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  }

  // 데스크탑 레이아웃
  return (
    <div className="flex items-center gap-3">
      {/* 단일/범위 토글 */}
      <div
        className="flex items-center p-1 rounded-xl"
        style={{ 
          background: "var(--notion-bg-secondary)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <button
          onClick={() => handleModeChange("single")}
          className="px-3 py-1.5 text-xs rounded-lg transition-all duration-200 interactive-btn"
          style={{
            background:
              selectMode === "single" ? "white" : "transparent",
            color:
              selectMode === "single"
                ? "#3b82f6"
                : "var(--notion-text-secondary)",
            boxShadow:
              selectMode === "single"
                ? "0 1px 4px rgba(0,0,0,0.06)"
                : "none",
            fontWeight: selectMode === "single" ? 600 : 500,
          }}
        >
          주차
        </button>
        <button
          onClick={() => handleModeChange("range")}
          className="px-3 py-1.5 text-xs rounded-lg transition-all duration-200 interactive-btn"
          style={{
            background:
              selectMode === "range" ? "white" : "transparent",
            color:
              selectMode === "range"
                ? "#3b82f6"
                : "var(--notion-text-secondary)",
            boxShadow:
              selectMode === "range"
                ? "0 1px 4px rgba(0,0,0,0.06)"
                : "none",
            fontWeight: selectMode === "range" ? 600 : 500,
          }}
        >
          범위
        </button>
      </div>

      {/* 주차 셀렉터 */}
      {selectMode === "single" ? (
        <div className="flex items-center gap-2">
          <select
            value={selectedYear}
            onChange={(e) => handleYearChange(Number(e.target.value))}
            className="notion-select rounded-lg px-3 py-1.5 font-medium"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
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
            className="notion-select rounded-lg px-3 py-1.5 font-medium"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
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
            className="notion-select rounded-lg px-3 py-1.5 font-medium"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
          >
            {availableWeeks.map((w) => (
              <option key={w.week} value={w.week}>
                {w.week}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <select
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="notion-select rounded-lg px-3 py-1.5 font-medium min-w-[150px]"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="text-xs font-medium px-1"
            style={{ color: "var(--notion-text-muted)" }}
          >
            →
          </span>
          <select
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
            className="notion-select rounded-lg px-3 py-1.5 font-medium min-w-[150px]"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
          >
            {allWeekOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 날짜 범위 표시 (1600px 이상에서만) */}
      <div
        className="hidden 3xl:flex items-center gap-2 text-xs ml-2 px-3 py-1.5 rounded-xl"
        style={{ 
          color: "var(--notion-text-secondary)",
          background: "var(--notion-bg-secondary)",
        }}
      >
        <span>📅</span>
        <span className="font-medium">{currentData?.range}</span>
        {selectMode === "range" && (
          <span 
            className="text-[10px] py-0.5 px-1.5 rounded-lg font-semibold"
            style={{
              background: "rgba(59, 130, 246, 0.15)",
              color: "#3b82f6",
            }}
          >
            누적
          </span>
        )}
      </div>
    </div>
  );
}
