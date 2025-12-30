"use client";

import { useMemo } from "react";
import { useScrumContext } from "@/context/ScrumContext";

interface WeekTimelineProps {
  className?: string;
}

export function WeekTimeline({ className = "" }: WeekTimelineProps) {
  const {
    weeks,
    selectedWeekKey,
    setSelectedWeekKey,
    sortedWeekKeys,
    allData,
  } = useScrumContext();

  // 주차를 연도별로 그룹화
  const groupedWeeks = useMemo(() => {
    const groups: { [year: number]: typeof weeks } = {};
    weeks.forEach((week) => {
      if (!groups[week.year]) {
        groups[week.year] = [];
      }
      groups[week.year].push(week);
    });
    // 연도별로 정렬 (최신이 위로)
    return Object.entries(groups)
      .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
      .map(([year, weekList]) => ({
        year: Number(year),
        weeks: weekList.sort((a, b) => {
          // 주차 번호로 정렬 (W01, W02, ...)
          const weekA = parseInt(a.week.replace("W", ""), 10);
          const weekB = parseInt(b.week.replace("W", ""), 10);
          return weekB - weekA; // 최신 주차가 위로
        }),
      }));
  }, [weeks]);

  const handleWeekSelect = (weekKey: string) => {
    setSelectedWeekKey(weekKey);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 타임라인 */}
      <div className="flex flex-col gap-0">
        {groupedWeeks.map((group, groupIndex) => (
          <div key={group.year} className="relative">
            {/* 연도 헤더 */}
            <div className="sticky top-0 z-10 bg-white border-b border-[#d0d7de] px-4 py-2">
              <h3 className="text-sm font-semibold text-[#0969da]">
                {group.year}년
              </h3>
            </div>

            {/* 주차 리스트 */}
            <div className="flex flex-col">
              {group.weeks.map((week, weekIndex) => {
                const isSelected = week.key === selectedWeekKey;
                const weekData = allData[week.key];
                const dateRange = weekData?.range || "";

                return (
                  <button
                    key={week.key}
                    onClick={() => handleWeekSelect(week.key)}
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
                          {week.week}
                        </span>
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
            {groupIndex < groupedWeeks.length - 1 && (
              <div className="h-2 bg-[#f6f8fa] border-b border-[#d0d7de]" />
            )}
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {groupedWeeks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-[#57606a]">주차 데이터가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

