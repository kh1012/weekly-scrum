"use client";

import { useState, useEffect, useMemo } from "react";
import type { FeedItemData, ActivityData } from "@/types/teamFeed";
import { InfiniteFeedList } from "./InfiniteFeedList";
import { ActivityChart } from "./ActivityChart";
import { WeeklySummary } from "./WeeklySummary";
import { FeedSearch } from "./FeedSearch";

interface TeamFeedClientProps {
  initialFeedItems: FeedItemData[];
  activityData?: ActivityData[];
}

/**
 * Entries 클라이언트 컴포넌트
 * - 검색 상태 관리
 * - Weekly Summary + Activity Chart 표시
 */
export function TeamFeedClient({ initialFeedItems, activityData }: TeamFeedClientProps) {
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

        if (entry.thisWeek.tasks?.some((task) => task.toLowerCase().includes(query))) {
          return true;
        }

        if (entry.pastWeek.tasks?.some((task) => task.title.toLowerCase().includes(query))) {
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
    <div className="h-full overflow-hidden bg-white">
      {/* 데스크톱 레이아웃 (≥1024px): 2 컬럼 */}
      <div className="hidden lg:flex gap-4 h-full overflow-hidden px-4 py-4">
        {/* 왼쪽: Entries */}
        <div 
          className="flex-1 overflow-y-scroll min-w-0" 
          style={{ scrollbarGutter: 'stable' }}
          data-feed-container
        >
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#24292f] mb-1">Entries</h1>
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

        {/* 우측: Weekly Summary + Activity */}
        <div className="w-80 flex-shrink-0 overflow-y-auto space-y-6">
          {/* Weekly Summary */}
          <WeeklySummary feedItems={initialFeedItems} />

          {/* Activity Chart */}
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>
      </div>

      {/* 태블릿 레이아웃 (768-1023px): 2 컬럼 */}
      <div className="hidden md:flex lg:hidden gap-4 h-full overflow-hidden px-4 py-4">
        {/* 왼쪽: Entries */}
        <div 
          className="flex-1 overflow-y-scroll min-w-0" 
          style={{ scrollbarGutter: 'stable' }}
        >
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#24292f] mb-1">Entries</h1>
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

        {/* 오른쪽: Weekly Summary + Activity */}
        <div className="w-72 flex-shrink-0 overflow-y-auto space-y-6">
          {/* Weekly Summary */}
          <WeeklySummary feedItems={initialFeedItems} />

          {/* Activity Chart */}
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 (<768px): 1컬럼 */}
      <div className="md:hidden h-full overflow-y-scroll px-4 py-4" style={{ scrollbarGutter: 'stable' }}>
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

        {/* 검색 - Full Width */}
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

