"use client";

/**
 * Calendar View - 메인 컴포넌트
 *
 * 주 단위 스냅샷 데이터를 달력 형태로 재구성해서
 * 프로젝트/멤버 집중도를 시각화
 */

import { useState, useMemo, useCallback } from "react";
import type {
  CalendarMode,
  WeekKey,
  WeekAggregation,
  ProjectFocusRangeSummary,
  MemberFocusRangeSummary,
} from "@/types/calendar";
import type { WeeklyScrumDataUnion } from "@/types/scrum";
import {
  convertToRawSnapshots,
  aggregateCalendarData,
  getCurrentMonth,
  getPrevMonth,
  getNextMonth,
  formatMonthLabel,
} from "@/lib/calendarAggregation";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarMetaPanel } from "./CalendarMetaPanel";

interface CalendarViewProps {
  weeklyDataList: WeeklyScrumDataUnion[];
}

export function CalendarView({ weeklyDataList }: CalendarViewProps) {
  // 상태 관리
  const [mode, setMode] = useState<CalendarMode>("project");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedWeek, setSelectedWeek] = useState<WeekKey | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Raw Snapshot 변환 및 집계
  const { weeks, projectRangeSummary, memberRangeSummary } = useMemo(() => {
    const rawSnapshots = convertToRawSnapshots(weeklyDataList);
    return aggregateCalendarData(rawSnapshots, selectedMonth);
  }, [weeklyDataList, selectedMonth]);

  // 기본 주 선택 (마지막 주)
  useMemo(() => {
    if (weeks.length > 0 && !selectedWeek) {
      const lastWeek = weeks[weeks.length - 1];
      setSelectedWeek(lastWeek.key);
    }
  }, [weeks, selectedWeek]);

  // 핸들러
  const handleModeChange = useCallback((newMode: CalendarMode) => {
    setMode(newMode);
    setSelectedInitiative(null);
    setSelectedMember(null);
  }, []);

  const handlePrevMonth = useCallback(() => {
    setSelectedMonth(getPrevMonth(selectedMonth));
    setSelectedWeek(null);
    setSelectedInitiative(null);
    setSelectedMember(null);
  }, [selectedMonth]);

  const handleNextMonth = useCallback(() => {
    setSelectedMonth(getNextMonth(selectedMonth));
    setSelectedWeek(null);
    setSelectedInitiative(null);
    setSelectedMember(null);
  }, [selectedMonth]);

  const handleSelectWeek = useCallback((weekKey: WeekKey) => {
    setSelectedWeek(weekKey);
    setSelectedInitiative(null);
    setSelectedMember(null);
  }, []);

  const handleSelectInitiative = useCallback((name: string) => {
    setSelectedInitiative(name);
  }, []);

  const handleSelectMember = useCallback((name: string) => {
    setSelectedMember(name);
  }, []);

  // 선택된 주 데이터
  const selectedWeekData = useMemo(() => {
    if (!selectedWeek) return null;
    return weeks.find(
      (w) => w.key.year === selectedWeek.year && w.key.weekIndex === selectedWeek.weekIndex
    ) || null;
  }, [weeks, selectedWeek]);

  return (
    <div className="h-full flex flex-col">
      {/* 상단 바 */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          {/* 좌측: 월 선택 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-semibold text-gray-900 min-w-[140px] text-center">
              {formatMonthLabel(selectedMonth)}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 우측: 모드 탭 */}
          <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl">
            <button
              onClick={() => handleModeChange("project")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "project"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              프로젝트 집중도
            </button>
            <button
              onClick={() => handleModeChange("member")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                mode === "member"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              멤버 집중도
            </button>
          </div>
        </div>
      </div>

      {/* 본문: 좌측 캘린더 + 우측 메타 패널 */}
      <div className="flex-1 flex min-h-0">
        {/* 좌측: Calendar Grid */}
        <div className="flex-1 overflow-auto p-6">
          <CalendarGrid
            weeks={weeks}
            mode={mode}
            selectedWeek={selectedWeek}
            onSelectWeek={handleSelectWeek}
            onSelectInitiative={handleSelectInitiative}
            onSelectMember={handleSelectMember}
          />
        </div>

        {/* 우측: Meta Panel */}
        <div className="w-[400px] border-l border-gray-100 bg-gray-50/50 overflow-auto">
          <CalendarMetaPanel
            mode={mode}
            projectRangeSummary={projectRangeSummary}
            memberRangeSummary={memberRangeSummary}
            selectedWeek={selectedWeekData}
            selectedInitiative={selectedInitiative}
            selectedMember={selectedMember}
          />
        </div>
      </div>
    </div>
  );
}

