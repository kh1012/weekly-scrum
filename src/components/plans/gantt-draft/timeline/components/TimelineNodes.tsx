/**
 * TimelineNodes - 노드 리스트 렌더러
 */

"use client";

import { TimelineNodeSummary } from "./TimelineNodeSummary";
import { TimelineNodeParent } from "./TimelineNodeParent";
import { TimelineNodeFeature } from "./TimelineNodeFeature";
import type { FlatTreeNode } from "../../laneLayout";
import type { DraftRow, DraftBar as DraftBarType, DraftFlag } from "../../types";

interface TimelineNodesProps {
  nodePositions: Array<{
    node: FlatTreeNode;
    top: number;
    height: number;
  }>;
  viewMode: "detailed" | "summarized";
  totalWidth: number;
  rangeStart: Date;
  rangeEnd: Date;
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
}

export function TimelineNodes({
  nodePositions,
  viewMode,
  totalWidth,
  rangeStart,
  rangeEnd,
  days,
  flags,
  rows,
  activeBars,
  activeBarsSet,
  filters,
  selectedBarId,
  selectedRowId,
  highlightedRowId,
  isEditing,
  readOnly,
  containerRef,
  dragCreate,
  dragPreview,
  middleClickScroll,
  onMouseDown,
  setHoverInfo,
  setLaneContextMenu,
  selectBar,
  setViewPopover,
  setShowEditModal,
  setModuleSummaryPopover,
  setBlockContextMenu,
  onDragDateChange,
  moveBarToRow,
}: TimelineNodesProps) {
  return (
    <>
      {nodePositions.map(({ node, top, height }) => {
        // Summarized 모드: 모듈 노드에 ModuleSummaryBar 렌더링
        if (viewMode === "summarized" && node.type === "module" && node.summary) {
          return (
            <TimelineNodeSummary
              key={node.id}
              node={node}
              top={top}
              height={height}
              totalWidth={totalWidth}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              flags={flags}
              readOnly={readOnly}
              onModuleSummaryClick={(node, rect) => {
                setModuleSummaryPopover({ node, anchorRect: rect });
              }}
              onModuleSummaryContextMenu={(node, position) => {
                if (setBlockContextMenu) {
                  setBlockContextMenu({
                    position,
                    type: "moduleSummary",
                    data: node,
                  });
                }
              }}
            />
          );
        }

        // feature 노드만 bar 렌더링 (Detailed 모드)
        if (node.type !== "feature" || !node.row) {
          // Project/Module 노드 범위 표시
          return (
            <TimelineNodeParent
              key={node.id}
              node={node}
              top={top}
              height={height}
              totalWidth={totalWidth}
              rangeStart={rangeStart}
              rangeEnd={rangeEnd}
              rows={rows}
              activeBars={activeBars}
              filters={{
                features: filters.features,
                modules: filters.modules,
              }}
              selectedRowId={selectedRowId}
              highlightedRowId={highlightedRowId}
            />
          );
        }

        // Feature 노드
        return (
          <TimelineNodeFeature
            key={node.id}
            node={node}
            top={top}
            height={height}
            totalWidth={totalWidth}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            days={days}
            activeBarsSet={activeBarsSet}
            selectedBarId={selectedBarId}
            selectedRowId={selectedRowId}
            highlightedRowId={highlightedRowId}
            isEditing={isEditing}
            readOnly={readOnly}
            containerRef={containerRef}
            nodePositions={nodePositions}
            dragCreate={dragCreate}
            dragPreview={dragPreview}
            middleClickScroll={middleClickScroll}
            onMouseDown={onMouseDown}
            setHoverInfo={setHoverInfo}
            setLaneContextMenu={setLaneContextMenu}
            selectBar={selectBar}
            setViewPopover={setViewPopover}
            setShowEditModal={setShowEditModal}
            setBlockContextMenu={setBlockContextMenu}
            onDragDateChange={onDragDateChange}
            moveBarToRow={moveBarToRow}
          />
        );
      })}
    </>
  );
}

