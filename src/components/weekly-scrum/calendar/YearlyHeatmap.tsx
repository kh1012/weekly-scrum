"use client";

/**
 * Yearly Heatmap 컴포넌트 (GitHub 기여도 잔디 스타일)
 *
 * 최근 12개월간의 주간 기여도를 시각화
 * 가로 스트립 방식으로 주차를 연속 배치, 월별 구분
 */

import { useMemo } from "react";
import type { RawSnapshot, MemberFocusRangeSummary } from "@/types/calendar";

interface YearlyHeatmapProps {
  rawSnapshots: RawSnapshot[];
  memberRangeSummary: MemberFocusRangeSummary;
}

// Airbnb 스타일 잔디 색상 (팀 전체 - 청록색 계열)
const TEAM_GRASS_COLORS = [
  "#f3f4f6", // 0: 없음 (연한 회색)
  "#ccfbf1", // 1: 최소 (teal-100)
  "#5eead4", // 2 (teal-300)
  "#14b8a6", // 3 (teal-500)
  "#0d9488", // 4: 최대 (teal-600)
];

// Airbnb 스타일 잔디 색상 (멤버별 - 핑크/로즈 계열)
const MEMBER_GRASS_COLORS = [
  "#f3f4f6", // 0: 없음
  "#fce7f3", // 1 (pink-100)
  "#f9a8d4", // 2 (pink-300)
  "#ec4899", // 3 (pink-500)
  "#db2777", // 4 (pink-600)
];

// 월 이름
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

// 월별 최대 주 수
const MAX_WEEKS_PER_MONTH = 5;

interface MonthData {
  year: number;
  month: number; // 0-11
  label: string;
}

/**
 * 날짜에서 해당 월의 몇 번째 주인지 계산 (0-based)
 */
function getWeekOfMonth(date: Date): number {
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const firstDayWeekday = firstDayOfMonth.getDay();
  const adjustedFirstDay = firstDayWeekday === 0 ? 6 : firstDayWeekday - 1;
  const dayOfMonth = date.getDate();
  return Math.floor((dayOfMonth + adjustedFirstDay - 1) / 7);
}

/**
 * 월-주 키 생성 (년-월-주차)
 */
function getMonthWeekKey(year: number, month: number, weekOfMonth: number): string {
  return `${year}-${month.toString().padStart(2, "0")}-W${weekOfMonth}`;
}

/**
 * 최근 12개월 생성
 */
function getLast12Months(): MonthData[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  
  const months: MonthData[] = [];
  
  for (let i = 11; i >= 0; i--) {
    let targetMonth = currentMonth - i;
    let targetYear = currentYear;
    
    while (targetMonth < 0) {
      targetMonth += 12;
      targetYear -= 1;
    }
    
    months.push({
      year: targetYear,
      month: targetMonth,
      label: MONTH_LABELS[targetMonth],
    });
  }
  
  return months;
}

/**
 * 상대 레벨 계산 (0-4)
 */
