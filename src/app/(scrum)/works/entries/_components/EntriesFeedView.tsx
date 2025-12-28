"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import type { SnapshotEntryListItem } from "@/lib/data/entries";
import type { GnbParams } from "@/lib/ui/gnbParams";
import type { WorkspaceMember } from "@/lib/data/members";
import { EntryCard } from "./EntryCard";
import { FilterPanel } from "./FilterPanel";

interface EntriesFeedViewProps {
  initialEntries: SnapshotEntryListItem[];
  totalCount: number;
  nextCursor?: string | null;
  error?: string;
  gnbParams: GnbParams;
  workspaceMembers: WorkspaceMember[];
  workspaceId: string;
}

/**
 * Entries 메인 뷰 컴포넌트
 * - 좌측 필터 패널
 * - 검색 기능
 * - Keyset pagination
 */
export function EntriesFeedView({
  initialEntries,
  totalCount,
  nextCursor: initialNextCursor,
  error: initialError,
  gnbParams,
  workspaceMembers,
  workspaceId,
}: EntriesFeedViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [entries, setEntries] = useState(initialEntries);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(initialError);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  
  // 검색 상태
  const [searchInput, setSearchInput] = useState(gnbParams.query || "");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    setEntries(initialEntries);
    setNextCursor(initialNextCursor);
    setError(initialError);
    setSearchInput(gnbParams.query || "");
  }, [initialEntries, initialNextCursor, initialError, gnbParams.query]);

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

  const handleLoadMore = useCallback(() => {
    if (!nextCursor || isLoadingMore) return;

    // 페이지네이션은 URL 기반으로 처리
    const params = new URLSearchParams();
    if (gnbParams.query) params.set("query", gnbParams.query);
    if (gnbParams.author) params.set("author", gnbParams.author);
    if (gnbParams.dateRangeStart) params.set("dateRangeStart", gnbParams.dateRangeStart);
    if (gnbParams.dateRangeEnd) params.set("dateRangeEnd", gnbParams.dateRangeEnd);
    if (gnbParams.hasCollaborators) params.set("hasCollaborators", "true");
    params.set("cursor", nextCursor);

    navigationProgress.start();
    startTransition(() => {
      router.push(`/works/entries?${params.toString()}`);
    });
  }, [nextCursor, isLoadingMore, gnbParams, router]);

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
        router.push(`/works/entries?${params.toString()}`);
      });
      setIsFilterPanelOpen(false);
    },
    [router]
  );

  const handleResetFilters = useCallback(() => {
    navigationProgress.start();
    startTransition(() => {
      router.push("/works/entries");
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
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Left Filter Panel (desktop: always visible, mobile: drawer) */}
      <FilterPanel
        isOpen={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        currentGnbParams={gnbParams}
        workspaceMembers={workspaceMembers}
        onApplyFilters={handleApplyFilters}
        onResetFilters={handleResetFilters}
      />

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h1 className="text-xl font-semibold text-[#24292f]">
                All Entries
              </h1>
              <p className="text-sm mt-1 text-[#57606a]">
                워크스페이스 전체 엔트리 ({totalCount.toLocaleString()}개)
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="lg:hidden px-4 py-2 text-sm font-medium text-[#24292f] bg-[#f6f8fa] hover:bg-[#eaeef2] border border-[#d0d7de] rounded-md transition-colors"
          >
            필터 {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
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
            placeholder="엔트리 검색 (이름, 설명)"
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
          <div className="flex items-center gap-2 p-3 bg-[#ddf4ff] border border-[#0969da]/20 rounded-md">
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

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-md text-sm border border-[#d73a49] bg-[#ffebe9] text-[#d73a49]">
            <p className="font-medium">데이터 조회 실패</p>
            <p className="mt-1 opacity-90">{error}</p>
          </div>
        )}

        {/* Entries List */}
        {entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}

            {/* Load More Button */}
            {nextCursor && (
              <div className="flex justify-center mt-6 pt-6 border-t border-[#d0d7de]">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore || isPending}
                  className="px-6 py-2 text-sm font-medium text-[#24292f] bg-[#f6f8fa] hover:bg-[#eaeef2] border border-[#d0d7de] rounded-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoadingMore || isPending ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-[#57606a] border-t-transparent rounded-full animate-spin" />
                      불러오는 중...
                    </span>
                  ) : (
                    "더 불러오기"
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          !error && (
            <div className="text-center py-16 bg-[#f6f8fa] rounded-md">
              <span className="text-4xl">🤷‍♀️</span>
              <p className="mt-4 text-lg font-medium text-[#24292f]">
                표시할 엔트리가 없습니다
              </p>
              <p className="mt-2 text-sm text-[#57606a]">
                필터를 조정하거나 검색어를 변경해 보세요.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
