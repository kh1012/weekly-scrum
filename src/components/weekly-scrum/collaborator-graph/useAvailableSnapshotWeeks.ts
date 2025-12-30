import { useState, useEffect } from "react";

export interface WeekOption {
  year: number;
  week: number;
  weekKey: string;
  weekStart: string;
  weekEnd: string;
  snapshotCount: number;
}

/**
 * 스냅샷 데이터가 있는 주차 목록을 가져오는 hook
 */
export function useAvailableSnapshotWeeks(workspaceId: string) {
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) {
      setIsLoading(false);
      return;
    }

    async function fetchWeeks() {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(
          `/api/manage/snapshots/counts?workspaceId=${workspaceId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch snapshot weeks");
        }

        const data = await response.json();

        // API 응답을 WeekOption 형식으로 변환
        const weekOptions: WeekOption[] = Object.entries(
          data.snapshotCountByWeek || {}
        )
          .filter(([_, count]) => (count as number) > 0)
          .map(([weekKey, count]) => {
            const [yearStr, weekStr] = weekKey.split("-");
            const year = parseInt(yearStr, 10);
            const week = parseInt(weekStr, 10);

            // ISO 주차를 기준으로 날짜 범위 계산
            const weekStart = getWeekStartDate(year, week);
            const weekEnd = getWeekEndDate(year, week);

            return {
              year,
              week,
              weekKey,
              weekStart: formatDate(weekStart),
              weekEnd: formatDate(weekEnd),
              snapshotCount: count as number,
            };
          })
          .sort((a, b) => {
            // 최신 주차가 위로 오도록 정렬
            if (a.year !== b.year) return b.year - a.year;
            return b.week - a.week;
          });

        setWeeks(weekOptions);
      } catch (err) {
        console.error("[useAvailableSnapshotWeeks] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeeks();
  }, [workspaceId]);

  return { weeks, isLoading, error };
}

/**
 * ISO 주차의 시작 날짜 (월요일) 계산
 */
function getWeekStartDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // 일요일을 7로 변환
  const weekStart = new Date(jan4);
  weekStart.setDate(jan4.getDate() - jan4Day + 1 + (week - 1) * 7);
  return weekStart;
}

/**
 * ISO 주차의 종료 날짜 (일요일) 계산
 */
function getWeekEndDate(year: number, week: number): Date {
  const weekStart = getWeekStartDate(year, week);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  return weekEnd;
}

/**
 * 날짜를 MM.DD 형식으로 포맷
 */
function formatDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}.${day}`;
}

