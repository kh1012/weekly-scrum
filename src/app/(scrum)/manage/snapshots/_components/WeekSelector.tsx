"use client";

/**
 * 연도 + ISO 주차 선택 UI
 */

import { getYearOptions, getWeekOptions } from "@/lib/date/isoWeek";

interface WeekSelectorProps {
  year: number;
  week: number;
  onYearChange: (year: number) => void;
  onWeekChange: (week: number) => void;
}

export function WeekSelector({
  year,
  week,
  onYearChange,
  onWeekChange,
}: WeekSelectorProps) {
  const yearOptions = getYearOptions();
  const weekOptions = getWeekOptions(year);

  return (
    <div className="flex items-center gap-2">
      {/* 연도 선택 */}
      <div className="relative">
        <select
          value={year}
          onChange={(e) => {
            const newYear = parseInt(e.target.value, 10);
            onYearChange(newYear);
            // 연도가 변경되면 주차도 유효한 범위로 조정
            const maxWeek = getWeekOptions(newYear).length;
            if (week > maxWeek) {
              onWeekChange(maxWeek);
            }
          }}
          className="pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 cursor-pointer"
          style={{ WebkitAppearance: "none", MozAppearance: "none", appearance: "none" }}
        >
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 주차 선택 */}
      <div className="relative">
        <select
          value={week}
          onChange={(e) => onWeekChange(parseInt(e.target.value, 10))}
          className="pl-3 pr-8 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 cursor-pointer"
          style={{ WebkitAppearance: "none", MozAppearance: "none", appearance: "none" }}
        >
          {weekOptions.map((w) => (
            <option key={w} value={w}>
              W{w.toString().padStart(2, "0")}
            </option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

