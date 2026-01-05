/**
 * Week Selector Component
 * 
 * 주차 선택 UI (년도 + 주차 번호)
 */

"use client";

import { getPreviousISOWeek, getWeeksInYear, formatWeekRange } from "@/lib/date/isoWeek";

interface WeekSelectorProps {
  selectedYear: number;
  selectedWeek: number; // 1, 2, 3, ... (숫자형)
  onWeekChange: (year: number, week: number) => void;
}

export function WeekSelector({
  selectedYear,
  selectedWeek,
  onWeekChange,
}: WeekSelectorProps) {
  // 이전/다음 주 계산
  const goToPreviousWeek = () => {
    const prev = getPreviousISOWeek(selectedYear, selectedWeek);
    onWeekChange(prev.year, prev.week);
  };

  const goToNextWeek = () => {
    const weeksInYear = getWeeksInYear(selectedYear);
    if (selectedWeek < weeksInYear) {
      onWeekChange(selectedYear, selectedWeek + 1);
    } else {
      // 내년 첫 주로
      onWeekChange(selectedYear + 1, 1);
    }
  };

  // 주차 범위 포맷 (MM.DD ~ MM.DD)
  const weekRangeText = formatWeekRange(selectedYear, selectedWeek);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-[#57606a]">주차 선택:</span>
      
      <div className="flex items-center gap-2 border border-[#d0d7de] rounded-md overflow-hidden bg-white">
        {/* 이전 주 버튼 */}
        <button
          onClick={goToPreviousWeek}
          className="px-3 py-2 hover:bg-[#f6f8fa] transition-colors"
          aria-label="이전 주"
        >
          <svg
            className="w-4 h-4 text-[#57606a]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        {/* 현재 주차 표시 */}
        <div className="px-4 py-2 font-semibold text-sm text-[#24292f] min-w-[200px] text-center border-x border-[#d0d7de]">
          <div>{selectedYear} W{selectedWeek.toString().padStart(2, "0")}</div>
          <div className="text-xs font-normal text-[#57606a] mt-0.5">
            {weekRangeText}
          </div>
        </div>

        {/* 다음 주 버튼 */}
        <button
          onClick={goToNextWeek}
          className="px-3 py-2 hover:bg-[#f6f8fa] transition-colors"
          aria-label="다음 주"
        >
          <svg
            className="w-4 h-4 text-[#57606a]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

