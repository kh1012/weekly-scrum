"use client";

/**
 * Calendar View - 메인 컴포넌트 (Airbnb 스타일)
 *
 * 주 단위 스냅샷 데이터를 달력 형태로 재구성해서
 * 프로젝트/멤버 집중도를 시각화
 */

import { useState, useMemo, useCallback, useEffect } from "react";
import type { CalendarMode, WeekKey } from "@/types/calendar";
import type { WeeklyScrumDataUnion, ScrumItem } from "@/types/scrum";
import {
  convertToRawSnapshots,
  aggregateCalendarData,
  getAvailableMonths,
  formatMonthLabel,
} from "@/lib/calendarAggregation";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarMetaPanel } from "./CalendarMetaPanel";
import { YearlyHeatmap } from "./YearlyHeatmap";

type ViewTab = "calendar" | "heatmap";

// 슬라이딩 토글 컴포넌트
function SlidingToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  const selectedIndex = options.findIndex((opt) => opt.value === value);

  return (
    <div className="relative flex items-center p-1 bg-gray-100/80 rounded-2xl">
      {/* 슬라이딩 배경 */}
      <div
        className="absolute top-1 bottom-1 bg-white rounded-xl shadow-md transition-all duration-300 ease-out"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          left: `calc(${(selectedIndex * 100) / options.length}% + 2px)`,
        }}
      />
      {/* 버튼들 */}
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`relative z-10 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-300 ${
            value === opt.value
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={{ width: `${100 / options.length}%` }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface CalendarViewProps {
  weeklyDataList: WeeklyScrumDataUnion[];
  filteredItems?: ScrumItem[];
}

export function CalendarView({
  weeklyDataList,
  filteredItems,
}: CalendarViewProps) {
  // 상태 관리
  const [mode, setMode] = useState<CalendarMode>("project");
  const [viewTab, setViewTab] = useState<ViewTab>("calendar");
  const [selectedMonth, setSelectedMonth] = useState<string>("all"); // 기본값: 전체
  const [selectedWeek, setSelectedWeek] = useState<WeekKey | null>(null);
  const [selectedInitiative, setSelectedInitiative] = useState<string | null>(
    null
  );
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  // Raw Snapshot 전체 (필터링 전)
  const allRawSnapshots = useMemo(() => {
    return convertToRawSnapshots(weeklyDataList);
  }, [weeklyDataList]);

  // 사용 가능한 월 목록
  const availableMonths = useMemo(() => {
    return getAvailableMonths(allRawSnapshots);
  }, [allRawSnapshots]);

  // Raw Snapshot 변환 및 집계
  const { weeks, projectRangeSummary, memberRangeSummary, rawSnapshots } =
    useMemo(() => {
      // 필터링된 아이템이 있으면 해당 멤버/프로젝트만 필터링
      let filteredRaw = allRawSnapshots;
      if (filteredItems && filteredItems.length > 0) {
        const allowedMembers = new Set(filteredItems.map((item) => item.name));
        const allowedProjects = new Set(
          filteredItems.map((item) => item.project)
        );
        const allowedDomains = new Set(
          filteredItems.map((item) => item.domain)
        );

        filteredRaw = allRawSnapshots.filter((snapshot) => {
          const memberMatch =
            allowedMembers.size === 0 ||
            allowedMembers.has(snapshot.memberName);
          const projectMatch =
            allowedProjects.size === 0 || allowedProjects.has(snapshot.project);
          const domainMatch =
            allowedDomains.size === 0 || allowedDomains.has(snapshot.domain);
          return memberMatch && projectMatch && domainMatch;
        });
      }

      const aggregated = aggregateCalendarData(filteredRaw, selectedMonth);
      return { ...aggregated, rawSnapshots: filteredRaw };
    }, [allRawSnapshots, filteredItems, selectedMonth]);

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

  const handleMonthChange = useCallback((month: string) => {
    setSelectedMonth(month);
    setSelectedWeek(null);
    setSelectedInitiative(null);
    setSelectedMember(null);
  }, []);

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
    return (
      weeks.find(
        (w) =>
          w.key.year === selectedWeek.year &&
          w.key.weekIndex === selectedWeek.weekIndex
      ) || null
    );
  }, [weeks, selectedWeek]);

  // 현재 선택된 기간 레이블
  const periodLabel = useMemo(() => {
    if (selectedMonth === "all") return "전체 기간";
    return formatMonthLabel(selectedMonth);
  }, [selectedMonth]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-50/50 p-6">
      {/* 상단 토글 - 캘린더/히트맵 선택 */}
      <div className="shrink-0 mb-4 flex items-center justify-center">
        <SlidingToggle
          options={[
            { value: "calendar" as ViewTab, label: "📅 주간 캘린더" },
            { value: "heatmap" as ViewTab, label: "🔥 연간 히트맵" },
          ]}
          value={viewTab}
          onChange={setViewTab}
        />
      </div>

      {/* 본문 - 외곽 border로 감싸기 */}
      <div className="flex-1 min-h-0 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        {viewTab === "calendar" ? (
          <>
            {/* 캘린더 헤더 */}
            <div className="shrink-0 px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                {/* 기간 필터 */}
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-900">
                    {periodLabel}
                  </h2>
                  <div className="relative">
                    <select
                      value={selectedMonth}
                      onChange={(e) => handleMonthChange(e.target.value)}
                      className="appearance-none bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium pl-3 pr-8 py-2 rounded-xl cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
                    >
                      <option value="all">전체 기간</option>
                      {availableMonths.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* 요약 정보 */}
                <div className="flex items-center gap-3">
                  <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                    <span className="font-semibold text-gray-700">{weeks.length}</span> 주
                  </div>
                  {filteredItems && filteredItems.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        />
                      </svg>
                      <span>{rawSnapshots.length}개 스냅샷</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 캘린더 본문 */}
            <div className="flex-1 flex min-h-0">
              {/* 좌측: Calendar Grid */}
              <div className="flex-1 overflow-auto p-5">
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
              <div className="w-[380px] border-l border-gray-100 bg-gray-50/50 overflow-auto">
                {/* 모드 토글 */}
                <div className="p-4 border-b border-gray-100 bg-white">
                  <SlidingToggle
                    options={[
                      {
                        value: "project" as CalendarMode,
                        label: "프로젝트별",
                      },
                      { value: "member" as CalendarMode, label: "멤버별" },
                    ]}
                    value={mode}
                    onChange={handleModeChange}
                  />
                </div>
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
          </>
        ) : (
          /* 히트맵 영역 - 최근 1년 */
          <div className="h-full overflow-auto">
            <YearlyHeatmap
              rawSnapshots={allRawSnapshots}
              memberRangeSummary={memberRangeSummary}
            />
          </div>
        )}
      </div>
    </div>
  );
}
