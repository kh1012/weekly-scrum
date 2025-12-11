"use client";

/**
 * Yearly Heatmap 컴포넌트 (GitHub 기여도 잔디 스타일)
 *
 * 최근 1년간의 주간 기여도를 시각화 (주 단위로 집계)
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

// 월 이름 (약어)
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * 최근 52주(1년)의 주차 목록 생성
 */
function getLast52Weeks(): { year: number; week: number; startDate: Date; month: number }[] {
  const weeks: { year: number; week: number; startDate: Date; month: number }[] = [];
  const today = new Date();
  
  // 오늘이 속한 주의 월요일 찾기
  const currentMonday = new Date(today);
  const day = currentMonday.getDay();
  const diff = currentMonday.getDate() - day + (day === 0 ? -6 : 1);
  currentMonday.setDate(diff);
  currentMonday.setHours(0, 0, 0, 0);
  
  // 52주 전부터 시작
  for (let i = 51; i >= 0; i--) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() - (i * 7));
    
    // ISO 주차 계산
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    
    weeks.push({
      year: d.getFullYear(),
      week: weekNumber,
      startDate: weekStart,
      month: weekStart.getMonth(),
    });
  }
  
  return weeks;
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
 * 주 키 생성
 */
function getWeekKey(year: number, week: number): string {
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

/**
 * RawSnapshot에서 완료된 task 수 계산
 */
function getDoneTaskCount(snapshot: RawSnapshot): number {
  return snapshot.pastWeekTasks.filter((t) => t.progress >= 100).length;
}

/**
 * 날짜 포맷 (MM.DD)
 */
function formatDate(date: Date): string {
  return `${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getDate().toString().padStart(2, "0")}`;
}

export function YearlyHeatmap({
  rawSnapshots,
  memberRangeSummary,
}: YearlyHeatmapProps) {
  // 최근 52주 목록
  const weeks = useMemo(() => getLast52Weeks(), []);

  // 주별 데이터 집계 (팀 전체)
  const teamWeeklyData = useMemo(() => {
    const weekData: Map<string, number> = new Map();
    
    rawSnapshots.forEach((snapshot) => {
      const key = getWeekKey(snapshot.year, snapshot.weekIndex);
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
      const key = getWeekKey(snapshot.year, snapshot.weekIndex);
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

  // 월 레이블 위치 계산
  const monthLabels = useMemo(() => {
    const labels: { month: string; colStart: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, idx) => {
      if (week.month !== lastMonth) {
        labels.push({
          month: MONTH_LABELS[week.month],
          colStart: idx,
        });
        lastMonth = week.month;
      }
    });
    
    return labels;
  }, [weeks]);

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
    <div className="p-8 space-y-10">
      {/* 헤더 - Airbnb 스타일 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">최근 1년 기여도</h2>
          <p className="text-gray-500 mt-1">
            지난 52주간의 팀 활동 현황을 한눈에 확인하세요
          </p>
        </div>
        {/* 요약 통계 - 인라인 */}
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{stats.totalTasks}</p>
            <p className="text-xs text-gray-500 font-medium">완료된 작업</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{stats.activeWeeks}</p>
            <p className="text-xs text-gray-500 font-medium">활동 주</p>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{stats.memberCount}</p>
            <p className="text-xs text-gray-500 font-medium">참여 멤버</p>
          </div>
        </div>
      </div>

      {/* 팀 전체 히트맵 - Airbnb 카드 스타일 */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-200">
              <span className="text-white text-lg">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">팀 전체 기여도</h3>
              <p className="text-xs text-gray-500">주 단위 완료 작업 수</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-1">
              {TEAM_GRASS_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-md transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>

        {/* 주 단위 잔디 그리드 */}
        <div className="relative">
          {/* 월 레이블 */}
          <div className="flex mb-3 pl-1">
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="text-xs font-medium text-gray-400"
                style={{
                  position: "absolute",
                  left: `${label.colStart * 18 + 4}px`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          {/* 잔디 그리드 - 주 단위 */}
          <div className="flex gap-1.5 mt-8 overflow-x-auto pb-2">
            {weeks.map((week, weekIdx) => {
              const key = getWeekKey(week.year, week.week);
              const value = teamWeeklyData.weekData.get(key) || 0;
              const level = getLevel(value, teamWeeklyData.maxValue);
              const isFuture = week.startDate > new Date();
              const isCurrentWeek = weekIdx === weeks.length - 1;
              const weekEnd = new Date(week.startDate);
              weekEnd.setDate(weekEnd.getDate() + 6);

              return (
                <div
                  key={weekIdx}
                  className={`group relative shrink-0`}
                >
                  <div
                    className={`w-4 h-4 rounded-md transition-all cursor-default ${
                      isCurrentWeek ? "ring-2 ring-teal-400 ring-offset-1" : ""
                    } hover:scale-125 hover:z-10`}
                    style={{
                      backgroundColor: isFuture ? "#f9fafb" : TEAM_GRASS_COLORS[level],
                    }}
                  />
                  {/* 툴팁 */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-xl">
                    <div className="font-medium">{week.year}년 {week.week}주차</div>
                    <div className="text-gray-300">{formatDate(week.startDate)} ~ {formatDate(weekEnd)}</div>
                    <div className="mt-1 text-teal-300 font-bold">{value}건 완료</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 멤버별 히트맵 - Airbnb 카드 스타일 */}
      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-lg shadow-pink-200">
              <span className="text-white text-lg">👤</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">멤버별 기여도</h3>
              <p className="text-xs text-gray-500">개인별 상대 기여지수</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-1">
              {MEMBER_GRASS_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-md transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>

        <div className="space-y-5">
          {members.map((memberName, memberIdx) => {
            const weekMap = memberWeeklyData.memberData.get(memberName);
            const personalMax = memberWeeklyData.memberMaxValues.get(memberName) || 0;
            const totalDone = memberWeeklyData.memberTotals.get(memberName) || 0;

            return (
              <div 
                key={memberName} 
                className="flex items-center gap-5 group/member hover:bg-gray-50 -mx-4 px-4 py-3 rounded-2xl transition-colors"
              >
                {/* 멤버 정보 */}
                <div className="w-40 shrink-0 flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shadow-sm">
                      {memberName.charAt(0)}
                    </div>
                    {/* 순위 뱃지 */}
                    {memberIdx < 3 && (
                      <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow ${
                        memberIdx === 0 ? "bg-amber-400" : memberIdx === 1 ? "bg-gray-400" : "bg-orange-400"
                      }`}>
                        {memberIdx + 1}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{memberName}</p>
                    <p className="text-xs text-gray-400 font-medium">{totalDone}건 완료</p>
                  </div>
                </div>

                {/* 주간 잔디 */}
                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-1">
                    {weeks.map((week, weekIdx) => {
                      const key = getWeekKey(week.year, week.week);
                      const value = weekMap?.get(key) || 0;
                      const level = getLevel(value, personalMax);
                      const isFuture = week.startDate > new Date();
                      const weekEnd = new Date(week.startDate);
                      weekEnd.setDate(weekEnd.getDate() + 6);

                      return (
                        <div
                          key={weekIdx}
                          className="group/cell relative shrink-0"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-sm transition-all hover:scale-150"
                            style={{
                              backgroundColor: isFuture ? "#f9fafb" : MEMBER_GRASS_COLORS[level],
                            }}
                          />
                          {/* 툴팁 */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-md opacity-0 group-hover/cell:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
                            {week.week}주: {value}건
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 통계 카드 - Airbnb 스타일 */}
      <div className="grid grid-cols-4 gap-5">
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
      text: "text-blue-600",
      shadow: "shadow-blue-100",
    },
    emerald: {
      bg: "from-emerald-50 to-emerald-100/50",
      border: "border-emerald-100",
      text: "text-emerald-600",
      shadow: "shadow-emerald-100",
    },
    purple: {
      bg: "from-purple-50 to-purple-100/50",
      border: "border-purple-100",
      text: "text-purple-600",
      shadow: "shadow-purple-100",
    },
    amber: {
      bg: "from-amber-50 to-amber-100/50",
      border: "border-amber-100",
      text: "text-amber-600",
      shadow: "shadow-amber-100",
    },
  };

  const config = colorConfig[color];

  return (
    <div
      className={`p-5 rounded-2xl bg-gradient-to-br ${config.bg} border ${config.border} shadow-sm hover:shadow-md ${config.shadow} transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">
            {value}
            <span className="text-base font-medium text-gray-400 ml-1">{unit}</span>
          </p>
        </div>
        <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-2xl shadow-sm`}>
          {emoji}
        </div>
      </div>
    </div>
  );
}
