/**
 * DraftTimeline 그리드 라인
 */

"use client";

import { DAY_WIDTH } from "../timelineTypes";
import type { FlatTreeNode } from "../../laneLayout";

interface TimelineGridLinesProps {
  days: Date[];
  rangeStart: Date;
  nodePositions: Array<{
    node: FlatTreeNode;
    top: number;
    height: number;
  }>;
}

export function TimelineGridLines({
  days,
  rangeStart,
  nodePositions,
}: TimelineGridLinesProps) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* 수직선 (일별) */}
      {days.map((day, idx) => {
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const isMonday = day.getDay() === 1;

        return (
          <div
            key={idx}
            className="absolute top-0 h-full transition-colors duration-100"
            style={{
              left: idx * DAY_WIDTH,
              width: DAY_WIDTH,
              background: isWeekend ? "rgba(0, 0, 0, 0.015)" : "transparent",
              borderRight: "1px solid rgba(0, 0, 0, 0.04)",
              borderLeft: isMonday ? "2px solid rgba(0, 0, 0, 0.08)" : "none",
            }}
          />
        );
      })}

      {/* 수평선 (노드별) */}
      {nodePositions.map(({ node, top, height }) => (
        <div
          key={node.id}
          className="absolute left-0 w-full"
          style={{
            top: top + height,
            borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
          }}
        />
      ))}

      {/* 오늘 표시선 - Airbnb 스타일 */}
      {(() => {
        const today = new Date();
        const daysDiff = Math.floor(
          (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff >= 0 && daysDiff < days.length) {
          return (
            <div
              className="absolute top-0 h-full z-10"
              style={{
                left: daysDiff * DAY_WIDTH + DAY_WIDTH / 2 - 1,
                width: 2,
                background:
                  "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)",
              }}
            />
          );
        }
        return null;
      })()}
    </div>
  );
}

