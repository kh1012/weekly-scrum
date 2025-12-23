/**
 * UnifiedGanttBoard
 * - 세로 스크롤: 단일 컨테이너에서 관리
 * - 가로 스크롤: 타임라인 영역에서만 관리
 * - 좌측 TreePanel과 우측 Timeline이 동일한 행 높이를 공유
 */

"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useDraftStore } from "./store";
import {
  buildFlatTree,
  calculateNodePositions,
  LANE_HEIGHT,
  ROW_HEIGHT,
} from "./laneLayout";

// ============================================================
// 타입 정의
// ============================================================

interface UnifiedGanttBoardProps {
  /** 좌측 트리 패널 렌더링 */
  renderTreePanel: (props: TreePanelRenderProps) => React.ReactNode;
  /** 우측 타임라인 렌더링 */
  renderTimeline: (props: TimelineRenderProps) => React.ReactNode;
  /** 헤더 영역 높이 (px) */
  headerHeight?: number;
  /** 좌측 패널 너비 (px) */
  treePanelWidth?: number;
  /** 읽기 전용 모드 */
  readOnly?: boolean;
  /** 모바일 모드 */
  isMobile?: boolean;
}

export interface TreePanelRenderProps {
  /** 컨테이너 ref (스크롤 이벤트용) */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 세로 스크롤 값 */
  scrollTop: number;
  /** 콘텐츠 총 높이 */
  totalHeight: number;
}

export interface TimelineRenderProps {
  /** 컨테이너 ref */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** 세로 스크롤 값 */
  scrollTop: number;
  /** 콘텐츠 총 높이 */
  totalHeight: number;
  /** 가로 스크롤 값 */
  scrollLeft: number;
  /** 가로 스크롤 변경 핸들러 */
  onScrollLeft: (value: number) => void;
}

// ============================================================
// 메인 컴포넌트
// ============================================================

export function UnifiedGanttBoard({
  renderTreePanel,
  renderTimeline,
  headerHeight = 0,
  treePanelWidth = 340,
  readOnly = false,
  isMobile = false,
}: UnifiedGanttBoardProps) {
  // Refs
  const outerRef = useRef<HTMLDivElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // 스크롤 상태
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Store에서 rows, bars, expandedNodes 가져오기
  const rows = useDraftStore((s) => s.rows);
  const bars = useDraftStore((s) => s.bars);
  const expandedNodesArray = useDraftStore((s) => s.ui.expandedNodes);

  // expandedNodes Set 변환
  const expandedNodes = useMemo(
    () => new Set(expandedNodesArray),
    [expandedNodesArray]
  );

  // 트리 노드 및 위치 계산
  const flatTree = useMemo(
    () => buildFlatTree(rows, bars, expandedNodes),
    [rows, bars, expandedNodes]
  );

  const nodePositions = useMemo(
    () => calculateNodePositions(flatTree),
    [flatTree]
  );

  // 총 높이 계산
  const totalHeight = useMemo(() => {
    if (nodePositions.length === 0) return 0;
    const last = nodePositions[nodePositions.length - 1];
    return last.top + last.height;
  }, [nodePositions]);

  // 세로 스크롤 핸들러
  const handleScroll = useCallback(() => {
    if (outerRef.current) {
      setScrollTop(outerRef.current.scrollTop);
    }
  }, []);

  // 가로 스크롤 핸들러 (타임라인용)
  const handleScrollLeft = useCallback((value: number) => {
    setScrollLeft(value);
  }, []);

  // 스크롤 이벤트 등록
  useEffect(() => {
    const outer = outerRef.current;
    if (!outer) return;

    outer.addEventListener("scroll", handleScroll, { passive: true });
    return () => outer.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return (
    <div
      ref={outerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden relative"
      style={{
        // 세로 스크롤만 담당
        scrollBehavior: "auto",
      }}
    >
      {/* 실제 콘텐츠 높이만큼의 가상 공간 */}
      <div
        className="relative flex"
        style={{
          height: totalHeight + headerHeight,
          minHeight: "100%",
        }}
      >
        {/* 좌측 트리 패널 (sticky) */}
        {!isMobile && (
          <div
            className="sticky left-0 z-20 bg-white shrink-0"
            style={{
              width: treePanelWidth,
              height: "100%",
            }}
          >
            {renderTreePanel({
              containerRef: treeContainerRef,
              scrollTop,
              totalHeight,
            })}
          </div>
        )}

        {/* 우측 타임라인 */}
        <div className="flex-1 relative">
          {renderTimeline({
            containerRef: timelineContainerRef,
            scrollTop,
            totalHeight,
            scrollLeft,
            onScrollLeft: handleScrollLeft,
          })}
        </div>
      </div>
    </div>
  );
}

export default UnifiedGanttBoard;

