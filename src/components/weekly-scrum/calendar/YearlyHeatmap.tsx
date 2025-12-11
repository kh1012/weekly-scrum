"use client";

/**
 * Yearly Heatmap 컴포넌트 (GitHub 기여도 잔디 스타일)
 *
 * 최근 12개월간의 주간 기여도를 시각화 (월별 세로 레이아웃)
 * 데이터의 weekStart를 기반으로 해당 월의 주차 위치에 표시
 * 반응형 디자인으로 viewport에 맞게 네모칸 크기 조정
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
  const firstDayWeekday = firstDayOfMonth.getDay(); // 0=일, 1=월, ...
  
  // 월요일 기준으로 주차 계산
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
  
  // 11개월 전부터 현재까지
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
  // weekStart를 파싱 (YYYY-MM-DD 형식)
  const [year, month, day] = snapshot.weekStart.split("-").map(Number);
  const date = new Date(year, month - 1, day); // month는 0-based
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
  // 최근 12개월
  const months = useMemo(() => getLast12Months(), []);
  
  // 현재 주 키
  const currentWeekKey = useMemo(() => getCurrentMonthWeekKey(), []);

  // 주별 데이터 집계 (팀 전체) - 월-주 키 기준
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

  // 멤버별 주간 데이터 - 월-주 키 기준
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
      
      // 총합
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
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            데이터가 없습니다
          </h3>
          <p className="text-sm text-gray-500 max-w-xs">
            스냅샷 데이터가 있으면 연간 히트맵을 확인할 수 있습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 lg:space-y-10">
      {/* 헤더 - Airbnb 스타일 */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-gray-900 tracking-tight">최근 12개월 기여도</h2>
          <p className="text-gray-500 mt-1 text-sm lg:text-base">
            월별 주간 활동 현황을 한눈에 확인하세요
          </p>
        </div>
        {/* 요약 통계 - 인라인 */}
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="text-right">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
            <p className="text-[10px] lg:text-xs text-gray-500 font-medium">완료된 작업</p>
          </div>
          <div className="w-px h-8 lg:h-10 bg-gray-200" />
          <div className="text-right">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.activeWeeks}</p>
            <p className="text-[10px] lg:text-xs text-gray-500 font-medium">활동 주</p>
          </div>
          <div className="w-px h-8 lg:h-10 bg-gray-200" />
          <div className="text-right">
            <p className="text-2xl lg:text-3xl font-bold text-gray-900">{stats.memberCount}</p>
            <p className="text-[10px] lg:text-xs text-gray-500 font-medium">참여 멤버</p>
          </div>
        </div>
      </div>

      {/* 팀 전체 히트맵 - Airbnb 카드 스타일 */}
      <div className="bg-white rounded-2xl lg:rounded-3xl border border-gray-100 p-5 lg:p-8 shadow-sm hover:shadow-md transition-shadow overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
              <span className="text-white text-base lg:text-lg">👥</span>
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-bold text-gray-900">팀 전체 기여도</h3>
              <p className="text-[10px] lg:text-xs text-gray-500">월별 주간 완료 작업 수</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] lg:text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-0.5 lg:gap-1">
              {TEAM_GRASS_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 lg:w-5 lg:h-5 rounded-md lg:rounded-lg transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>

        {/* 월별 세로 잔디 그리드 - 반응형 */}
        <div className="overflow-x-auto overflow-y-visible pb-2">
          <div className="flex justify-between min-w-[600px] lg:min-w-0 gap-1 sm:gap-2 lg:gap-3 xl:gap-4">
            {months.map((monthData) => (
              <div key={`${monthData.year}-${monthData.month}`} className="flex-1 flex flex-col items-center">
                {/* 월 레이블 */}
                <div className="text-[10px] lg:text-xs font-semibold text-gray-500 mb-1.5 lg:mb-2 h-4 lg:h-5 flex items-center">
                  {monthData.label}
                </div>
                {/* 주 단위 칸들 (세로) */}
                <div className="flex flex-col gap-0.5 lg:gap-1">
                  {Array.from({ length: MAX_WEEKS_PER_MONTH }).map((_, weekIdx) => {
                    const key = getMonthWeekKey(monthData.year, monthData.month, weekIdx);
                    const value = teamWeeklyData.weekData.get(key) || 0;
                    const level = getLevel(value, teamWeeklyData.maxValue);
                    const isCurrentWeek = key === currentWeekKey;

                    return (
                      <div
                        key={key}
                        className="group relative"
                      >
                        <div
                          className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 rounded-md lg:rounded-lg transition-all cursor-default ${
                            isCurrentWeek ? "ring-2 ring-teal-400 ring-offset-1 lg:ring-offset-2" : ""
                          } hover:scale-110 hover:z-10`}
                          style={{ backgroundColor: TEAM_GRASS_COLORS[level] }}
                        />
                        {/* 툴팁 */}
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 lg:ml-3 px-2 lg:px-3 py-1.5 lg:py-2 bg-gray-900 text-white text-[10px] lg:text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100] shadow-xl">
                          <div className="font-medium">{monthData.year}년 {monthData.label} {weekIdx + 1}주차</div>
                          <div className="mt-0.5 lg:mt-1 text-teal-300 font-bold">{value}건 완료</div>
                          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 멤버별 히트맵 - Airbnb 카드 스타일 */}
      <div className="bg-white rounded-2xl lg:rounded-3xl border border-gray-100 p-5 lg:p-8 shadow-sm hover:shadow-md transition-shadow overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-200">
              <span className="text-white text-base lg:text-lg">👤</span>
            </div>
            <div>
              <h3 className="text-base lg:text-lg font-bold text-gray-900">멤버별 기여도</h3>
              <p className="text-[10px] lg:text-xs text-gray-500">개인별 상대 기여지수</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] lg:text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-0.5 lg:gap-1">
              {MEMBER_GRASS_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 lg:w-5 lg:h-5 rounded-md lg:rounded-lg transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>

        <div className="space-y-3 lg:space-y-4">
          {members.map((memberName, memberIdx) => {
            const weekMap = memberWeeklyData.memberData.get(memberName);
            const personalMax = memberWeeklyData.memberMaxValues.get(memberName) || 0;
            const totalDone = memberWeeklyData.memberTotals.get(memberName) || 0;

            return (
              <div 
                key={memberName} 
                className="flex items-start gap-3 lg:gap-4 group/member hover:bg-gray-50 -mx-3 lg:-mx-4 px-3 lg:px-4 py-2 lg:py-3 rounded-xl transition-colors overflow-visible"
              >
                {/* 멤버 정보 */}
                <div className="w-24 lg:w-32 shrink-0 flex items-center gap-2 pt-4 lg:pt-5">
                  <div className="relative">
                    <div className="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs lg:text-sm font-bold text-gray-600 shadow-sm">
                      {memberName.charAt(0)}
                    </div>
                    {/* 순위 뱃지 */}
                    {memberIdx < 3 && (
                      <div className={`absolute -top-1 -right-1 w-3.5 h-3.5 lg:w-4 lg:h-4 rounded-full flex items-center justify-center text-[8px] lg:text-[9px] font-bold text-white shadow ${
                        memberIdx === 0 ? "bg-amber-400" : memberIdx === 1 ? "bg-gray-400" : "bg-orange-400"
                      }`}>
                        {memberIdx + 1}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] lg:text-xs font-semibold text-gray-900 truncate">{memberName}</p>
                    <p className="text-[9px] lg:text-[10px] text-gray-400">{totalDone}건</p>
                  </div>
                </div>

                {/* 월별 세로 잔디 - 1월~12월 전체 - 반응형 */}
                <div className="flex-1 overflow-x-auto overflow-y-visible pb-1">
                  <div className="flex justify-between min-w-[500px] lg:min-w-0 gap-1 sm:gap-1.5 lg:gap-2 xl:gap-3">
                    {months.map((monthData) => (
                      <div key={`${memberName}-${monthData.year}-${monthData.month}`} className="flex-1 flex flex-col items-center">
                        {/* 월 레이블 (첫 멤버만) */}
                        {memberIdx === 0 && (
                          <div className="text-[9px] lg:text-[10px] font-medium text-gray-400 mb-1 lg:mb-1.5 h-3 lg:h-4 flex items-center">
                            {monthData.label}
                          </div>
                        )}
                        {memberIdx > 0 && <div className="h-3 lg:h-4 mb-1 lg:mb-1.5" />}
                        
                        {/* 주 단위 칸들 (세로) */}
                        <div className="flex flex-col gap-0.5 lg:gap-1">
                          {Array.from({ length: MAX_WEEKS_PER_MONTH }).map((_, weekIdx) => {
                            const key = getMonthWeekKey(monthData.year, monthData.month, weekIdx);
                            const value = weekMap?.get(key) || 0;
                            const level = getLevel(value, personalMax);
                            const isCurrentWeek = key === currentWeekKey;

                            return (
                              <div
                                key={key}
                                className="group/cell relative"
                              >
                                <div
                                  className={`w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 rounded-md lg:rounded-lg transition-all ${
                                    isCurrentWeek ? "ring-2 ring-pink-400 ring-offset-1" : ""
                                  } hover:scale-110`}
                                  style={{ backgroundColor: MEMBER_GRASS_COLORS[level] }}
                                />
                                {/* 툴팁 */}
                                <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-[9px] lg:text-[10px] rounded-md opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[100]">
                                  {monthData.label} {weekIdx + 1}주: {value}건
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 통계 카드 - Airbnb 스타일 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
        <StatCard
          label="최고 주간 기록"
          value={stats.maxWeekTasks}
          unit="건"
          emoji="🏆"
          color="amber"
        />
        <StatCard
          label="주간 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.activeWeeks, 1))}
          unit="건"
          emoji="📊"
          color="blue"
        />
        <StatCard
          label="활동 비율"
          value={Math.round((stats.activeWeeks / 52) * 100)}
          unit="%"
          emoji="⚡"
          color="emerald"
        />
        <StatCard
          label="인당 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.memberCount, 1))}
          unit="건"
          emoji="👤"
          color="purple"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  emoji,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  emoji: string;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const colorConfig = {
    blue: {
      bg: "from-blue-50 to-blue-100/50",
      border: "border-blue-100",
      shadow: "shadow-blue-100",
    },
    emerald: {
      bg: "from-emerald-50 to-emerald-100/50",
      border: "border-emerald-100",
      shadow: "shadow-emerald-100",
    },
    purple: {
      bg: "from-purple-50 to-purple-100/50",
      border: "border-purple-100",
      shadow: "shadow-purple-100",
    },
    amber: {
      bg: "from-amber-50 to-amber-100/50",
      border: "border-amber-100",
      shadow: "shadow-amber-100",
    },
  };

  const config = colorConfig[color];

  return (
    <div
      className={`p-4 lg:p-5 rounded-xl lg:rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} shadow-sm hover:shadow-md ${config.shadow} transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs lg:text-sm text-gray-500 font-medium mb-0.5 lg:mb-1">{label}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900">
            {value}
            <span className="text-sm lg:text-base font-medium text-gray-400 ml-0.5 lg:ml-1">{unit}</span>
          </p>
        </div>
        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-white flex items-center justify-center text-xl lg:text-2xl shadow-sm">
          {emoji}
        </div>
      </div>
    </div>
  );
}
