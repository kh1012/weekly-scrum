"use client";

import type { ExecutionGapItem } from "@/types/insight";

interface ExecutionGapProps {
  items: ExecutionGapItem[];
}

function getGapColorClass(gap: number): string {
  if (gap <= -11) {
    return "text-red-600";
  }
  if (gap <= -1) {
    return "text-orange-500";
  }
  return "text-[#1f2328]";
}

function getGapBgClass(gap: number): string {
  if (gap <= -11) {
    return "bg-red-50 border-red-200";
  }
  if (gap <= -1) {
    return "bg-orange-50 border-orange-200";
  }
  return "bg-[#f6f8fa] border-[#d8dee4]";
}

export function ExecutionGap({ items }: ExecutionGapProps) {
  // gap < 0 인 항목만 필터링
  const negativeGapItems = items.filter((item) => item.gap < 0);

  if (negativeGapItems.length === 0) {
    return (
      <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
        <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Execution Gap Analysis
        </h2>
        <div className="text-center py-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-[#656d76]">계획 대비 부족한 항목이 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
      <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        Execution Gap Analysis
        <span className="ml-auto text-xs font-normal text-[#656d76] bg-[#f6f8fa] px-2 py-0.5 rounded-full">
          {negativeGapItems.length}건
        </span>
      </h2>
      
      <div className="space-y-3">
        {negativeGapItems.map((item, index) => {
          const colorClass = getGapColorClass(item.gap);
          const bgClass = getGapBgClass(item.gap);
          
          return (
            <div
              key={index}
              className={`p-4 border rounded-lg ${bgClass}`}
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-[#1f2328]">
                  {item.name}
                </span>
                <span className="text-xs text-[#656d76] bg-white px-2 py-0.5 rounded border border-[#d8dee4]">
                  {item.project}
                </span>
                <span className={`ml-auto text-lg font-bold ${colorClass}`}>
                  {item.gap}%
                </span>
              </div>
              {item.reason && (
                <p className="text-sm text-[#656d76] mt-2">
                  <span className="font-medium text-[#1f2328]">Reason:</span>{" "}
                  {item.reason}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}


