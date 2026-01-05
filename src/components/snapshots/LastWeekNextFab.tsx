"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LastWeekNextPanel } from "./LastWeekNextPanel";
import type { LastWeekNextItem } from "@/lib/data/lastWeekNext";

interface LastWeekNextFabProps {
  workspaceId: string;
  userId: string;
  year: number;
  week: number;
}

export function LastWeekNextFab({
  workspaceId,
  userId,
  year,
  week,
}: LastWeekNextFabProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<LastWeekNextItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isPrefetchedRef = useRef(false);
  const isLoadingRef = useRef(false);
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 데이터 fetch 함수 (공통)
  const fetchData = useCallback(async () => {
    // 이미 데이터가 있거나 로딩 중이면 skip
    if (isPrefetchedRef.current || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/snapshots/last-week-next?workspaceId=${encodeURIComponent(
          workspaceId
        )}&userId=${encodeURIComponent(userId)}&year=${year}&week=${week}`
      );

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        isPrefetchedRef.current = true;
      } else {
        console.error("Failed to fetch last week next");
        setItems([]);
      }
    } catch (error) {
      console.error("Error fetching last week next:", error);
      setItems([]);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [workspaceId, userId, year, week]);

  // 마운트 후 2초 뒤에 백그라운드 prefetch
  useEffect(() => {
    prefetchTimeoutRef.current = setTimeout(() => {
      fetchData();
    }, 2000);

    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, [fetchData]);

  // 패널 열 때 데이터가 없으면 즉시 fetch
  useEffect(() => {
    if (isOpen && !isPrefetchedRef.current && !isLoadingRef.current) {
      fetchData();
    }
  }, [isOpen, fetchData]);

  // 버튼 hover 시 prefetch
  const handleMouseEnter = useCallback(() => {
    if (!isPrefetchedRef.current && !isLoadingRef.current) {
      // hover 시 즉시 prefetch (timeout 취소)
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
      fetchData();
    }
  }, [fetchData]);

  return (
    <>
      {/* Floating Action Button - GitHub 스타일 */}
      <button
        onClick={() => setIsOpen(true)}
        onMouseEnter={handleMouseEnter}
        className="fixed right-5 bottom-5 z-[9997] flex items-center gap-2 px-3 py-2 bg-[#0969da] text-white rounded-md shadow-md hover:bg-[#0860ca] hover:shadow-lg transition-all duration-200 font-medium text-xs border border-[#0969da]"
        title="지난 주 Next 항목 참고하기"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="hidden sm:inline">지난 주 Next</span>
      </button>

      {/* Panel */}
      <LastWeekNextPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={items}
        isLoading={isLoading}
      />
    </>
  );
}
