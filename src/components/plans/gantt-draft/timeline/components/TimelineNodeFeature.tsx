/**
 * TimelineNodeFeature - Feature 노드 (bars 렌더링)
 */

"use client";

import { parseLocalDate, LANE_HEIGHT } from "../../laneLayout";
import { DraftBar } from "../../DraftBar";
import { TimelineDragPreview } from "./TimelineDragPreview";
import { DAY_WIDTH } from "../timelineTypes";
import type { FlatTreeNode } from "../../laneLayout";
import type { DraftRow, DraftBar as DraftBarType } from "../../types";

interface TimelineNodeFeatureProps {
  node: FlatTreeNode;
  top: number;
  height: number;
  totalWidth: number;
  rangeStart: Date;
  days: Date[];
  activeBarsSet: Set<string>;
  selectedBarId?: string;
  selectedRowId?: string;
  highlightedRowId?: string | null;
  isEditing: boolean;
  readOnly: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  nodePositions: Array<{
    node: FlatTreeNode;
    top: number;
    height: number;
  }>;
  dragCreate: any;
  dragPreview: { left: number; width: number } | null;
  middleClickScroll: any;
  onMouseDown: (
    e: React.MouseEvent,
    rowId: string,
    row: DraftRow,
    laneIndex: number,
  ) => void;
  setHoverInfo: (info: any) => void;
  setLaneContextMenu: (menu: any) => void;
  selectBar: (clientUid: string | undefined) => void;
  setViewPopover: (popover: any) => void;
  setShowEditModal: (bar: DraftBarType | null) => void;
  setBlockContextMenu?: (menu: any) => void;
  onDragDateChange?: (
    info: { startDate: string; endDate: string } | null,
  ) => void;
  moveBarToRow: (
    clientUid: string,
    project: string,
    module: string,
    feature: string,
    domain?: string,
  ) => void;
}

