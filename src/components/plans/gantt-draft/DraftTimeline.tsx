/**
 * Draft Timeline (우측)
 * - 날짜 헤더 (sticky)
 * - Row별 Bar 렌더링
 * - Drag to create / move / resize
 */

"use client";

import { useRef, useCallback } from "react";
import { useDraftStore } from "./store";
import { FlagLane } from "./FlagLane";
import { packFlagsIntoLanes } from "./flagLayout";
import { ROW_HEIGHT, LANE_HEIGHT } from "./laneLayout";
import { DAY_WIDTH, HEADER_HEIGHT } from "./timeline/timelineTypes";
import type { DraftTimelineProps } from "./timeline/timelineTypes";

// State & Hooks
import { useTimelineState } from "./timeline/useTimelineState";
import { useTimelineData } from "./timeline/useTimelineData";
import { useTimelineDragCreate } from "./timeline/useTimelineDragCreate";
import { useTimelineScroll } from "./timeline/useTimelineScroll";
import { useTimelineKeyboard } from "./timeline/useTimelineKeyboard";
import { useTimelineLaneActions } from "./timeline/useTimelineLaneActions";
import { useTimelineEffects } from "./timeline/useTimelineEffects";

// Components
import { TimelineHeader } from "./timeline/components/TimelineHeader";
import { TimelineGridLines } from "./timeline/components/TimelineGridLines";
import { TimelineHighlight } from "./timeline/components/TimelineHighlight";
import { TimelineNodes } from "./timeline/components/TimelineNodes";
import { TimelineHoverPreview } from "./timeline/components/TimelineHoverPreview";
import { SnapshotConnections } from "./timeline/components/SnapshotConnections";
import { TimelineModals } from "./timeline/components/TimelineModals";
import { TimelineLaneMenu } from "./timeline/components/TimelineLaneMenu";
import { TimelineDeleteLaneModal } from "./timeline/components/TimelineDeleteLaneModal";
import { BlockContextMenu } from "./timeline/components/BlockContextMenu";

