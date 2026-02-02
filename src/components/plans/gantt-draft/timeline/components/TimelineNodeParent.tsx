/**
 * TimelineNodeParent - Project/Module 노드 (하위 bars의 기간 범위 표시)
 */

"use client";

import { getNodeDateRange, parseLocalDate } from "../../laneLayout";
import { DAY_WIDTH } from "../timelineTypes";
import type { FlatTreeNode } from "../../laneLayout";
import type { DraftRow, DraftBar as DraftBarType } from "../../types";

interface TimelineNodeParentProps {
  node: FlatTreeNode;
  top: number;
  height: number;
  totalWidth: number;
  rangeStart: Date;
  rows: DraftRow[];
  activeBars: DraftBarType[];
  filters: {
    features: string[];
    modules: string[];
  };
  selectedRowId?: string;
  highlightedRowId?: string | null;
}

export function TimelineNodeParent({
  node,
  top,
  height,
  totalWidth,
  rangeStart,
  rows,
  activeBars,
  filters,
  selectedRowId,
  highlightedRowId,
}: TimelineNodeParentProps) {
  // 기능 필터가 적용된 경우: 프로젝트/모듈 행 숨김
  // 모듈 필터가 적용된 경우: 프로젝트 행 숨김
  const hasFeatureFilter = filters.features.length > 0;
  const hasModuleFilter = filters.modules.length > 0;

  if (hasFeatureFilter) return null;
  if (hasModuleFilter && node.type === "project") return null;

  // 선택/포커스 상태 확인
  const isSelected = selectedRowId === node.id;
  const isFocused = highlightedRowId === node.id;

  // project/module 노드는 하위 bars의 기간 범위를 표시 (접혀도 유지)
  const dateRange = getNodeDateRange(node, rows, activeBars);

  // rangeStart를 자정으로 정규화
  const rangeStartMidnight = new Date(
    rangeStart.getFullYear(),
    rangeStart.getMonth(),
    rangeStart.getDate()
  );

  let rangeBarLeft = 0;
  let rangeBarWidth = 0;

  if (dateRange) {
    const minStartDate = parseLocalDate(dateRange.minStart);
    const maxEndDate = parseLocalDate(dateRange.maxEnd);

    const startOffset = Math.round(
      (minStartDate.getTime() - rangeStartMidnight.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const endOffset = Math.round(
      (maxEndDate.getTime() - rangeStartMidnight.getTime()) /
        (1000 * 60 * 60 * 24)
    );

    rangeBarLeft = startOffset * DAY_WIDTH;
    rangeBarWidth = (endOffset - startOffset + 1) * DAY_WIDTH;
  }

  // 배경색 결정 (선택/포커스 상태 우선)
  const getBackground = () => {
    if (isFocused) {
      return "linear-gradient(90deg, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%)";
    }
    if (isSelected) {
      return "linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)";
    }
    if (node.type === "project") {
      return "linear-gradient(90deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%)";
    }
    if (node.type === "module") {
      return "linear-gradient(90deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.01) 100%)";
    }
    return "transparent";
  };

  return (
    <div
      key={node.id}
      className="absolute left-0 transition-colors duration-150"
      style={{
        top,
        height,
        width: totalWidth,
        background: getBackground(),
      }}
    >
      {/* 하위 feature들의 기간 범위 표시 - Airbnb 스타일 */}
      {dateRange && (
        <div
          className="absolute rounded-lg transition-all duration-200"
          style={{
            left: rangeBarLeft,
            width: rangeBarWidth,
            top: (height - 10) / 2,
            height: 10,
            background:
              node.type === "project"
                ? "linear-gradient(90deg, rgba(251, 191, 36, 0.18) 0%, rgba(251, 191, 36, 0.08) 100%)"
                : "linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.06) 100%)",
            border:
              node.type === "project"
                ? "1px dashed rgba(245, 158, 11, 0.5)"
                : "1px dashed rgba(139, 92, 246, 0.4)",
            boxShadow:
              node.type === "project"
                ? "0 1px 3px rgba(245, 158, 11, 0.1)"
                : "0 1px 3px rgba(139, 92, 246, 0.08)",
          }}
        />
      )}
    </div>
  );
}

