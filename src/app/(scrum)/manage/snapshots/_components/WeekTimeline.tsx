"use client";

import { useMemo } from "react";

interface WeekTimelineProps {
  year: number;
  week: number;
  onYearChange: (year: number) => void;
  onWeekChange: (week: number) => void;
  snapshotCountByWeek: Map<string, number>;
  className?: string;
}

// ISO 8601 주차 계산 (정확한 계산)
function getCurrentISOWeek(): { year: number; week: number } {
  const now = new Date();
  const target = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const dayNum = (target.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6
  target.setUTCDate(target.getUTCDate() - dayNum + 3); // Thursday of current week
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const weekDiff = Math.round((target.getTime() - firstThursday.getTime()) / 86400000);
  const week = 1 + Math.floor(weekDiff / 7);
  return { year: target.getUTCFullYear(), week };
}

// 날짜 범위 계산 (ISO 주차)
function getWeekDateRange(year: number, week: number): string {
  // ISO 8601 week-1 based date calculation
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const startDate = new Date(week1Monday);
  startDate.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  const formatShort = (date: Date) => {
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${month}.${day}`;
  };

  return `${formatShort(startDate)} ~ ${formatShort(endDate)}`;
}

// 두 주차 사이의 모든 주차 생성
function generateWeeksBetween(
  startYear: number,
  startWeek: number,
  endYear: number,
  endWeek: number
): Array<{ year: number; week: number }> {
  const weeks: Array<{ year: number; week: number }> = [];
  
  let currentYear = startYear;
  let currentWeek = startWeek;
  
  while (currentYear < endYear || (currentYear === endYear && currentWeek <= endWeek)) {
    weeks.push({ year: currentYear, week: currentWeek });
    
    // 해당 연도의 마지막 주차 계산
    const dec31 = new Date(Date.UTC(currentYear, 11, 31));
    const dec31Day = (dec31.getUTCDay() + 6) % 7;
    dec31.setUTCDate(dec31.getUTCDate() - dec31Day + 3);
    const lastWeekYear = dec31.getUTCFullYear();
    const firstThursday = new Date(Date.UTC(lastWeekYear, 0, 4));
    const weekDiff = Math.round((dec31.getTime() - firstThursday.getTime()) / 86400000);
    const weeksInYear = 1 + Math.floor(weekDiff / 7);
    
    currentWeek++;
    if (currentWeek > weeksInYear) {
      currentWeek = 1;
      currentYear++;
    }
  }
  
  return weeks;
}

export function WeekTimeline({
  year,
  week,
  onYearChange,
  onWeekChange,
  snapshotCountByWeek,
  className = "",
}: WeekTimelineProps) {
  // 연도별 주차 데이터 생성 (연속된 주차 표시)
  const groupedWeeks = useMemo(() => {
    // 1. 현재 ISO 주차 계산
    const currentISOWeek = getCurrentISOWeek();
    
    // 2. 스냅샷이 있는 주차들 추출
    const snapshotWeeks: Array<{ year: number; week: number }> = [];
    snapshotCountByWeek.forEach((_, key) => {
      const [yearStr, weekStr] = key.split('-');
      snapshotWeeks.push({
        year: parseInt(yearStr, 10),
        week: parseInt(weekStr, 10),
      });
    });
    
    // 3. 범위 결정: 가장 오래된 스냅샷 주차부터 현재 주차까지
    let startYear = currentISOWeek.year;
    let startWeek = currentISOWeek.week;
    
    if (snapshotWeeks.length > 0) {
      // 가장 오래된 주차 찾기
      const sortedSnapshots = [...snapshotWeeks].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
      });
      const oldest = sortedSnapshots[0];
      startYear = oldest.year;
      startWeek = oldest.week;
    }
    
    // 4. 시작 주차부터 현재 주차까지 모든 주차 생성
    const allWeeks = generateWeeksBetween(
      startYear,
      startWeek,
      currentISOWeek.year,
      currentISOWeek.week
    );
    
    // 5. 연도별로 그룹화
    const weeksByYear = new Map<number, Array<{ year: number; week: number }>>();
    allWeeks.forEach((w) => {
      if (!weeksByYear.has(w.year)) {
        weeksByYear.set(w.year, []);
      }
      weeksByYear.get(w.year)!.push(w);
    });
    
    // 6. 연도별로 정렬하고 각 연도의 주차도 정렬 (최신이 위로)
    return Array.from(weeksByYear.entries())
      .sort(([a], [b]) => b - a) // 연도 내림차순
      .map(([y, weeks]) => ({
        year: y,
        weeks: weeks.sort((a, b) => b.week - a.week), // 주차 내림차순
      }))
      .filter(group => group.weeks.length > 0);
  }, [snapshotCountByWeek]);

  const handleWeekSelect = (selectedYear: number, selectedWeek: number) => {
    if (selectedYear !== year) {
      onYearChange(selectedYear);
    }
    onWeekChange(selectedWeek);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {groupedWeeks.map((group, groupIndex) => (
        <div key={group.year} className="py-2">
          {/* 연도 헤더 */}
          <div className="px-3 py-1 mb-1">
            <h3 className="text-xs font-semibold text-[#57606a]">
              {group.year}
            </h3>
          </div>

          {/* 주차 리스트 */}
          <div className="flex flex-col gap-0.5 px-2">
            {group.weeks.map((weekData) => {
              const isSelected = weekData.year === year && weekData.week === week;
              const dateRange = getWeekDateRange(weekData.year, weekData.week);
              const weekKey = `${weekData.year}-${weekData.week}`;
              const snapshotCount = snapshotCountByWeek.get(weekKey) || 0;

              return (
                <button
                  key={`${weekData.year}-${weekData.week}`}
                  onClick={() => handleWeekSelect(weekData.year, weekData.week)}
                  className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-md
                    transition-colors duration-150
                    ${
                      isSelected
                        ? "bg-[#0969da] text-white"
                        : "hover:bg-[#f6f8fa] text-[#24292f]"
                    }
                  `}
                >
                  {/* 주차 정보 */}
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        W{String(weekData.week).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-white/70" : "text-[#57606a]"
                        }`}
                      >
                        {dateRange}
                      </span>
                    </div>
                    {/* 스냅샷 개수 항상 표시 */}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                        snapshotCount > 0
                          ? isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#ddf4ff] text-[#0969da]"
                          : isSelected
                          ? "bg-white/10 text-white/70"
                          : "bg-[#f6f8fa] text-[#57606a]"
                      }`}
                    >
                      {snapshotCount}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {groupedWeeks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <svg
            className="w-12 h-12 text-[#d0d7de] mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-xs text-[#57606a]">스냅샷이 없습니다</p>
        </div>
      )}
    </div>
  );
}

