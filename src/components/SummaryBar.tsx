"use client";

/**
 * Summary Bar 컴포넌트
 * 
 * 현재 적용 중인 필터/검색 조건을 한눈에 표시합니다.
 */

import { formatWeekDisplay, type GnbParams } from "@/lib/ui/gnbParams";

interface SummaryBarProps {
  params: GnbParams;
  totalCount?: number;
  onReset?: () => void;
}

export function SummaryBar({ params, totalCount, onReset }: SummaryBarProps) {
  const conditions: { label: string; value: string; color: string }[] = [];

  // 주차
  if (params.year && params.week) {
    conditions.push({
      label: "주차",
      value: formatWeekDisplay(params.year, params.week),
      color: "blue",
    });
  }

  // 범위
  if (params.rangeStart && params.rangeEnd) {
    conditions.push({
      label: "범위",
      value: `${params.rangeStart} ~ ${params.rangeEnd}`,
      color: "purple",
    });
  }

  // 검색어
  if (params.query) {
    conditions.push({
      label: "검색",
      value: `"${params.query}"`,
      color: "amber",
    });
  }

  // 상태
  if (params.status) {
    conditions.push({
      label: "상태",
      value: params.status,
      color: "emerald",
    });
  }

  // 프로젝트
  if (params.project) {
    conditions.push({
      label: "프로젝트",
      value: params.project,
      color: "rose",
    });
  }

  // 도메인
  if (params.domain) {
    conditions.push({
      label: "도메인",
      value: params.domain,
      color: "indigo",
    });
  }

  // 작성자
  if (params.author) {
    conditions.push({
      label: "작성자",
      value: params.author,
      color: "cyan",
    });
  }

  if (conditions.length === 0) {
    return null;
  }

  const colorClasses: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-200",
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {conditions.map((condition, index) => (
          <span
            key={index}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${colorClasses[condition.color]}`}
          >
            <span className="opacity-70">{condition.label}:</span>
            <span>{condition.value}</span>
          </span>
        ))}
        
        {totalCount !== undefined && (
          <span className="text-xs text-gray-500 ml-2">
            총 {totalCount}개
          </span>
        )}
      </div>

      {onReset && (
        <button
          onClick={onReset}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          초기화
        </button>
      )}
    </div>
  );
}





















