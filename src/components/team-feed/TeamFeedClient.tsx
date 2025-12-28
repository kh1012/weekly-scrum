"use client";

import { useState, useEffect, useMemo, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { FeedItemData } from "@/types/teamFeed";
import type { GnbParams } from "@/lib/ui/gnbParams";
import type { WorkspaceMember } from "@/lib/data/members";
import { InfiniteFeedList } from "./InfiniteFeedList";
import { TeamFeedFilterPanel } from "./TeamFeedFilterPanel";
import { DailyActivity } from "./DailyActivity";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";

interface TeamFeedClientProps {
  initialFeedItems: FeedItemData[];
  gnbParams: GnbParams;
  workspaceMembers: WorkspaceMember[];
}

/**
 * Team Feed 클라이언트 컴포넌트
 * - 좌측 필터 패널
 * - 검색 기능
 */
export function TeamFeedClient({
  initialFeedItems,
  gnbParams,
  workspaceMembers,
}: TeamFeedClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // 검색 상태
  const [searchInput, setSearchInput] = useState(gnbParams.query || "");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setSearchInput(gnbParams.query || "");
  }, [gnbParams.query]);

  // 검색 디바운싱
  useEffect(() => {
    setIsSearching(true);
    const timer = setTimeout(() => {
      if (searchInput !== gnbParams.query) {
        handleApplyFilters({ ...gnbParams, query: searchInput || undefined });
      }
      setIsSearching(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleApplyFilters = useCallback(
    (newGnbParams: GnbParams) => {
      const params = new URLSearchParams();
      if (newGnbParams.query) params.set("query", newGnbParams.query);
      if (newGnbParams.author) params.set("author", newGnbParams.author);
      if (newGnbParams.dateRangeStart) params.set("dateRangeStart", newGnbParams.dateRangeStart);
      if (newGnbParams.dateRangeEnd) params.set("dateRangeEnd", newGnbParams.dateRangeEnd);
      if (newGnbParams.hasCollaborators) params.set("hasCollaborators", "true");

      navigationProgress.start();
      startTransition(() => {
        router.push(`/team-feed?${params.toString()}`);
      });
      setIsFilterPanelOpen(false);
    },
    [router]
  );

  const handleResetFilters = useCallback(() => {
    navigationProgress.start();
    startTransition(() => {
      router.push("/team-feed");
    });
    setIsFilterPanelOpen(false);
    setSearchInput("");
  }, [router]);

  const activeFilterCount = [
    gnbParams.author,
    gnbParams.dateRangeStart,
    gnbParams.dateRangeEnd,
    gnbParams.hasCollaborators,
    gnbParams.query,
  ].filter(Boolean).length;

  return (
    <div className="flex h-full bg-white">
      {/* Left Filter Panel (desktop: always visible, mobile: drawer) */}
      <TeamFeedFilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        currentGnbParams={gnbParams}
        workspaceMembers={workspaceMembers}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content - Flex container */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 overflow-hidden">
        {/* Center: Entries List */}
        <div className="flex-1 min-w-0 px-4 py-6 overflow-y-auto border-r border-[#d0d7de]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-[#24292f]">
              Team Feed
            </h1>
            <p className="text-sm mt-1 text-[#57606a]">
              팀원들의 최근 스냅샷 엔트리 ({initialFeedItems.length}개)
            </p>
          </div>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="lg:hidden px-4 py-2 text-sm font-medium text-[#24292f] bg-[#f6f8fa] hover:bg-[#eaeef2] border border-[#d0d7de] rounded-md transition-colors"
          >
            필터 {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#57606a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="엔트리 검색 (이름, 프로젝트, 모듈, 기능)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
          />
          {(searchInput || isSearching) && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isSearching && (
                <div className="w-4 h-4 border-2 border-[#0969da] border-t-transparent rounded-full animate-spin" />
              )}
              {searchInput && !isSearching && (
                <button
                  onClick={() => setSearchInput("")}
                  className="text-[#57606a] hover:text-[#24292f] transition-colors"
                  title="초기화"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Active filters summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-[#ddf4ff] border border-[#0969da]/20 rounded-md">
            <span className="text-sm text-[#0969da]">
              {activeFilterCount}개 필터 적용중
            </span>
            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs text-[#0969da] hover:underline"
            >
              전체 초기화
            </button>
          </div>
        )}

        {/* Entries List */}
        {initialFeedItems.length > 0 ? (
          <InfiniteFeedList
            initialFeedItems={initialFeedItems}
            searchQuery={gnbParams.query || ""}
            onSearchStateChange={setIsSearching}
          />
        ) : (
          <div className="text-center py-16 bg-[#f6f8fa] rounded-md">
            <span className="text-4xl">🤷‍♀️</span>
            <p className="mt-4 text-lg font-medium text-[#24292f]">
              표시할 엔트리가 없습니다
            </p>
            <p className="mt-2 text-sm text-[#57606a]">
              필터를 조정하거나 검색어를 변경해 보세요.
            </p>
          </div>
        )}
        </div>

        {/* Right: Daily Activity (desktop only) */}
        <div className="hidden lg:block w-64 shrink-0 px-4 py-6 overflow-y-auto">
          <div className="sticky top-6">
            <DailyActivity feedItems={initialFeedItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
