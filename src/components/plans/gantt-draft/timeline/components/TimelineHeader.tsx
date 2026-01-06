/**
 * DraftTimeline 헤더 (월/일)
 */

"use client";

import { DAY_WIDTH, HEADER_HEIGHT } from "../timelineTypes";

interface TimelineHeaderProps {
  headerRef: React.RefObject<HTMLDivElement | null>;
  totalWidth: number;
  months: { month: string; days: number }[];
  days: Date[];
}

export function TimelineHeader({
  headerRef,
  totalWidth,
  months,
  days,
}: TimelineHeaderProps) {
  return (
    <div
      ref={headerRef}
      className="flex-shrink-0 overflow-hidden"
      style={{
        height: HEADER_HEIGHT,
        background: "linear-gradient(180deg, #f8f9fa 0%, #f3f4f6 100%)",
      }}
    >
      {/* 하단 border - 별도 div로 처리 */}
      <div
        className="absolute left-0 right-0 bottom-0 z-10"
        style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
      />
      <div className="relative" style={{ width: totalWidth, height: "100%" }}>
        {/* 월 헤더 - Airbnb 스타일 */}
        <div className="absolute top-0 left-0 flex" style={{ height: 38 }}>
          {/* 하단 border - 별도 div로 처리 */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
          />
          {months.map((m, idx) => (
            <div
              key={idx}
              className="flex items-center justify-center text-xs font-semibold tracking-wide"
              style={{
                width: m.days * DAY_WIDTH,
                borderRight: "1px solid rgba(0, 0, 0, 0.06)",
                color: "#374151",
                background: "transparent",
              }}
            >
              {m.month}
            </div>
          ))}
        </div>

        {/* 일 헤더 - Airbnb 스타일 */}
        <div className="absolute left-0 flex" style={{ top: 38, height: 38 }}>
          {days.map((day, idx) => {
            const isToday = day.toDateString() === new Date().toDateString();
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isMonday = day.getDay() === 1;

            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-center text-xs transition-colors duration-100"
                style={{
                  width: DAY_WIDTH,
                  borderRight: "1px solid rgba(0, 0, 0, 0.04)",
                  borderLeft: isMonday
                    ? "2px solid rgba(0, 0, 0, 0.08)"
                    : "none",
                  background: isToday
                    ? "linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)"
                    : isWeekend
                    ? "rgba(0, 0, 0, 0.02)"
                    : "transparent",
                  color: isToday
                    ? "#2563eb"
                    : isWeekend
                    ? "#9ca3af"
                    : "#6b7280",
                }}
              >
                <span
                  className={`font-semibold ${
                    isToday ? "text-blue-600" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
                <span className="text-[9px] font-medium opacity-70">
                  {["일", "월", "화", "수", "목", "금", "토"][day.getDay()]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

