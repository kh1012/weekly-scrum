"use client";

import { useMemo } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { CustomSelect } from "@/components/common/CustomSelect";
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

  // 사용 가능한 연도 목록
  const years = useMemo(() => {
    const set = new Set(weeks.map((w) => w.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [weeks]);

  const selectedYear = currentData?.year ?? years[0];

  // 선택된 연도의 주차 목록
  const availableWeeks = useMemo(() => {
    return weeks.filter((w) => w.year === selectedYear);
  }, [weeks, selectedYear]);

  // 현재 선택된 주차
  const selectedWeek = useMemo(() => {
    const parts = selectedWeekKey.split("-");
    // v3 형식: YYYY-WXX
    if (parts.length === 2 && parts[1].startsWith("W")) {
      return parts[1];
    }
    // v2 형식: YYYY-MM-WXX (레거시 호환)
    if (parts.length === 3) {
      return parts[2];
    }
    return availableWeeks[0]?.week || "";
  }, [selectedWeekKey, availableWeeks]);

  // 선택된 주차의 날짜 범위
  const selectedWeekRange = useMemo(() => {
    const weekData = weeks.find((w) => w.key === selectedWeekKey);
    if (weekData?.weekStart && weekData?.weekEnd) {
      // YYYY-MM-DD → MM.DD 형식으로 변환
      const formatShort = (dateStr: string) => {
        const [, month, day] = dateStr.split("-");
        return `${parseInt(month, 10)}.${parseInt(day, 10)}`;
      };
      return `${formatShort(weekData.weekStart)} ~ ${formatShort(weekData.weekEnd)}`;
    }
    return null;
  }, [weeks, selectedWeekKey]);

  const allWeekOptions = sortedWeekKeys.map((key) => {
    const d = allData[key];
    return { key, label: `${d.year}년 ${d.week}` };
  });

  const handleModeChange = (mode: SelectMode) => {
    setSelectMode(mode);
    if (mode === "range") {
      setRangeStart(selectedWeekKey);
      setRangeEnd(selectedWeekKey);
    }
  };

  const handleYearChange = (year: number) => {
    const newWeeks = weeks.filter((w) => w.year === year);
    if (newWeeks.length > 0) {
      setSelectedWeekKey(newWeeks[0].key);
    }
  };

  const handleWeekChange = (week: string) => {
    // weeks 배열에서 해당 주차의 올바른 키 찾기 (v2/v3 형식 호환)
    const targetWeek = availableWeeks.find((w) => w.week === week);
    if (targetWeek) {
      setSelectedWeekKey(targetWeek.key);
    }
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
            <CustomSelect
              value={selectedYear}
              onChange={(val) => handleYearChange(Number(val))}
              options={years.map((year) => ({
                value: year,
                label: `${year}년`,
              }))}
              className="text-xs py-2 px-3 flex-1 min-w-0 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
            />
            <CustomSelect
              value={selectedWeek}
              onChange={(val) => handleWeekChange(String(val))}
              options={availableWeeks.map((w) => ({
                value: w.week,
                label: w.week,
              }))}
              className="text-xs py-2 px-3 w-20 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
            />
            {/* 주차 날짜 범위 표시 */}
            {selectedWeekRange && (
              <span 
                className="text-[10px] px-2 py-1 rounded-lg shrink-0"
                style={{ 
                  color: "var(--notion-text-muted)",
                  background: "var(--notion-bg-tertiary)",
                }}
              >
                {selectedWeekRange}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CustomSelect
              value={rangeStart}
              onChange={(val) => setRangeStart(String(val))}
              options={allWeekOptions.map((opt) => ({
                value: opt.key,
                label: opt.label,
              }))}
              className="text-xs py-2 px-3 flex-1 min-w-0 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
            />
            <span
              className="text-xs font-medium px-1"
              style={{ color: "var(--notion-text-muted)" }}
            >
              →
            </span>
            <CustomSelect
              value={rangeEnd}
              onChange={(val) => setRangeEnd(String(val))}
              options={allWeekOptions.map((opt) => ({
                value: opt.key,
                label: opt.label,
              }))}
              className="text-xs py-2 px-3 flex-1 min-w-0 rounded-xl font-medium"
              style={{ background: "var(--notion-bg-secondary)", border: "none" }}
            />
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
        className="flex items-center h-9 p-1 rounded-xl"
        style={{ 
          background: "var(--notion-bg-secondary)",
          boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
        }}
      >
        <button
          onClick={() => handleModeChange("single")}
          className="h-7 px-3 text-xs rounded-lg transition-all duration-200 interactive-btn"
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
          className="h-7 px-3 text-xs rounded-lg transition-all duration-200 interactive-btn"
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
          <CustomSelect
            value={selectedYear}
            onChange={(val) => handleYearChange(Number(val))}
            options={years.map((year) => ({
              value: year,
              label: `${year}년`,
            }))}
            className="h-9 rounded-xl px-3 text-sm font-medium"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
          />
          <CustomSelect
            value={selectedWeek}
            onChange={(val) => handleWeekChange(String(val))}
            options={availableWeeks.map((w) => ({
              value: w.week,
              label: w.week,
            }))}
            className="h-9 rounded-xl px-3 text-sm font-medium"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
          />
          {/* 주차 날짜 범위 표시 */}
          {selectedWeekRange && (
            <span 
              className="text-xs px-2 py-1 rounded-lg"
              style={{ 
                color: "var(--notion-text-muted)",
                background: "var(--notion-bg-tertiary)",
              }}
            >
              {selectedWeekRange}
            </span>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <CustomSelect
            value={rangeStart}
            onChange={(val) => setRangeStart(String(val))}
            options={allWeekOptions.map((opt) => ({
              value: opt.key,
              label: opt.label,
            }))}
            className="h-9 rounded-xl px-3 text-sm font-medium min-w-[150px]"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
          />
          <span
            className="text-sm font-medium px-1"
            style={{ color: "var(--notion-text-muted)" }}
          >
            →
          </span>
          <CustomSelect
            value={rangeEnd}
            onChange={(val) => setRangeEnd(String(val))}
            options={allWeekOptions.map((opt) => ({
              value: opt.key,
              label: opt.label,
            }))}
            className="h-9 rounded-xl px-3 text-sm font-medium min-w-[150px]"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "none",
            }}
          />
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
