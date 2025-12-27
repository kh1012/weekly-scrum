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
 */
export function ActivityChart({ data }: ActivityChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
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
    <div className="sticky top-24 h-fit bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Activity</h3>
      <p className="text-sm text-gray-600 mb-6">
        Avg {avgCount} entries/day · Peak: {formatDate(peakDay.date)} (
        {peakDay.count})
      </p>

      {/* 바 차트 */}
      <div className="space-y-2">
        {data.map((item, index) => {
          const heightPercent = (item.count / maxCount) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.date}
              className="relative flex items-center gap-3 group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* 날짜 레이블 */}
              <div className="w-16 text-xs text-gray-500 text-right">
                {formatShortDate(item.date)}
              </div>

              {/* 바 */}
              <div className="flex-1 h-8 bg-gray-100 rounded relative overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isHovered ? "bg-blue-600" : "bg-blue-500"
                  }`}
                  style={{ width: `${heightPercent}%` }}
                />
                {isHovered && (
                  <div className="absolute inset-0 flex items-center justify-end pr-2">
                    <span className="text-xs font-medium text-white">
                      {item.count} entries · {item.authorCount} authors
                    </span>
                  </div>
                )}
              </div>

              {/* 개수 표시 */}
              <div className="w-8 text-xs text-gray-700 font-medium">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>
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

