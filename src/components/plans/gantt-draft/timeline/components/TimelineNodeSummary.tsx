/**
 * TimelineNodeSummary - Summarized 모드의 ModuleSummaryBar 노드
 */

"use client";

import { calculateBarPosition } from "../../laneLayout";
import { ModuleSummaryBar } from "../../ModuleSummaryBar";
import { isDateRangeOverlapping } from "../timelineTypes";
import type { FlatTreeNode } from "../../laneLayout";
import type { DraftBar as DraftBarType, DraftFlag } from "../../types";

interface TimelineNodeSummaryProps {
  node: FlatTreeNode;
  top: number;
  height: number;
  totalWidth: number;
  rangeStart: Date;
  flags: DraftFlag[];
  readOnly: boolean;
  onModuleSummaryClick: (node: FlatTreeNode, rect: DOMRect) => void;
  onModuleSummaryContextMenu?: (node: FlatTreeNode, position: { x: number; y: number }) => void;
}

export function TimelineNodeSummary({
  node,
  top,
  height,
  totalWidth,
  rangeStart,
  flags,
  readOnly,
  onModuleSummaryClick,
  onModuleSummaryContextMenu,
}: TimelineNodeSummaryProps) {
  if (!node.summary || !node.summary.startDate || !node.summary.endDate) {
    return null;
  }

  const { summary } = node;

  // 바 위치 계산
  const barPosition = calculateBarPosition(
    { startDate: summary.startDate, endDate: summary.endDate } as DraftBarType,
    rangeStart,
    40 // DAY_WIDTH
  );

  // 모듈에 속한 프로젝트 추출 (node.id는 "project::module" 형식)
  const [project] = node.id.split("::");

  // 모듈 기간과 겹치는 Flags 필터링
  const overlappingFlags = flags.filter(
    (flag) =>
      !flag.deleted &&
      isDateRangeOverlapping(
        summary.startDate,
        summary.endDate,
        flag.startDate,
        flag.endDate
      )
  );

  return (
    <div
      key={node.id}
      className="absolute left-0"
      style={{
        top,
        height,
        width: totalWidth,
      }}
    >
      <ModuleSummaryBar
        module={node.label}
        project={project}
        startDate={summary.startDate}
        endDate={summary.endDate}
        featureCount={summary.featureCount}
        features={summary.features}
        assignees={summary.uniqueAssignees}
        authors={summary.uniqueAuthors}
        avgProgress={summary.avgProgress}
        isEntryOnly={summary.isEntryOnly}
        isMixed={summary.isMixed}
        left={barPosition.left}
        width={barPosition.width}
        onClick={(e) => {
          // 읽기모드가 아닐 때만 좌클릭으로 팝오버 열기
          if (!readOnly) {
            const rect = e.currentTarget.getBoundingClientRect();
            onModuleSummaryClick(node, rect);
          }
        }}
        onContextMenu={(e) => {
          // 읽기모드일 때만 우클릭 메뉴 열기
          if (readOnly && onModuleSummaryContextMenu) {
            e.preventDefault();
            e.stopPropagation();
            onModuleSummaryContextMenu(node, { x: e.clientX, y: e.clientY });
          }
        }}
      />
    </div>
  );
}

