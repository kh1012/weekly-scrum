/**
 * Week Selector Component
 * 
 * 주차 선택 UI (년도 + 주차 번호)
 */

"use client";

interface WeekSelectorProps {
  selectedYear: number;
  selectedWeek: string; // W01, W02, ...
  onWeekChange: (year: number, week: string) => void;
}

export function WeekSelector({
  selectedYear,
  selectedWeek,
  onWeekChange,
}: WeekSelectorProps) {
  // 이전/다음 주 계산
  const goToPreviousWeek = () => {
    const weekNum = parseInt(selectedWeek.replace("W", ""), 10);
    if (weekNum > 1) {
      onWeekChange(selectedYear, `W${(weekNum - 1).toString().padStart(2, "0")}`);
    } else {
      // 작년 마지막 주로
      onWeekChange(selectedYear - 1, "W52");
    }
  };

  const goToNextWeek = () => {
    const weekNum = parseInt(selectedWeek.replace("W", ""), 10);
    if (weekNum < 52) {
      onWeekChange(selectedYear, `W${(weekNum + 1).toString().padStart(2, "0")}`);
    } else {
      // 내년 첫 주로
      onWeekChange(selectedYear + 1, "W01");
    }
  };

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
        <div className="px-4 py-2 font-semibold text-sm text-[#24292f] min-w-[120px] text-center border-x border-[#d0d7de]">
          {selectedYear} {selectedWeek}
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

