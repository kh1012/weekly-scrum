"use client";

/**
 * Calendar Grid 컴포넌트
 *
 * 주 단위 막대 그래프를 표시하는 캘린더 그리드
 */

import { useMemo } from "react";
import type { CalendarMode, WeekKey, WeekAggregation } from "@/types/calendar";
import { formatWeekLabel } from "@/lib/calendarAggregation";
import { WeekCell } from "./WeekCell";

interface CalendarGridProps {
  weeks: WeekAggregation[];
  mode: CalendarMode;
  selectedWeek: WeekKey | null;
  onSelectWeek: (weekKey: WeekKey) => void;
  onSelectInitiative: (name: string) => void;
  onSelectMember: (name: string) => void;
}

export function CalendarGrid({
  weeks,
  mode,
  selectedWeek,
  onSelectWeek,
  onSelectInitiative,
  onSelectMember,
}: CalendarGridProps) {
  if (weeks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-gray-300"
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
          <p className="text-sm">이 달에 스냅샷 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {weeks.map((week) => {
        const isSelected =
          selectedWeek?.year === week.key.year &&
          selectedWeek?.weekIndex === week.key.weekIndex;

        return (
          <WeekCell
            key={`${week.key.year}-${week.key.weekIndex}`}
            week={week}
            mode={mode}
            selected={isSelected}
            onSelectWeek={onSelectWeek}
            onSelectInitiative={onSelectInitiative}
            onSelectMember={onSelectMember}
          />
        );
      })}
    </div>
  );
}

