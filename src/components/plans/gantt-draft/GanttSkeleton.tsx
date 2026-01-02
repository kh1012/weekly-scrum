/**
 * Gantt 차트 스켈레톤 로딩 UI
 * - 필터 적용 중 표시
 * - 트리와 타임라인 영역 모방
 */

"use client";

import { TREE_WIDTH } from "./DraftTreePanel";

export function GanttSkeleton() {
  return (
    <div className="absolute inset-0 z-50 flex bg-white">
      {/* 트리 스켈레톤 */}
      <div
        className="flex-shrink-0 border-r border-gray-200 overflow-hidden"
        style={{ width: TREE_WIDTH }}
      >
        {/* 헤더 영역 */}
        <div className="h-[76px] border-b border-gray-200 p-2 space-y-2">
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-8 bg-gray-100 rounded-lg animate-pulse" />
        </div>

        {/* 트리 아이템 */}
        <div className="p-2 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-2 animate-pulse"
              style={{ marginLeft: (i % 3) * 16 }}
            >
              <div className="w-4 h-4 bg-gray-200 rounded" />
              <div
                className="h-4 bg-gray-200 rounded"
                style={{ width: `${60 + Math.random() * 80}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 타임라인 스켈레톤 */}
      <div className="flex-1 overflow-hidden">
        {/* 헤더 영역 */}
        <div className="h-[76px] border-b border-gray-200">
          {/* 월 헤더 */}
          <div className="h-[38px] border-b border-gray-100 flex">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 border-r border-gray-100 p-2 flex items-center justify-center"
              >
                <div className="h-5 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* 날짜 헤더 */}
          <div className="h-[38px] flex overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="w-10 border-r border-gray-100 p-1 flex flex-col items-center justify-center"
              >
                <div className="h-2 w-6 bg-gray-100 rounded animate-pulse mb-1" />
                <div className="h-3 w-8 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* 타임라인 바 영역 */}
        <div className="p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <div key={rowIndex} className="relative h-12">
              {/* 랜덤한 위치와 길이의 바 스켈레톤 */}
              {Array.from({ length: Math.floor(Math.random() * 2) + 1 }).map(
                (_, barIndex) => {
                  const left = Math.random() * 60;
                  const width = 10 + Math.random() * 25;
                  return (
                    <div
                      key={barIndex}
                      className="absolute h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg animate-pulse"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        top: barIndex * 12,
                      }}
                    >
                      <div className="p-2 space-y-1">
                        <div className="h-2 bg-gray-300/50 rounded w-1/3" />
                        <div className="h-2 bg-gray-300/50 rounded w-2/3" />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          ))}
        </div>

        {/* 로딩 텍스트 */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="flex flex-col items-center gap-3 bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
            </div>
            <p className="text-sm font-medium text-gray-700">
              필터 적용 중...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

