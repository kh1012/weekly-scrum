"use client";

import { memo } from "react";
import type { MonthGroup } from "./useGanttLayout";
import { DAY_WIDTH } from "./useGanttLayout";

interface TimelineHeaderProps {
  days: Date[];
  months: MonthGroup[];
  totalWidth: number;
  todayIndex: number;
}

/**
 * 타임라인 헤더 (월 + 일 표시)
 */
export const TimelineHeader = memo(function TimelineHeader({
  days,
  months,
  totalWidth,
  todayIndex,
}: TimelineHeaderProps) {
  return (
    <div
      className="flex-shrink-0 border-b"
      style={{
        width: totalWidth,
        minWidth: totalWidth,
        borderColor: "var(--notion-border)",
      }}
    >
      {/* Month Row */}
      <div
        className="flex h-[26px] border-b"
        style={{
          background: "var(--notion-bg-secondary)",
          borderColor: "var(--notion-border)",
        }}
      >
        {months.map((month, index) => (
          <div
            key={`${month.year}-${month.month}`}
            className="flex items-center justify-center text-xs font-medium border-r"
            style={{
              width: month.width,
              minWidth: month.width,
              color: "var(--notion-text)",
              borderColor: "var(--notion-border)",
              background:
                index % 2 === 0
                  ? "var(--notion-bg-secondary)"
                  : "rgba(0, 0, 0, 0.02)",
            }}
          >
            {month.label}
          </div>
        ))}
      </div>

      {/* Day Row */}
      <div
        className="flex h-[26px]"
        style={{ background: "var(--notion-bg)" }}
      >
        {days.map((day, index) => {
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const isToday = index === todayIndex;
          const dayOfMonth = day.getDate();

          return (
            <div
              key={index}
              className="flex items-center justify-center text-[10px] border-r"
              style={{
                width: DAY_WIDTH,
                minWidth: DAY_WIDTH,
                borderColor: "rgba(0, 0, 0, 0.05)",
                color: isToday
                  ? "#ef4444"
                  : isWeekend
                    ? "#9ca3af"
                    : "var(--notion-text-muted)",
                fontWeight: isToday ? 600 : 400,
                background: isToday
                  ? "rgba(239, 68, 68, 0.08)"
                  : isWeekend
                    ? "rgba(0, 0, 0, 0.02)"
                    : "transparent",
              }}
            >
              {dayOfMonth}
            </div>
          );
        })}
      </div>
    </div>
  );
});

