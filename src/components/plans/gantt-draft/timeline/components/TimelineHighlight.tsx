/**
 * DraftTimeline 기간 강조 오버레이
 */

"use client";

import { parseLocalDate } from "../../laneLayout";
import { FLAG_LANE_HEIGHT } from "../../FlagLane";
import { DAY_WIDTH } from "../timelineTypes";
import type { FlatTreeNode } from "../../laneLayout";

interface TimelineHighlightProps {
  highlightDateRange: {
    startDate: string;
    endDate: string;
    color?: string;
    type?: "flag" | "node";
    nodeId?: string;
  } | null;
  rangeStart: Date;
  days: Date[];
  flagItems: Array<{ flagId: string; laneIndex: number }>;
  flagLaneHeight: number;
  nodePositions: Array<{
    node: FlatTreeNode;
    top: number;
    height: number;
  }>;
}

export function TimelineHighlight({
  highlightDateRange,
  rangeStart,
  days,
  flagItems,
  flagLaneHeight,
  nodePositions,
}: TimelineHighlightProps) {
  if (!highlightDateRange) return null;

  const highlightStart = parseLocalDate(highlightDateRange.startDate);
  const highlightEnd = parseLocalDate(highlightDateRange.endDate);

  const rangeStartMidnight = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate()
  );

  const startOffset = Math.round(
    (highlightStart.getTime() - rangeStartMidnight.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const endOffset = Math.round(
    (highlightEnd.getTime() - rangeStartMidnight.getTime()) /
      (1000 * 60 * 60 * 24)
  );

  // 범위 밖이면 표시하지 않음
  if (endOffset < 0 || startOffset >= days.length) return null;

  const clampedStartOffset = Math.max(0, startOffset);
  const clampedEndOffset = Math.min(days.length - 1, endOffset);

  const highlightLeft = clampedStartOffset * DAY_WIDTH;
  const highlightWidth = (clampedEndOffset - clampedStartOffset + 1) * DAY_WIDTH;
  const highlightColor =
    highlightDateRange.color ||
    (highlightDateRange.type === "flag" ? "#ef4444" : "#3b82f6");

  // 라벨 위치 계산
  const isFlag = highlightDateRange.type === "flag";
  let labelTop = 8; // 기본값

  if (isFlag) {
    // Flag 선택: 해당 FlagBar가 있는 레인 바로 아래
    const flagItem = flagItems.find(
      (item) => item.flagId === highlightDateRange.nodeId
    );
    if (flagItem) {
      // 해당 레인의 하단 위치 (laneIndex는 0부터 시작)
      labelTop = (flagItem.laneIndex + 1) * FLAG_LANE_HEIGHT;
    } else {
      // 못 찾으면 전체 FlagLane 높이 사용
      labelTop = flagLaneHeight;
    }
  } else if (highlightDateRange.nodeId) {
    // 노드 선택: 해당 노드의 레인 상단에 표시
    const nodePos = nodePositions.find(
      (p) => p.node.id === highlightDateRange.nodeId
    );
    if (nodePos) {
      labelTop = nodePos.top + 4; // 레인 상단에서 약간 아래
    }
  }

  return (
    <>
      {/* 기간 강조 배경 - z-index 낮게 */}
      <div
        className="absolute top-0 h-full pointer-events-none"
        style={{
          left: highlightLeft,
          width: highlightWidth,
          background: `linear-gradient(180deg, ${highlightColor}15 0%, ${highlightColor}08 50%, ${highlightColor}15 100%)`,
          borderLeft: `2px solid ${highlightColor}60`,
          borderRight: `2px solid ${highlightColor}60`,
          zIndex: 1,
        }}
      />
      {/* 기간 라벨 - z-index 높게 */}
      <div
        className="absolute px-2 py-1 text-[10px] font-bold whitespace-nowrap pointer-events-none"
        style={{
          left: highlightLeft + highlightWidth / 2,
          top: labelTop,
          transform: "translateX(-50%)",
          background: highlightColor,
          color: "white",
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          zIndex: 100,
          // Flag: 둥근 모서리 전체, 노드: 하단만 둥근 모서리
          borderRadius: isFlag ? "6px" : "0 0 6px 6px",
        }}
      >
        {highlightDateRange.startDate === highlightDateRange.endDate
          ? highlightDateRange.startDate
          : `${highlightDateRange.startDate} ~ ${highlightDateRange.endDate}`}
      </div>
    </>
  );
}

