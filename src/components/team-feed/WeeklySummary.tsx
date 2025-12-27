"use client";

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
 */
export function WeeklySummary({ feedItems }: WeeklySummaryProps) {
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
    <div className="sticky top-0 py-2">
      <div className="mb-4 px-2">
        <h2 className="text-sm font-semibold text-[#24292f] mb-1">
          Weekly Summary
        </h2>
        <p className="text-xs text-[#57606a]">
          {weeks.length} weeks · {totalEntries} entries
        </p>
      </div>

      {/* 주차별 통계 */}
      <div className="space-y-2">
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
    </div>
  );
}

