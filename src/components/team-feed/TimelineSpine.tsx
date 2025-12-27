"use client";

import { useEffect, useState } from "react";

interface TimelineSpineProps {
  weeks: Array<{ year: number; week: string; label: string }>;
}

/**
 * 타임라인 스파인 컴포넌트 (데스크톱 전용)
 * - 주차별 노드 표시
 * - 스크롤에 따라 현재 보이는 주차 하이라이트
 */
export function TimelineSpine({ weeks }: TimelineSpineProps) {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);

  useEffect(() => {
    // 스크롤 이벤트 리스너 (추후 구현 가능)
    // 현재는 첫 번째 주차를 기본 활성화
  }, []);

  return (
    <div className="space-y-1">
      {weeks.map((week, index) => (
        <button
          key={`${week.year}-${week.week}`}
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

