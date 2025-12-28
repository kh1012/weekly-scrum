"use client";

/**
 * Calendar View - 메인 컴포넌트 (GitHub 스타일)
 *
 * 주 단위 스냅샷 데이터를 달력 형태로 재구성해서
 * 프로젝트/멤버 집중도를 시각화
 */

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { CalendarMode, WeekKey } from "@/types/calendar";
import type { WeeklyScrumDataUnion, ScrumItem } from "@/types/scrum";
import {
  convertToRawSnapshots,
  aggregateCalendarData,
  getAvailableMonths,
} from "@/lib/calendarAggregation";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarMetaPanel } from "./CalendarMetaPanel";
import { YearlyHeatmap } from "./YearlyHeatmap";

type ViewTab = "calendar" | "heatmap";

// GitHub 스타일 토글 컴포넌트
function TabToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex items-center border border-[#d0d7de] rounded-md overflow-hidden">
      {options.map((opt, idx) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            value === opt.value
              ? "bg-[#0969da] text-white"
              : "bg-white text-[#24292f] hover:bg-[#f6f8fa]"
          } ${idx > 0 ? "border-l border-[#d0d7de]" : ""}`}
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
  const [isPeriodDropdownOpen, setIsPeriodDropdownOpen] = useState(false);
  const periodDropdownRef = useRef<HTMLDivElement>(null);

  // 기간 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    if (!isPeriodDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        periodDropdownRef.current &&
        !periodDropdownRef.current.contains(e.target as Node)
      ) {
        setIsPeriodDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPeriodDropdownOpen]);

  // Raw Snapshot 전체 (필터링 전)
  const allRawSnapshots = useMemo(() => {
    return convertToRawSnapshots(weeklyDataList);
  }, [weeklyDataList]);

  // 사용 가능한 월 목록
  const availableMonths = useMemo(() => {
    return getAvailableMonths(allRawSnapshots);
  }, [allRawSnapshots]);

  // Raw Snapshot 변환 및 집계
  const {
    weeks,
    projectRangeSummary,
    moduleRangeSummary,
    featureRangeSummary,
    memberRangeSummary,
    rawSnapshots,
  } = useMemo(() => {
    // 필터링된 아이템이 있으면 해당 멤버/프로젝트만 필터링
    let filteredRaw = allRawSnapshots;
    if (filteredItems && filteredItems.length > 0) {
      const allowedMembers = new Set(filteredItems.map((item) => item.name));
      const allowedProjects = new Set(
        filteredItems.map((item) => item.project)
      );
      const allowedDomains = new Set(filteredItems.map((item) => item.domain));

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

  return (
    <div className="h-full flex flex-col bg-white p-4 md:p-6">
      {/* 상단 토글 - 캘린더/히트맵 선택 */}
      <div className="shrink-0 mb-4 flex items-center justify-center">
        <TabToggle
          options={[
            { value: "calendar" as ViewTab, label: "주간 캘린더" },
            { value: "heatmap" as ViewTab, label: "연간 히트맵" },
          ]}
          value={viewTab}
          onChange={setViewTab}
        />
      </div>

      {/* 본문 */}
      <div className="flex-1 min-h-0 rounded-md border border-[#d0d7de] bg-white overflow-hidden">
        {viewTab === "calendar" ? (
          <>
            {/* 캘린더 헤더 */}
            <div className="shrink-0 px-4 md:px-6 py-3 border-b border-[#d0d7de] bg-[#f6f8fa]">
              <div className="flex items-center justify-between">
                {/* 기간 필터 - 커스텀 드롭다운 */}
                <div className="relative" ref={periodDropdownRef}>
                  <button
                    onClick={() => setIsPeriodDropdownOpen(!isPeriodDropdownOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors border ${
                      selectedMonth !== "all"
                        ? "bg-[#ddf4ff] text-[#0969da] border-[#0969da]"
                        : "bg-white text-[#24292f] hover:bg-[#f6f8fa] border-[#d0d7de]"
                    }`}
                  >
                    <span>
                      {selectedMonth === "all"
                        ? "전체 기간"
                        : availableMonths.find((m) => m.value === selectedMonth)
                            ?.label || selectedMonth}
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${
                        isPeriodDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>

                  {/* 드롭다운 패널 */}
                  {isPeriodDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md border border-[#d0d7de] z-50 overflow-hidden">
                      {/* 전체 기간 */}
                      <button
                        onClick={() => {
                          handleMonthChange("all");
                          setIsPeriodDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          selectedMonth === "all"
                            ? "bg-[#ddf4ff] text-[#0969da] font-medium"
                            : "text-[#24292f] hover:bg-[#f6f8fa]"
                        }`}
                      >
                        {selectedMonth === "all" && (
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                        <span className={selectedMonth === "all" ? "" : "ml-6"}>
                          전체 기간
                        </span>
                      </button>

                      {/* 구분선 */}
                      <div className="h-px bg-[#d0d7de]" />

                      {/* 월별 목록 */}
                      <div className="max-h-60 overflow-y-auto">
                        {availableMonths.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => {
                              handleMonthChange(m.value);
                              setIsPeriodDropdownOpen(false);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                              selectedMonth === m.value
                                ? "bg-[#ddf4ff] text-[#0969da] font-medium"
                                : "text-[#24292f] hover:bg-[#f6f8fa]"
                            }`}
                          >
                            {selectedMonth === m.value && (
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                            <span
                              className={
                                selectedMonth === m.value ? "" : "ml-6"
                              }
                            >
                              {m.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 요약 정보 */}
                <div className="flex items-center gap-2">
                  <div className="text-xs text-[#57606a] bg-[#f6f8fa] px-2.5 py-1 rounded border border-[#d0d7de]">
                    <span className="font-medium text-[#24292f]">{weeks.length}</span> 주
                  </div>
                  {filteredItems && filteredItems.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-[#0969da] bg-[#ddf4ff] px-2.5 py-1 rounded border border-[#0969da]">
                      <svg
                        className="w-3 h-3"
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
              <div className="flex-1 overflow-auto p-4">
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
              <div className="w-[380px] border-l border-[#d0d7de] bg-[#f6f8fa] overflow-auto">
                {/* 모드 토글 - 4개 탭 */}
                <div className="p-3 border-b border-[#d0d7de] bg-white">
                  <div className="grid grid-cols-4 gap-1">
                    {(
                      [
                        { value: "project", label: "프로젝트" },
                        { value: "module", label: "모듈" },
                        { value: "feature", label: "기능" },
                        { value: "member", label: "멤버" },
                      ] as { value: CalendarMode; label: string }[]
                    ).map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => handleModeChange(opt.value)}
                        className={`px-2 py-1.5 text-xs font-medium rounded transition-colors ${
                          mode === opt.value
                            ? "bg-[#0969da] text-white"
                            : "bg-[#f6f8fa] text-[#57606a] hover:bg-[#d0d7de]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <CalendarMetaPanel
                  mode={mode}
                  projectRangeSummary={projectRangeSummary}
                  moduleRangeSummary={moduleRangeSummary}
                  featureRangeSummary={featureRangeSummary}
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
