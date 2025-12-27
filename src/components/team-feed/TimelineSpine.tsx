"use client";

import { useState } from "react";

interface TimelineSpineProps {
  weeks: Array<{ year: number; week: string; label: string }>;
}

/**
 * 타임라인 스파인 컴포넌트 (데스크톱 전용)
 * - 주차별 노드 표시
 * - 클릭 시 해당 주차로 스크롤 (추후 구현 가능)
 */
export function TimelineSpine({ weeks }: TimelineSpineProps) {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  const handleWeekClick = (index: number, week: { year: number; week: string }) => {
    setActiveWeekIndex(index);
    
    // TODO: 해당 주차로 스크롤
    // 현재는 클릭만 가능하고, 스크롤 연동은 추후 구현
    console.log(`Clicked week: ${week.year} ${week.week}`);
  };

  return (
    <div className="space-y-1">
      {weeks.map((week, index) => (
        <button
          key={`${week.year}-${week.week}`}
          onClick={() => handleWeekClick(index, week)}
          className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
            index === activeWeekIndex
              ? "bg-[#0969da]/10 text-[#0969da] font-medium"
              : "hover:bg-[#f6f8fa] text-[#57606a]"
          }`}
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                index === activeWeekIndex ? "bg-[#0969da]" : "bg-[#d0d7de]"
              }`}
            />
            <span className="text-xs">
              {week.year} {week.label}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
