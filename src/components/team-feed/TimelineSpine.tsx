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
    <div className="sticky top-6 h-[calc(100vh-3rem)] flex flex-col py-6 px-4">
      <div className="relative flex-1">
        {/* 세로 라인 - GitHub 스타일 */}
        <div className="absolute left-4 top-0 bottom-0 w-px bg-[#d0d7de]" />

        {/* 주차 노드 - GitHub 스타일 */}
        <div className="space-y-8">
          {weeks.map((week, index) => (
            <div key={`${week.year}-${week.week}`} className="relative flex items-center">
              {/* 노드 */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  index === activeWeekIndex
                    ? "bg-[#0969da] text-white"
                    : "bg-white border-2 border-[#d0d7de] text-[#57606a]"
                }`}
              >
                <div className="text-center">
                  <div className="text-[10px] font-semibold">{week.week}</div>
                </div>
              </div>

              {/* 레이블 */}
              <div className="ml-3">
                <p
                  className={`text-xs font-medium ${
                    index === activeWeekIndex ? "text-[#24292f]" : "text-[#57606a]"
                  }`}
                >
                  {week.year} {week.label}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

