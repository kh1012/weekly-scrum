"use client";

/**
 * Calendar Grid 컴포넌트 (Pinterest/Masonry 스타일)
 *
 * 주 단위 막대 그래프를 표시하는 캘린더 그리드
 * CSS columns를 사용한 Masonry 레이아웃
 */

import type { CalendarMode, WeekKey, WeekAggregation } from "@/types/calendar";
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
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-gray-400"
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
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            데이터가 없습니다
          </h3>
          <p className="text-sm text-gray-500 max-w-[240px] mx-auto">
            이 달에 스냅샷 데이터가 없거나 필터 조건에 맞는 데이터가 없습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 그리드 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {mode === "project" ? "프로젝트별 주간 현황" : "멤버별 주간 현황"}
        </h2>
        <span className="text-xs text-gray-400">
          {weeks.length}개 주차
        </span>
      </div>

      {/* Pinterest/Masonry 스타일 그리드 - CSS columns 사용 */}
      <div 
        className="columns-1 md:columns-2 xl:columns-3 2xl:columns-4 gap-4"
        style={{ columnFill: "balance" }}
      >
        {weeks.map((week) => {
          const isSelected =
            selectedWeek?.year === week.key.year &&
            selectedWeek?.weekIndex === week.key.weekIndex;

          return (
            <div 
              key={`${week.key.year}-${week.key.weekIndex}`}
              className="break-inside-avoid mb-4"
            >
              <WeekCell
                week={week}
                mode={mode}
                selected={isSelected}
                onSelectWeek={onSelectWeek}
                onSelectInitiative={onSelectInitiative}
                onSelectMember={onSelectMember}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
