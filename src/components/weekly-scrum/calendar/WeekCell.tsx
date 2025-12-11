"use client";

/**
 * Week Cell 컴포넌트
 *
 * 개별 주에 대한 프로젝트/멤버 막대 그래프 표시
 */

import { useMemo } from "react";
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

// 프로젝트별 색상 팔레트
const PROJECT_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-pink-500",
  "bg-cyan-500",
  "bg-amber-500",
  "bg-indigo-500",
];

// 멤버별 색상 팔레트
const MEMBER_COLORS = [
  "bg-violet-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-lime-500",
  "bg-fuchsia-500",
  "bg-sky-500",
  "bg-red-500",
  "bg-green-500",
];

export function WeekCell({
  week,
  mode,
  selected,
  onSelectWeek,
  onSelectInitiative,
  onSelectMember,
}: WeekCellProps) {
  const label = formatWeekLabel(week);

  // 상위 3개 항목만 표시
  const topItems = useMemo(() => {
    if (mode === "project") {
      return week.initiatives.slice(0, 3);
    }
    return week.members.slice(0, 3);
  }, [week, mode]);

  // 최대 focusScore 계산 (막대 비율용)
  const maxFocus = useMemo(() => {
    const total = mode === "project" ? week.totalInitiativeFocus : week.totalMemberFocus;
    return total > 0 ? total : 1;
  }, [week, mode]);

  const colors = mode === "project" ? PROJECT_COLORS : MEMBER_COLORS;

  return (
    <div
      onClick={() => onSelectWeek(week.key)}
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
        selected
          ? "border-blue-500 bg-blue-50/50 shadow-sm"
          : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
      }`}
    >
      {/* 주차 레이블 */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-xs text-gray-500">
          {mode === "project"
            ? `${week.initiatives.length}개 프로젝트`
            : `${week.members.length}명 참여`}
        </span>
      </div>

      {/* 막대 그래프 */}
      <div className="space-y-2">
        {topItems.length === 0 ? (
          <div className="text-xs text-gray-400 py-2">데이터 없음</div>
        ) : (
          topItems.map((item, idx) => {
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
                className="group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-gray-700 truncate flex-1 group-hover:text-blue-600 transition-colors">
                    {name}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {doneCount}건 완료
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all group-hover:opacity-80`}
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 더 보기 표시 */}
      {(mode === "project" ? week.initiatives.length : week.members.length) > 3 && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          +{(mode === "project" ? week.initiatives.length : week.members.length) - 3}개 더
        </div>
      )}
    </div>
  );
}

