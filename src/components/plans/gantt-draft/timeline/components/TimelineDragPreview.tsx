/**
 * DraftTimeline 드래그 프리뷰
 */

"use client";

import { LANE_HEIGHT } from "../../laneLayout";
import { DAY_WIDTH } from "../timelineTypes";

interface TimelineDragPreviewProps {
  dragCreate: {
    rowId: string;
    laneIndex: number;
  } | null;
  dragPreview: { left: number; width: number } | null;
  currentRowId: string;
}

export function TimelineDragPreview({
  dragCreate,
  dragPreview,
  currentRowId,
}: TimelineDragPreviewProps) {
  if (!dragCreate || dragCreate.rowId !== currentRowId || !dragPreview) {
    return null;
  }

  return (
    <div
      className="absolute rounded-lg pointer-events-none transition-all duration-100"
      style={{
        left: dragPreview.left,
        top: dragCreate.laneIndex * LANE_HEIGHT + 4,
        width: dragPreview.width,
        height: LANE_HEIGHT - 8,
        background:
          "linear-gradient(90deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%)",
        border: "2px dashed #3b82f6",
        boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
      }}
    />
  );
}