export function TimelineNodeFeature({
  node,
  top,
  height,
  totalWidth,
  rangeStart,
  days,
  activeBarsSet,
  selectedBarId,
  selectedRowId,
  highlightedRowId,
  isEditing,
  readOnly,
  containerRef,
  nodePositions,
  dragCreate,
  dragPreview,
  middleClickScroll,
  onMouseDown,
  setHoverInfo,
  setLaneContextMenu,
  selectBar,
  setViewPopover,
  setShowEditModal,
  setBlockContextMenu,
  onDragDateChange,
  moveBarToRow,
}: TimelineNodeFeatureProps) {
  if (!node.row) return null;

  const row = node.row;
  const nodeBars = node.bars || [];
  const isRowSelected = row.rowId === selectedRowId;
  const isFocused = row.rowId === highlightedRowId;

  // 접힌 상태에서는 드래그 생성 비활성화
  const isCollapsed = node.isExpanded === false;

  return (
    <div
      key={node.id}
      className={`absolute left-0 ${
        isCollapsed ? "cursor-default" : "cursor-crosshair"
      } ${isFocused ? "animate-pulse-subtle" : ""}`}
      style={{
        top,
        height,
        width: totalWidth,
        // 접힌 상태: 연한 회색 음영, focus 상태: 주황색 음영
        background: isCollapsed
          ? "rgba(0, 0, 0, 0.03)"
          : isFocused
            ? "rgba(251, 146, 60, 0.08)"
            : "transparent",
        // 선택된 행 강조 - 파란색 얇은 라인
        borderTop: isRowSelected
          ? "1px solid #3b82f6"
          : isFocused
            ? "1px solid rgba(251, 146, 60, 0.3)"
            : "none",
        borderBottom: isRowSelected
          ? "1px solid #3b82f6"
          : isFocused
            ? "1px solid rgba(251, 146, 60, 0.3)"
            : "none",
      }}
      onMouseDown={(e) => {
        // 접힌 상태에서는 드래그 생성 비활성화
        if (node.isExpanded === false) return;

        // 클릭 위치에서 laneIndex 계산 (merge된 레인 지원)
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const laneIndex = Math.floor(relativeY / LANE_HEIGHT);
        onMouseDown(e, row.rowId, row, laneIndex);
      }}
      onMouseMove={(e) => {
        // 접힌 상태에서는 호버 프리뷰 비활성화
        if (node.isExpanded === false) {
          setHoverInfo(null);
          return;
        }

        // 편집 모드이고, 드래그 중이 아니고, 휠 클릭 스크롤 중이 아닐 때만 호버 프리뷰 표시
        if (
          isEditing &&
          !dragCreate?.isActive &&
          !middleClickScroll?.isActive
        ) {
          const rect = containerRef.current?.getBoundingClientRect();
          const nodeRect = e.currentTarget.getBoundingClientRect();
          if (rect) {
            const x =
              e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
            // 일 단위로 스냅
            const snappedX = Math.floor(x / DAY_WIDTH) * DAY_WIDTH;
            const dayIndex = Math.floor(x / DAY_WIDTH);

            // 개별 레인 인덱스 계산
            const relativeY = e.clientY - nodeRect.top;
            const laneIndex = Math.floor(relativeY / LANE_HEIGHT);

            // 스냅된 위치가 변경된 경우에만 상태 업데이트 (성능 최적화)
            if (dayIndex >= 0 && dayIndex < days.length) {
              setHoverInfo((prev: any) => {
                // 같은 위치 및 레인이면 업데이트 안함
                if (
                  prev?.rowId === row.rowId &&
                  prev?.x === snappedX &&
                  prev?.laneIndex === laneIndex
                ) {
                  return prev;
                }
                return {
                  rowId: row.rowId,
                  date: days[dayIndex],
                  x: snappedX,
                  laneIndex,
                  nodeTop: top,
                  nodeHeight: height,
                };
              });
            }
          }
        }
      }}
      onMouseLeave={() => {
        setHoverInfo(null);
      }}
      onContextMenu={(e) => {
        if (!isEditing) return;
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        const laneIndex = Math.floor(relativeY / LANE_HEIGHT);
        setLaneContextMenu({
          rowId: row.rowId,
          laneIndex,
          position: { x: e.clientX, y: e.clientY },
        });
      }}
    >
      {/* Bars */}
      {(() => {
        return nodeBars
          .filter((bar) => activeBarsSet.has(bar.clientUid)) // 필터링된 bars만 렌더링
          .map((bar) => {
            const barStart = parseLocalDate(bar.startDate);
            const barEnd = parseLocalDate(bar.endDate);

            // rangeStart도 자정으로 정규화하여 비교
            const rangeStartMidnight = new Date(
              rangeStart.getFullYear(),
              rangeStart.getMonth(),
              rangeStart.getDate(),
            );

            const startOffset = Math.round(
              (barStart.getTime() - rangeStartMidnight.getTime()) /
                (1000 * 60 * 60 * 24),
            );
            const endOffset = Math.round(
              (barEnd.getTime() - rangeStartMidnight.getTime()) /
                (1000 * 60 * 60 * 24),
            );

            const left = startOffset * DAY_WIDTH;
            const width = (endOffset - startOffset + 1) * DAY_WIDTH;

            // 현재 row의 스크롤 보정된 절대 Y offset 계산
            // containerRef는 그리드 영역(헤더/플래그 아래)을 가리킴
            const containerTop =
              containerRef.current?.getBoundingClientRect().top || 0;
            const scrollTop = containerRef.current?.scrollTop || 0;
            const rowTopOffset = containerTop + top - scrollTop;

            return (
              <DraftBar
                key={bar.clientUid}
                bar={bar}
                left={left}
                width={width}
                lane={bar.lane}
                isSelected={bar.clientUid === selectedBarId}
                isEditing={isEditing}
                readOnly={readOnly}
                onSelect={() => selectBar(bar.clientUid)}
                onDoubleClick={(e?: React.MouseEvent) => {
                  // 읽기모드: 아무 동작도 하지 않음 (컨텍스트 메뉴로만 접근)
                  if (readOnly) {
                    return;
                  }

                  // 편집모드가 아닌 경우: 팝오버 표시
                  if (!isEditing) {
                    const rect = (
                      e?.currentTarget as HTMLElement
                    )?.getBoundingClientRect();
                    setViewPopover({
                      bar,
                      position: {
                        x: rect ? rect.left + rect.width / 2 : e?.clientX || 0,
                        y: rect ? rect.bottom + 8 : (e?.clientY || 0) + 8,
                      },
                    });
                  } else {
                    // 편집 모드: EditPlanModal 표시
                    setShowEditModal(bar);
                  }
                }}
                onContextMenu={(e, bar) => {
                  if (setBlockContextMenu) {
                    setBlockContextMenu({
                      position: { x: e.clientX, y: e.clientY },
                      type: "bar",
                      data: bar,
                    });
                  }
                }}
                dayWidth={DAY_WIDTH}
                rangeStart={rangeStart}
                onDragDateChange={onDragDateChange}
                onClearHover={() => setHoverInfo(null)}
                rowTopOffset={rowTopOffset}
                rowBars={nodeBars}
                onMoveComplete={(absoluteY: number) => {
                  // 마우스 절대 Y 위치로 타겟 Row 찾기
                  // containerRef는 그리드 영역(헤더/플래그 아래)을 가리킴
                  const containerRect =
                    containerRef.current?.getBoundingClientRect();
                  if (!containerRect) return;

                  // 스크롤 보정된 상대 Y 계산
                  // containerRect.top은 이미 헤더/플래그 아래이므로 추가 오프셋 불필요
                  const currentScrollTop = containerRef.current?.scrollTop || 0;
                  const relativeY =
                    absoluteY - containerRect.top + currentScrollTop;

                  // nodePositions에서 타겟 row 찾기
                  let targetNode = null;
                  for (const pos of nodePositions) {
                    if (
                      pos.node.type === "feature" &&
                      pos.node.row &&
                      relativeY >= pos.top &&
                      relativeY < pos.top + pos.height
                    ) {
                      targetNode = pos.node;
                      break;
                    }
                  }

                  // 타겟이 현재 row와 다르면 이동
                  if (
                    targetNode &&
                    targetNode.row &&
                    targetNode.row.rowId !== bar.rowId
                  ) {
                    moveBarToRow(
                      bar.clientUid,
                      targetNode.row.project,
                      targetNode.row.module,
                      targetNode.row.feature,
                      targetNode.row.domain,
                    );
                  }
                }}
              />
            );
          });
      })()}

      {/* 드래그 프리뷰 */}
      <TimelineDragPreview
        dragCreate={dragCreate}
        dragPreview={dragPreview}
        currentRowId={row.rowId}
      />
    </div>
  );
}
