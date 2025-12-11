"use client";

/**
 * Member Heatmap 컴포넌트 (GitHub 잔디 스타일)
 *
 * 멤버별 주간 기여도를 개인 상대지수로 시각화
 */

import { useMemo } from "react";
import type { WeekAggregation, MemberFocusRangeSummary } from "@/types/calendar";

interface MemberHeatmapProps {
  weeks: WeekAggregation[];
  memberRangeSummary: MemberFocusRangeSummary;
  selectedMonth: string;
}

// 개인별 상대 기여도 색상 (GitHub 잔디 스타일)
const GRASS_COLORS = [
  "bg-gray-100", // 0: 데이터 없음
  "bg-emerald-100", // 1: 최소
  "bg-emerald-200", // 2
  "bg-emerald-300", // 3
  "bg-emerald-400", // 4
  "bg-emerald-500", // 5: 최대
];

// 팀 전체 기여도 색상
const TEAM_GRASS_COLORS = [
  "bg-gray-100",
  "bg-blue-100",
  "bg-blue-200",
  "bg-blue-300",
  "bg-blue-400",
  "bg-blue-500",
];

/**
 * 개인별 상대 기여도 레벨 계산 (0-5)
 * 개인의 최대값 대비 현재값 비율로 계산
 */
function getRelativeLevel(value: number, personalMax: number): number {
  if (value === 0) return 0;
  if (personalMax === 0) return 0;
  const ratio = value / personalMax;
  if (ratio <= 0.2) return 1;
  if (ratio <= 0.4) return 2;
  if (ratio <= 0.6) return 3;
  if (ratio <= 0.8) return 4;
  return 5;
}

/**
 * 월의 총 주차 수 계산
 */
function getWeeksInMonth(selectedMonth: string): number[] {
  const [year, month] = selectedMonth.split("-").map(Number);
  
  // 해당 월의 첫날과 마지막날
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  
  // ISO 주차 계산을 위한 함수
  const getWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  
  const startWeek = getWeekNumber(firstDay);
  const endWeek = getWeekNumber(lastDay);
  
  // 연말/연초 케이스 처리
  if (endWeek < startWeek) {
    const weeks = [];
    for (let i = startWeek; i <= 52; i++) weeks.push(i);
    for (let i = 1; i <= endWeek; i++) weeks.push(i);
    return weeks;
  }
  
  return Array.from({ length: endWeek - startWeek + 1 }, (_, i) => startWeek + i);
}

