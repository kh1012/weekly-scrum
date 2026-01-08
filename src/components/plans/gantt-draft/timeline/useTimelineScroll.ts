/**
 * DraftTimeline 스크롤 관련 로직
 */

import { useCallback } from "react";
import type { MiddleClickScrollState } from "./timelineTypes";
import { DAY_WIDTH } from "./timelineTypes";
import { useRAFThrottle } from "./useRAFThrottle";

interface UseTimelineScrollProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
  headerRef: React.RefObject<HTMLDivElement | null>;
  flagLaneRef: React.RefObject<HTMLDivElement | null>;
  rangeStart: Date;
  days: Date[];
  setHeaderScrollLeft: (scrollLeft: number) => void;
  setHoverInfo: (info: any) => void;
  setMiddleClickScroll: (state: MiddleClickScrollState | null) => void;
  middleClickScroll: MiddleClickScrollState | null;
  onScrollChange?: (scrollTop: number) => void;
  onVirtualScrollChange?: (scrollTop: number) => void;
}

export function useTimelineScroll({
  containerRef,
  headerRef,
  flagLaneRef,
  rangeStart,
  days,
  setHeaderScrollLeft,
  setHoverInfo,
  setMiddleClickScroll,
  middleClickScroll,
  onScrollChange,
  onVirtualScrollChange,
}: UseTimelineScrollProps) {
  // 헤더 스크롤 동기화 (FlagLane 포함) - Raw 버전
  const handleScrollRaw = useCallback(() => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;

      // 가로 스크롤 동기화
      if (headerRef.current) {
        headerRef.current.scrollLeft = scrollLeft;
      }
      if (flagLaneRef.current) {
        flagLaneRef.current.scrollLeft = scrollLeft;
      }
      setHeaderScrollLeft(scrollLeft);

      // 세로 스크롤 동기화 (TreePanel과 가상화)
      onScrollChange?.(scrollTop);
      onVirtualScrollChange?.(scrollTop);
    }
  }, [
    containerRef,
    headerRef,
    flagLaneRef,
    setHeaderScrollLeft,
    onScrollChange,
    onVirtualScrollChange,
  ]);

  // RAF로 감싸진 버전 (Feature Flag로 제어)
  const handleScroll = useRAFThrottle(handleScrollRaw);

  // Flag 영역 스크롤 시 타임라인 동기화 (양방향)
  const handleFlagScroll = useCallback(() => {
    if (flagLaneRef.current && containerRef.current) {
      const scrollLeft = flagLaneRef.current.scrollLeft;

      // 타임라인과 헤더 동기화
      containerRef.current.scrollLeft = scrollLeft;
      if (headerRef.current) {
        headerRef.current.scrollLeft = scrollLeft;
      }
      setHeaderScrollLeft(scrollLeft);
    }
  }, [containerRef, headerRef, flagLaneRef, setHeaderScrollLeft]);

  // 오늘로 스크롤하는 함수
  const scrollToToday = useCallback(
    (smooth = true) => {
      if (!containerRef.current) return;

      const today = new Date();
      const daysDiff = Math.floor(
        (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = days.length;

      // 오늘이 범위 내에 있으면 스크롤
      if (daysDiff >= 0 && daysDiff < totalDays) {
        const scrollX =
          daysDiff * DAY_WIDTH -
          containerRef.current.clientWidth / 2 +
          DAY_WIDTH / 2;
        containerRef.current.scrollTo({
          left: Math.max(0, scrollX),
          behavior: smooth ? "smooth" : "instant",
        });
      }
    },
    [rangeStart, days.length, containerRef]
  );

  // Epic으로 스크롤하는 함수 (날짜 범위 중앙으로 수평 스크롤)
  const scrollToDateRange = useCallback(
    (startDateStr: string, endDateStr: string, smooth = true) => {
      if (!containerRef.current) return;

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      // 시작일과 종료일의 중간 날짜 계산
      const midTime = (startDate.getTime() + endDate.getTime()) / 2;
      const midDate = new Date(midTime);

      // rangeStart 기준으로 일수 차이 계산
      const daysDiff = Math.floor(
        (midDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = days.length;

      // 범위 내에 있으면 스크롤
      if (daysDiff >= 0 && daysDiff < totalDays) {
        const scrollX =
          daysDiff * DAY_WIDTH -
          containerRef.current.clientWidth / 2 +
          DAY_WIDTH / 2;
        containerRef.current.scrollTo({
          left: Math.max(0, scrollX),
          behavior: smooth ? "smooth" : "instant",
        });
      }
    },
    [rangeStart, days.length, containerRef]
  );

  // 휠 클릭 스크롤 시작
  const handleMiddleClickStart = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 1 || !containerRef.current) return; // 휠 클릭(middle button)이 아니면 종료

      e.preventDefault();

      // 호버 프리뷰 숨기기
      setHoverInfo(null);

      setMiddleClickScroll({
        isActive: true,
        startX: e.clientX,
        startY: e.clientY,
        scrollLeft: containerRef.current.scrollLeft,
        scrollTop: containerRef.current.scrollTop,
      });
    },
    [containerRef, setHoverInfo, setMiddleClickScroll]
  );

  // 휠 클릭 스크롤 이동 (직접 실행 - mousemove 빈도가 낮아 RAF 불필요)
  const handleMiddleClickMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!middleClickScroll?.isActive || !containerRef.current) return;

      const deltaX = middleClickScroll.startX - e.clientX;
      const deltaY = middleClickScroll.startY - e.clientY;

      containerRef.current.scrollLeft = middleClickScroll.scrollLeft + deltaX;
      containerRef.current.scrollTop = middleClickScroll.scrollTop + deltaY;
    },
    [middleClickScroll, containerRef]
  );

  return {
    handleScroll,
    handleFlagScroll,
    scrollToToday,
    scrollToDateRange,
    handleMiddleClickStart,
    handleMiddleClickMove,
  };
}

