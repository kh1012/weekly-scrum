"use client";

/**
 * Yearly Heatmap 컴포넌트
 *
 * 52주를 한눈에 보여주는 GitHub 기여도 스타일 히트맵
 * - 팀 전체: 한 줄에 52개 셀 (월 레이블 상단 1회)
 * - 멤버별: 동일한 구조로 각 멤버당 한 줄
 * - Airbnb 스타일의 부드러운 컬러와 인터랙션
 */

import { useMemo, useState } from "react";
import type { RawSnapshot, MemberFocusRangeSummary } from "@/types/calendar";

interface YearlyHeatmapProps {
  rawSnapshots: RawSnapshot[];
  memberRangeSummary: MemberFocusRangeSummary;
}

// Airbnb 스타일 색상 팔레트 (팀 전체 - Teal)
const TEAM_COLORS = [
  "#f7f7f7", // 0: 없음 (밝은 회색)
  "#d1fae5", // 1 (emerald-100)
  "#6ee7b7", // 2 (emerald-300)
  "#10b981", // 3 (emerald-500)
  "#047857", // 4 (emerald-700)
];

// Airbnb 스타일 색상 팔레트 (멤버별 - Rose)
const MEMBER_COLORS = [
  "#f7f7f7", // 0: 없음
  "#fce7f3", // 1 (pink-100)
  "#f9a8d4", // 2 (pink-300)
  "#ec4899", // 3 (pink-500)
  "#be185d", // 4 (pink-700)
];

// 월 레이블
const MONTH_LABELS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

interface WeekData {
  index: number;        // 52주 그리드에서의 인덱스 (0-51)
  year: number;         // ISO 주차 연도
  week: number;         // ISO 주차 (1-53)
  month: number;        // 시작일의 월 (0-11)
  startDate: Date;      // 주의 시작일 (월요일)
  endDate: Date;        // 주의 종료일 (일요일)
  key: string;          // 고유 키
}

/**
 * 최근 52주 데이터 생성
 */
