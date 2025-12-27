"use client";

import { useState } from "react";
import type { ActivityChartData } from "@/types/teamFeed";

interface ActivityChartProps {
  data: ActivityChartData[];
}

/**
 * 활동 차트 컴포넌트
 * - 최근 14일간의 일별 엔트리 작성 현황
 * - 바 차트 형태
 * - Collapsible
 */
export function ActivityChart({ data }: ActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  if (data.length === 0) {
    return (
      <div className="p-4 bg-[#f6f8fa] text-center text-[#57606a] text-xs border border-[#d0d7de] rounded-md">
        활동 데이터가 없습니다.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);
  const avgCount = (
    data.reduce((sum, d) => sum + d.count, 0) / data.length
  ).toFixed(1);

  // 피크 날짜 찾기
  const peakDay = data.reduce((prev, current) =>
    current.count > prev.count ? current : prev
  );

  return (
    <div className="border border-[#d0d7de] rounded-md bg-white">
      {/* Header - Clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#f6f8fa] transition-colors rounded-t-md"
      >
        <div className="text-left">
          <h3 className="text-sm font-semibold text-[#24292f] mb-0.5">
            Team Activity
          </h3>
          <p className="text-xs text-[#57606a]">
            Avg {avgCount} entries/day · Peak: {formatDate(peakDay.date)} (
            {peakDay.count})
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
        <div className="px-4 pb-4 pt-2 border-t border-[#d0d7de] space-y-1.5 max-h-[400px] overflow-y-auto">
          {data.map((item, index) => {
            const heightPercent = (item.count / maxCount) * 100;
            const isHovered = hoveredIndex === index;

            return (
              <div
                key={item.date}
                className="relative flex items-center gap-2 group"
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* 날짜 레이블 */}
                <div className="w-12 text-[11px] text-[#57606a] text-right">
                  {formatShortDate(item.date)}
                </div>

                {/* 바 */}
                <div className="flex-1 h-6 bg-[#f6f8fa] relative overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isHovered ? "bg-[#0969da]" : "bg-[#0969da]/80"
                    }`}
                    style={{ width: `${heightPercent}%` }}
                  />
                  {isHovered && (
                    <div className="absolute inset-0 flex items-center justify-end pr-2">
                      <span className="text-[10px] font-medium text-white">
                        {item.count} entries · {item.authorCount} authors
                      </span>
                    </div>
                  )}
                </div>

                {/* 개수 표시 */}
                <div className="w-6 text-[11px] text-[#24292f] font-medium">
                  {item.count}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

