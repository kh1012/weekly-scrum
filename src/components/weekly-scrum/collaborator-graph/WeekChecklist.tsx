"use client";

import { useMemo } from "react";
import type { WeekOption } from "./useAvailableSnapshotWeeks";

interface WeekChecklistProps {
  weeks: WeekOption[];
  selectedWeeks: Set<string>;
  onToggleWeek: (weekKey: string) => void;
  onSelectAll: () => void;
  onSelectNone: () => void;
  onSelectLast4: () => void;
  onSelectLast8: () => void;
  isLoading?: boolean;
}

export function WeekChecklist({
  weeks,
  selectedWeeks,
  onToggleWeek,
  onSelectAll,
  onSelectNone,
  onSelectLast4,
  onSelectLast8,
  isLoading = false,
}: WeekChecklistProps) {
  const allSelected = useMemo(
    () => weeks.length > 0 && weeks.every((w) => selectedWeeks.has(w.weekKey)),
    [weeks, selectedWeeks]
  );

  const noneSelected = useMemo(
    () => selectedWeeks.size === 0,
    [selectedWeeks]
  );

  if (isLoading) {
    return (
      <div className="text-center text-xs text-[#57606a] py-6">
        주차 데이터를 불러오는 중...
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="text-center py-6">
        <svg
          className="w-10 h-10 mx-auto text-[#d0d7de] mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-xs text-[#57606a] font-medium">
          스냅샷 데이터가 없습니다
        </p>
        <p className="text-[11px] text-[#8c959f] mt-0.5">
          먼저 스냅샷을 작성해주세요
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Quick Select Buttons */}
      <div className="grid grid-cols-2 gap-1.5 mb-3">
        <button
          onClick={onSelectAll}
          disabled={allSelected}
          className={`px-2.5 py-1.5 text-[11px] font-normal rounded-md border transition-colors ${
            allSelected
              ? "bg-[#f6f8fa] text-[#8c959f] border-[#d0d7de] cursor-not-allowed"
              : "bg-white text-[#24292f] border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#0969da]"
          }`}
        >
          전체 선택
        </button>
        <button
          onClick={onSelectNone}
          disabled={noneSelected}
          className={`px-2.5 py-1.5 text-[11px] font-normal rounded-md border transition-colors ${
            noneSelected
              ? "bg-[#f6f8fa] text-[#8c959f] border-[#d0d7de] cursor-not-allowed"
              : "bg-white text-[#24292f] border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#0969da]"
          }`}
        >
          선택 해제
        </button>
        <button
          onClick={onSelectLast4}
          className="px-2.5 py-1.5 text-[11px] font-normal rounded-md border bg-white text-[#24292f] border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#0969da] transition-colors"
        >
          최근 4주
        </button>
        <button
          onClick={onSelectLast8}
          className="px-2.5 py-1.5 text-[11px] font-normal rounded-md border bg-white text-[#24292f] border-[#d0d7de] hover:bg-[#f6f8fa] hover:border-[#0969da] transition-colors"
        >
          최근 8주
        </button>
      </div>

      {/* Week List */}
      <div className="space-y-1.5">
        {weeks.map((week) => {
          const isSelected = selectedWeeks.has(week.weekKey);
          return (
            <label
              key={week.weekKey}
              className={`group flex items-center gap-2.5 p-2.5 rounded-md border cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "border-[#0969da] bg-[#ddf4ff]"
                  : "border-[#d0d7de] bg-white hover:border-[#0969da] hover:bg-[#f6f8fa]"
              }`}
            >
              {/* Checkbox */}
              <div
                className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0 ${
                  isSelected
                    ? "bg-[#0969da] border-[#0969da]"
                    : "border-[#d0d7de] group-hover:border-[#0969da]"
                }`}
              >
                {isSelected && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </div>
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleWeek(week.weekKey)}
                className="sr-only"
              />

              {/* Week Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-xs font-medium ${
                      isSelected ? "text-[#0969da]" : "text-[#24292f]"
                    }`}
                  >
                    {week.year} W{String(week.week).padStart(2, "0")}
                  </span>
                  <span
                    className={`text-[11px] ${
                      isSelected ? "text-[#0969da]" : "text-[#57606a]"
                    }`}
                  >
                    {week.weekStart} ~ {week.weekEnd}
                  </span>
                </div>
                <div
                  className={`text-[11px] mt-0.5 ${
                    isSelected ? "text-[#0969da]" : "text-[#57606a]"
                  }`}
                >
                  스냅샷 {week.snapshotCount}개
                </div>
              </div>
            </label>
          );
        })}
      </div>
    </>
  );
}