export function DraftTimeline({
  rangeStart,
  rangeEnd,
  isEditing,
  isAdmin = false,
  readOnly = false,
  members = [],
  workspaceId = "",
  onDragDateChange,
  onAction,
  scrollTop: externalScrollTop,
  onScrollChange,
  onScrollbarHeightChange,
  highlightedRowId,
}: DraftTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const flagLaneRef = useRef<HTMLDivElement>(null);

  // State
  const state = useTimelineState();

  // Store
  const allRows = useDraftStore((s) => s.rows);
  const allBars = useDraftStore((s) => s.bars);
  const searchQuery = useDraftStore((s) => s.ui.searchQuery);
  const filters = useDraftStore((s) => s.ui.filters);
  const filterIndex = useDraftStore((s) => s.filterIndex);
  const expandedNodesArray = useDraftStore((s) => s.ui.expandedNodes);
  const viewMode = useDraftStore((s) => s.ui.viewMode);
  const addBar = useDraftStore((s) => s.addBar);
  const selectedBarId = useDraftStore((s) => s.ui.selectedBarId);
  const selectedRowId = useDraftStore((s) => s.ui.selectedRowId);
  const selectBar = useDraftStore((s) => s.selectBar);
  const deleteBar = useDraftStore((s) => s.deleteBar);
  const updateBar = useDraftStore((s) => s.updateBar);
  const moveBarToRow = useDraftStore((s) => s.moveBarToRow);
  const flags = useDraftStore((s) => s.flags);
  const selectedFlagId = useDraftStore((s) => s.selectedFlagId);
  const selectFlag = useDraftStore((s) => s.selectFlag);
  const deleteFlagAction = useDraftStore((s) => s.deleteFlag);
  const fetchFlags = useDraftStore((s) => s.fetchFlags);
  const clearPendingFlag = useDraftStore((s) => s.clearPendingFlag);
  const highlightDateRange = useDraftStore((s) => s.ui.highlightDateRange);
  const setHighlightDateRange = useDraftStore((s) => s.setHighlightDateRange);

  // Data calculations
  const data = useTimelineData({
    rangeStart,
    rangeEnd,
    allRows,
    allBars,
    activeBars: state.dragCreate?.isActive ? [] : allBars.filter((b) => !b.deleted),
    searchQuery,
    filters,
    filterIndex: filterIndex || null,
    expandedNodesArray,
    viewMode,
  });

  // Flag Lane 높이 계산
  const { laneCount: flagLaneCount, items: flagItems } = packFlagsIntoLanes({
    flags,
    rangeStart,
    rangeEnd,
    dayWidth: 40,
  });
  const flagLaneHeight = Math.max(1, flagLaneCount) * 32; // FLAG_LANE_HEIGHT

  // Drag create logic
  const dragLogic = useTimelineDragCreate({
    isEditing,
    rangeStart,
    dragCreate: state.dragCreate,
    setDragCreate: state.setDragCreate,
    setHoverInfo: state.setHoverInfo,
    setShowCreateModal: state.setShowCreateModal,
    containerRef,
    onAction,
    addBar,
    middleClickScroll: state.middleClickScroll,
    setMiddleClickScroll: state.setMiddleClickScroll,
  });

  // Scroll logic
  const scrollLogic = useTimelineScroll({
    containerRef,
    headerRef,
    flagLaneRef,
    rangeStart,
    days: data.days,
    setHeaderScrollLeft: state.setHeaderScrollLeft,
    setHoverInfo: state.setHoverInfo,
    setMiddleClickScroll: state.setMiddleClickScroll,
    middleClickScroll: state.middleClickScroll,
    onScrollChange,
  });

  // Lane actions
  const laneActions = useTimelineLaneActions({
    rows: data.rows,
    activeBars: data.filteredActiveBars,
    rangeStart,
    rangeEnd,
    laneContextMenu: state.laneContextMenu,
    deleteLaneConfirm: state.deleteLaneConfirm,
    updateBar,
    setLaneContextMenu: state.setLaneContextMenu,
    setDeleteLaneConfirm: state.setDeleteLaneConfirm,
    onAction,
  });

  // Keyboard events
  useTimelineKeyboard({
    isEditing,
    selectedBarId,
    selectedFlagId,
    deleteBar,
    selectBar,
    deleteFlagAction,
    selectFlag,
    clearPendingFlag,
    setHighlightDateRange,
    setLaneContextMenu: state.setLaneContextMenu,
  });

  // Effects
  useTimelineEffects({
    workspaceId,
    fetchFlags,
    externalScrollTop,
    containerRef,
    onScrollbarHeightChange,
    scrollToToday: scrollLogic.scrollToToday,
    scrollToDateRange: scrollLogic.scrollToDateRange,
  });

  const handleCellLeave = useCallback(() => {
    state.setHoverInfo(null);
  }, [state]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 헤더 영역 */}
      <TimelineHeader
        headerRef={headerRef}
        totalWidth={data.totalWidth}
        months={data.months}
        days={data.days}
      />

      {/* Flag Lane */}
      <div
        ref={flagLaneRef}
        className="flex-shrink-0 overflow-x-auto scrollbar-hide relative"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onScroll={scrollLogic.handleFlagScroll}
      >
        <FlagLane
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          dayWidth={40}
          totalWidth={data.totalWidth}
          isEditing={isEditing}
          scrollLeft={state.headerScrollLeft}
          onOpenCreateModal={() => state.setShowCreateFlagModal(true)}
          onOpenEditModal={(flag) => state.setEditingFlag(flag)}
        />
      </div>

      {/* 그리드 영역 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative timeline-scrollbar"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
          minHeight: 0,
          cursor: state.middleClickScroll?.isActive ? "move" : undefined,
        }}
        onScroll={scrollLogic.handleScroll}
        onMouseDown={scrollLogic.handleMiddleClickStart}
        onMouseMove={(e) => {
          scrollLogic.handleMiddleClickMove(e);
          dragLogic.handleMouseMove(e);
        }}
        onMouseUp={dragLogic.handleMouseUp}
        onMouseLeave={() => {
          dragLogic.handleMouseUp();
          handleCellLeave();
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            selectBar(undefined);
            selectFlag(null);
            setHighlightDateRange(null);
          }
        }}
      >
        <div
          className="relative"
          style={{ width: data.totalWidth, height: data.totalHeight }}
        >
          {/* 기간 강조 표시 */}
          <TimelineHighlight
            highlightDateRange={highlightDateRange || null}
            rangeStart={rangeStart}
            days={data.days}
            flagItems={flagItems}
            flagLaneHeight={flagLaneHeight}
            nodePositions={data.nodePositions}
          />

          {/* 그리드 라인 */}
          <TimelineGridLines
            days={data.days}
            rangeStart={rangeStart}
            nodePositions={data.nodePositions}
          />

          {/* 노드 렌더링 */}
          <TimelineNodes
            nodePositions={data.nodePositions}
            viewMode={viewMode}
            totalWidth={data.totalWidth}
            rangeStart={rangeStart}
            days={data.days}
            flags={flags}
            rows={data.rows}
            activeBars={data.filteredActiveBars}
            activeBarsSet={data.activeBarsSet}
            filters={filters}
            selectedBarId={selectedBarId}
            selectedRowId={selectedRowId}
            highlightedRowId={highlightedRowId}
            isEditing={isEditing}
            readOnly={readOnly}
            containerRef={containerRef}
            dragCreate={state.dragCreate}
            dragPreview={dragLogic.dragPreview}
            middleClickScroll={state.middleClickScroll}
            onMouseDown={dragLogic.handleMouseDown}
            setHoverInfo={state.setHoverInfo}
            setLaneContextMenu={state.setLaneContextMenu}
            selectBar={selectBar}
            setViewPopover={state.setViewPopover}
            setShowEditModal={state.setShowEditModal}
            setModuleSummaryPopover={state.setModuleSummaryPopover}
            setBlockContextMenu={state.setBlockContextMenu}
            onDragDateChange={onDragDateChange}
            moveBarToRow={moveBarToRow}
          />

          {/* 호버 프리뷰 */}
          <TimelineHoverPreview
            isEditing={isEditing}
            dragCreateIsActive={!!state.dragCreate?.isActive}
            hoverInfo={state.hoverInfo}
          />

          {/* 스냅샷 연결 */}
          <SnapshotConnections
            connections={data.snapshotConnections}
            totalWidth={data.totalWidth}
            totalHeight={data.totalHeight}
          />
        </div>
      </div>

      {/* 모달들 */}
      <TimelineModals
        showCreateModal={state.showCreateModal}
        showEditModal={state.showEditModal}
        showCreateFlagModal={state.showCreateFlagModal}
        editingFlag={state.editingFlag}
        viewPopover={state.viewPopover}
        moduleSummaryPopover={state.moduleSummaryPopover}
        flags={flags}
        members={members}
        workspaceId={workspaceId}
        filters={filters}
        setShowCreateModal={state.setShowCreateModal}
        setShowEditModal={state.setShowEditModal}
        setShowCreateFlagModal={state.setShowCreateFlagModal}
        setEditingFlag={state.setEditingFlag}
        setViewPopover={state.setViewPopover}
        setModuleSummaryPopover={state.setModuleSummaryPopover}
        onCreatePlan={dragLogic.handleCreatePlan}
        updateBar={updateBar}
        deleteBar={deleteBar}
      />

      {/* 레인 컨텍스트 메뉴 */}
      <TimelineLaneMenu
        laneContextMenu={state.laneContextMenu}
        onAddLane={laneActions.handleAddLane}
        onDeleteLane={laneActions.handleDeleteLane}
      />

      {/* 레인 삭제 확인 모달 */}
      <TimelineDeleteLaneModal
        deleteLaneConfirm={state.deleteLaneConfirm}
        onConfirm={laneActions.handleConfirmDeleteLane}
        onCancel={() => state.setDeleteLaneConfirm(null)}
      />

      {/* 블록 컨텍스트 메뉴 */}
      <BlockContextMenu
        position={state.blockContextMenu?.position || null}
        onViewDetails={() => {
          if (!state.blockContextMenu) return;

          if (state.blockContextMenu.type === "moduleSummary") {
            // 모듈 요약 블록: ModuleSummaryPopover 열기
            const node = state.blockContextMenu.data;
            // 임시 rect 생성 (마우스 위치 기준)
            const rect = new DOMRect(
              state.blockContextMenu.position.x,
              state.blockContextMenu.position.y,
              0,
              0
            );
            state.setModuleSummaryPopover({ node, anchorRect: rect });
          } else if (state.blockContextMenu.type === "bar") {
            // 계획 블록: PlanViewPopover 열기
            const bar = state.blockContextMenu.data;
            state.setViewPopover({
              bar,
              position: {
                x: state.blockContextMenu.position.x,
                y: state.blockContextMenu.position.y + 8,
              },
            });
          }
        }}
        onClose={() => state.setBlockContextMenu(null)}
      />
    </div>
  );
}

export { DAY_WIDTH, ROW_HEIGHT, LANE_HEIGHT };
