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

export function WeekTimeline({
  year,
  week,
  onYearChange,
  onWeekChange,
  snapshotCountByWeek,
  className = "",
}: WeekTimelineProps) {
  // 연도별 주차 데이터 생성
  const groupedWeeks = useMemo(() => {
    const weeksByYear = new Map<number, Set<number>>();
    
    // 1. snapshotCountByWeek에서 스냅샷이 있는 주차 추출
    snapshotCountByWeek.forEach((_, key) => {
      const [yearStr, weekStr] = key.split('-');
      const y = parseInt(yearStr, 10);
      const w = parseInt(weekStr, 10);
      
      if (!weeksByYear.has(y)) {
        weeksByYear.set(y, new Set());
      }
      weeksByYear.get(y)!.add(w);
    });

    // 2. 현재 선택된 주차는 항상 포함 (스냅샷이 없어도 표시)
    if (!weeksByYear.has(year)) {
      weeksByYear.set(year, new Set([week]));
    } else {
      weeksByYear.get(year)!.add(week);
    }

    // 3. 현재 ISO 주차도 항상 포함 (새로 작성할 수 있도록)
    const now = new Date();
    const jan4 = new Date(Date.UTC(now.getFullYear(), 0, 4));
    const jan4Day = jan4.getUTCDay() || 7;
    const week1Monday = new Date(jan4);
    week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
    const daysSinceWeek1 = Math.floor((now.getTime() - week1Monday.getTime()) / (24 * 60 * 60 * 1000));
    const currentWeek = Math.floor(daysSinceWeek1 / 7) + 1;
    const currentYear = now.getFullYear();

    if (!weeksByYear.has(currentYear)) {
      weeksByYear.set(currentYear, new Set([currentWeek]));
    } else {
      weeksByYear.get(currentYear)!.add(currentWeek);
    }

    // 4. 연도별로 정렬하고 각 연도의 주차도 정렬 (최신이 위로)
    return Array.from(weeksByYear.entries())
      .sort(([a], [b]) => b - a) // 연도 내림차순
      .map(([y, weeksSet]) => ({
        year: y,
        weeks: Array.from(weeksSet).sort((a, b) => b - a), // 주차 내림차순
      }))
      .filter(group => group.weeks.length > 0); // 빈 그룹 제외
  }, [snapshotCountByWeek, year, week]);

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
            {group.weeks.map((w) => {
              const isSelected = group.year === year && w === week;
              const dateRange = getWeekDateRange(group.year, w);
              const weekKey = `${group.year}-${w}`;
              const snapshotCount = snapshotCountByWeek.get(weekKey) || 0;

              return (
                <button
                  key={w}
                  onClick={() => handleWeekSelect(group.year, w)}
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
                        W{String(w).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-white/70" : "text-[#57606a]"
                        }`}
                      >
                        {dateRange}
                      </span>
                    </div>
                    {snapshotCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#ddf4ff] text-[#0969da]"
                        }`}
                      >
                        {snapshotCount}
                      </span>
                    )}
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