export function MemberHeatmap({
  weeks,
  memberRangeSummary,
  selectedMonth,
}: MemberHeatmapProps) {
  // 해당 월의 모든 주차 (데이터 없어도 표시)
  const monthWeeks = useMemo(() => getWeeksInMonth(selectedMonth), [selectedMonth]);
  const [year] = selectedMonth.split("-").map(Number);

  // 멤버 목록 (focusScore 순)
  const members = useMemo(() => {
    return memberRangeSummary.members.map((m) => m.memberName);
  }, [memberRangeSummary]);

  // 주별 멤버 데이터 + 개인별 최대값 계산
  const heatmapData = useMemo(() => {
    const memberWeekData: Map<string, Map<number, number>> = new Map();
    const memberMaxValues: Map<string, number> = new Map();

    // 모든 멤버에 대해 빈 Map 초기화
    members.forEach((name) => {
      memberWeekData.set(name, new Map());
      memberMaxValues.set(name, 0);
    });

    // 실제 데이터 채우기
    weeks.forEach((week) => {
      week.members.forEach((member) => {
        const weekMap = memberWeekData.get(member.memberName);
        if (weekMap) {
          const value = member.doneTaskCount;
          weekMap.set(week.key.weekIndex, value);
          const currentMax = memberMaxValues.get(member.memberName) || 0;
          if (value > currentMax) {
            memberMaxValues.set(member.memberName, value);
          }
        }
      });
    });

    return { memberWeekData, memberMaxValues };
  }, [weeks, members]);

  // 팀 전체 주간 기여도 계산
  const teamWeeklyData = useMemo(() => {
    const weekTotals: Map<number, number> = new Map();
    let maxTotal = 0;

    weeks.forEach((week) => {
      const total = week.members.reduce((sum, m) => sum + m.doneTaskCount, 0);
      weekTotals.set(week.key.weekIndex, total);
      if (total > maxTotal) maxTotal = total;
    });

    return { weekTotals, maxTotal };
  }, [weeks]);

  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500 font-medium">이 달에 데이터가 없습니다</p>
          <p className="text-sm text-gray-400 mt-1">다른 월을 선택해주세요</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 팀 전체 기여도 잔디 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">팀 전체 기여도</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              주간 완료 Task 수 기준
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>집중도 낮음</span>
            <div className="flex gap-0.5">
              {TEAM_GRASS_COLORS.map((color, i) => (
                <div key={i} className={`w-4 h-4 rounded ${color}`} />
              ))}
            </div>
            <span>집중도 높음</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {monthWeeks.map((weekIndex) => {
            const total = teamWeeklyData.weekTotals.get(weekIndex) || 0;
            const level = getRelativeLevel(total, teamWeeklyData.maxTotal);

            return (
              <div
                key={weekIndex}
                className="group relative"
              >
                <div
                  className={`w-12 h-12 rounded-lg ${TEAM_GRASS_COLORS[level]} flex items-center justify-center transition-all duration-200 hover:scale-110 cursor-default`}
                >
                  <span className={`text-xs font-semibold ${level > 2 ? "text-white" : "text-gray-600"}`}>
                    W{weekIndex}
                  </span>
                </div>
                {/* 툴팁 */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {total > 0 ? `${total}건 완료` : "데이터 없음"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 멤버별 기여 히트맵 */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">멤버별 기여 히트맵</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {members.length}명의 멤버 · 개인별 상대 기여도
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-0.5">
              {GRASS_COLORS.map((color, i) => (
                <div key={i} className={`w-4 h-4 rounded ${color}`} />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>

        <div className="space-y-4">
          {members.map((memberName) => {
            const weekData = heatmapData.memberWeekData.get(memberName);
            const personalMax = heatmapData.memberMaxValues.get(memberName) || 0;
            const memberSummary = memberRangeSummary.members.find(
              (m) => m.memberName === memberName
            );
            const totalDone = memberSummary?.doneTaskCount || 0;

            return (
              <div key={memberName} className="flex items-center gap-4">
                {/* 멤버 정보 */}
                <div className="w-36 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                      {memberName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{memberName}</p>
                      <p className="text-xs text-gray-400">{totalDone}건 완료</p>
                    </div>
                  </div>
                </div>

                {/* 주간 잔디 */}
                <div className="flex gap-1.5 flex-1">
                  {monthWeeks.map((weekIndex) => {
                    const value = weekData?.get(weekIndex) || 0;
                    const level = getRelativeLevel(value, personalMax);

                    return (
                      <div
                        key={weekIndex}
                        className="group relative flex-1 max-w-[48px]"
                      >
                        <div
                          className={`aspect-square rounded-md ${GRASS_COLORS[level]} transition-all duration-200 hover:scale-110 cursor-default`}
                          title={`W${weekIndex}: ${value > 0 ? `${value}건` : "없음"}`}
                        />
                        {/* 툴팁 */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          W{weekIndex}: {value > 0 ? `${value}건` : "없음"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="총 멤버"
          value={members.length}
          unit="명"
          icon="👥"
          color="blue"
        />
        <StatCard
          label="총 완료 Task"
          value={memberRangeSummary.totalDoneTaskCount}
          unit="건"
          icon="✅"
          color="emerald"
        />
        <StatCard
          label="평균 달성률"
          value={
            memberRangeSummary.totalPlannedTaskCount > 0
              ? Math.round(
                  (memberRangeSummary.totalDoneTaskCount /
                    memberRangeSummary.totalPlannedTaskCount) *
                    100
                )
              : 0
          }
          unit="%"
          icon="📈"
          color="purple"
        />
        <StatCard
          label="활동 주차"
          value={weeks.length}
          unit="주"
          icon="📅"
          color="orange"
        />
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
  color: "blue" | "emerald" | "purple" | "orange";
}) {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100/50 border-blue-100",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-100",
    purple: "from-purple-50 to-purple-100/50 border-purple-100",
    orange: "from-orange-50 to-orange-100/50 border-orange-100",
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-gradient-to-br ${colorClasses[color]} border`}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-xs text-gray-500 font-medium">{label}</p>
          <p className="text-xl font-bold text-gray-900">
            {value}
            <span className="text-sm font-normal text-gray-500 ml-1">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
