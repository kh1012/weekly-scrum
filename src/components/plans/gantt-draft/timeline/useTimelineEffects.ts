/**
 * DraftTimeline 사이드 이펙트 (useEffect)
 */

import { useEffect } from "react";
import { useDraftStore } from "../store";

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

  // 저장 전 스크롤 위치 저장 이벤트 핸들러
  const saveScrollPosition = useDraftStore((s) => s.saveScrollPosition);
  
  useEffect(() => {
    const handleBeforeSave = () => {
      if (containerRef.current) {
        saveScrollPosition({
          left: containerRef.current.scrollLeft,
          top: containerRef.current.scrollTop,
        });
      }
    };

    window.addEventListener("gantt:before-save", handleBeforeSave);
    return () => window.removeEventListener("gantt:before-save", handleBeforeSave);
  }, [containerRef, saveScrollPosition]);

  // 저장 후 스크롤 위치 복원
  const savedScrollPosition = useDraftStore((s) => s.ui.savedScrollPosition);
  const clearSavedScrollPosition = useDraftStore((s) => s.clearSavedScrollPosition);
  
  useEffect(() => {
    if (!savedScrollPosition || !containerRef.current) return;
    
    // 저장된 스크롤 위치로 복원
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollLeft = savedScrollPosition.left;
        containerRef.current.scrollTop = savedScrollPosition.top;
      }
      clearSavedScrollPosition();
    }, 100);
    return () => clearTimeout(timer);
  }, [savedScrollPosition, clearSavedScrollPosition, containerRef]);

  // 초기 로드 시 오늘로 스크롤 (저장된 스크롤 위치가 없을 때만)
  useEffect(() => {
    // 저장된 스크롤 위치가 있으면 스킵 (저장 후 재렌더링 시)
    // 스토어에서 직접 확인 (구독 대신 스냅샷)
    const hasSavedPosition = useDraftStore.getState().ui.savedScrollPosition !== null;
    if (hasSavedPosition) return;
    
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

