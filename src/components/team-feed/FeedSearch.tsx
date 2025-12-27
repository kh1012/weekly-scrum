"use client";

import { useState, useEffect, useCallback } from "react";

interface FeedSearchProps {
  onSearch: (query: string) => void;
  totalCount: number;
  matchCount: number;
  isSearching: boolean;
}

/**
 * Feed 검색 컴포넌트 - GitHub 스타일
 * - 디바운싱 적용 (500ms)
 * - 로딩 스피너
 * - 검색 결과 카운트
 */
export function FeedSearch({ onSearch, totalCount, matchCount, isSearching }: FeedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // 디바운싱 적용 (500ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery("");
  }, []);

  return (
    <div className="mb-4">
      <div className="relative">
        {/* 검색 아이콘 */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isSearching ? (
            <svg
              className="w-4 h-4 text-[#57606a] animate-spin"
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
          ) : (
            <svg
              className="w-4 h-4 text-[#57606a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          )}
        </div>

        {/* 검색 입력 */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in feed..."
          className="w-full pl-10 pr-20 py-2 text-sm bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-[#24292f] placeholder-[#57606a] outline-none focus:border-[#0969da] focus:shadow-[0_0_0_3px_rgba(9,105,218,0.1)] transition-colors"
        />

        {/* 클리어 버튼 & 결과 카운트 */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {searchQuery && (
            <>
              {/* 결과 카운트 */}
              <span className="text-xs text-[#57606a] whitespace-nowrap">
                {matchCount} / {totalCount}
              </span>

              {/* 클리어 버튼 */}
              <button
                onClick={handleClear}
                className="p-1 hover:bg-[#d0d7de] rounded-md transition-colors"
                title="Clear search"
              >
                <svg
                  className="w-3.5 h-3.5 text-[#57606a]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 검색 안내 (검색어 없을 때) */}
      {!searchQuery && (
        <p className="mt-2 text-xs text-[#57606a]">
          프로젝트, 모듈, 기능, Progress, Next, Risk 내용을 검색할 수 있습니다
        </p>
      )}
    </div>
  );
}

