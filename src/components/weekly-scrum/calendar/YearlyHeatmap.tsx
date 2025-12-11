"use client";

/**
 * Yearly Heatmap 컴포넌트 (GitHub 기여도 잔디 스타일)
 *
 * 최근 1년간의 주간 기여도를 시각화
 */

import { useMemo } from "react";
import type { RawSnapshot, MemberFocusRangeSummary } from "@/types/calendar";

interface YearlyHeatmapProps {
  rawSnapshots: RawSnapshot[];
  memberRangeSummary: MemberFocusRangeSummary;
}

// GitHub 잔디 색상 (팀 전체)
const TEAM_GRASS_COLORS = [
  "#ebedf0", // 0: 없음
  "#9be9a8", // 1: 최소
  "#40c463", // 2
  "#30a14e", // 3
  "#216e39", // 4: 최대
];

// 멤버별 잔디 색상
const MEMBER_GRASS_COLORS = [
  "#ebedf0", // 0: 없음
  "#c6e48b", // 1
  "#7bc96f", // 2
  "#239a3b", // 3
  "#196127", // 4
];

// 월 이름
const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

// 요일 이름
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 최근 52주(1년)의 주차 목록 생성
 */
function getLast52Weeks(): { year: number; week: number; startDate: Date }[] {
  const weeks: { year: number; week: number; startDate: Date }[] = [];
  const today = new Date();
  
  // 오늘이 속한 주의 일요일 찾기
  const currentSunday = new Date(today);
  currentSunday.setDate(today.getDate() - today.getDay());
  currentSunday.setHours(0, 0, 0, 0);
  
  // 52주 전부터 시작
  for (let i = 52; i >= 0; i--) {
    const weekStart = new Date(currentSunday);
    weekStart.setDate(currentSunday.getDate() - (i * 7));
    
    // ISO 주차 계산
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    
    weeks.push({
      year: d.getFullYear(),
      week: weekNumber,
      startDate: weekStart,
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
    
    rawSnapshots.forEach((snapshot) => {
      const key = getWeekKey(snapshot.year, snapshot.weekIndex);
      const doneCount = getDoneTaskCount(snapshot);
      
      if (!memberData.has(snapshot.memberName)) {
        memberData.set(snapshot.memberName, new Map());
        memberMaxValues.set(snapshot.memberName, 0);
      }
      
      const weekMap = memberData.get(snapshot.memberName)!;
      const current = weekMap.get(key) || 0;
      const newValue = current + doneCount;
      weekMap.set(key, newValue);
      
      const currentMax = memberMaxValues.get(snapshot.memberName) || 0;
      if (newValue > currentMax) {
        memberMaxValues.set(snapshot.memberName, newValue);
      }
    });
    
    return { memberData, memberMaxValues };
  }, [rawSnapshots]);

  // 멤버 목록 (기여도 순)
  const members = useMemo(() => {
    return memberRangeSummary.members
      .map((m) => m.memberName)
      .sort((a, b) => {
        const aTotal = memberRangeSummary.members.find((m) => m.memberName === a)?.doneTaskCount || 0;
        const bTotal = memberRangeSummary.members.find((m) => m.memberName === b)?.doneTaskCount || 0;
        return bTotal - aTotal;
      });
  }, [memberRangeSummary]);

  // 월 레이블 위치 계산
  const monthLabels = useMemo(() => {
    const labels: { month: string; colStart: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, idx) => {
      const month = week.startDate.getMonth();
      if (month !== lastMonth) {
        labels.push({
          month: MONTH_NAMES[month],
          colStart: idx,
        });
        lastMonth = month;
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
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            데이터가 없습니다
          </h3>
          <p className="text-sm text-gray-500">
            스냅샷 데이터가 있으면 연간 히트맵을 확인할 수 있습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">최근 1년 기여도</h2>
          <p className="text-sm text-gray-500 mt-1">
            지난 52주간의 팀 활동 현황
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="font-medium">총 완료:</span>
            <span className="font-bold text-gray-900">{stats.totalTasks}건</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">활동 주:</span>
            <span className="font-bold text-gray-900">{stats.activeWeeks}주</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">참여 멤버:</span>
            <span className="font-bold text-gray-900">{stats.memberCount}명</span>
          </div>
        </div>
      </div>

      {/* 팀 전체 히트맵 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900">팀 전체 기여도</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-0.5">
              {TEAM_GRASS_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>

        {/* GitHub 스타일 잔디 그리드 */}
        <div className="overflow-x-auto">
          {/* 월 레이블 */}
          <div className="flex mb-1 ml-8" style={{ minWidth: `${weeks.length * 14}px` }}>
            {monthLabels.map((label, idx) => (
              <div
                key={idx}
                className="text-xs text-gray-400"
                style={{
                  position: "absolute",
                  left: `${label.colStart * 14 + 32}px`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex gap-1 mt-5">
            {/* 요일 레이블 */}
            <div className="flex flex-col gap-0.5 mr-1 text-xs text-gray-400 shrink-0">
              {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                <div key={day} className="h-3 flex items-center">
                  {day % 2 === 1 ? DAY_NAMES[day] : ""}
                </div>
              ))}
            </div>

            {/* 주차별 칸 */}
            {weeks.map((week, weekIdx) => {
              const key = getWeekKey(week.year, week.week);
              const value = teamWeeklyData.weekData.get(key) || 0;
              const level = getLevel(value, teamWeeklyData.maxValue);

              return (
                <div key={weekIdx} className="flex flex-col gap-0.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
                    const cellDate = new Date(week.startDate);
                    cellDate.setDate(cellDate.getDate() + dayOfWeek);
                    const isToday = cellDate.toDateString() === new Date().toDateString();
                    const isFuture = cellDate > new Date();

                    return (
                      <div
                        key={dayOfWeek}
                        className={`w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-gray-300 ${
                          isToday ? "ring-2 ring-blue-400" : ""
                        }`}
                        style={{
                          backgroundColor: isFuture ? "#f3f4f6" : TEAM_GRASS_COLORS[level],
                          opacity: dayOfWeek > 0 ? 0.3 : 1, // 일요일만 진하게 (주 기준)
                        }}
                        title={`${week.year}년 ${week.week}주차: ${value}건`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 멤버별 히트맵 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-bold text-gray-900">멤버별 기여도</h3>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-0.5">
              {MEMBER_GRASS_COLORS.map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span>많음</span>
          </div>
        </div>

        <div className="space-y-4">
          {members.map((memberName) => {
            const weekMap = memberWeeklyData.memberData.get(memberName);
            const personalMax = memberWeeklyData.memberMaxValues.get(memberName) || 0;
            const memberSummary = memberRangeSummary.members.find(
              (m) => m.memberName === memberName
            );
            const totalDone = memberSummary?.doneTaskCount || 0;

            return (
              <div key={memberName} className="flex items-center gap-4">
                {/* 멤버 정보 */}
                <div className="w-28 shrink-0 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {memberName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{memberName}</p>
                    <p className="text-[10px] text-gray-400">{totalDone}건</p>
                  </div>
                </div>

                {/* 주간 잔디 (가로 스크롤) */}
                <div className="flex-1 overflow-x-auto">
                  <div className="flex gap-0.5" style={{ minWidth: `${weeks.length * 6}px` }}>
                    {weeks.map((week, weekIdx) => {
                      const key = getWeekKey(week.year, week.week);
                      const value = weekMap?.get(key) || 0;
                      const level = getLevel(value, personalMax);
                      const isFuture = week.startDate > new Date();

                      return (
                        <div
                          key={weekIdx}
                          className="w-[5px] h-[5px] rounded-[1px] transition-all hover:scale-150"
                          style={{
                            backgroundColor: isFuture ? "#f3f4f6" : MEMBER_GRASS_COLORS[level],
                          }}
                          title={`${week.year}년 ${week.week}주차: ${value}건`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="최고 주간 기록"
          value={stats.maxWeekTasks}
          unit="건"
          icon="🏆"
          color="amber"
        />
        <StatCard
          label="주간 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.activeWeeks, 1))}
          unit="건"
          icon="📊"
          color="blue"
        />
        <StatCard
          label="활동 비율"
          value={Math.round((stats.activeWeeks / 52) * 100)}
          unit="%"
          icon="⚡"
          color="emerald"
        />
        <StatCard
          label="인당 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.memberCount, 1))}
          unit="건"
          icon="👤"
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
  icon,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  icon: string;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const colorClasses = {
    blue: "from-blue-50 to-blue-100/50 border-blue-100",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-100",
    purple: "from-purple-50 to-purple-100/50 border-purple-100",
    amber: "from-amber-50 to-amber-100/50 border-amber-100",
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

