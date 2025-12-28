"use client";

/**
 * Entries Feed View
 * 
 * snapshot_entries 피드 + 좌측 필터 패널 + 검색 + 페이지네이션
 */

import { useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import type { WorkspaceMember } from "@/lib/data/members";

interface SnapshotEntry {
  id: string;
  snapshot_id: string;
  author_id: string | null;
  created_at: string;
  name: string | null;
  domain: string | null;
  project: string | null;
  module: string | null;
  feature: string | null;
  past_week_tasks: unknown;
  this_week_tasks: unknown;
  collaborators: unknown;
}

interface EntriesFeedViewProps {
  entries: SnapshotEntry[];
  profileMap: Map<string, string>;
  members: WorkspaceMember[];
  filters: {
    authorId?: string;
    startDate?: string;
    endDate?: string;
    hasCollaborators: boolean;
    searchQuery?: string;
  };
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
  };
  error?: string;
}

export function EntriesFeedView({
  entries,
  profileMap,
  members,
  filters,
  pagination,
  error,
}: EntriesFeedViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [localSearchQuery, setLocalSearchQuery] = useState(filters.searchQuery || "");
  const [showFilters, setShowFilters] = useState(true);
  
  // URL 업데이트 헬퍼
  const updateFilters = useCallback((updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    
    // 페이지네이션 커서 초기화
    params.delete("cursor");
    
    navigationProgress.start();
    router.push(`/works/entries?${params.toString()}`);
  }, [searchParams, router]);
  
  // 필터 초기화
  const handleReset = useCallback(() => {
    setLocalSearchQuery("");
    navigationProgress.start();
    router.push("/works/entries");
  }, [router]);
  
  // 검색 제출
  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ q: localSearchQuery || undefined });
  }, [localSearchQuery, updateFilters]);
  
  // 다음 페이지 로드
  const handleLoadMore = useCallback(() => {
    if (!pagination.nextCursor) return;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set("cursor", pagination.nextCursor);
    
    navigationProgress.start();
    router.push(`/works/entries?${params.toString()}`);
  }, [pagination.nextCursor, searchParams, router]);
  
  // 날짜 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  return (
    <div className="flex gap-6 min-h-screen bg-white">
      {/* 좌측 필터 패널 */}
      {showFilters && (
        <aside className="w-64 shrink-0 border-r border-[#d0d7de] p-4 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#24292f]">Filters</h2>
            <button
              onClick={handleReset}
              className="text-xs text-[#0969da] hover:underline"
            >
              Reset
            </button>
          </div>
          
          {/* Author 필터 */}
          <div>
            <label className="block text-xs font-medium text-[#57606a] mb-2">
              Author
            </label>
            <select
              value={filters.authorId || ""}
              onChange={(e) => updateFilters({ author: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm border border-[#d0d7de] rounded-md focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none"
            >
              <option value="">All Authors</option>
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.display_name || member.email || member.user_id.slice(0, 8)}
                </option>
              ))}
            </select>
          </div>
          
          {/* Date Range 필터 */}
          <div>
            <label className="block text-xs font-medium text-[#57606a] mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => updateFilters({ start_date: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-[#d0d7de] rounded-md focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none"
              />
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => updateFilters({ end_date: e.target.value || undefined })}
                className="w-full px-3 py-2 text-sm border border-[#d0d7de] rounded-md focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none"
              />
            </div>
          </div>
          
          {/* Collaborator 토글 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasCollaborators}
                onChange={(e) => updateFilters({ has_collaborators: e.target.checked ? "true" : undefined })}
                className="w-4 h-4 text-[#0969da] border-[#d0d7de] rounded focus:ring-[#0969da]"
              />
              <span className="text-sm text-[#24292f]">Has Collaborators</span>
            </label>
          </div>
        </aside>
      )}
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-md transition-colors hover:bg-[#f6f8fa] text-[#57606a]"
              title={showFilters ? "Hide Filters" : "Show Filters"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
            <span className="text-2xl">📝</span>
            <div>
              <h1 className="text-xl font-semibold text-[#24292f]">
                Work Entries
              </h1>
              <p className="text-sm text-[#57606a]">
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </p>
            </div>
          </div>
          
          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={localSearchQuery}
              onChange={(e) => setLocalSearchQuery(e.target.value)}
              placeholder="Search entries..."
              className="w-64 px-3 py-2 text-sm border border-[#d0d7de] rounded-md focus:border-[#0969da] focus:ring-1 focus:ring-[#0969da] outline-none"
            />
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0860ca] rounded-md transition-colors"
            >
              Search
            </button>
          </form>
        </div>
        
        {/* 에러 표시 */}
        {error && (
          <div className="p-4 rounded-md border border-[#d73a49] bg-[#ffebe9] text-[#d73a49] text-sm">
            {error}
          </div>
        )}
        
        {/* 엔트리 목록 */}
        {entries.length > 0 ? (
          <div className="space-y-4">
            {entries.map((entry) => {
              const authorName = entry.author_id ? profileMap.get(entry.author_id) : null;
              const collabs = entry.collaborators as { name: string }[] || [];
              
              return (
                <div
                  key={entry.id}
                  className="p-4 border border-[#d0d7de] rounded-md hover:border-[#0969da] transition-colors bg-white"
                >
                  {/* 헤더 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0969da] flex items-center justify-center text-white text-sm font-semibold">
                        {(entry.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#24292f]">
                          {entry.name || "Unnamed"}
                        </h3>
                        <p className="text-xs text-[#57606a]">
                          {authorName || entry.author_id?.slice(0, 8) || "Unknown"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#57606a]">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  
                  {/* 메타 정보 */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {entry.domain && (
                      <span className="px-2 py-1 text-xs rounded-md bg-[#ddf4ff] text-[#0969da]">
                        {entry.domain}
                      </span>
                    )}
                    {entry.project && (
                      <span className="px-2 py-1 text-xs rounded-md bg-[#f6f8fa] text-[#24292f]">
                        {entry.project}
                      </span>
                    )}
                    {entry.module && (
                      <span className="px-2 py-1 text-xs rounded-md bg-[#f6f8fa] text-[#57606a]">
                        {entry.module}
                      </span>
                    )}
                    {entry.feature && (
                      <span className="px-2 py-1 text-xs rounded-md bg-[#f6f8fa] text-[#57606a]">
                        {entry.feature}
                      </span>
                    )}
                  </div>
                  
                  {/* 협업자 */}
                  {collabs.length > 0 && (
                    <div className="flex items-center gap-2 text-xs text-[#57606a]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>{collabs.map(c => c.name).join(", ")}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-16 text-center bg-[#f6f8fa] rounded-md">
            <span className="text-4xl">📝</span>
            <p className="mt-4 text-lg font-medium text-[#24292f]">No entries found</p>
            <p className="mt-2 text-sm text-[#57606a]">
              Try adjusting your filters or search query.
            </p>
          </div>
        )}
        
        {/* 페이지네이션 */}
        {pagination.hasMore && (
          <div className="flex justify-center pt-6">
            <button
              onClick={handleLoadMore}
              className="px-6 py-3 text-sm font-medium text-[#24292f] bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] rounded-md transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

