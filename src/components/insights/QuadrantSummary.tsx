"use client";

import { useState } from "react";
import type { QuadrantSummaryData } from "@/types/insight";

interface QuadrantSummaryProps {
  data: QuadrantSummaryData;
}

interface QuadrantInfo {
  label: string;
  description: string;
  color: string;
}

const QUADRANT_LABELS: Record<string, QuadrantInfo> = {
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
  const [hoveredQuadrant, setHoveredQuadrant] = useState<string | null>(null);
  
  const total = data.q1 + data.q2 + data.q3 + data.q4;
  
  // Q1 -> Q4 순서로 표시
  const barData = [
    { key: "q1", value: data.q1 },
    { key: "q2", value: data.q2 },
    { key: "q3", value: data.q3 },
    { key: "q4", value: data.q4 },
  ];

  // 실제 사분면 배치: Q2 Q1 / Q3 Q4
  const gridQuadrants = [
    { key: "q2", value: data.q2 },
    { key: "q1", value: data.q1 },
    { key: "q3", value: data.q3 },
    { key: "q4", value: data.q4 },
  ];

  // 각 사분면에 대응되는 분석 결과 찾기
  const findExplanationForQuadrant = (key: string): string | null => {
    const label = QUADRANT_LABELS[key].label;
    return data.explanation.find((exp) => exp.includes(label)) || null;
  };

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

      {/* 막대바 형태 프로그래스바 */}
      <div className="space-y-3 mb-5">
        {barData.map(({ key, value }) => {
          const info = QUADRANT_LABELS[key];
          const percentage = total > 0 ? (value / total) * 100 : 0;
          const isHovered = hoveredQuadrant === key;
          
          return (
            <div
              key={key}
              className="group cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredQuadrant(key)}
              onMouseLeave={() => setHoveredQuadrant(null)}
            >
              <div className="flex items-center gap-3">
                {/* 라벨 */}
                <div 
                  className="w-10 text-sm font-bold flex-shrink-0"
                  style={{ color: info.color }}
                >
                  {info.label}
                </div>
                
                {/* 프로그래스바 */}
                <div className="flex-1 h-6 bg-[#e5e7eb] rounded-full overflow-hidden relative">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: info.color,
                      opacity: isHovered ? 1 : 0.85,
                    }}
                  />
                  {/* 호버 시 설명 표시 */}
                  {isHovered && (
                    <div 
                      className="absolute inset-0 flex items-center px-3 text-xs font-medium text-white truncate"
                      style={{ 
                        textShadow: percentage > 30 ? "0 1px 2px rgba(0,0,0,0.3)" : "none",
                        color: percentage > 30 ? "#fff" : "#1f2328",
                      }}
                    >
                      {info.description}
                    </div>
                  )}
                </div>
                
                {/* 갯수 */}
                <div className="w-8 text-right text-sm font-bold text-[#1f2328]">
                  {value}
                </div>
                
                {/* 퍼센트 */}
                <div className="w-12 text-right text-sm text-[#656d76]">
                  {percentage.toFixed(0)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 사분면 그리드 */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {gridQuadrants.map(({ key, value }) => {
          const info = QUADRANT_LABELS[key];
          const percentage = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
          const isHovered = hoveredQuadrant === key;
          
          return (
            <div
              key={key}
              className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                isHovered 
                  ? "border-[#1f2328] bg-white shadow-md" 
                  : "border-[#d8dee4] bg-[#f6f8fa]"
              }`}
              onMouseEnter={() => setHoveredQuadrant(key)}
              onMouseLeave={() => setHoveredQuadrant(null)}
            >
              {/* 상단: 라벨 + 퍼센트 */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-sm font-bold"
                  style={{ color: info.color }}
                >
                  {info.label}
                </span>
                <span className="text-xs text-[#8c959f]">
                  {percentage}%
                </span>
              </div>
              {/* 숫자 */}
              <div className="text-2xl font-bold text-[#1f2328] mb-1">
                {value}
              </div>
              {/* 설명 */}
              <p className="text-xs text-[#656d76]">
                {info.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* 해석 */}
      {data.explanation.length > 0 && (
        <div className="border-t border-[#d8dee4] pt-4">
          <h3 className="text-sm font-medium text-[#656d76] mb-2">분석</h3>
          <ul className="space-y-1.5">
            {data.explanation.map((text, index) => {
              // 어떤 사분면에 대한 분석인지 확인
              const matchedQuadrant = Object.keys(QUADRANT_LABELS).find(
                (key) => text.includes(QUADRANT_LABELS[key].label)
              );
              const isHighlighted = matchedQuadrant && hoveredQuadrant === matchedQuadrant;
              
              return (
                <li 
                  key={index} 
                  className={`flex items-start gap-2 transition-all duration-200 ${
                    isHighlighted ? "bg-[#f6f8fa] -mx-2 px-2 py-1 rounded" : ""
                  }`}
                >
                  <span 
                    className="flex-shrink-0 w-1.5 h-1.5 mt-1.5 rounded-full"
                    style={{ 
                      backgroundColor: matchedQuadrant 
                        ? QUADRANT_LABELS[matchedQuadrant].color 
                        : "#9ca3af" 
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-[#1f2328]">{text}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
