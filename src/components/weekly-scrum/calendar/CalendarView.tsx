"use client";

/**
 * Calendar View - 메인 컴포넌트 (Airbnb 스타일)
 *
 * 주 단위 스냅샷 데이터를 달력 형태로 재구성해서
 * 프로젝트/멤버 집중도를 시각화
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import type {
  CalendarMode,
  WeekKey,
  WeekAggregation,
  ProjectFocusRangeSummary,
  MemberFocusRangeSummary,
} from "@/types/calendar";
import type { WeeklyScrumDataUnion, ScrumItem } from "@/types/scrum";
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
import { MemberHeatmap } from "./MemberHeatmap";

type ViewTab = "calendar" | "heatmap";

interface CalendarViewProps {
  weeklyDataList: WeeklyScrumDataUnion[];
  filteredItems?: ScrumItem[];
}

export function CalendarView({ weeklyDataList, filteredItems }: CalendarViewProps) {
  // 상태 관리
  const [mode, setMode] = useState<CalendarMode>("project");
  const [viewTab, setViewTab] = useState<ViewTab>("calendar");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonth());
  const [selectedWeek, setSelectedWeek] = useState<WeekKey | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Raw Snapshot 변환 및 집계
  const { weeks, projectRangeSummary, memberRangeSummary, rawSnapshots } = useMemo(() => {
    const raw = convertToRawSnapshots(weeklyDataList);
    
    // 필터링된 아이템이 있으면 해당 멤버/프로젝트만 필터링
    let filteredRaw = raw;
    if (filteredItems && filteredItems.length > 0) {
      const allowedMembers = new Set(filteredItems.map(item => item.name));
      const allowedProjects = new Set(filteredItems.map(item => item.project));
      const allowedDomains = new Set(filteredItems.map(item => item.domain));
      
      filteredRaw = raw.filter(snapshot => {
        const memberMatch = allowedMembers.size === 0 || allowedMembers.has(snapshot.memberName);
        const projectMatch = allowedProjects.size === 0 || allowedProjects.has(snapshot.project);
        const domainMatch = allowedDomains.size === 0 || allowedDomains.has(snapshot.domain);
        return memberMatch && projectMatch && domainMatch;
      });
    }
    
    const aggregated = aggregateCalendarData(filteredRaw, selectedMonth);
    return { ...aggregated, rawSnapshots: filteredRaw };
  }, [weeklyDataList, filteredItems, selectedMonth]);

  // 기본 주 선택 (마지막 주)
  useEffect(() => {
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
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      {/* 상단 헤더 - Airbnb 스타일 */}
      <div className="shrink-0 px-6 py-5 border-b border-gray-100/80 bg-white/70 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          {/* 좌측: 월 선택 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-900 min-w-[160px] text-center tracking-tight">
              {formatMonthLabel(selectedMonth)}
            </h1>
            <button
              onClick={handleNextMonth}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* 우측: 뷰 탭 + 모드 탭 */}
          <div className="flex items-center gap-4">
            {/* 뷰 탭 (Calendar / Heatmap) */}
            <div className="flex items-center p-1 bg-gray-100/80 rounded-2xl">
              <button
                onClick={() => setViewTab("calendar")}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  viewTab === "calendar"
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                📅 캘린더
              </button>
              <button
                onClick={() => setViewTab("heatmap")}
                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                  viewTab === "heatmap"
                    ? "bg-white text-gray-900 shadow-md"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                🔥 히트맵
              </button>
            </div>

            {/* 모드 탭 (프로젝트 / 멤버) - 캘린더 탭일 때만 */}
            {viewTab === "calendar" && (
              <div className="flex items-center p-1 bg-gray-100/80 rounded-2xl">
                <button
                  onClick={() => handleModeChange("project")}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    mode === "project"
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  프로젝트 집중도
                </button>
                <button
                  onClick={() => handleModeChange("member")}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    mode === "member"
                      ? "bg-white text-gray-900 shadow-md"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  멤버 집중도
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 필터 적용 안내 */}
        {filteredItems && filteredItems.length > 0 && (
          <div className="mt-3 flex items-center gap-2 text-sm text-blue-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>필터가 적용되어 {rawSnapshots.length}개의 스냅샷을 표시 중</span>
          </div>
        )}
      </div>

      {/* 본문 */}
      {viewTab === "calendar" ? (
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
          <div className="w-[420px] border-l border-gray-100/80 bg-gradient-to-b from-gray-50/80 to-white overflow-auto">
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
      ) : (
        <div className="flex-1 overflow-auto p-6">
          <MemberHeatmap
            weeks={weeks}
            memberRangeSummary={memberRangeSummary}
            selectedMonth={selectedMonth}
          />
        </div>
      )}
    </div>
  );
}
