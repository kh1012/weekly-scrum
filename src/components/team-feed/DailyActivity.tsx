"use client";

import { useState, useMemo } from "react";
import type { FeedItemData } from "@/types/teamFeed";

interface DailyActivityProps {
  feedItems: FeedItemData[];
}

interface DailyGroup {
  date: string;
  dayLabel: string;
  contributors: Array<{
    personName: string;
    personId: string;
    entryCount: number;
  }>;
}

/**
 * 일자별 활동 표시 컴포넌트 - GitHub 스타일
 * - 브라우저 시간대 기준으로 날짜 계산
 * - 더보기 기능으로 1주일씩 확장 가능
 */
export function DailyActivity({ feedItems }: DailyActivityProps) {
  const [weeksToShow, setWeeksToShow] = useState(1); // 기본 1주일

  // 브라우저 시간대 기준으로 오늘 날짜 가져오기
  const getTodayInBrowserTimezone = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    return new Date(year, month, date);
  };

  // 브라우저 시간대 기준으로 날짜 문자열 생성 (YYYY-MM-DD)
  const getDateStringInBrowserTimezone = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // 브라우저 시간대 기준으로 날짜 범위 생성
  const getDateRange = useMemo(() => {
    const today = getTodayInBrowserTimezone();
    const days: string[] = [];
    const totalDays = weeksToShow * 7;

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(getDateStringInBrowserTimezone(date));
    }
    return days;
  }, [weeksToShow]);

  // 날짜별 그룹화 (브라우저 시간대 기준)
  const dailyGroups: DailyGroup[] = useMemo(() => {
    return getDateRange.map((date) => {
      const contributorMap = new Map<
        string,
        { personName: string; entryCount: number }
      >();

      feedItems.forEach((item) => {
        // 브라우저 시간대 기준으로 날짜 변환
        const itemDate = new Date(item.latestActivityDate);
        const itemDateString = getDateStringInBrowserTimezone(itemDate);

        if (itemDateString === date) {
          const existing = contributorMap.get(item.personId);
          if (existing) {
            existing.entryCount += item.entries.length;
          } else {
            contributorMap.set(item.personId, {
              personName: item.personName,
              entryCount: item.entries.length,
            });
          }
        }
      });

      const contributors = Array.from(contributorMap.entries()).map(
        ([personId, data]) => ({
          personId,
          personName: data.personName,
          entryCount: data.entryCount,
        })
      );

      // 날짜 포맷팅 (브라우저 시간대 기준)
      const dateObj = new Date(date + "T00:00:00");
      const dayLabel = new Intl.DateTimeFormat("ko-KR", {
        month: "numeric",
        day: "numeric",
        weekday: "short",
      }).format(dateObj);

      return {
        date,
        dayLabel,
        contributors,
      };
    });
  }, [feedItems, getDateRange]);

  // 표시할 날짜 그룹 (최근부터)
  const visibleGroups = dailyGroups.slice(0, weeksToShow * 7);

  // 총 통계 계산 (표시된 기간)
  const totalStats = useMemo(() => {
    const personSet = new Set<string>();
    let totalEntries = 0;

    visibleGroups.forEach((day) => {
      day.contributors.forEach((contributor) => {
        personSet.add(contributor.personId);
        totalEntries += contributor.entryCount;
      });
    });

    return {
      personCount: personSet.size,
      entryCount: totalEntries,
    };
  }, [visibleGroups]);

  // Last 7 days 통계 계산
  const last7DaysStats = useMemo(() => {
    const last7Groups = dailyGroups.slice(0, 7);
    const personSet = new Set<string>();
    let totalEntries = 0;

    last7Groups.forEach((day) => {
      day.contributors.forEach((contributor) => {
        personSet.add(contributor.personId);
        totalEntries += contributor.entryCount;
      });
    });

    return {
      personCount: personSet.size,
      entryCount: totalEntries,
    };
  }, [dailyGroups]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-[#24292f] mb-1">
          Recent Activity
        </h2>
        <p className="text-[10px] text-[rgba(140,149,159,1)]">
          Last 7 days - {last7DaysStats.personCount} person,{" "}
          {last7DaysStats.entryCount} entries
        </p>
      </div>

      {/* 일자별 활동 */}
      <div className="space-y-3">
        {visibleGroups.map((day) => {
          const personCount = day.contributors.length;
          const entryCount = day.contributors.reduce(
            (sum, c) => sum + c.entryCount,
            0
          );

          return (
            <div key={day.date}>
              <div className="mb-2">
                <p className="text-xs font-semibold text-[#24292f]">
                  {day.dayLabel}{" "}
                  <span className="text-[10px] text-[rgba(140,149,159,1)] font-normal">
                    {personCount} person, {entryCount} entries
                  </span>
                </p>
              </div>

              {day.contributors.length > 0 ? (
                <div className="space-y-1.5">
                  {day.contributors.map((contributor) => (
                    <div
                      key={contributor.personId}
                      className="flex items-center gap-2 text-xs"
                    >
                      <span className="w-1 h-1 rounded-full bg-[#0969da] flex-shrink-0" />
                      <span className="text-[#24292f] font-medium truncate">
                        {contributor.personName}
                      </span>
                      <span className="text-[10px] text-[rgba(140,149,159,1)]">
                        {contributor.entryCount} entries
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[rgba(140,149,159,1)]">
                  No activity
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* 더보기 버튼 */}
      {weeksToShow * 7 < dailyGroups.length && (
        <button
          onClick={() => setWeeksToShow((prev) => prev + 1)}
          className="w-full px-3 py-2 text-xs font-medium text-[#0969da] hover:bg-[#f6f8fa] rounded-md transition-colors border border-[#d0d7de]"
        >
          더보기 ({weeksToShow + 1}주차)
        </button>
      )}
    </div>
  );
}
