"use client";

import { useMemo, useState } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { weekKeyToSortValue } from "@/lib/weekUtils";

interface WeekTimelineProps {
  className?: string;
  multiSelect?: boolean; // 다중 선택 모드
}

// 날짜 범위 표시용 포맷 함수
function formatDateRange(range: string): string {
  // "2025.12.22 ~ 2025.12.28" 형태를 "12.22 ~ 12.28"로 변환
  const parts = range.split(" ~ ");
  if (parts.length === 2) {
    const startParts = parts[0].split(".");
    const endParts = parts[1].split(".");
    if (startParts.length >= 3 && endParts.length >= 3) {
      return `${startParts[1]}.${startParts[2]} ~ ${endParts[1]}.${endParts[2]}`;
    }
  }
  return range;
}

export function WeekTimeline({ className = "", multiSelect = false }: WeekTimelineProps) {
  const {
    weeks,
    selectedWeekKey,
    setSelectedWeekKey,
    selectMode,
    setSelectMode,
    rangeStart,
    rangeEnd,
    setRangeStart,
    setRangeEnd,
    allData,
  } = useScrumContext();

  // 다중 선택 상태 (체크박스 모드)
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set([selectedWeekKey]));

  // 주차를 연도별로 그룹화 (실제 데이터가 있는 주차만)
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
      }))
      .filter(group => group.weeks.length > 0); // 빈 그룹 제외
  }, [weeks]);

  const handleWeekSelect = (weekKey: string) => {
    if (multiSelect) {
      // 다중 선택 모드: 체크박스 토글
      const newSelected = new Set(selectedWeeks);
      if (newSelected.has(weekKey)) {
        newSelected.delete(weekKey);
      } else {
        newSelected.add(weekKey);
      }
      setSelectedWeeks(newSelected);

      // 선택된 주차들의 범위를 계산하여 range 모드로 전환
      if (newSelected.size > 0) {
        const sortedKeys = Array.from(newSelected).sort((a, b) => {
          const sortA = weekKeyToSortValue(a);
          const sortB = weekKeyToSortValue(b);
          return sortA - sortB;
        });
        const minKey = sortedKeys[0];
        const maxKey = sortedKeys[sortedKeys.length - 1];

        if (sortedKeys.length === 1) {
          // 하나만 선택된 경우 single 모드
          setSelectMode("single");
          setSelectedWeekKey(minKey);
        } else {
          // 여러 개 선택된 경우 range 모드
          setSelectMode("range");
          setRangeStart(minKey);
          setRangeEnd(maxKey);
        }
      }
    } else {
      // 단일 선택 모드
      setSelectedWeekKey(weekKey);
    }
  };

  // 선택 상태 확인 함수
  const isWeekSelected = (weekKey: string) => {
    if (multiSelect) {
      return selectedWeeks.has(weekKey);
    } else {
      return weekKey === selectedWeekKey;
    }
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
            {group.weeks.map((week) => {
              const isSelected = isWeekSelected(week.key);
              const weekData = allData[week.key];
              const dateRange = weekData?.range ? formatDateRange(weekData.range) : "";
              const entryCount = weekData?.items?.length || 0;

              return (
                <button
                  key={week.key}
                  onClick={() => handleWeekSelect(week.key)}
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
                  {/* 체크박스 (다중 선택 모드) */}
                  {multiSelect && (
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-white border-white"
                          : "border-[#d0d7de] bg-white"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          className="w-3 h-3 text-[#0969da]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  )}

                  {/* 주차 정보 */}
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">
                        {week.week}
                      </span>
                      <span
                        className={`text-[10px] ${
                          isSelected ? "text-white/70" : "text-[#57606a]"
                        }`}
                      >
                        {dateRange}
                      </span>
                    </div>
                    {entryCount > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : "bg-[#ddf4ff] text-[#0969da]"
                        }`}
                      >
                        {entryCount}
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
          <p className="text-xs text-[#57606a]">주차 데이터가 없습니다</p>
        </div>
      )}
    </div>
  );
}

