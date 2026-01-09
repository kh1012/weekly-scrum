"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FeedItem } from "./FeedItem";
import type { FeedItemData } from "@/types/teamFeed";

interface InfiniteFeedListProps {
  initialFeedItems: FeedItemData[];
  searchQuery?: string;
  onSearchStateChange?: (isSearching: boolean) => void;
}

const ITEMS_PER_PAGE = 20;

/**
 * 무한 스크롤 피드 리스트 컴포넌트
 * - 페이지당 20개씩 표시
 * - 스크롤 시 자동으로 다음 페이지 로드
 * - 검색 필터링 지원
 */
export function InfiniteFeedList({ 
  initialFeedItems,
  searchQuery = "",
  onSearchStateChange
}: InfiniteFeedListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 검색 필터링
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return initialFeedItems;
    }

    const query = searchQuery.toLowerCase();

    const filtered = initialFeedItems.filter((item) => {
      // 이름 검색
      if (item.personName.toLowerCase().includes(query)) return true;

      // 엔트리 내부 검색
      return item.entries.some((entry) => {
        // 프로젝트, 모듈, 기능
        if (
          entry.project.toLowerCase().includes(query) ||
          entry.module.toLowerCase().includes(query) ||
          entry.feature.toLowerCase().includes(query)
        ) {
          return true;
        }

        // Progress (thisWeek.tasks)
        if (entry.thisWeek.tasks?.some((task) => {
          const taskText = typeof task === 'string' ? task : (task.title || '');
          return taskText.toLowerCase().includes(query);
        })) {
          return true;
        }

        // Next (pastWeek.tasks)
        if (
          entry.pastWeek.tasks?.some((task) => {
            const taskTitle = typeof task === 'string' ? task : (task.title || '');
            return taskTitle.toLowerCase().includes(query);
          })
        ) {
          return true;
        }

        // Risk
        if (entry.risks.some((risk) => {
          const riskText = typeof risk === 'string' ? risk : (risk.title || risk.note || '');
          return riskText.toLowerCase().includes(query);
        })) {
          return true;
        }

        return false;
      });
    });
    
    return filtered;
  }, [initialFeedItems, searchQuery]);

  // 검색 상태 변경 알림 (useEffect로 분리)
  useEffect(() => {
    if (!searchQuery.trim()) {
      onSearchStateChange?.(false);
      return;
    }

    // 검색 시작
    onSearchStateChange?.(true);
    
    // 검색 완료 후 상태 업데이트
    const timer = setTimeout(() => {
      onSearchStateChange?.(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchStateChange]);

  // 검색 쿼리 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // 표시할 아이템 계산
  const displayedItems = useMemo(() => {
    return filteredItems.slice(0, currentPage * ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // 더 불러올 아이템이 있는지 확인
  const hasMore = useMemo(() => {
    return displayedItems.length < filteredItems.length;
  }, [displayedItems.length, filteredItems.length]);

  // 다음 페이지 로드
  const loadMore = useCallback(() => {
    setCurrentPage((prev) => prev + 1);
  }, []);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadMore]);

  return (
    <>
      {/* 피드 아이템 */}
      {displayedItems.length > 0 ? (
        displayedItems.map((item) => (
          <FeedItem
            key={`${item.personId}-${item.year}-${item.week}`}
            data={item}
            searchQuery={searchQuery}
          />
        ))
      ) : (
        <div className="py-12 text-center">
          <svg
            className="w-12 h-12 mx-auto mb-4 text-[#8c959f]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="text-sm text-[#57606a] font-medium mb-1">
            검색 결과가 없습니다
          </p>
          <p className="text-xs text-[#8c959f]">
            다른 검색어로 시도해보세요
          </p>
        </div>
      )}

      {/* 로딩 트리거 */}
      {hasMore && displayedItems.length > 0 && (
        <div ref={observerTarget} className="py-4 text-center">
          <div className="inline-flex items-center gap-2 text-xs text-[#57606a]">
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
            <span>로딩 중...</span>
          </div>
        </div>
      )}

      {/* 모두 로드 완료 */}
      {!hasMore && displayedItems.length > 0 && (
        <div className="py-4 text-center text-xs text-[#57606a]">
          {searchQuery
            ? `검색 결과 ${filteredItems.length}개를 모두 불러왔습니다`
            : `모든 피드를 불러왔습니다 (${initialFeedItems.length}개)`}
        </div>
      )}
    </>
  );
}
