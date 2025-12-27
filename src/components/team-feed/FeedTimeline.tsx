"use client";

import { useEffect, useState, useRef } from "react";
import type { FeedItemData } from "@/types/teamFeed";

interface FeedTimelineProps {
  feedItems: FeedItemData[];
  isSearching: boolean;
  hasSearchQuery: boolean;
}

interface WeekData {
  year: number;
  week: string;
  label: string;
  count: number;
}

/**
 * Feed Timeline 컴포넌트 - GitHub 스타일
 * - 스크롤 위치에 따라 현재 주차 표시
 * - 검색 중에는 음영처리
 */
export function FeedTimeline({ feedItems, isSearching, hasSearchQuery }: FeedTimelineProps) {
  const [activeWeekIndex, setActiveWeekIndex] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 주차별 그룹화
  const weeks: WeekData[] = [];
  const weekMap = new Map<string, number>();

  feedItems.forEach((item) => {
    const key = `${item.year}-${item.week}`;
    if (!weekMap.has(key)) {
      weekMap.set(key, weeks.length);
      weeks.push({
        year: item.year,
        week: item.week,
        label: item.week,
        count: 1,
      });
    } else {
      const index = weekMap.get(key)!;
      weeks[index].count++;
    }
  });

  // 스크롤 위치에 따라 활성 주차 업데이트
  useEffect(() => {
    if (hasSearchQuery) return; // 검색 중에는 업데이트 안함

    const handleScroll = () => {
      // Feed 영역의 스크롤 컨테이너 찾기
      const feedContainer = document.querySelector('[data-feed-container]');
      if (!feedContainer) return;

      // 현재 보이는 피드 아이템 찾기
      const feedCards = document.querySelectorAll('[data-feed-week]');
      let foundIndex = 0;

      feedCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        // 뷰포트 상단에서 30% 이내에 있으면 활성화
        if (rect.top <= window.innerHeight * 0.3 && rect.bottom >= 0) {
          const weekKey = card.getAttribute('data-feed-week');
          if (weekKey) {
            const weekIndex = weeks.findIndex(w => `${w.year}-${w.week}` === weekKey);
            if (weekIndex !== -1) {
              foundIndex = weekIndex;
            }
          }
        }
      });

      setActiveWeekIndex(foundIndex);
    };

    // 스크롤 이벤트 리스너 등록
    const feedContainer = document.querySelector('[data-feed-container]');
    if (feedContainer) {
      feedContainer.addEventListener('scroll', handleScroll);
      handleScroll(); // 초기 실행
    }

    return () => {
      if (feedContainer) {
        feedContainer.removeEventListener('scroll', handleScroll);
      }
    };
  }, [weeks, hasSearchQuery]);

  const handleWeekClick = (index: number) => {
    if (hasSearchQuery) return; // 검색 중에는 클릭 불가

    const weekKey = `${weeks[index].year}-${weeks[index].week}`;
    const targetCard = document.querySelector(`[data-feed-week="${weekKey}"]`);
    
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveWeekIndex(index);
    }
  };

  if (weeks.length === 0) return null;

  return (
    <div 
      ref={timelineRef}
      className={`sticky top-0 py-2 transition-opacity duration-300 ${
        hasSearchQuery ? 'opacity-30 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="mb-4 px-2">
        <h2 className="text-sm font-semibold text-[#24292f] mb-1">Timeline</h2>
        {hasSearchQuery ? (
          <p className="text-xs text-[#8c959f]">검색 중에는 타임라인을 사용할 수 없습니다</p>
        ) : (
          <p className="text-xs text-[#57606a]">{weeks.length} weeks</p>
        )}
      </div>

      {/* 타임라인 */}
      <div className="relative">
        {/* 세로 라인 */}
        <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-[#d0d7de]" />

        {/* 주차 노드들 */}
        <div className="space-y-1">
          {weeks.map((week, index) => {
            const isActive = index === activeWeekIndex && !hasSearchQuery;
            const isPast = index < activeWeekIndex && !hasSearchQuery;

            return (
              <button
                key={`${week.year}-${week.week}`}
                onClick={() => handleWeekClick(index)}
                disabled={hasSearchQuery}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-md transition-all ${
                  hasSearchQuery
                    ? 'cursor-not-allowed'
                    : isActive
                    ? 'bg-[#ddf4ff]'
                    : 'hover:bg-[#f6f8fa]'
                }`}
              >
                {/* 노드 점 */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      isActive
                        ? 'bg-[#0969da] border-[#0969da] scale-110'
                        : isPast
                        ? 'bg-[#0969da] border-[#0969da]'
                        : 'bg-white border-[#d0d7de]'
                    }`}
                  >
                    {(isActive || isPast) && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* 주차 정보 */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-xs font-medium ${
                        isActive ? 'text-[#0969da]' : 'text-[#24292f]'
                      }`}
                    >
                      {week.year} {week.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#57606a] mt-0.5">
                    {week.count} feed{week.count > 1 ? 's' : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 검색 중 안내 */}
      {hasSearchQuery && (
        <div className="mt-4 px-2 py-3 bg-[#fff8c5] border border-[#d4a72c]/20 rounded-md">
          <p className="text-xs text-[#9a6700]">
            검색을 해제하면 타임라인을 다시 사용할 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}

