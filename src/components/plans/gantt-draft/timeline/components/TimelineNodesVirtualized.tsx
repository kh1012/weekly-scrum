/**
 * TimelineNodesVirtualized - 가상화된 노드 리스트 렌더러
 *
 * 화면에 보이는 노드만 렌더링하여 성능을 개선합니다.
 * Feature Flag로 제어되며, OFF 시에는 TimelineNodes를 사용합니다.
 */

"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { TimelineNodes } from "./TimelineNodes";
import { useVirtualization, type NodePosition } from "../useVirtualization";
import type { FlatTreeNode } from "../../laneLayout";
import type {
  DraftRow,
  DraftBar as DraftBarType,
  DraftFlag,
} from "../../types";

interface TimelineNodesVirtualizedProps {
  nodePositions: Array<{
    node: FlatTreeNode;
    top: number;
    height: number;
  }>;
  viewMode: "detailed" | "summarized";
  totalWidth: number;
  rangeStart: Date;
  days: Date[];
  flags: DraftFlag[];
  rows: DraftRow[];
  activeBars: DraftBarType[];
  activeBarsSet: Set<string>;
  filters: {
    features: string[];
    modules: string[];
    stages: string[];
    assignees: string[];
  };
  selectedBarId?: string;
  selectedRowId?: string;
  highlightedRowId?: string | null;
  isEditing: boolean;
  readOnly: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  dragCreate: any;
  dragPreview: { left: number; width: number } | null;
  middleClickScroll: any;
  onMouseDown: (
    e: React.MouseEvent,
    rowId: string,
    row: DraftRow,
    laneIndex: number
  ) => void;
  setHoverInfo: (info: any) => void;
  setLaneContextMenu: (menu: any) => void;
  selectBar: (clientUid: string | undefined) => void;
  setViewPopover: (popover: any) => void;
  setShowEditModal: (bar: DraftBarType | null) => void;
  setModuleSummaryPopover: (popover: any) => void;
  setBlockContextMenu?: (menu: any) => void;
  onDragDateChange?: (
    info: { startDate: string; endDate: string } | null
  ) => void;
  moveBarToRow: (
    clientUid: string,
    project: string,
    module: string,
    feature: string,
    domain?: string
  ) => void;
  // 가상화 관련 props
  containerHeight: number;
  scrollTop: number;
}

export function TimelineNodesVirtualized({
  nodePositions,
  containerHeight,
  scrollTop,
  ...otherProps
}: TimelineNodesVirtualizedProps) {
  // 스크롤 중 감지 (willChange 동적 활성화용)
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 스크롤 중 감지 및 종료 감지
  useEffect(() => {
    setIsScrolling(true);

    // 스크롤 종료 감지 (150ms 디바운스)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollTop]);

  // 데이터 양에 따른 동적 overscan 조정
  const dynamicOverscan = useMemo(() => {
    const nodeCount = nodePositions.length;
    if (nodeCount < 100) return 5;
    if (nodeCount < 500) return 3;
    return 2;
  }, [nodePositions.length]);

  // 가상화 계산
  const {
    visibleStartIndex,
    visibleEndIndex,
    offsetY,
    totalHeight,
    isVirtualized,
  } = useVirtualization({
    nodePositions: nodePositions as NodePosition[],
    containerHeight,
    scrollTop,
    overscan: dynamicOverscan,
  });

  // 보이는 노드만 필터링
  const visibleNodePositions = useMemo(() => {
    if (!isVirtualized) {
      return nodePositions;
    }
    return nodePositions.slice(visibleStartIndex, visibleEndIndex + 1);
  }, [nodePositions, visibleStartIndex, visibleEndIndex, isVirtualized]);

  // 가상화가 비활성화된 경우 기존 TimelineNodes 사용
  if (!isVirtualized) {
    return <TimelineNodes nodePositions={nodePositions} {...otherProps} />;
  }

  // 가상화가 활성화된 경우 - GPU 가속을 위한 translate3d 방식
  // 외부 container는 totalHeight로 고정, 내부는 translate3d로 이동
  const adjustedNodePositions = useMemo(() => {
    return visibleNodePositions.map(pos => ({
      ...pos,
      top: pos.top - offsetY, // offsetY만큼 조정
    }));
  }, [visibleNodePositions, offsetY]);

  return (
    <div
      style={{
        height: totalHeight,
        position: "relative",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {/* GPU 가속을 위한 translate3d 사용 */}
      <div
        style={{
          transform: `translate3d(0, ${offsetY}px, 0)`,
          willChange: isScrolling ? "transform" : "auto",
          backfaceVisibility: "hidden", // GPU 레이어 강제 생성
          perspective: 1000, // 3D 렌더링 힌트
        }}
      >
        <TimelineNodes nodePositions={adjustedNodePositions} {...otherProps} />
      </div>
    </div>
  );
}
