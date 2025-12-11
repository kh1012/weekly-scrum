"use client";

/**
 * Week Cell 컴포넌트 (Airbnb 스타일 + Pinterest 확장)
 *
 * 개별 주에 대한 프로젝트/멤버 막대 그래프 표시
 * 더보기 클릭 시 전체 항목 표시
 */

import { useState, useMemo } from "react";
import type { CalendarMode, WeekKey, WeekAggregation } from "@/types/calendar";
import { formatWeekLabel } from "@/lib/calendarAggregation";

interface WeekCellProps {
  week: WeekAggregation;
  mode: CalendarMode;
  selected: boolean;
  onSelectWeek: (weekKey: WeekKey) => void;
  onSelectInitiative: (name: string) => void;
  onSelectMember: (name: string) => void;
}

// 프로젝트별 색상 팔레트 (Airbnb 스타일)
const PROJECT_COLORS = [
  { bg: "bg-blue-500", hover: "hover:bg-blue-600", light: "bg-blue-50" },
  { bg: "bg-emerald-500", hover: "hover:bg-emerald-600", light: "bg-emerald-50" },
  { bg: "bg-purple-500", hover: "hover:bg-purple-600", light: "bg-purple-50" },
  { bg: "bg-orange-500", hover: "hover:bg-orange-600", light: "bg-orange-50" },
  { bg: "bg-pink-500", hover: "hover:bg-pink-600", light: "bg-pink-50" },
  { bg: "bg-cyan-500", hover: "hover:bg-cyan-600", light: "bg-cyan-50" },
  { bg: "bg-amber-500", hover: "hover:bg-amber-600", light: "bg-amber-50" },
  { bg: "bg-indigo-500", hover: "hover:bg-indigo-600", light: "bg-indigo-50" },
];

// 멤버별 색상 팔레트
const MEMBER_COLORS = [
  { bg: "bg-violet-500", hover: "hover:bg-violet-600", light: "bg-violet-50" },
  { bg: "bg-rose-500", hover: "hover:bg-rose-600", light: "bg-rose-50" },
  { bg: "bg-teal-500", hover: "hover:bg-teal-600", light: "bg-teal-50" },
  { bg: "bg-lime-500", hover: "hover:bg-lime-600", light: "bg-lime-50" },
  { bg: "bg-fuchsia-500", hover: "hover:bg-fuchsia-600", light: "bg-fuchsia-50" },
  { bg: "bg-sky-500", hover: "hover:bg-sky-600", light: "bg-sky-50" },
  { bg: "bg-red-500", hover: "hover:bg-red-600", light: "bg-red-50" },
  { bg: "bg-green-500", hover: "hover:bg-green-600", light: "bg-green-50" },
];

const DEFAULT_VISIBLE_COUNT = 4;

export function WeekCell({
  week,
  mode,
  selected,
  onSelectWeek,
  onSelectInitiative,
  onSelectMember,
}: WeekCellProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const label = formatWeekLabel(week);

  const allItems = useMemo(() => {
    return mode === "project" ? week.initiatives : week.members;
  }, [week, mode]);

  // 표시할 항목
  const visibleItems = useMemo(() => {
    if (isExpanded) return allItems;
    return allItems.slice(0, DEFAULT_VISIBLE_COUNT);
  }, [allItems, isExpanded]);

  // 최대 focusScore 계산 (막대 비율용)
  const maxFocus = useMemo(() => {
    const total = mode === "project" ? week.totalInitiativeFocus : week.totalMemberFocus;
    return total > 0 ? total : 1;
  }, [week, mode]);

  const colors = mode === "project" ? PROJECT_COLORS : MEMBER_COLORS;
  const totalCount = allItems.length;
  const hasMore = totalCount > DEFAULT_VISIBLE_COUNT;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      onClick={() => onSelectWeek(week.key)}
      className={`group p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
        selected
          ? "border-gray-900 bg-white shadow-lg"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
      }`}
      style={{
        // Pinterest 스타일: 확장 시 자연스럽게 높이 증가
        minHeight: isExpanded ? "auto" : undefined,
      }}
    >
      {/* 주차 레이블 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-sm font-bold text-gray-900">{label.split("·")[0].trim()}</span>
          <span className="block text-xs text-gray-400 mt-0.5">
            {label.split("·")[1]?.trim()}
          </span>
        </div>
        <div className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
          selected ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
        }`}>
          {totalCount}개
        </div>
      </div>

      {/* 막대 그래프 */}
      <div className="space-y-2.5">
        {visibleItems.length === 0 ? (
          <div className="text-xs text-gray-400 py-4 text-center">
            데이터 없음
          </div>
        ) : (
          visibleItems.map((item, idx) => {
            const name = mode === "project"
              ? (item as typeof week.initiatives[0]).initiativeName
              : (item as typeof week.members[0]).memberName;
            const focusScore = item.focusScore;
            const percentage = Math.round((focusScore / maxFocus) * 100);
            const color = colors[idx % colors.length];
            const doneCount = item.doneTaskCount;

            return (
              <div
                key={name}
                onClick={(e) => {
                  e.stopPropagation();
                  if (mode === "project") {
                    onSelectInitiative(name);
                  } else {
                    onSelectMember(name);
                  }
                }}
                className="group/item"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-medium text-gray-700 truncate flex-1 group-hover/item:text-gray-900 transition-colors">
                    {name}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-500 ml-2 shrink-0 tabular-nums">
                    {doneCount}건
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color.bg} rounded-full transition-all duration-500 group-hover/item:opacity-80`}
                    style={{ width: `${Math.max(percentage, 8)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 더 보기 / 접기 버튼 */}
      {hasMore && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={handleToggleExpand}
            className="w-full text-xs text-gray-500 hover:text-gray-700 font-medium py-1 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
          >
            {isExpanded ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
                접기
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                +{totalCount - DEFAULT_VISIBLE_COUNT}개 더 보기
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
