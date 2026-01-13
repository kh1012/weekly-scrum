"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

interface WeekTimelineProps {
  year: number;
  week: number;
  onYearChange: (year: number) => void;
  onWeekChange: (week: number) => void;
  snapshotCountByWeek: Map<string, number>;
  isLoading?: boolean;
  className?: string;
  /** 편집 모드에서는 스냅샷이 없는 주차를 비활성화 */
  disableEmptyWeeks?: boolean;
  /** 현재 선택된 주차의 스냅샷 데이터 */
  currentWeekSnapshots?: any[];
  /** 워크스페이스 ID */
  workspaceId?: string;
  /** 사용자 ID */
  userId?: string;
  /** 최근 업데이트된 주차 (애니메이션용) */
  recentlyUpdatedWeek?: string | null;
}

// ISO 8601 주차 계산 (정확한 계산)
function getCurrentISOWeek(): { year: number; week: number } {
  const now = new Date();
  const target = new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  );

  // ISO 8601: 주는 월요일부터 시작, 연도의 첫 주는 목요일을 포함하는 주
  const dayOfWeek = (target.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6

  // 이번 주의 목요일로 이동
  const thursday = new Date(target);
  thursday.setUTCDate(target.getUTCDate() - dayOfWeek + 3);

  // 목요일이 속한 연도가 ISO 주차의 연도
  const year = thursday.getUTCFullYear();

  // 해당 연도의 1월 4일 (항상 첫 번째 주에 포함)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4DayOfWeek = (jan4.getUTCDay() + 6) % 7;

  // 첫 번째 주의 월요일
  const firstMonday = new Date(jan4);
  firstMonday.setUTCDate(jan4.getUTCDate() - jan4DayOfWeek);

  // 주차 계산
  const weekNumber =
    Math.floor((thursday.getTime() - firstMonday.getTime()) / 86400000 / 7) + 1;

  return { year, week: weekNumber };
}

// 특정 연도의 ISO 주차 수 계산
function getWeeksInYear(year: number): number {
  // ISO 8601: 해당 연도의 마지막 주차를 정확히 계산
  // 53주가 되는 조건:
  // 1. 1월 1일이 목요일이거나
  // 2. 윤년이고 1월 1일이 수요일인 경우

  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Day = jan1.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  const weeksInYear =
    jan1Day === 4 ? 53 : isLeapYear && jan1Day === 3 ? 53 : 52;

  return weeksInYear;
}

// 날짜 범위 계산 (ISO 주차)
function getWeekDateRange(year: number, week: number): string {
  // ISO 8601 week-1 based date calculation
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

  const startDate = new Date(week1Monday);
  startDate.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);

  const endDate = new Date(startDate);
  endDate.setUTCDate(startDate.getUTCDate() + 6);

  const formatShort = (date: Date) => {
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    return `${month}.${day}`;
  };

  return `${formatShort(startDate)} ~ ${formatShort(endDate)}`;
}

// 두 주차 사이의 모든 주차 생성
function generateWeeksBetween(
  startYear: number,
  startWeek: number,
  endYear: number,
  endWeek: number
): Array<{ year: number; week: number }> {
  const weeks: Array<{ year: number; week: number }> = [];

  let currentYear = startYear;
  let currentWeek = startWeek;

  // 안전장치: 무한 루프 방지 (최대 200주)
  let iterations = 0;
  const MAX_ITERATIONS = 200;

  while (iterations < MAX_ITERATIONS) {
    // 종료 조건 확인
    if (
      currentYear > endYear ||
      (currentYear === endYear && currentWeek > endWeek)
    ) {
      break;
    }

    weeks.push({ year: currentYear, week: currentWeek });

    // 다음 주차로 이동
    currentWeek++;
    const weeksInYear = getWeeksInYear(currentYear);
    if (currentWeek > weeksInYear) {
      currentWeek = 1;
      currentYear++;
    }

    iterations++;
  }

  return weeks;
}