function getLast52Weeks(): WeekData[] {
  const weeks: WeekData[] = [];
  const today = new Date();
  
  // 현재 주의 월요일 찾기
  const currentDay = today.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const currentMonday = new Date(today);
  currentMonday.setDate(today.getDate() + diffToMonday);
  currentMonday.setHours(0, 0, 0, 0);
  
  // 52주 전부터 현재까지
  for (let i = 51; i >= 0; i--) {
    const weekStart = new Date(currentMonday);
    weekStart.setDate(currentMonday.getDate() - i * 7);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    // ISO 주차 계산
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    
    const key = `${d.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
    
    weeks.push({
      index: 51 - i,
      year: d.getFullYear(),
      week: weekNumber,
      month: weekStart.getMonth(),
      startDate: weekStart,
      endDate: weekEnd,
      key,
    });
  }
  
  return weeks;
}

/**
 * 월별 주차 시작 인덱스 계산
 */
function getMonthStartIndices(weeks: WeekData[]): { month: number; index: number }[] {
  const indices: { month: number; index: number }[] = [];
  let lastMonth = -1;
  
  weeks.forEach((week, index) => {
    if (week.month !== lastMonth) {
      indices.push({ month: week.month, index });
      lastMonth = week.month;
    }
  });
  
  return indices;
}

/**
 * 날짜에서 ISO 주차 키 계산
 * weekStart: "YYYY-MM-DD" 형식
 */
function getISOWeekKey(weekStart: string): string {
  const [year, month, day] = weekStart.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  
  // ISO 주차 계산
  const d = new Date(date);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  
  return `${d.getFullYear()}-W${weekNumber.toString().padStart(2, "0")}`;
}

/**
 * 레벨 계산 (0-4)
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
 * 완료된 작업 수 계산
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

export function YearlyHeatmap({ rawSnapshots, memberRangeSummary }: YearlyHeatmapProps) {
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);
  
  // 52주 데이터
  const weeks = useMemo(() => getLast52Weeks(), []);
  const monthIndices = useMemo(() => getMonthStartIndices(weeks), [weeks]);
  const currentWeekKey = useMemo(() => weeks[weeks.length - 1].key, [weeks]);

  // 팀 전체 데이터 집계 (weekStart 기반 ISO 주차 매칭)
  const teamData = useMemo(() => {
    const weekData: Map<string, number> = new Map();
    
    rawSnapshots.forEach((snapshot) => {
      // weekStart를 기반으로 ISO 주차 키 계산
      const key = getISOWeekKey(snapshot.weekStart);
      const current = weekData.get(key) || 0;
      weekData.set(key, current + getDoneTaskCount(snapshot));
    });
    
    let maxValue = 0;
    weekData.forEach((v) => { if (v > maxValue) maxValue = v; });
    
    return { weekData, maxValue };
  }, [rawSnapshots]);

  // 멤버별 데이터 집계 (weekStart 기반 ISO 주차 매칭)
  const memberData = useMemo(() => {
    const data: Map<string, { weekData: Map<string, number>; maxValue: number; total: number }> = new Map();
    
    rawSnapshots.forEach((snapshot) => {
      // weekStart를 기반으로 ISO 주차 키 계산
      const key = getISOWeekKey(snapshot.weekStart);
      const doneCount = getDoneTaskCount(snapshot);
      
      if (!data.has(snapshot.memberName)) {
        data.set(snapshot.memberName, { weekData: new Map(), maxValue: 0, total: 0 });
      }
      
      const memberInfo = data.get(snapshot.memberName)!;
      const current = memberInfo.weekData.get(key) || 0;
      const newValue = current + doneCount;
      memberInfo.weekData.set(key, newValue);
      memberInfo.total += doneCount;
      if (newValue > memberInfo.maxValue) memberInfo.maxValue = newValue;
    });
    
    return data;
  }, [rawSnapshots]);

  // 멤버 목록 (기여도 순)
  const members = useMemo(() => {
    return Array.from(memberData.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .map(([name]) => name);
  }, [memberData]);

  // 통계
  const stats = useMemo(() => {
    let totalTasks = 0;
    let activeWeeks = 0;
    let maxWeekTasks = 0;
    
    teamData.weekData.forEach((count) => {
      totalTasks += count;
      if (count > 0) activeWeeks++;
      if (count > maxWeekTasks) maxWeekTasks = count;
    });
    
    return { totalTasks, activeWeeks, maxWeekTasks, memberCount: members.length };
  }, [teamData, members]);

  if (rawSnapshots.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center shadow-inner">
            <span className="text-3xl">📊</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">데이터가 없습니다</h3>
          <p className="text-sm text-gray-500">스냅샷 데이터가 있으면 연간 히트맵을 확인할 수 있습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* 헤더 섹션 */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">최근 52주 기여도</h2>
          <p className="text-sm text-gray-500 mt-0.5">팀과 멤버별 주간 활동을 한눈에 확인하세요</p>
        </div>
        <div className="flex items-center gap-5 text-sm">
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{stats.totalTasks}</span>
            <span className="text-gray-400 ml-1">건</span>
            <p className="text-[10px] text-gray-400 mt-0.5">총 완료</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-900">{stats.memberCount}</span>
            <span className="text-gray-400 ml-1">명</span>
            <p className="text-[10px] text-gray-400 mt-0.5">참여</p>
          </div>
        </div>
      </div>

      {/* 팀 전체 히트맵 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow">
              <span className="text-white text-xs">👥</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">팀 전체</h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>Less</span>
            {TEAM_COLORS.map((color, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* 월 레이블 */}
        <div className="relative mb-1" style={{ marginLeft: "0px" }}>
          <div className="flex">
            {monthIndices.map(({ month, index }, i) => {
              const nextIndex = monthIndices[i + 1]?.index ?? 52;
              const widthPercent = ((nextIndex - index) / 52) * 100;
              return (
                <div
                  key={`month-${month}-${index}`}
                  className="text-[10px] font-medium text-gray-400"
                  style={{ width: `${widthPercent}%` }}
                >
                  {MONTH_LABELS[month]}
                </div>
              );
            })}
          </div>
        </div>

        {/* 52주 히트맵 그리드 */}
        <div className="flex gap-[2px]">
          {weeks.map((week) => {
            const value = teamData.weekData.get(week.key) || 0;
            const level = getLevel(value, teamData.maxValue);
            const isCurrentWeek = week.key === currentWeekKey;
            const isHovered = hoveredWeek === `team-${week.key}`;

            return (
              <div
                key={week.key}
                className="relative group"
                style={{ width: `${100 / 52}%` }}
                onMouseEnter={() => setHoveredWeek(`team-${week.key}`)}
                onMouseLeave={() => setHoveredWeek(null)}
              >
                <div
                  className={`
                    aspect-square rounded-sm transition-all duration-150
                    ${isCurrentWeek ? "ring-2 ring-emerald-500 ring-offset-1" : ""}
                    ${isHovered ? "scale-150 z-10 shadow-lg" : "hover:scale-125"}
                  `}
                  style={{ backgroundColor: TEAM_COLORS[level] }}
                />
                {/* 툴팁 */}
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl z-50 whitespace-nowrap">
                    <div className="font-medium">{week.year}년 {week.week}주차</div>
                    <div className="text-gray-300 text-[10px]">{formatDate(week.startDate)} ~ {formatDate(week.endDate)}</div>
                    <div className="text-emerald-300 font-semibold mt-0.5">{value}건 완료</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 멤버별 히트맵 */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow">
              <span className="text-white text-xs">👤</span>
            </div>
            <h3 className="text-sm font-bold text-gray-900">멤버별</h3>
            <span className="text-xs text-gray-400 ml-1">· {members.length}명</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <span>Less</span>
            {MEMBER_COLORS.map((color, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            ))}
            <span>More</span>
          </div>
        </div>

        {/* 월 레이블 (멤버 영역 상단에 1회만) */}
        <div className="relative mb-2 pl-28">
          <div className="flex">
            {monthIndices.map(({ month, index }, i) => {
              const nextIndex = monthIndices[i + 1]?.index ?? 52;
              const widthPercent = ((nextIndex - index) / 52) * 100;
              return (
                <div
                  key={`member-month-${month}-${index}`}
                  className="text-[9px] font-medium text-gray-300"
                  style={{ width: `${widthPercent}%` }}
                >
                  {MONTH_LABELS[month]}
                </div>
              );
            })}
          </div>
        </div>

        {/* 멤버 리스트 */}
        <div className="space-y-1">
          {members.map((memberName) => {
            const info = memberData.get(memberName)!;
            
            return (
              <div key={memberName} className="flex items-center gap-3 py-1">
                {/* 멤버 정보 */}
                <div className="w-24 shrink-0 flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500 shadow-inner">
                    {memberName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-gray-700 truncate">{memberName}</p>
                    <p className="text-[9px] text-gray-400">{info.total}건</p>
                  </div>
                </div>

                {/* 52주 히트맵 */}
                <div className="flex-1 flex gap-px">
                  {weeks.map((week) => {
                    const value = info.weekData.get(week.key) || 0;
                    const level = getLevel(value, info.maxValue);
                    const isCurrentWeek = week.key === currentWeekKey;
                    const isHovered = hoveredWeek === `${memberName}-${week.key}`;

                    return (
                      <div
                        key={week.key}
                        className="relative group/cell"
                        style={{ width: `${100 / 52}%` }}
                        onMouseEnter={() => setHoveredWeek(`${memberName}-${week.key}`)}
                        onMouseLeave={() => setHoveredWeek(null)}
                      >
                        <div
                          className={`
                            aspect-square rounded-[2px] transition-all duration-150
                            ${isCurrentWeek ? "ring-1 ring-pink-400" : ""}
                            ${isHovered ? "scale-[2] z-10 shadow-md" : "group-hover/row:scale-110"}
                          `}
                          style={{ backgroundColor: MEMBER_COLORS[level] }}
                        />
                        {/* 툴팁 */}
                        {isHovered && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-lg shadow-xl z-50 whitespace-nowrap">
                            <div className="font-medium">{week.week}주차</div>
                            <div className="text-pink-300 font-semibold">{value}건</div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                          </div>
                        )}
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="최고 주간"
          value={stats.maxWeekTasks}
          unit="건"
          emoji="🏆"
          color="amber"
          tooltip="52주 중 가장 많은 작업을 완료한 주"
        />
        <StatCard
          label="주간 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.activeWeeks, 1))}
          unit="건"
          emoji="📊"
          color="blue"
          tooltip="활동 주간의 평균 완료 작업 수"
        />
        <StatCard
          label="활동 비율"
          value={Math.round((stats.activeWeeks / 52) * 100)}
          unit="%"
          emoji="⚡"
          color="emerald"
          tooltip="52주 중 활동이 있었던 주의 비율"
        />
        <StatCard
          label="인당 평균"
          value={Math.round(stats.totalTasks / Math.max(stats.memberCount, 1))}
          unit="건"
          emoji="👤"
          color="purple"
          tooltip="참여 멤버 1인당 평균 완료 작업"
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
  tooltip,
}: {
  label: string;
  value: number;
  unit: string;
  emoji: string;
  color: "blue" | "emerald" | "purple" | "amber";
  tooltip: string;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const colorConfig = {
    blue: "from-blue-50 to-blue-100/50 border-blue-100",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-100",
    purple: "from-purple-50 to-purple-100/50 border-purple-100",
    amber: "from-amber-50 to-amber-100/50 border-amber-100",
  };

  return (
    <div
      className={`relative p-4 rounded-xl bg-gradient-to-br ${colorConfig[color]} border shadow-sm hover:shadow transition-shadow cursor-default`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1">
            <p className="text-xs text-gray-500 font-medium">{label}</p>
            <svg className="w-3 h-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900 mt-0.5">
            {value}
            <span className="text-sm font-medium text-gray-400 ml-0.5">{unit}</span>
          </p>
        </div>
        <div className="w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center text-base shadow-sm">
          {emoji}
        </div>
      </div>
      
      {/* 툴팁 */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[11px] rounded-lg shadow-xl z-50 min-w-[160px] max-w-[240px] text-center leading-relaxed whitespace-normal">
          {tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
