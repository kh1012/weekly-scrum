/**
 * TimelineNodesVirtualized - 가상화된 노드 리스트 렌더러
 * 
 * 화면에 보이는 노드만 렌더링하여 성능을 개선합니다.
 * Feature Flag로 제어되며, OFF 시에는 TimelineNodes를 사용합니다.
 */

"use client";

import { useMemo } from "react";
import { TimelineNodes } from "./TimelineNodes";
import { useVirtualization, type NodePosition } from "../useVirtualization";
import type { FlatTreeNode } from "../../laneLayout";
import type { DraftRow, DraftBar as DraftBarType, DraftFlag } from "../../types";

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
  onDragDateChange?: (info: { startDate: string; endDate: string } | null) => void;
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
    overscan: 5,
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

  // 가상화가 활성화된 경우
  return (
    <div
      style={{
        height: totalHeight,
        position: "relative",
        width: "100%",
      }}
    >
      <div
        style={{
          transform: `translateY(${offsetY}px)`,
          willChange: "transform",
        }}
      >
        <TimelineNodes
          nodePositions={visibleNodePositions}
          {...otherProps}
        />
      </div>
    </div>
  );
}

