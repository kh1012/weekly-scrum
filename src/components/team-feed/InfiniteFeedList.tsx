"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { FeedItem } from "./FeedItem";
import type { FeedItemData } from "@/types/teamFeed";

interface InfiniteFeedListProps {
  initialFeedItems: FeedItemData[];
}

const ITEMS_PER_PAGE = 20;

/**
 * 무한 스크롤 피드 리스트 컴포넌트
 * - 페이지당 20개씩 표시
 * - 스크롤 시 자동으로 다음 페이지 로드
 */
export function InfiniteFeedList({ initialFeedItems }: InfiniteFeedListProps) {
  const [displayedItems, setDisplayedItems] = useState<FeedItemData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);

  // 초기 데이터 설정
  useEffect(() => {
    const initialItems = initialFeedItems.slice(0, ITEMS_PER_PAGE);
    setDisplayedItems(initialItems);
    setHasMore(initialFeedItems.length > ITEMS_PER_PAGE);
  }, [initialFeedItems]);

  // 다음 페이지 로드
  const loadMore = useCallback(() => {
    if (!hasMore) return;

    const startIndex = currentPage * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const nextItems = initialFeedItems.slice(startIndex, endIndex);

    if (nextItems.length === 0) {
      setHasMore(false);
      return;
    }

    setDisplayedItems((prev) => [...prev, ...nextItems]);
    setCurrentPage((prev) => prev + 1);
    setHasMore(endIndex < initialFeedItems.length);
  }, [currentPage, hasMore, initialFeedItems]);

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
      {displayedItems.map((item) => (
        <FeedItem
          key={`${item.personId}-${item.year}-${item.week}`}
          data={item}
        />
      ))}

      {/* 로딩 트리거 */}
      {hasMore && (
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
          모든 피드를 불러왔습니다 ({initialFeedItems.length}개)
        </div>
      )}
    </>
  );
}

