"use client";

import type { QuadrantSummaryData } from "@/types/insight";

interface QuadrantSummaryProps {
  data: QuadrantSummaryData;
}

const QUADRANT_LABELS: Record<string, { label: string; description: string; color: string }> = {
  q1: {
    label: "Q1",
    description: "높은 진척 + 낮은 리스크",
    color: "#22c55e",
  },
  q2: {
    label: "Q2",
    description: "낮은 진척 + 낮은 리스크",
    color: "#3b82f6",
  },
  q3: {
    label: "Q3",
    description: "낮은 진척 + 높은 리스크",
    color: "#ef4444",
  },
  q4: {
    label: "Q4",
    description: "높은 진척 + 높은 리스크",
    color: "#f59e0b",
  },
};

export function QuadrantSummary({ data }: QuadrantSummaryProps) {
  const total = data.q1 + data.q2 + data.q3 + data.q4;
  const quadrants = [
    { key: "q1", value: data.q1 },
    { key: "q2", value: data.q2 },
    { key: "q3", value: data.q3 },
    { key: "q4", value: data.q4 },
  ];

  const maxValue = Math.max(data.q1, data.q2, data.q3, data.q4, 1);

  return (
    <section className="bg-white border border-[#d0d7de] rounded-lg p-5">
      <h2 className="text-base font-semibold text-[#1f2328] mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-[#656d76]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
        </svg>
        Quadrant Summary
        <span className="ml-auto text-xs font-normal text-[#656d76] bg-[#f6f8fa] px-2 py-0.5 rounded-full">
          총 {total}건
        </span>
      </h2>

      {/* 사분면 그리드 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {quadrants.map(({ key, value }) => {
          const info = QUADRANT_LABELS[key];
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          
          return (
            <div
              key={key}
              className="relative p-4 rounded-lg border border-[#d8dee4] bg-[#f6f8fa]"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="text-sm font-bold"
                  style={{ color: info.color }}
                >
                  {info.label}
                </span>
                <span className="text-2xl font-bold text-[#1f2328]">
                  {value}
                </span>
              </div>
              <p className="text-xs text-[#656d76] mb-2">
                {info.description}
              </p>
              {/* 진행 바 */}
              <div className="h-1.5 bg-[#d8dee4] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(value / maxValue) * 100}%`,
                    backgroundColor: info.color,
                  }}
                />
              </div>
              <span className="absolute top-3 right-3 text-xs text-[#8c959f]">
                {percentage}%
              </span>
            </div>
          );
        })}
      </div>

      {/* 해석 */}
      {data.explanation.length > 0 && (
        <div className="border-t border-[#d8dee4] pt-4">
          <h3 className="text-sm font-medium text-[#656d76] mb-2">분석</h3>
          <ul className="space-y-1.5">
            {data.explanation.map((text, index) => (
              <li key={index} className="flex items-start gap-2">
                <span 
                  className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full bg-slate-400"
                  aria-hidden="true"
                />
                <span className="text-sm text-[#1f2328]">{text}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

