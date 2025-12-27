"use client";

import { useState, useEffect, useMemo } from "react";
import type { FeedItemData, ActivityChartData } from "@/types/teamFeed";
import { InfiniteFeedList } from "./InfiniteFeedList";
import { ActivityChart } from "./ActivityChart";
import { WeeklySummary } from "./WeeklySummary";
import { FeedSearch } from "./FeedSearch";
import { DailyActivity } from "./DailyActivity";

interface TeamFeedClientProps {
  initialFeedItems: FeedItemData[];
  activityData?: ActivityChartData[];
}

/**
 * Entries 클라이언트 컴포넌트
 * - 검색 상태 관리
 * - Weekly Summary + Activity Chart 표시
 */
export function TeamFeedClient({
  initialFeedItems,
  activityData,
}: TeamFeedClientProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // 디바운싱 적용 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 검색 결과 카운트 계산
  const resultCount = useMemo(() => {
    if (!searchQuery.trim()) return initialFeedItems.length;

    const query = searchQuery.toLowerCase();
    return initialFeedItems.filter((item) => {
      if (item.personName.toLowerCase().includes(query)) return true;

      return item.entries.some((entry) => {
        if (
          entry.project.toLowerCase().includes(query) ||
          entry.module.toLowerCase().includes(query) ||
          entry.feature.toLowerCase().includes(query)
        ) {
          return true;
        }

        if (
          entry.thisWeek.tasks?.some((task) =>
            task.toLowerCase().includes(query)
          )
        ) {
          return true;
        }

        if (
          entry.pastWeek.tasks?.some((task) =>
            task.title.toLowerCase().includes(query)
          )
        ) {
          return true;
        }

        if (entry.risks.some((risk) => risk.toLowerCase().includes(query))) {
          return true;
        }

        return false;
      });
    }).length;
  }, [initialFeedItems, searchQuery]);

  return (
    <div className="bg-white">
      {/* 데스크톱 레이아웃 (≥1024px): 3 컬럼 */}
      <div className="hidden lg:flex gap-0 px-4 py-6">
        {/* 왼쪽: Weekly Summary + Activity Chart (고정 너비 + 구분선) */}
        <div className="w-80 flex-shrink-0 pr-6 border-r border-[#d0d7de]">
          <div className="space-y-6 sticky">
            {/* Weekly Summary */}
            <WeeklySummary feedItems={initialFeedItems} />

            {/* Activity Chart */}
            {activityData && activityData.length > 0 && (
              <ActivityChart data={activityData} />
            )}
          </div>
        </div>

        {/* 중앙: Entries (flex-1) */}
        <div className="flex-1 px-6 min-w-0" data-feed-container>
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#24292f] mb-1">
              Entries
            </h1>
            <p className="text-sm text-[#57606a]">
              팀원들의 최근 스냅샷 엔트리를 확인하세요
            </p>
          </div>

          {/* 검색 - Full Width */}
          <FeedSearch
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            isSearching={isSearching}
            resultCount={resultCount}
            totalCount={initialFeedItems.length}
          />

          <InfiniteFeedList
            initialFeedItems={initialFeedItems}
            searchQuery={searchQuery}
            onSearchStateChange={setIsSearching}
          />
        </div>

        {/* 우측: Daily Activity (고정 너비) */}
        <div className="w-64 flex-shrink-0 pl-6">
          <div className="sticky">
            <DailyActivity feedItems={initialFeedItems} />
          </div>
        </div>
      </div>

      {/* 태블릿 레이아웃 (768-1023px): 2 컬럼 */}
      <div className="hidden md:flex lg:hidden gap-0 px-4 py-6">
        {/* 왼쪽: Weekly Summary + Activity (고정 너비 + 구분선) */}
        <div className="w-72 flex-shrink-0 pr-6 border-r border-[#d0d7de]">
          <div className="space-y-6 sticky">
            <WeeklySummary feedItems={initialFeedItems} />
            {activityData && activityData.length > 0 && (
              <ActivityChart data={activityData} />
            )}
          </div>
        </div>

        {/* 오른쪽: Entries */}
        <div className="flex-1 px-6 min-w-0">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#24292f] mb-1">
              Entries
            </h1>
            <p className="text-sm text-[#57606a]">
              팀원들의 최근 스냅샷 엔트리를 확인하세요
            </p>
          </div>

          <FeedSearch
            searchQuery={searchInput}
            onSearchChange={setSearchInput}
            isSearching={isSearching}
            resultCount={resultCount}
            totalCount={initialFeedItems.length}
          />

          <InfiniteFeedList
            initialFeedItems={initialFeedItems}
            searchQuery={searchQuery}
            onSearchStateChange={setIsSearching}
          />
        </div>
      </div>

      {/* 모바일 레이아웃 (<768px): 1컬럼 */}
      <div className="md:hidden px-4 py-6">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-[#24292f] mb-1">Entries</h1>

          {/* 활동 요약 (한 줄) */}
          {activityData && activityData.length > 0 && (
            <p className="text-xs text-[#57606a] mt-1">
              Avg{" "}
              {(
                activityData.reduce((sum, d) => sum + d.count, 0) /
                activityData.length
              ).toFixed(1)}{" "}
              entries/day · Peak:{" "}
              {formatDate(
                activityData.reduce((prev, current) =>
                  current.count > prev.count ? current : prev
                ).date
              )}{" "}
              (
              {
                activityData.reduce((prev, current) =>
                  current.count > prev.count ? current : prev
                ).count
              }
              )
            </p>
          )}
        </div>

        {/* 검색 */}
        <FeedSearch
          searchQuery={searchInput}
          onSearchChange={setSearchInput}
          isSearching={isSearching}
          resultCount={resultCount}
          totalCount={initialFeedItems.length}
        />

        {/* Entries */}
        <InfiniteFeedList
          initialFeedItems={initialFeedItems}
          searchQuery={searchQuery}
          onSearchStateChange={setIsSearching}
        />
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}
