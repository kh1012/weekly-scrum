"use client";

import { useState } from "react";
import type { FeedItemData } from "@/types/teamFeed";

interface WeeklySummaryProps {
  feedItems: FeedItemData[];
}

interface WeekData {
  year: number;
  week: string;
  entryCount: number;
  feedCount: number;
}

/**
 * 주차별 엔트리 통계 컴포넌트 - GitHub 스타일
 * - 주차별로 그룹화된 엔트리 개수 표시
 * - Collapsible
 */
export function WeeklySummary({ feedItems }: WeeklySummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 주차별 그룹화
  const weeks: WeekData[] = [];
  const weekMap = new Map<string, number>();

  feedItems.forEach((item) => {
    const key = `${item.year}-${item.week}`;
    if (!weekMap.has(key)) {
      weekMap.set(key, weeks.length);
      weeks.push({
        year: item.year,
        week: item.week,
        entryCount: item.entries.length,
        feedCount: 1,
      });
    } else {
      const index = weekMap.get(key)!;
      weeks[index].entryCount += item.entries.length;
      weeks[index].feedCount += 1;
    }
  });

  if (weeks.length === 0) return null;

  // 총 엔트리 개수
  const totalEntries = weeks.reduce((sum, w) => sum + w.entryCount, 0);

  return (
    <div className="border border-[#d0d7de] rounded-md bg-white">
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f6f8fa] transition-colors rounded-t-md"
      >
        <div className="text-left">
          <h2 className="text-sm font-semibold text-[#24292f] mb-0.5">
            Weekly Summary
          </h2>
          <p className="text-xs text-[#57606a]">
            {weeks.length} weeks · {totalEntries} entries
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-[#57606a] transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content - Expandable */}
      {isExpanded && (
        <div className="px-4 pb-4 pt-2 border-t border-[#d0d7de] space-y-2 max-h-[400px] overflow-y-auto">
          {weeks.map((week) => (
            <div
              key={`${week.year}-${week.week}`}
              className="px-3 py-2 bg-[#f6f8fa] border border-[#d0d7de] rounded-md hover:bg-white transition-colors"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-xs font-semibold text-[#24292f]">
                  {week.year} {week.week}
                </span>
                <span className="text-xs font-medium text-[#0969da]">
                  {week.entryCount} entries
                </span>
              </div>
              <p className="text-[10px] text-[#57606a]">
                {week.feedCount} feed{week.feedCount > 1 ? "s" : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

