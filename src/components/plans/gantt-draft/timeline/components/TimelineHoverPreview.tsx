/**
 * DraftTimeline 호버 프리뷰
 */

"use client";

import { LANE_HEIGHT } from "../../laneLayout";
import { DAY_WIDTH } from "../timelineTypes";
import type { HoverInfo } from "../timelineTypes";

interface TimelineHoverPreviewProps {
  isEditing: boolean;
  dragCreateIsActive: boolean;
  hoverInfo: HoverInfo | null;
}

export function TimelineHoverPreview({
  isEditing,
  dragCreateIsActive,
  hoverInfo,
}: TimelineHoverPreviewProps) {
  if (!isEditing || dragCreateIsActive || !hoverInfo) {
    return null;
  }

  return (
    <div
      className="absolute pointer-events-none z-10"
      style={{
        left: hoverInfo.x,
        top: hoverInfo.nodeTop + hoverInfo.laneIndex * LANE_HEIGHT + 4,
        width: DAY_WIDTH,
        height: LANE_HEIGHT - 8,
        background: "rgba(156, 163, 175, 0.15)",
        border: "1px dashed rgba(156, 163, 175, 0.4)",
        borderRadius: 6,
      }}
    />
  );
}

