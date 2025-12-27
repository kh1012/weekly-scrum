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
    <div className="sticky top-24 h-[calc(100vh-6rem)] flex flex-col py-8">
      <div className="relative flex-1">
        {/* 세로 라인 */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gray-200" />

        {/* 주차 노드 */}
        <div className="space-y-12">
          {weeks.map((week, index) => (
            <div key={`${week.year}-${week.week}`} className="relative flex items-center">
              {/* 노드 */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                  index === activeWeekIndex
                    ? "bg-blue-600 text-white shadow-lg scale-110"
                    : "bg-white border-2 border-gray-200 text-gray-600"
                }`}
              >
                <div className="text-center">
                  <div className="text-xs font-semibold">{week.week}</div>
                </div>
              </div>

              {/* 레이블 */}
              <div className="ml-4">
                <p
                  className={`text-sm font-medium ${
                    index === activeWeekIndex ? "text-gray-900" : "text-gray-500"
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

