/**
 * Draft Timeline (우측)
 * - 날짜 헤더
 * - Row별 Bar 렌더링
 * - Drag to create / move / resize
 */

"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useDraftStore, selectFilteredRows, selectVisibleBars } from "./store";
import { buildRenderRows, formatDate, xToDate } from "./laneLayout";
import { DraftBar } from "./DraftBar";
import { CreatePlanModal } from "./CreatePlanModal";
import { PlusIcon } from "@/components/common/Icons";
import type { DraftRow, PlanStatus } from "./types";

const DAY_WIDTH = 40;
const ROW_HEIGHT = 36;
const LANE_HEIGHT = 32;
const HEADER_HEIGHT = 60;

interface DraftTimelineProps {
  rangeStart: Date;
  rangeEnd: Date;
  isEditing: boolean;
}

interface DragCreateState {
  rowId: string;
  startDate: Date;
  endDate: Date;
  project: string;
  module: string;
  feature: string;
}

export function DraftTimeline({ rangeStart, rangeEnd, isEditing }: DraftTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverInfo, setHoverInfo] = useState<{
    rowId: string;
    date: Date;
    x: number;
    y: number;
  } | null>(null);

  const [dragCreate, setDragCreate] = useState<{
    isActive: boolean;
    startX: number;
    currentX: number;
    rowId: string;
    row: DraftRow;
  } | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<DragCreateState | null>(null);

  const rows = useDraftStore((s) => selectFilteredRows(s));
  const bars = useDraftStore((s) => selectVisibleBars(s));
  const addBar = useDraftStore((s) => s.addBar);
  const addRow = useDraftStore((s) => s.addRow);
  const selectedBarId = useDraftStore((s) => s.ui.selectedBarId);
  const selectBar = useDraftStore((s) => s.selectBar);

  // 날짜 범위 계산
  const days = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(rangeStart);
    while (current <= rangeEnd) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [rangeStart, rangeEnd]);

  // 월별 그룹
  const months = useMemo(() => {
    const result: Array<{ month: string; days: number; startIndex: number }> = [];
    let currentMonth = "";
    let count = 0;
    let startIndex = 0;

    days.forEach((day, idx) => {
      const monthKey = day.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
      });

      if (monthKey !== currentMonth) {
        if (currentMonth) {
          result.push({ month: currentMonth, days: count, startIndex });
        }
        currentMonth = monthKey;
        count = 1;
        startIndex = idx;
      } else {
        count++;
      }
    });

    if (currentMonth) {
      result.push({ month: currentMonth, days: count, startIndex });
    }

    return result;
  }, [days]);

  const totalWidth = days.length * DAY_WIDTH;

  // RenderRows 계산
  const renderRows = useMemo(() => buildRenderRows(rows, bars), [rows, bars]);

  // 총 높이 계산
  const totalHeight = useMemo(() => {
    return renderRows.reduce((sum, row) => sum + Math.max(1, row.laneCount) * LANE_HEIGHT, 0);
  }, [renderRows]);

  // Drag create 핸들링
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, rowId: string, row: DraftRow) => {
      if (!isEditing) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);

      setDragCreate({
        isActive: true,
        startX: x,
        currentX: x,
        rowId,
        row,
      });
    },
    [isEditing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragCreate?.isActive) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
      setDragCreate((prev) => (prev ? { ...prev, currentX: x } : null));
    },
    [dragCreate?.isActive]
  );

  const handleMouseUp = useCallback(() => {
    if (!dragCreate?.isActive) return;

    const startX = Math.min(dragCreate.startX, dragCreate.currentX);
    const endX = Math.max(dragCreate.startX, dragCreate.currentX);

    // 최소 드래그 거리 확인
    if (endX - startX > 20) {
      const startDate = xToDate(startX, rangeStart, DAY_WIDTH);
      const endDate = xToDate(endX, rangeStart, DAY_WIDTH);

      setShowCreateModal({
        rowId: dragCreate.rowId,
        startDate,
        endDate,
        project: dragCreate.row.project,
        module: dragCreate.row.module,
        feature: dragCreate.row.feature,
      });
    }

    setDragCreate(null);
  }, [dragCreate, rangeStart]);

  // 빈 셀 hover 처리
  const handleCellHover = useCallback(
    (rowId: string, day: Date, x: number, y: number) => {
      if (!isEditing || dragCreate?.isActive) return;
      setHoverInfo({ rowId, date: day, x, y });
    },
    [isEditing, dragCreate?.isActive]
  );

  const handleCellLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  // + 버튼 클릭 (빠른 생성)
  const handleQuickCreate = useCallback(
    (rowId: string, day: Date, row: DraftRow) => {
      const endDate = new Date(day);
      endDate.setDate(endDate.getDate() + 6); // 기본 1주일

      setShowCreateModal({
        rowId,
        startDate: day,
        endDate,
        project: row.project,
        module: row.module,
        feature: row.feature,
      });
    },
    []
  );

  // 생성 모달 완료
  const handleCreatePlan = useCallback(
    (data: { title: string; stage: string; status: PlanStatus }) => {
      if (!showCreateModal) return;

      // Row가 없으면 추가
      addRow(
        showCreateModal.project,
        showCreateModal.module,
        showCreateModal.feature
      );

      // Bar 추가
      addBar({
        rowId: showCreateModal.rowId,
        title: data.title,
        stage: data.stage,
        status: data.status,
        startDate: formatDate(showCreateModal.startDate),
        endDate: formatDate(showCreateModal.endDate),
      });

      setShowCreateModal(null);
    },
    [showCreateModal, addRow, addBar]
  );

  // 오늘 위치로 스크롤
  useEffect(() => {
    if (!containerRef.current) return;

    const today = new Date();
    const daysDiff = Math.floor(
      (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysDiff >= 0 && daysDiff < days.length) {
      containerRef.current.scrollLeft = daysDiff * DAY_WIDTH - 200;
    }
  }, [rangeStart, days.length]);

  // 드래그 프리뷰 계산
  const dragPreview = useMemo(() => {
    if (!dragCreate?.isActive) return null;

    const startX = Math.min(dragCreate.startX, dragCreate.currentX);
    const width = Math.abs(dragCreate.currentX - dragCreate.startX);

    return { left: startX, width };
  }, [dragCreate]);

  // 각 row의 y 위치 계산
  const rowPositions = useMemo(() => {
    const positions: Array<{ rowId: string; top: number; height: number }> = [];
    let currentTop = 0;

    for (const row of renderRows) {
      const height = Math.max(1, row.laneCount) * LANE_HEIGHT;
      positions.push({ rowId: row.rowId, top: currentTop, height });
      currentTop += height;
    }

    return positions;
  }, [renderRows]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 헤더 영역 */}
      <div
        className="flex-shrink-0 border-b"
        style={{
          height: HEADER_HEIGHT,
          borderColor: "var(--notion-border)",
        }}
      >
        <div
          className="relative overflow-hidden"
          style={{ width: "100%", height: "100%" }}
        >
          {/* 월 헤더 */}
          <div
            className="absolute top-0 left-0 flex"
            style={{ height: 28 }}
          >
            {months.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center border-r text-xs font-medium"
                style={{
                  width: m.days * DAY_WIDTH,
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                  background: "var(--notion-bg-secondary)",
                }}
              >
                {m.month}
              </div>
            ))}
          </div>

          {/* 일 헤더 */}
          <div
            className="absolute left-0 flex"
            style={{ top: 28, height: 32 }}
          >
            {days.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isMonday = day.getDay() === 1;

              return (
                <div
                  key={idx}
                  className={`flex flex-col items-center justify-center text-xs border-r ${
                    isMonday ? "border-l" : ""
                  }`}
                  style={{
                    width: DAY_WIDTH,
                    borderColor: "var(--notion-border)",
                    background: isToday
                      ? "rgba(59, 130, 246, 0.1)"
                      : isWeekend
                      ? "var(--notion-bg-tertiary)"
                      : "var(--notion-bg-secondary)",
                    color: isToday
                      ? "#3b82f6"
                      : isWeekend
                      ? "var(--notion-text-muted)"
                      : "var(--notion-text)",
                  }}
                >
                  <span className="font-medium">{day.getDate()}</span>
                  <span className="text-[10px] opacity-60">
                    {["일", "월", "화", "수", "목", "금", "토"][day.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 그리드 영역 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto relative"
        style={{ background: "var(--notion-bg)" }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          handleCellLeave();
        }}
      >
        <div
          className="relative"
          style={{ width: totalWidth, height: totalHeight }}
        >
          {/* 그리드 라인 */}
          <div className="absolute inset-0 pointer-events-none">
            {/* 수직선 (일별) */}
            {days.map((day, idx) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isMonday = day.getDay() === 1;

              return (
                <div
                  key={idx}
                  className="absolute top-0 h-full"
                  style={{
                    left: idx * DAY_WIDTH,
                    width: DAY_WIDTH,
                    background: isWeekend
                      ? "rgba(0,0,0,0.02)"
                      : "transparent",
                    borderRight: `1px solid var(--notion-border)`,
                    borderLeft: isMonday
                      ? "2px solid var(--notion-border)"
                      : "none",
                  }}
                />
              );
            })}

            {/* 수평선 (row별) */}
            {rowPositions.map(({ rowId, top, height }) => (
              <div
                key={rowId}
                className="absolute left-0 w-full border-b"
                style={{
                  top: top + height,
                  borderColor: "var(--notion-border)",
                }}
              />
            ))}

            {/* 오늘 표시선 */}
            {(() => {
              const today = new Date();
              const daysDiff = Math.floor(
                (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff >= 0 && daysDiff < days.length) {
                return (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-blue-500 z-10"
                    style={{ left: daysDiff * DAY_WIDTH + DAY_WIDTH / 2 }}
                  />
                );
              }
              return null;
            })()}
          </div>

          {/* Row 영역 (클릭 가능) */}
          {renderRows.map((row) => {
            const pos = rowPositions.find((p) => p.rowId === row.rowId);
            if (!pos) return null;

            return (
              <div
                key={row.rowId}
                className="absolute left-0"
                style={{
                  top: pos.top,
                  height: pos.height,
                  width: totalWidth,
                }}
                onMouseDown={(e) => handleMouseDown(e, row.rowId, row)}
              >
                {/* Bars */}
                {row.bars.map((bar) => {
                  const barStart = new Date(bar.startDate);
                  const barEnd = new Date(bar.endDate);
                  const startOffset = Math.floor(
                    (barStart.getTime() - rangeStart.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const endOffset = Math.floor(
                    (barEnd.getTime() - rangeStart.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );

                  const left = startOffset * DAY_WIDTH;
                  const width = (endOffset - startOffset + 1) * DAY_WIDTH;

                  return (
                    <DraftBar
                      key={bar.clientUid}
                      bar={bar}
                      left={left}
                      width={width}
                      lane={bar.lane}
                      isSelected={bar.clientUid === selectedBarId}
                      isEditing={isEditing}
                      onSelect={() => selectBar(bar.clientUid)}
                      dayWidth={DAY_WIDTH}
                      rangeStart={rangeStart}
                    />
                  );
                })}

                {/* 드래그 프리뷰 */}
                {dragCreate?.rowId === row.rowId && dragPreview && (
                  <div
                    className="absolute rounded pointer-events-none"
                    style={{
                      left: dragPreview.left,
                      top: 2,
                      width: dragPreview.width,
                      height: LANE_HEIGHT - 4,
                      background: "rgba(59, 130, 246, 0.3)",
                      border: "2px dashed #3b82f6",
                    }}
                  />
                )}
              </div>
            );
          })}

          {/* Hover + 버튼 */}
          {hoverInfo && isEditing && (
            <button
              className="absolute z-20 flex items-center justify-center w-6 h-6 rounded-full shadow-md transition-transform hover:scale-110"
              style={{
                left: hoverInfo.x - 12,
                top: hoverInfo.y - 12,
                background: "#3b82f6",
                color: "white",
              }}
              onClick={() => {
                const row = rows.find((r) => r.rowId === hoverInfo.rowId);
                if (row) {
                  handleQuickCreate(hoverInfo.rowId, hoverInfo.date, row);
                }
              }}
            >
              <PlusIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 생성 모달 */}
      {showCreateModal && (
        <CreatePlanModal
          isOpen={true}
          onClose={() => setShowCreateModal(null)}
          onCreate={handleCreatePlan}
          defaultValues={{
            project: showCreateModal.project,
            module: showCreateModal.module,
            feature: showCreateModal.feature,
            startDate: formatDate(showCreateModal.startDate),
            endDate: formatDate(showCreateModal.endDate),
          }}
        />
      )}
    </div>
  );
}

export { DAY_WIDTH, ROW_HEIGHT, LANE_HEIGHT };