function getLevel(value: number, maxValue: number): number {
  if (value === 0 || maxValue === 0) return 0;
  const ratio = value / maxValue;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * RawSnapshot에서 완료된 task 수 계산
 */
function getDoneTaskCount(snapshot: RawSnapshot): number {
  return snapshot.pastWeekTasks.filter((t) => t.progress >= 100).length;
}

/**
 * RawSnapshot에서 월-주 키 추출
 */
function getSnapshotMonthWeekKey(snapshot: RawSnapshot): string {
  const [year, month, day] = snapshot.weekStart.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekOfMonth = getWeekOfMonth(date);
  return getMonthWeekKey(year, month - 1, weekOfMonth);
}

/**
 * 현재 주 키
 */
function getCurrentMonthWeekKey(): string {
  const today = new Date();
  const weekOfMonth = getWeekOfMonth(today);
  return getMonthWeekKey(today.getFullYear(), today.getMonth(), weekOfMonth);
}

export function YearlyHeatmap({
  rawSnapshots,
  memberRangeSummary,
}: YearlyHeatmapProps) {
  const months = useMemo(() => getLast12Months(), []);
  const currentWeekKey = useMemo(() => getCurrentMonthWeekKey(), []);

  // 주별 데이터 집계 (팀 전체)
  const teamWeeklyData = useMemo(() => {
    const weekData: Map<string, number> = new Map();
    
    rawSnapshots.forEach((snapshot) => {
      const key = getSnapshotMonthWeekKey(snapshot);
      const current = weekData.get(key) || 0;
      const doneCount = getDoneTaskCount(snapshot);
      weekData.set(key, current + doneCount);
    });
    
    let maxValue = 0;
    weekData.forEach((v) => {
      if (v > maxValue) maxValue = v;
    });
    
    return { weekData, maxValue };
  }, [rawSnapshots]);

  // 멤버별 주간 데이터
  const memberWeeklyData = useMemo(() => {
    const memberData: Map<string, Map<string, number>> = new Map();
    const memberMaxValues: Map<string, number> = new Map();
    const memberTotals: Map<string, number> = new Map();
    
    rawSnapshots.forEach((snapshot) => {
      const key = getSnapshotMonthWeekKey(snapshot);
      const doneCount = getDoneTaskCount(snapshot);
      
      if (!memberData.has(snapshot.memberName)) {
        memberData.set(snapshot.memberName, new Map());
        memberMaxValues.set(snapshot.memberName, 0);
        memberTotals.set(snapshot.memberName, 0);
      }
      
      const weekMap = memberData.get(snapshot.memberName)!;
      const current = weekMap.get(key) || 0;
      const newValue = current + doneCount;
      weekMap.set(key, newValue);
      
      memberTotals.set(snapshot.memberName, (memberTotals.get(snapshot.memberName) || 0) + doneCount);
      
      const currentMax = memberMaxValues.get(snapshot.memberName) || 0;
      if (newValue > currentMax) {
        memberMaxValues.set(snapshot.memberName, newValue);
      }
    });
    
    return { memberData, memberMaxValues, memberTotals };
  }, [rawSnapshots]);

  // 멤버 목록 (기여도 순)
  const members = useMemo(() => {
    return Array.from(memberWeeklyData.memberTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);
  }, [memberWeeklyData]);

  // 통계 계산
  const stats = useMemo(() => {
    let totalTasks = 0;
    let activeWeeks = 0;
    let maxWeekTasks = 0;
    
    teamWeeklyData.weekData.forEach((count) => {
      totalTasks += count;
      if (count > 0) activeWeeks++;
      if (count > maxWeekTasks) maxWeekTasks = count;
    });
    
    return {
      totalTasks,
      activeWeeks,
      maxWeekTasks,
      memberCount: members.length,
    };
  }, [teamWeeklyData, members]);

  if (rawSnapshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center shadow-inner">
            <span className="text-4xl">📊</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">데이터가 없습니다</h3>
          <p className="text-sm text-gray-500 max-w-xs">스냅샷 데이터가 있으면 연간 히트맵을 확인할 수 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      {/* 헤더 */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">최근 12개월 기여도</h2>
          <p className="text-gray-500 mt-1 text-sm">월별 주간 활동 현황을 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-4 lg:gap-6">
          <div className="text-right">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
            <p className="text-[10px] lg:text-xs text-gray-500">완료된 작업</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.memberCount}</p>
            <p className="text-[10px] lg:text-xs text-gray-500">참여 멤버</p>
          </div>
        </div>
      </div>

      {/* 팀 전체 히트맵 - 가로 스트립 방식 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm">👥</span>
            </div>
            <div>
              <h3 className="text-sm lg:text-base font-bold text-gray-900">팀 전체 기여도</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>Less</span>
            <div className="flex gap-0.5">
              {TEAM_GRASS_COLORS.map((color, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        {/* 가로 스트립 히트맵 */}
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1" style={{ minWidth: "100%" }}>
            {/* 월 레이블 행 */}
            <div className="flex">
              {months.map((monthData, idx) => (
                <div
                  key={`label-${monthData.year}-${monthData.month}`}
                  className="text-[10px] font-medium text-gray-400"
                  style={{ width: `${100 / 12}%`, minWidth: `${MAX_WEEKS_PER_MONTH * 14 + 8}px` }}
                >
                  {monthData.label}
                </div>
              ))}
            </div>
            {/* 주차 칸 행 */}
            <div className="flex">
              {months.map((monthData) => (
                <div
                  key={`cells-${monthData.year}-${monthData.month}`}
                  className="flex gap-0.5 pr-2"
                  style={{ width: `${100 / 12}%`, minWidth: `${MAX_WEEKS_PER_MONTH * 14 + 8}px` }}
                >
                  {Array.from({ length: MAX_WEEKS_PER_MONTH }).map((_, weekIdx) => {
                    const key = getMonthWeekKey(monthData.year, monthData.month, weekIdx);
                    const value = teamWeeklyData.weekData.get(key) || 0;
                    const level = getLevel(value, teamWeeklyData.maxValue);
                    const isCurrentWeek = key === currentWeekKey;

                    return (
                      <div key={key} className="group relative">
                        <div
                          className={`w-3 h-3 lg:w-3.5 lg:h-3.5 rounded-sm transition-transform hover:scale-125 ${
                            isCurrentWeek ? "ring-1 ring-teal-500 ring-offset-1" : ""
                          }`}
                          style={{ backgroundColor: TEAM_GRASS_COLORS[level] }}
                        />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                          {monthData.label} {weekIdx + 1}주 · {value}건
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 멤버별 히트맵 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 lg:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm">👤</span>
            </div>
            <div>
              <h3 className="text-sm lg:text-base font-bold text-gray-900">멤버별 기여도</h3>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>Less</span>
            <div className="flex gap-0.5">
              {MEMBER_GRASS_COLORS.map((color, i) => (
                <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>

        <div className="space-y-2">
          {members.map((memberName) => {
            const weekMap = memberWeeklyData.memberData.get(memberName);
            const personalMax = memberWeeklyData.memberMaxValues.get(memberName) || 0;
            const totalDone = memberWeeklyData.memberTotals.get(memberName) || 0;

            return (
              <div key={memberName} className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg transition-colors">
                {/* 멤버 정보 */}
                <div className="w-24 lg:w-28 shrink-0 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                    {memberName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-gray-800 truncate">{memberName}</p>
                    <p className="text-[9px] text-gray-400">{totalDone}건</p>
                  </div>
                </div>

                {/* 가로 스트립 히트맵 */}
                <div className="flex-1 overflow-x-auto">
                  <div className="inline-flex flex-col gap-0.5" style={{ minWidth: "100%" }}>
                    {/* 월 레이블 */}
                    <div className="flex">
                      {months.map((monthData) => (
                        <div
                          key={`${memberName}-label-${monthData.month}`}
                          className="text-[8px] text-gray-300"
                          style={{ width: `${100 / 12}%`, minWidth: `${MAX_WEEKS_PER_MONTH * 10 + 4}px` }}
                        >
                          {monthData.label}
                        </div>
                      ))}
                    </div>
                    {/* 주차 칸 */}
                    <div className="flex">
                      {months.map((monthData) => (
                        <div
                          key={`${memberName}-cells-${monthData.month}`}
                          className="flex gap-px pr-1"
                          style={{ width: `${100 / 12}%`, minWidth: `${MAX_WEEKS_PER_MONTH * 10 + 4}px` }}
                        >
                          {Array.from({ length: MAX_WEEKS_PER_MONTH }).map((_, weekIdx) => {
                            const key = getMonthWeekKey(monthData.year, monthData.month, weekIdx);
                            const value = weekMap?.get(key) || 0;
                            const level = getLevel(value, personalMax);
                            const isCurrentWeek = key === currentWeekKey;

                            return (
                              <div key={key} className="group relative">
                                <div
                                  className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-sm transition-transform hover:scale-150 ${
                                    isCurrentWeek ? "ring-1 ring-pink-400" : ""
                                  }`}
                                  style={{ backgroundColor: MEMBER_GRASS_COLORS[level] }}
                                />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 bg-gray-900 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                                  {monthData.label} {weekIdx + 1}주 · {value}건
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 통계 카드 - 툴팁 포함 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCardWithTooltip
          label="최고 주간 기록"
          value={stats.maxWeekTasks}
          unit="건"
          emoji="🏆"
          color="amber"
          tooltip="12개월 중 가장 많은 작업을 완료한 주의 완료 건수"
        />
        <StatCardWithTooltip
          label="주간 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.activeWeeks, 1))}
          unit="건"
          emoji="📊"
          color="blue"
          tooltip="활동이 있었던 주의 평균 완료 작업 수"
        />
        <StatCardWithTooltip
          label="활동 비율"
          value={Math.round((stats.activeWeeks / 60) * 100)}
          unit="%"
          emoji="⚡"
          color="emerald"
          tooltip="전체 60주(12개월 × 5주) 중 활동이 있었던 주의 비율"
        />
        <StatCardWithTooltip
          label="인당 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.memberCount, 1))}
          unit="건"
          emoji="👤"
          color="purple"
          tooltip="참여 멤버 1인당 평균 완료 작업 수"
        />
      </div>
    </div>
  );
}

function StatCardWithTooltip({
  label,
  value,
  unit,
  emoji,
  color,
  tooltip,
}: {
  label: string;
  value: number;
  unit: string;
  emoji: string;
  color: "blue" | "emerald" | "purple" | "amber";
  tooltip: string;
}) {
  const colorConfig = {
    blue: { bg: "from-blue-50 to-blue-100/50", border: "border-blue-100" },
    emerald: { bg: "from-emerald-50 to-emerald-100/50", border: "border-emerald-100" },
    purple: { bg: "from-purple-50 to-purple-100/50", border: "border-purple-100" },
    amber: { bg: "from-amber-50 to-amber-100/50", border: "border-amber-100" },
  };

  const config = colorConfig[color];

  return (
    <div className={`group relative p-4 rounded-xl bg-gradient-to-br ${config.bg} border ${config.border} shadow-sm hover:shadow-md transition-all cursor-default`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {value}
            <span className="text-sm font-medium text-gray-400 ml-0.5">{unit}</span>
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-lg shadow-sm">
          {emoji}
        </div>
      </div>
      {/* 툴팁 */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[11px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 max-w-[200px] text-center leading-relaxed shadow-xl">
        {tooltip}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
