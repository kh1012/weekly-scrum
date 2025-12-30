"use client";

import { useMemo } from "react";
import type { WorkloadLevel } from "@/lib/supabase/types";

interface WeekTimelineProps {
  year: number;
  week: number;
  onYearChange: (year: number) => void;
  onWeekChange: (week: number) => void;
  snapshotCountByWeek: Map<string, number>;
  className?: string;
}

// 연도별 주차 목록 생성 (W01 ~ W53)
function getWeeksForYear(year: number): number[] {
  // ISO 8601에 따르면 일부 연도는 53주까지 있음
  // 간단하게 1~53주를 모두 표시하되, 실제 데이터가 있는 주차만 보이도록 함
  return Array.from({ length: 53 }, (_, i) => i + 1);
}

// 날짜 범위 계산 (ISO 주차)
function getWeekDateRange(year: number, week: number): string {
  // ISO 주차의 시작일 계산
  const jan4 = new Date(year, 0, 4); // 1월 4일
  const jan4Day = jan4.getDay() || 7; // 일요일=7
  const mondayOfWeek1 = new Date(jan4);
  mondayOfWeek1.setDate(jan4.getDate() - jan4Day + 1);

  const startDate = new Date(mondayOfWeek1);
  startDate.setDate(mondayOfWeek1.getDate() + (week - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);

  const formatShort = (date: Date) => {
    const month = date.getMonth() + 1;
    const day = date.getDate();
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
  // 사용 가능한 연도 목록 (현재 연도 기준 ±2년)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear + 1, currentYear, currentYear - 1, currentYear - 2];
  }, []);

  // 연도별 주차 데이터 생성
  const groupedWeeks = useMemo(() => {
    return availableYears.map((y) => {
      const weeks = getWeeksForYear(y);
      // 스냅샷이 있는 주차만 필터링
      const weeksWithData = weeks.filter((w) => {
        const key = `${y}-${w}`;
        return snapshotCountByWeek.has(key);
      });

      // 데이터가 없어도 현재 선택된 연도의 현재 주차는 표시
      if (y === year && !weeksWithData.includes(week)) {
        weeksWithData.push(week);
        weeksWithData.sort((a, b) => b - a);
      }

      return {
        year: y,
        weeks: weeksWithData.length > 0 ? weeksWithData : weeks.slice(0, 1), // 최소 1주차는 표시
      };
    });
  }, [availableYears, snapshotCountByWeek, year, week]);

  const handleWeekSelect = (selectedYear: number, selectedWeek: number) => {
    if (selectedYear !== year) {
      onYearChange(selectedYear);
    }
    onWeekChange(selectedWeek);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 타임라인 */}
      <div className="flex flex-col gap-0">
        {groupedWeeks.map((group, groupIndex) => {
          if (group.weeks.length === 0) return null;

          return (
            <div key={group.year} className="relative">
              {/* 연도 헤더 */}
              <div className="sticky top-0 z-10 bg-white border-b border-[#d0d7de] px-4 py-2">
                <h3 className="text-sm font-semibold text-[#0969da]">
                  {group.year}년
                </h3>
              </div>

              {/* 주차 리스트 */}
              <div className="flex flex-col">
                {group.weeks.map((w, weekIndex) => {
                  const isSelected = group.year === year && w === week;
                  const dateRange = getWeekDateRange(group.year, w);
                  const weekKey = `${group.year}-${w}`;
                  const snapshotCount = snapshotCountByWeek.get(weekKey) || 0;

                  return (
                    <button
                      key={w}
                      onClick={() => handleWeekSelect(group.year, w)}
                      className={`
                        relative flex items-center gap-3 px-4 py-3 border-b border-[#d0d7de]
                        transition-all duration-200
                        hover:bg-[#f6f8fa]
                        ${isSelected ? "bg-[#ddf4ff]" : ""}
                      `}
                    >
                      {/* 라디오 버튼 */}
                      <div
                        className={`
                          relative flex items-center justify-center w-5 h-5 rounded-full border-2
                          transition-all duration-200
                          ${
                            isSelected
                              ? "border-[#0969da] bg-[#0969da]"
                              : "border-[#d0d7de] bg-white"
                          }
                        `}
                      >
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-white" />
                        )}
                      </div>

                      {/* 타임라인 연결선 (마지막 항목 제외) */}
                      {weekIndex < group.weeks.length - 1 && (
                        <div className="absolute left-[30px] top-[calc(50%+4px)] w-px h-[calc(100%-8px)] bg-[#d0d7de]" />
                      )}

                      {/* 주차 정보 */}
                      <div className="flex-1 flex flex-col items-start gap-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-semibold ${
                              isSelected ? "text-[#0969da]" : "text-[#24292f]"
                            }`}
                          >
                            W{String(w).padStart(2, "0")}
                          </span>
                          {snapshotCount > 0 && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#0969da] text-white font-medium">
                              {snapshotCount}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[#57606a]">
                          {dateRange}
                        </span>
                      </div>

                      {/* 선택된 항목 표시 */}
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-[#0969da] animate-pulse" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* 연도 구분선 (마지막 연도 제외) */}
              {groupIndex < groupedWeeks.length - 1 &&
                group.weeks.length > 0 && (
                  <div className="h-2 bg-[#f6f8fa] border-b border-[#d0d7de]" />
                )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

