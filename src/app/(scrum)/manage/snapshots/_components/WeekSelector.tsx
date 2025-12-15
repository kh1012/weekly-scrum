"use client";

/**
 * 연도 + ISO 주차 선택 UI (커스텀 드롭다운)
 */

import { useState, useRef, useEffect, useMemo } from "react";
import {
  getWeekOptions,
  getWeekDateRange,
  formatShortDate,
  getCurrentISOWeek,
} from "@/lib/date/isoWeek";

interface WeekSelectorProps {
  year: number;
  week: number;
  onYearChange: (year: number) => void;
  onWeekChange: (week: number) => void;
  /** 현재 선택된 주차의 스냅샷 갯수 (선택적) */
  snapshotCount?: number;
  /** 각 주차별 스냅샷 갯수 맵 (key: "년-주차", value: 갯수) */
  snapshotCountByWeek?: Map<string, number>;
}

/**
 * 동적 연도 옵션 생성 (브라우저 시간 기준)
 * - 현재 연도부터 시작
 * - 현재 연도 + 1년까지 포함
 */
function getDynamicYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  return [currentYear, currentYear + 1];
}

export function WeekSelector({
  year,
  week,
  onYearChange,
  onWeekChange,
  snapshotCount,
  snapshotCountByWeek,
}: WeekSelectorProps) {
  const weekOptions = getWeekOptions(year);
  const [isYearOpen, setIsYearOpen] = useState(false);
  const [isWeekOpen, setIsWeekOpen] = useState(false);
  const yearDropdownRef = useRef<HTMLDivElement>(null);
  const weekDropdownRef = useRef<HTMLDivElement>(null);
  const selectedYearRef = useRef<HTMLButtonElement>(null);
  const selectedWeekRef = useRef<HTMLButtonElement>(null);

  // 현재 주차 정보 (브라우저 시간 기준)
  const currentWeekInfo = useMemo(() => getCurrentISOWeek(), []);

  // 동적 연도 옵션
  const yearOptions = useMemo(() => getDynamicYearOptions(), []);

  // 주차별 기간 정보
  const weekOptionsWithRange = useMemo(() => {
    return weekOptions.map((w) => {
      const { weekStart, weekEnd } = getWeekDateRange(year, w);
      const isCurrentWeek =
        currentWeekInfo.year === year && currentWeekInfo.week === w;
      return {
        week: w,
        label: `W${w.toString().padStart(2, "0")}`,
        range: `${formatShortDate(weekStart)} ~ ${formatShortDate(weekEnd)}`,
        isCurrentWeek,
      };
    });
  }, [year, weekOptions, currentWeekInfo]);

  // 선택된 주차 정보
  const selectedWeekInfo = weekOptionsWithRange.find((w) => w.week === week);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        yearDropdownRef.current &&
        !yearDropdownRef.current.contains(event.target as Node)
      ) {
        setIsYearOpen(false);
      }
      if (
        weekDropdownRef.current &&
        !weekDropdownRef.current.contains(event.target as Node)
      ) {
        setIsWeekOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 드롭다운 열릴 때 선택된 항목으로 스크롤
  useEffect(() => {
    if (isYearOpen && selectedYearRef.current) {
      selectedYearRef.current.scrollIntoView({
        block: "center",
        behavior: "auto",
      });
    }
  }, [isYearOpen]);

  useEffect(() => {
    if (isWeekOpen && selectedWeekRef.current) {
      selectedWeekRef.current.scrollIntoView({
        block: "center",
        behavior: "auto",
      });
    }
  }, [isWeekOpen]);

  return (
    <div className="flex items-center gap-2">
      {/* 연도 선택 (커스텀 드롭다운) */}
      <div className="relative" ref={yearDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsYearOpen(!isYearOpen);
            setIsWeekOpen(false);
          }}
          className="flex items-center gap-2 h-9 rounded-lg px-3 text-sm font-medium bg-gray-50 transition-colors hover:bg-gray-100"
        >
          <span>{year}년</span>
          {currentWeekInfo.year === year && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
              현재
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isYearOpen ? "rotate-180" : ""
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

        {/* 연도 드롭다운 리스트 */}
        {isYearOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 max-h-60 overflow-y-auto min-w-[120px]">
            {yearOptions.map((y) => {
              const isCurrentYear = currentWeekInfo.year === y;
              return (
                <button
                  key={y}
                  ref={y === year ? selectedYearRef : null}
                  type="button"
                  onClick={() => {
                    onYearChange(y);
                    const maxWeek = getWeekOptions(y).length;
                    if (week > maxWeek) {
                      onWeekChange(maxWeek);
                    }
                    setIsYearOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    y === year
                      ? "bg-gray-100 font-medium"
                      : "hover:bg-gray-50"
                  } ${isCurrentYear ? "text-blue-600" : "text-gray-700"}`}
                >
                  <span className="font-medium">{y}년</span>
                  {isCurrentYear && (
                    <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                      현재
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 주차 선택 (커스텀 드롭다운) */}
      <div className="relative" ref={weekDropdownRef}>
        <button
          type="button"
          onClick={() => {
            setIsWeekOpen(!isWeekOpen);
            setIsYearOpen(false);
          }}
          className="flex items-center gap-2 h-9 rounded-lg px-3 text-sm font-medium bg-gray-50 transition-colors hover:bg-gray-100"
        >
          <span>{selectedWeekInfo?.label}</span>
          <span className="text-gray-500 text-xs">
            {selectedWeekInfo?.range}
          </span>
          {selectedWeekInfo?.isCurrentWeek && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
              현재
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${
              isWeekOpen ? "rotate-180" : ""
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

        {/* 주차 드롭다운 리스트 */}
        {isWeekOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-gray-200 py-1 max-h-80 overflow-y-auto min-w-[280px]">
            {weekOptionsWithRange.map((w) => {
              // 주차별 스냅샷 갯수 조회 (snapshotCountByWeek 우선, 없으면 현재 선택 주차면 snapshotCount 사용)
              const weekKey = `${year}-${w.week}`;
              let count = 0;
              if (snapshotCountByWeek) {
                count = snapshotCountByWeek.get(weekKey) || 0;
              } else if (w.week === week && snapshotCount !== undefined) {
                count = snapshotCount;
              }
              const hasSnapshots = count > 0;
              
              return (
                <button
                  key={w.week}
                  ref={w.week === week ? selectedWeekRef : null}
                  type="button"
                  onClick={() => {
                    onWeekChange(w.week);
                    setIsWeekOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
                    w.week === week
                      ? "bg-gray-100 font-medium"
                      : "hover:bg-gray-50"
                  } ${w.isCurrentWeek ? "text-blue-600" : "text-gray-700"}`}
                >
                  <div className="flex items-center gap-2">
                    {/* 스냅샷 갯수를 주차 라벨 좌측에 항상 표시 (0이면 회색 점) */}
                    {hasSnapshots ? (
                      <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded min-w-[18px] text-center font-medium">
                        {count}
                      </span>
                    ) : (
                      <span className="w-[18px] h-[18px] flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                      </span>
                    )}
                    <span className="font-medium">{w.label}</span>
                    {w.isCurrentWeek && (
                      <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">
                        현재
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{w.range}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

