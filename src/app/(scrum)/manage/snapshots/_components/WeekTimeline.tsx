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
  const target = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  
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
  const weekNumber = Math.floor((thursday.getTime() - firstMonday.getTime()) / 86400000 / 7) + 1;
  
  return { year, week: weekNumber };
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
    if (currentYear > endYear || (currentYear === endYear && currentWeek > endWeek)) {
      break;
    }
    
    weeks.push({ year: currentYear, week: currentWeek });
    
    // 해당 연도의 마지막 주차 계산 (ISO 8601)
    const dec31 = new Date(Date.UTC(currentYear, 11, 31));
    const dec31DayOfWeek = (dec31.getUTCDay() + 6) % 7;
    const dec31Thursday = new Date(dec31);
    dec31Thursday.setUTCDate(dec31.getUTCDate() - dec31DayOfWeek + 3);
    
    // 12월 31일의 목요일이 속한 연도
    const lastWeekYear = dec31Thursday.getUTCFullYear();
    
    // 그 연도의 1월 4일
    const jan4 = new Date(Date.UTC(lastWeekYear, 0, 4));
    const jan4DayOfWeek = (jan4.getUTCDay() + 6) % 7;
    const firstMonday = new Date(jan4);
    firstMonday.setUTCDate(jan4.getUTCDate() - jan4DayOfWeek);
    
    // 마지막 주차 계산
    const weeksInYear = Math.floor((dec31Thursday.getTime() - firstMonday.getTime()) / 86400000 / 7) + 1;
    
    // 다음 주차로 이동
    currentWeek++;
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
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // 다중 선택 모드
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  // Export 메뉴 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node) &&
        exportButtonRef.current &&
        !exportButtonRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };

    if (isExportMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isExportMenuOpen]);

  // 다중 선택 모드 시작
  const startMultiSelectMode = () => {
    setIsMultiSelectMode(true);
    setSelectedWeeks(new Set());
    setIsExportMenuOpen(false);
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

  // TXT 형식으로 export
  const exportAsTxt = () => {
    if (!currentWeekSnapshots || currentWeekSnapshots.length === 0) {
      alert("내보낼 스냅샷 데이터가 없습니다.");
      return;
    }

    const lines: string[] = [];
    lines.push(`# ${year}년 W${String(week).padStart(2, "0")} 주차 스냅샷`);
    lines.push(`# 생성일: ${new Date().toLocaleDateString("ko-KR")}`);
    lines.push("");

    currentWeekSnapshots.forEach((snapshot, snapshotIndex) => {
      lines.push(`## 스냅샷 ${snapshotIndex + 1}`);
      lines.push(`작성일: ${new Date(snapshot.created_at).toLocaleString("ko-KR")}`);
      lines.push("");

      if (snapshot.entries && snapshot.entries.length > 0) {
        snapshot.entries.forEach((entry: any, entryIndex: number) => {
          lines.push(`### 엔트리 ${entryIndex + 1}`);
          lines.push(`[${entry.domain} / ${entry.project} / ${entry.module || "-"} / ${entry.feature || "-"}]`);
          lines.push("");

          // Progress (Past Week)
          if (entry.past_week?.tasks && entry.past_week.tasks.length > 0) {
            lines.push("* Progress");
            lines.push("    * Tasks");
            entry.past_week.tasks.forEach((task: any) => {
              lines.push(`        * ${task.title} (${task.progress}%)`);
            });
            lines.push("");
          }

          // Next (This Week)
          if (entry.this_week?.tasks && entry.this_week.tasks.length > 0) {
            lines.push("* Next");
            lines.push("    * Tasks");
            entry.this_week.tasks.forEach((task: string) => {
              lines.push(`        * ${task}`);
            });
            lines.push("");
          }

          // Risks
          if (entry.risks && entry.risks.length > 0) {
            lines.push("* Risks");
            entry.risks.forEach((risk: string) => {
              lines.push(`    * ${risk}`);
            });
            lines.push("");
          }

          // Collaborators
          if (entry.collaborators && entry.collaborators.length > 0) {
            lines.push("* Collaborators");
            entry.collaborators.forEach((collab: any) => {
              const relations = collab.relations || [collab.relation || "pair"];
              lines.push(`    * ${collab.name} (${relations.join(", ")})`);
            });
            lines.push("");
          }

          lines.push("---");
          lines.push("");
        });
      }
    });

    const content = lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `snapshot_${year}_W${String(week).padStart(2, "0")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
  };

  // JSON 형식으로 export
  const exportAsJson = () => {
    if (!currentWeekSnapshots || currentWeekSnapshots.length === 0) {
      alert("내보낼 스냅샷 데이터가 없습니다.");
      return;
    }

    const exportData = {
      year,
      week,
      weekKey: `${year}-${week}`,
      exportDate: new Date().toISOString(),
      snapshots: currentWeekSnapshots.map((snapshot) => ({
        id: snapshot.id,
        created_at: snapshot.created_at,
        updated_at: snapshot.updated_at,
        workload_level: snapshot.workload_level,
        workload_note: snapshot.workload_note,
        entries: snapshot.entries,
      })),
    };

    const content = JSON.stringify(exportData, null, 2);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `snapshot_${year}_W${String(week).padStart(2, "0")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsExportMenuOpen(false);
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
        const [yearStr, weekStr] = weekKey.split('-');
        const weekYear = parseInt(yearStr, 10);
        const weekNum = parseInt(weekStr, 10);
        
        // ISO 주차의 시작 날짜 계산
        const jan4 = new Date(Date.UTC(weekYear, 0, 4));
        const jan4Day = jan4.getUTCDay() || 7;
        const week1Monday = new Date(jan4);
        week1Monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1);
        
        const startDate = new Date(week1Monday);
        startDate.setUTCDate(week1Monday.getUTCDate() + (weekNum - 1) * 7);
        
        const weekStartDate = startDate.toISOString().split('T')[0];
        
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
      const blob = new Blob([content], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `snapshots_${weeksData.length}weeks_${new Date().toISOString().split('T')[0]}.json`;
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
    
    // 해당 연도의 마지막 주차 계산 (ISO 8601)
    const dec31 = new Date(Date.UTC(currentISOWeek.year, 11, 31));
    const dec31DayOfWeek = (dec31.getUTCDay() + 6) % 7;
    const dec31Thursday = new Date(dec31);
    dec31Thursday.setUTCDate(dec31.getUTCDate() - dec31DayOfWeek + 3);
    
    const lastWeekYear = dec31Thursday.getUTCFullYear();
    const jan4 = new Date(Date.UTC(lastWeekYear, 0, 4));
    const jan4DayOfWeek = (jan4.getUTCDay() + 6) % 7;
    const firstMonday = new Date(jan4);
    firstMonday.setUTCDate(jan4.getUTCDate() - jan4DayOfWeek);
    
    const weeksInYear = Math.floor((dec31Thursday.getTime() - firstMonday.getTime()) / 86400000 / 7) + 1;
    
    if (currentISOWeek.week < weeksInYear) {
      nextWeek.week = currentISOWeek.week + 1;
    } else {
      nextWeek.year = currentISOWeek.year + 1;
      nextWeek.week = 1;
    }
    
    // 3. 스냅샷이 있는 주차들 추출
    const snapshotWeeks: Array<{ year: number; week: number }> = [];
    snapshotCountByWeek.forEach((_, key) => {
      const [yearStr, weekStr] = key.split('-');
      snapshotWeeks.push({
        year: parseInt(yearStr, 10),
        week: parseInt(weekStr, 10),
      });
    });
    
    // 4. 범위 결정: 가장 오래된 스냅샷 주차부터 다음 주차까지
    let startYear = currentISOWeek.year;
    let startWeek = currentISOWeek.week;
    
    if (snapshotWeeks.length > 0) {
      // 가장 오래된 주차 찾기
      const sortedSnapshots = [...snapshotWeeks].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
      });
      const oldest = sortedSnapshots[0];
      startYear = oldest.year;
      startWeek = oldest.week;
    }
    
    // 5. 시작 주차부터 다음 주차(현재 +1)까지 모든 주차 생성
    const allWeeks = generateWeeksBetween(
      startYear,
      startWeek,
      nextWeek.year,
      nextWeek.week
    );
    
    // 6. 연도별로 그룹화
    const weeksByYear = new Map<number, Array<{ year: number; week: number }>>();
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
      .filter(group => group.weeks.length > 0);
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
          title="주차 정보 불러오는 중"
          description="잠시만 기다려주세요"
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {/* 헤더 - PC에서만 표시 (모바일 Sheet에는 자체 헤더가 있음) */}
      <div className="hidden lg:block shrink-0 px-4 md:px-6 py-3 md:py-4 bg-[#f6f8fa] border-b border-[#d0d7de]">
        <div className="flex items-center justify-between">
          {isMultiSelectMode ? (
            // 다중 선택 모드
            <>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
                  <svg
                    className="w-4 h-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-blue-700">
                    {selectedWeeks.size}개 선택됨
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={exportMultipleWeeks}
                  disabled={selectedWeeks.size === 0 || isExporting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  {isExporting ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      <span>내보내는 중...</span>
                    </>
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
                      <span>내보내기 ({selectedWeeks.size})</span>
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
                <h2 className="text-base md:text-lg font-semibold text-[#24292f]">주차 선택</h2>
                <p className="text-xs text-[#57606a]">
                  주차별 스냅샷 조회
                </p>
              </div>

              {/* Export 옵션 버튼 */}
              <div className="relative">
                <button
                  ref={exportButtonRef}
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  aria-label="옵션"
                  className="p-1.5 rounded-lg transition-all duration-200 hover:bg-gray-200 text-gray-700"
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
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

                {/* Export 드롭다운 메뉴 */}
                {isExportMenuOpen && (
                  <div
                    ref={exportMenuRef}
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-fadeIn"
                  >
                    <button
                      onClick={exportAsTxt}
                      disabled={!currentWeekSnapshots || currentWeekSnapshots.length === 0}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        !currentWeekSnapshots || currentWeekSnapshots.length === 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      TXT로 내보내기
                    </button>
                    <button
                      onClick={exportAsJson}
                      disabled={!currentWeekSnapshots || currentWeekSnapshots.length === 0}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        !currentWeekSnapshots || currentWeekSnapshots.length === 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                        />
                      </svg>
                      JSON으로 내보내기
                    </button>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={startMultiSelectMode}
                      disabled={!currentWeekSnapshots || currentWeekSnapshots.length === 0}
                      className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                        !currentWeekSnapshots || currentWeekSnapshots.length === 0
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      데이터 내보내기
                    </button>
                  </div>
                )}
              </div>
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
              const isSelected = weekData.year === year && weekData.week === week;
              const dateRange = getWeekDateRange(weekData.year, weekData.week);
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

