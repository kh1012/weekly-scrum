/**
 * DraftTimeline 사이드 이펙트 (useEffect)
 */

import { useEffect } from "react";

interface UseTimelineEffectsProps {
  workspaceId: string;
  fetchFlags: (workspaceId: string) => void;
  externalScrollTop?: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScrollbarHeightChange?: (height: number) => void;
  scrollToToday: (smooth: boolean) => void;
  scrollToDateRange: (startDate: string, endDate: string, smooth: boolean) => void;
}

export function useTimelineEffects({
  workspaceId,
  fetchFlags,
  externalScrollTop,
  containerRef,
  onScrollbarHeightChange,
  scrollToToday,
  scrollToDateRange,
}: UseTimelineEffectsProps) {
  // 초기 flags 로드
  useEffect(() => {
    if (workspaceId) {
      fetchFlags(workspaceId);
    }
  }, [workspaceId, fetchFlags]);

  // 외부 scrollTop 동기화 (TreePanel에서 전달)
  useEffect(() => {
    if (externalScrollTop !== undefined && containerRef.current) {
      if (containerRef.current.scrollTop !== externalScrollTop) {
        containerRef.current.scrollTop = externalScrollTop;
      }
    }
  }, [externalScrollTop, containerRef]);

  // 가로 스크롤바 높이 감지 및 전달
  useEffect(() => {
    const checkScrollbarHeight = () => {
      if (containerRef.current && onScrollbarHeightChange) {
        const hasHorizontalScrollbar =
          containerRef.current.scrollWidth > containerRef.current.clientWidth;
        const scrollbarHeight = hasHorizontalScrollbar
          ? containerRef.current.offsetHeight - containerRef.current.clientHeight
          : 0;
        onScrollbarHeightChange(scrollbarHeight);
      }
    };

    // 초기 체크
    checkScrollbarHeight();

    // 리사이즈 시 재체크
    const resizeObserver = new ResizeObserver(checkScrollbarHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [onScrollbarHeightChange, containerRef]);

  // 초기 로드 시 오늘로 스크롤
  useEffect(() => {
    // 약간의 지연 후 스크롤 (레이아웃 완료 후)
    const timer = setTimeout(() => {
      scrollToToday(false); // 초기에는 부드러운 애니메이션 없이
    }, 100);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 오늘로 이동 이벤트 핸들러
  useEffect(() => {
    const handleScrollToToday = () => {
      scrollToToday(true);
    };

    window.addEventListener("gantt:scroll-to-today", handleScrollToToday);
    return () =>
      window.removeEventListener("gantt:scroll-to-today", handleScrollToToday);
  }, [scrollToToday]);

  // Epic으로 스크롤하는 이벤트 핸들러
  useEffect(() => {
    const handleScrollToEpic = (
      e: CustomEvent<{ rowId: string; startDate: string; endDate: string }>
    ) => {
      const { startDate, endDate } = e.detail;
      scrollToDateRange(startDate, endDate, true);
    };

    window.addEventListener(
      "gantt:scroll-to-epic",
      handleScrollToEpic as EventListener
    );
    return () =>
      window.removeEventListener(
        "gantt:scroll-to-epic",
        handleScrollToEpic as EventListener
      );
  }, [scrollToDateRange]);

  // Flag 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScrollToFlag = (
      e: CustomEvent<{ flagId: string; startDate: string; endDate: string }>
    ) => {
      const { startDate, endDate } = e.detail;
      scrollToDateRange(startDate, endDate, true);
    };

    window.addEventListener(
      "gantt:scroll-to-flag",
      handleScrollToFlag as EventListener
    );
    return () =>
      window.removeEventListener(
        "gantt:scroll-to-flag",
        handleScrollToFlag as EventListener
      );
  }, [scrollToDateRange]);
}