export function WeekTimeline({
  year,
  week,
  onYearChange,
  onWeekChange,
  snapshotCountByWeek,
  isLoading = false,
  className = "",
  disableEmptyWeeks = false,
  currentWeekSnapshots = [],
  workspaceId,
  userId,
  recentlyUpdatedWeek = null,
}: WeekTimelineProps) {
  // 다중 선택 모드
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // 전체 주차에 대해 스냅샷 엔트리가 1개라도 있는지 확인
  const hasAnySnapshotEntries = useMemo(() => {
    return Array.from(snapshotCountByWeek.values()).some((count) => count > 0);
  }, [snapshotCountByWeek]);

  // 다중 선택 모드 시작
  const startMultiSelectMode = () => {
    setIsMultiSelectMode(true);
    setSelectedWeeks(new Set());
  };

  // 다중 선택 모드 취소
  const cancelMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    setSelectedWeeks(new Set());
  };

  // 주차 선택 토글
  const toggleWeekSelection = (weekKey: string) => {
    setSelectedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekKey)) {
        next.delete(weekKey);
      } else {
        next.add(weekKey);
      }
      return next;
    });
  };

  // 다중 주차 데이터 내보내기
  const exportMultipleWeeks = async () => {
    if (selectedWeeks.size === 0) {
      alert("내보낼 주차를 선택해주세요.");
      return;
    }

    if (!workspaceId || !userId) {
      alert("워크스페이스 또는 사용자 정보가 없습니다.");
      return;
    }

    setIsExporting(true);

    try {
      // 선택된 주차들의 데이터 가져오기
      const weeksData = [];

      for (const weekKey of Array.from(selectedWeeks)) {
        const [yearStr, weekStr] = weekKey.split("-");
        const weekYear = parseInt(yearStr, 10);
        const weekNum = parseInt(weekStr, 10);

        // ISO 주차의 시작 날짜 계산
        const jan4 = new Date(Date.UTC(weekYear, 0, 4));
        const jan4Day = jan4.getUTCDay() || 7;
        const week1Monday = new Date(jan4);
        week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);

        const startDate = new Date(week1Monday);
        startDate.setUTCDate(week1Monday.getUTCDate() + (weekNum - 1) * 7);

        const weekStartDate = startDate.toISOString().split("T")[0];

        // API 호출
        const response = await fetch(
          `/api/manage/snapshots?workspaceId=${workspaceId}&userId=${userId}&weekStartDate=${weekStartDate}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.snapshots && data.snapshots.length > 0) {
            weeksData.push({
              year: weekYear,
              week: weekNum,
              weekKey,
              snapshots: data.snapshots,
              stats: data.stats,
            });
          }
        }
      }

      if (weeksData.length === 0) {
        alert("내보낼 데이터가 없습니다.");
        setIsExporting(false);
        return;
      }

      // JSON 내보내기
      const exportData = {
        exportDate: new Date().toISOString(),
        totalWeeks: weeksData.length,
        weeks: weeksData,
      };

      const content = JSON.stringify(exportData, null, 2);
      const blob = new Blob([content], {
        type: "application/json;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `snapshots_${weeksData.length}weeks_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // 다중 선택 모드 종료
      cancelMultiSelectMode();
    } catch (error) {
      console.error("Failed to export snapshots:", error);
      alert("데이터 내보내기에 실패했습니다.");
    } finally {
      setIsExporting(false);
    }
  };
  // 연도별 주차 데이터 생성 (연속된 주차 표시)
  const groupedWeeks = useMemo(() => {
    // 1. 현재 ISO 주차 계산
    const currentISOWeek = getCurrentISOWeek();

    // 2. 다음 주차 계산 (현재 주차 +1)
    const nextWeek = { ...currentISOWeek };
    const weeksInCurrentYear = getWeeksInYear(currentISOWeek.year);

    if (currentISOWeek.week < weeksInCurrentYear) {
      nextWeek.week = currentISOWeek.week + 1;
    } else {
      nextWeek.year = currentISOWeek.year + 1;
      nextWeek.week = 1;
    }

    // 3. 시작 주차: 2025년 W46 (고정)
    const startYear = 2025;
    const startWeek = 46;

    // 4. 종료 주차: 현재 주차 +1
    const endYear = nextWeek.year;
    const endWeek = nextWeek.week;

    // 5. 시작 주차부터 끝 주차까지 모든 주차 생성
    const allWeeks = generateWeeksBetween(
      startYear,
      startWeek,
      endYear,
      endWeek
    );

    // 6. 연도별로 그룹화
    const weeksByYear = new Map<
      number,
      Array<{ year: number; week: number }>
    >();
    allWeeks.forEach((w) => {
      if (!weeksByYear.has(w.year)) {
        weeksByYear.set(w.year, []);
      }
      weeksByYear.get(w.year)!.push(w);
    });

    // 7. 연도별로 정렬하고 각 연도의 주차도 정렬 (최신이 위로)
    return Array.from(weeksByYear.entries())
      .sort(([a], [b]) => b - a) // 연도 내림차순
      .map(([y, weeks]) => ({
        year: y,
        weeks: weeks.sort((a, b) => b.week - a.week), // 주차 내림차순
      }))
      .filter((group) => group.weeks.length > 0);
  }, [snapshotCountByWeek, year, week]);

  const handleWeekSelect = (selectedYear: number, selectedWeek: number) => {
    if (selectedYear !== year) {
      onYearChange(selectedYear);
    }
    onWeekChange(selectedWeek);
  };

  // 로딩 중일 때 스피너 표시
  if (isLoading) {
    return (
      <div className={`flex flex-col ${className}`}>
        <LogoLoadingSpinner
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 헤더 - PC에서만 표시 (모바일 Sheet에는 자체 헤더가 있음) */}
      <div className="hidden lg:block shrink-0 px-4 md:px-6 py-2 md:py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {isMultiSelectMode ? (
            // 다중 선택 모드
            <>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-[#24292f]">
                  주차 선택
                </h2>
                <p className="text-xs text-[#57606a]">
                  내보낼 주차를 선택하세요
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportMultipleWeeks}
                  disabled={selectedWeeks.size === 0 || isExporting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isExporting ? (
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 640 640"
                      fill="currentColor"
                    >
                      <path d="M344 170.6C362.9 161.6 376 142.3 376 120C376 89.1 350.9 64 320 64C289.1 64 264 89.1 264 120C264 142.3 277.1 161.6 296 170.6L296 269.4C293.2 270.7 290.5 272.3 288 274.1L207.9 228.3C209.5 207.5 199.3 186.7 180 175.5C153.2 160 119 169.2 103.5 196C88 222.8 97.2 257 124 272.5C125.3 273.3 126.6 274 128 274.6L128 365.4C126.7 366 125.3 366.7 124 367.5C97.2 383 88 417.2 103.5 444C119 470.8 153.2 480 180 464.5C199.3 453.4 209.4 432.5 207.8 411.7L258.3 382.8C246.8 371.6 238.4 357.2 234.5 341.1L184 370.1C181.4 368.3 178.8 366.8 176 365.4L176 274.6C178.8 273.3 181.5 271.7 184 269.9L264.1 315.7C264 317.1 263.9 318.5 263.9 320C263.9 342.3 277 361.6 295.9 370.6L295.9 469.4C277 478.4 263.9 497.7 263.9 520C263.9 550.9 289 576 319.9 576C350.8 576 375.9 550.9 375.9 520C375.9 497.7 362.8 478.4 343.9 469.4L343.9 370.6C346.7 369.3 349.4 367.7 351.9 365.9L432 411.7C430.4 432.5 440.6 453.3 459.8 464.5C486.6 480 520.8 470.8 536.3 444C551.8 417.2 542.6 383 515.8 367.5C514.5 366.7 513.1 366 511.8 365.4L511.8 274.6C513.2 274 514.5 273.3 515.8 272.5C542.6 257 551.8 222.8 536.3 196C520.8 169.2 486.8 160 460 175.5C440.7 186.6 430.6 207.5 432.2 228.3L381.6 257.2C393.1 268.4 401.5 282.8 405.4 298.9L456 269.9C458.6 271.7 461.2 273.2 464 274.6L464 365.4C461.2 366.7 458.5 368.3 456 370L375.9 324.2C376 322.8 376.1 321.4 376.1 319.9C376.1 297.6 363 278.3 344.1 269.3L344.1 170.5z" />
                    </svg>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      {selectedWeeks.size > 0 && (
                        <span className="flex items-center justify-center w-5 h-5 text-xs font-bold bg-white text-blue-600 rounded-full">
                          {selectedWeeks.size}
                        </span>
                      )}
                    </>
                  )}
                </button>
                <button
                  onClick={cancelMultiSelectMode}
                  disabled={isExporting}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            </>
          ) : (
            // 일반 모드
            <>
              <div>
                <h2 className="text-base md:text-lg font-semibold text-[#24292f]">
                  주차 선택
                </h2>
                <p className="text-xs text-[#57606a]">주차별 스냅샷 조회</p>
              </div>

              {/* 데이터 내보내기 버튼 */}
              <button
                onClick={startMultiSelectMode}
                disabled={!hasAnySnapshotEntries}
                aria-label="데이터 내보내기"
                className={`p-1.5 rounded-lg transition-all duration-200 ${
                  !hasAnySnapshotEntries
                    ? "text-gray-400 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-200"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 주차 리스트 */}
      <div className="flex-1 overflow-y-auto w-full">
        {groupedWeeks.map((group, groupIndex) => (
          <div key={group.year} className="py-2">
            {/* 연도 헤더 */}
            <div className="px-3 py-1 mb-1">
              <h3 className="text-xs font-semibold text-[#57606a]">
                {group.year}
              </h3>
            </div>

            {/* 주차 리스트 */}
            <div className="flex flex-col gap-0.5 px-2">
              {group.weeks.map((weekData) => {
                const isSelected =
                  weekData.year === year && weekData.week === week;
                const dateRange = getWeekDateRange(
                  weekData.year,
                  weekData.week
                );
                const weekKey = `${weekData.year}-${weekData.week}`;
                const snapshotCount = snapshotCountByWeek.get(weekKey) || 0;
                const isDisabled = disableEmptyWeeks && snapshotCount === 0;

                const isWeekSelected = selectedWeeks.has(weekKey);

                return (
                  <button
                    key={`${weekData.year}-${weekData.week}`}
                    onClick={() => {
                      if (isMultiSelectMode) {
                        if (!isDisabled) {
                          toggleWeekSelection(weekKey);
                        }
                      } else {
                        if (!isDisabled) {
                          handleWeekSelect(weekData.year, weekData.week);
                        }
                      }
                    }}
                    disabled={isDisabled}
                    className={`
                    flex items-center gap-2 px-2 py-1.5 rounded-md
                    transition-colors duration-150
                    ${
                      isMultiSelectMode
                        ? isWeekSelected
                          ? "bg-blue-50 border border-blue-300 text-blue-700"
                          : isDisabled
                          ? "text-[#8c959f] cursor-not-allowed opacity-50"
                          : "hover:bg-[#f6f8fa] text-[#24292f] border border-transparent"
                        : isSelected
                        ? "bg-[#0969da] text-white"
                        : isDisabled
                        ? "text-[#8c959f] cursor-not-allowed opacity-50"
                        : "hover:bg-[#f6f8fa] text-[#24292f]"
                    }
                  `}
                  >
                    {/* 다중 선택 모드: 체크박스 */}
                    {isMultiSelectMode && (
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isWeekSelected
                            ? "bg-blue-600 border-blue-600"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isWeekSelected && (
                          <svg
                            className="w-3 h-3 text-white"
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
                    )}

                    {/* 주차 정보 */}
                    <div className="flex-1 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium">
                          W{String(weekData.week).padStart(2, "0")}
                        </span>
                        <span
                          className={`text-[10px] ${
                            isMultiSelectMode
                              ? isWeekSelected
                                ? "text-blue-600"
                                : "text-[#57606a]"
                              : isSelected
                              ? "text-white/70"
                              : "text-[#57606a]"
                          }`}
                        >
                          {dateRange}
                        </span>
                      </div>
                      {/* 스냅샷 개수 항상 표시 */}
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium transition-all duration-300 ${
                          recentlyUpdatedWeek === weekKey
                            ? "animate-[pulse-scale_0.6s_ease-in-out]"
                            : ""
                        } ${
                          isMultiSelectMode
                            ? isWeekSelected
                              ? "bg-blue-600 text-white"
                              : snapshotCount > 0
                              ? "bg-[#ddf4ff] text-[#0969da]"
                              : "bg-[#f6f8fa] text-[#57606a]"
                            : snapshotCount > 0
                            ? isSelected
                              ? "bg-white/20 text-white"
                              : "bg-[#ddf4ff] text-[#0969da]"
                            : isSelected
                            ? "bg-white/10 text-white/70"
                            : "bg-[#f6f8fa] text-[#57606a]"
                        }`}
                        style={
                          recentlyUpdatedWeek === weekKey
                            ? {
                                animation: "pulse-scale 0.6s ease-in-out",
                              }
                            : undefined
                        }
                      >
                        {snapshotCount}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {groupedWeeks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <svg
              className="w-12 h-12 text-[#d0d7de] mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-xs text-[#57606a]">스냅샷이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
