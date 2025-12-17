/**
 * Draft Timeline (우측)
 * - 날짜 헤더 (sticky)
 * - Row별 Bar 렌더링
 * - Drag to create / move / resize
 */

"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { useDraftStore } from "./store";
import {
  buildFlatTree,
  calculateNodePositions,
  formatDate,
  xToDate,
  parseLocalDate,
  getNodeDateRange,
  LANE_HEIGHT,
  ROW_HEIGHT,
} from "./laneLayout";
import { DraftBar } from "./DraftBar";
import { CreatePlanModal, WorkspaceMemberOption } from "./CreatePlanModal";
import { EditPlanModal } from "./EditPlanModal";
import { PlusIcon } from "@/components/common/Icons";
import type {
  DraftRow,
  DraftBar as DraftBarType,
  PlanStatus,
  DraftAssignee,
} from "./types";

const DAY_WIDTH = 40;
const HEADER_HEIGHT = 76; // 38px + 38px (월 + 일, TreePanel 헤더와 동일)

interface DraftTimelineProps {
  rangeStart: Date;
  rangeEnd: Date;
  isEditing: boolean;
  isAdmin?: boolean;
  members?: WorkspaceMemberOption[];
  /** 드래그 중 기간 정보 콜백 (FloatingDock 표시용) */
  onDragDateChange?: (
    info: { startDate: string; endDate: string } | null
  ) => void;
  /** 액션 발생 시 락 연장 (남은 시간이 절반 이하일 때) */
  onAction?: () => void;
}

interface DragCreateState {
  rowId: string;
  startDate: Date;
  endDate: Date;
  project: string;
  module: string;
  feature: string;
}

export function DraftTimeline({
  rangeStart,
  rangeEnd,
  isEditing,
  isAdmin = false,
  members = [],
  onDragDateChange,
  onAction,
}: DraftTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  // 호버 정보 - 개별 레인에 스냅
  const [hoverInfo, setHoverInfo] = useState<{
    rowId: string;
    date: Date;
    x: number; // 스냅된 x 좌표
    laneIndex: number; // 개별 레인 인덱스
    nodeTop: number; // 노드 상단 y 좌표
    nodeHeight: number; // 노드 전체 높이
  } | null>(null);

  // 드래그 생성 상태
  const [dragCreate, setDragCreate] = useState<{
    isActive: boolean; // 드래그 모드 활성화 여부
    isDragging: boolean; // threshold 초과 후 실제 드래그 중
    startX: number;
    currentX: number;
    rowId: string;
    row: DraftRow;
    laneIndex: number; // merge된 레인의 인덱스
  } | null>(null);

  const [showCreateModal, setShowCreateModal] =
    useState<DragCreateState | null>(null);
  const [showEditModal, setShowEditModal] = useState<DraftBarType | null>(null);

  const allRows = useDraftStore((s) => s.rows);
  const allBars = useDraftStore((s) => s.bars);
  const searchQuery = useDraftStore((s) => s.ui.searchQuery);
  const filters = useDraftStore((s) => s.ui.filters);
  const expandedNodesArray = useDraftStore((s) => s.ui.expandedNodes);
  const addBar = useDraftStore((s) => s.addBar);
  const addRow = useDraftStore((s) => s.addRow);
  const selectedBarId = useDraftStore((s) => s.ui.selectedBarId);
  const selectBar = useDraftStore((s) => s.selectBar);
  const deleteBar = useDraftStore((s) => s.deleteBar);
  const updateBar = useDraftStore((s) => s.updateBar);

  // Set으로 변환 (빠른 조회용)
  const expandedNodes = useMemo(
    () => new Set(expandedNodesArray),
    [expandedNodesArray]
  );

  // 활성 bars (삭제되지 않은 것들)
  const activeBars = useMemo(() => {
    return allBars.filter((b) => !b.deleted);
  }, [allBars]);

  // 필터링된 rows (useMemo로 캐싱)
  const rows = useMemo(() => {
    return allRows.filter((row) => {
      // 로컬에서 생성된 row는 bars 없이도 표시
      // 서버에서 로드된 row는 bars가 있어야 표시
      if (!row.isLocal) {
        const hasBars = activeBars.some((b) => b.rowId === row.rowId);
        if (!hasBars) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          row.project.toLowerCase().includes(q) ||
          row.module.toLowerCase().includes(q) ||
          row.feature.toLowerCase().includes(q);
        if (!match) return false;
      }
      if (
        filters.projects.length > 0 &&
        !filters.projects.includes(row.project)
      ) {
        return false;
      }
      if (filters.modules.length > 0 && !filters.modules.includes(row.module)) {
        return false;
      }

      if (
        filters.features.length > 0 &&
        !filters.features.includes(row.feature)
      ) {
        return false;
      }

      return true;
    });
  }, [allRows, activeBars, searchQuery, filters]);

  // 날짜 배열 생성 (rangeStart ~ rangeEnd)
  const days = useMemo(() => {
    const result: Date[] = [];
    const current = new Date(rangeStart);
    while (current <= rangeEnd) {
      result.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return result;
  }, [rangeStart, rangeEnd]);

  // 월 구분선 (첫 번째 날 기준)
  const months = useMemo(() => {
    const result: { month: string; days: number }[] = [];
    let currentMonth = "";
    let currentDays = 0;

    for (const day of days) {
      const monthStr = `${day.getFullYear()}년 ${day.getMonth() + 1}월`;
      if (monthStr !== currentMonth) {
        if (currentMonth) {
          result.push({ month: currentMonth, days: currentDays });
        }
        currentMonth = monthStr;
        currentDays = 1;
      } else {
        currentDays++;
      }
    }
    if (currentMonth) {
      result.push({ month: currentMonth, days: currentDays });
    }
    return result;
  }, [days]);

  const totalWidth = days.length * DAY_WIDTH;

  // 트리 구조 기반 노드 리스트 (좌측 트리와 동기화)
  const flatNodes = useMemo(() => {
    const nodes = buildFlatTree(rows, activeBars, expandedNodes);

    // 기능 필터: feature 노드만 반환
    if (filters.features.length > 0) {
      return nodes.filter((node) => node.type === "feature");
    }
    // 모듈 필터: module, feature 노드만 반환 (project 제외)
    if (filters.modules.length > 0) {
      return nodes.filter(
        (node) => node.type === "module" || node.type === "feature"
      );
    }
    return nodes;
  }, [rows, activeBars, expandedNodes, filters.features, filters.modules]);

  // 노드별 위치 계산
  const nodePositions = useMemo(
    () => calculateNodePositions(flatNodes),
    [flatNodes]
  );

  // 총 높이 계산
  const totalHeight = useMemo(() => {
    if (nodePositions.length === 0) return 0;
    const last = nodePositions[nodePositions.length - 1];
    return last.top + last.height;
  }, [nodePositions]);

  // 헤더 스크롤 동기화
  const handleScroll = useCallback(() => {
    if (containerRef.current && headerRef.current) {
      headerRef.current.scrollLeft = containerRef.current.scrollLeft;
    }
  }, []);

  // 오늘로 스크롤하는 함수
  const scrollToToday = useCallback(
    (smooth = true) => {
      if (!containerRef.current) return;

      const today = new Date();
      const daysDiff = Math.floor(
        (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = days.length;

      // 오늘이 범위 내에 있으면 스크롤
      if (daysDiff >= 0 && daysDiff < totalDays) {
        const scrollX =
          daysDiff * DAY_WIDTH -
          containerRef.current.clientWidth / 2 +
          DAY_WIDTH / 2;
        containerRef.current.scrollTo({
          left: Math.max(0, scrollX),
          behavior: smooth ? "smooth" : "instant",
        });
      }
    },
    [rangeStart, days.length]
  );

  // 초기 로드 시 오늘로 스크롤
  useEffect(() => {
    // 약간의 지연 후 스크롤 (레이아웃 완료 후)
    const timer = setTimeout(() => {
      scrollToToday(false); // 초기에는 부드러운 애니메이션 없이
    }, 100);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 오늘로 이동 이벤트 핸들러
  useEffect(() => {
    const handleScrollToToday = () => {
      scrollToToday(true);
    };

    window.addEventListener("gantt:scroll-to-today", handleScrollToToday);
    return () =>
      window.removeEventListener("gantt:scroll-to-today", handleScrollToToday);
  }, [scrollToToday]);

  // 드래그 상태를 ref로 관리 (성능 최적화 - 렌더링 최소화)
  const dragCreateRef = useRef(dragCreate);
  dragCreateRef.current = dragCreate;

  // Drag create 핸들링 - 일 단위로 스냅
  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      rowId: string,
      row: DraftRow,
      laneIndex: number = 0
    ) => {
      // 편집 모드가 아니면 무시
      if (!isEditing) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX =
        e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
      // 일 단위로 스냅 (클릭한 셀의 시작점)
      const snappedX = Math.floor(rawX / DAY_WIDTH) * DAY_WIDTH;

      // 호버 프리뷰 숨기기
      setHoverInfo(null);

      // 액션 발생 - 락 연장 트리거
      onAction?.();

      // mouse down 시 바로 프리뷰 표시 (파란색 블록)
      setDragCreate({
        isActive: true,
        isDragging: false,
        startX: snappedX,
        currentX: snappedX,
        rowId,
        row,
        laneIndex,
      });
    },
    [isEditing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const current = dragCreateRef.current;
      if (!current?.isActive) return;

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const rawX =
        e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
      // 일 단위로 스냅 (드래그 중에도 셀 경계에 맞춤)
      const snappedX = Math.floor(rawX / DAY_WIDTH) * DAY_WIDTH;

      // 같은 위치면 업데이트 안함 (성능 최적화)
      if (snappedX === current.currentX) return;

      const distance = Math.abs(snappedX - current.startX);
      const shouldDrag = distance >= DAY_WIDTH; // 1일 이상 이동 시 드래그

      setDragCreate((prev) =>
        prev
          ? {
              ...prev,
              currentX: snappedX,
              isDragging: shouldDrag || prev.isDragging,
            }
          : null
      );
    },
    [] // 의존성 제거 - ref 사용으로 최신 상태 참조
  );

  const handleMouseUp = useCallback(() => {
    if (!dragCreate?.isActive) return;

    const startX = Math.min(dragCreate.startX, dragCreate.currentX);
    const endX = Math.max(dragCreate.startX, dragCreate.currentX);

    // 드래그 모드인 경우: 범위 선택
    if (dragCreate.isDragging) {
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
    } else {
      // 클릭인 경우: 1일짜리 기간 즉시 생성
      const clickDate = xToDate(dragCreate.startX, rangeStart, DAY_WIDTH);

      setShowCreateModal({
        rowId: dragCreate.rowId,
        startDate: clickDate,
        endDate: clickDate, // 같은 날짜 = 1일
        project: dragCreate.row.project,
        module: dragCreate.row.module,
        feature: dragCreate.row.feature,
      });
    }

    setDragCreate(null);
  }, [dragCreate, rangeStart]);

  const handleCellLeave = useCallback(() => {
    setHoverInfo(null);
  }, []);

  // 생성 모달 완료
  const handleCreatePlan = useCallback(
    (data: {
      title: string;
      stage: string;
      status: PlanStatus;
      assignees: DraftAssignee[];
    }) => {
      if (!showCreateModal) return;

      addBar({
        rowId: showCreateModal.rowId,
        title: data.title,
        stage: data.stage,
        status: data.status,
        startDate: formatDate(showCreateModal.startDate),
        endDate: formatDate(showCreateModal.endDate),
        assignees: data.assignees,
      });

      setShowCreateModal(null);
    },
    [showCreateModal, addBar]
  );

  // 드래그 프리뷰 계산 - isActive이면 표시 (마우스 다운 즉시)
  const dragPreview = useMemo(() => {
    if (!dragCreate?.isActive) return null;

    const startX = Math.min(dragCreate.startX, dragCreate.currentX);
    const endX = Math.max(dragCreate.startX, dragCreate.currentX);
    // 너비는 끝점 + 1일 너비 (포함)
    const width = endX - startX + DAY_WIDTH;

    return { left: startX, width };
  }, [dragCreate]);

  // 전역 키보드 이벤트 (Delete/Backspace)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isEditing || !selectedBarId) return;

      // 입력 필드에서는 무시
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteBar(selectedBarId);
        selectBar(undefined);
      } else if (e.key === "Escape") {
        selectBar(undefined);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isEditing, selectedBarId, deleteBar, selectBar]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 헤더 영역 (가로 스크롤 동기화) - Airbnb 스타일 */}
      <div
        ref={headerRef}
        className="flex-shrink-0 overflow-hidden"
        style={{
          height: HEADER_HEIGHT,
          background: "linear-gradient(180deg, #f8f9fa 0%, #f3f4f6 100%)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="relative" style={{ width: totalWidth, height: "100%" }}>
          {/* 월 헤더 - Airbnb 스타일 */}
          <div
            className="absolute top-0 left-0 flex"
            style={{
              height: 38,
              borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            {months.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-center text-xs font-semibold tracking-wide"
                style={{
                  width: m.days * DAY_WIDTH,
                  borderRight: "1px solid rgba(0, 0, 0, 0.06)",
                  color: "#374151",
                  background: "transparent",
                }}
              >
                {m.month}
              </div>
            ))}
          </div>

          {/* 일 헤더 - Airbnb 스타일 */}
          <div className="absolute left-0 flex" style={{ top: 38, height: 38 }}>
            {days.map((day, idx) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isMonday = day.getDay() === 1;

              return (
                <div
                  key={idx}
                  className="flex flex-col items-center justify-center text-xs transition-colors duration-100"
                  style={{
                    width: DAY_WIDTH,
                    borderRight: "1px solid rgba(0, 0, 0, 0.04)",
                    borderLeft: isMonday
                      ? "2px solid rgba(0, 0, 0, 0.08)"
                      : "none",
                    background: isToday
                      ? "linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.08) 100%)"
                      : isWeekend
                      ? "rgba(0, 0, 0, 0.02)"
                      : "transparent",
                    color: isToday
                      ? "#2563eb"
                      : isWeekend
                      ? "#9ca3af"
                      : "#6b7280",
                  }}
                >
                  <span
                    className={`font-semibold ${
                      isToday ? "text-blue-600" : ""
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <span className="text-[9px] font-medium opacity-70">
                    {["일", "월", "화", "수", "목", "금", "토"][day.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 그리드 영역 - Airbnb 스타일 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
          minHeight: 0,
        }}
        onScroll={handleScroll}
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
          {/* 그리드 라인 - Airbnb 스타일 */}
          <div className="absolute inset-0 pointer-events-none">
            {/* 수직선 (일별) */}
            {days.map((day, idx) => {
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const isMonday = day.getDay() === 1;

              return (
                <div
                  key={idx}
                  className="absolute top-0 h-full transition-colors duration-100"
                  style={{
                    left: idx * DAY_WIDTH,
                    width: DAY_WIDTH,
                    background: isWeekend
                      ? "rgba(0, 0, 0, 0.015)"
                      : "transparent",
                    borderRight: "1px solid rgba(0, 0, 0, 0.04)",
                    borderLeft: isMonday
                      ? "2px solid rgba(0, 0, 0, 0.08)"
                      : "none",
                  }}
                />
              );
            })}

            {/* 수평선 (노드별) */}
            {nodePositions.map(({ node, top, height }) => (
              <div
                key={node.id}
                className="absolute left-0 w-full"
                style={{
                  top: top + height,
                  borderBottom: "1px solid rgba(0, 0, 0, 0.04)",
                }}
              />
            ))}

            {/* 오늘 표시선 - Airbnb 스타일 */}
            {(() => {
              const today = new Date();
              const daysDiff = Math.floor(
                (today.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
              );
              if (daysDiff >= 0 && daysDiff < days.length) {
                return (
                  <div
                    className="absolute top-0 h-full z-10"
                    style={{
                      left: daysDiff * DAY_WIDTH + DAY_WIDTH / 2 - 1,
                      width: 2,
                      background:
                        "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
                      boxShadow: "0 0 8px rgba(59, 130, 246, 0.4)",
                    }}
                  />
                );
              }
              return null;
            })()}
          </div>

          {/* 노드 영역 (클릭 가능) - Airbnb 스타일 */}
          {nodePositions.map(({ node, top, height }) => {
            // feature 노드만 bar 렌더링
            if (node.type !== "feature" || !node.row) {
              // 기능 필터가 적용된 경우: 프로젝트/모듈 행 숨김
              // 모듈 필터가 적용된 경우: 프로젝트 행 숨김
              const hasFeatureFilter = filters.features.length > 0;
              const hasModuleFilter = filters.modules.length > 0;
              
              if (hasFeatureFilter) return null;
              if (hasModuleFilter && node.type === "project") return null;

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

              return (
                <div
                  key={node.id}
                  className="absolute left-0"
                  style={{
                    top,
                    height,
                    width: totalWidth,
                    background:
                      node.type === "project"
                        ? "linear-gradient(90deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%)"
                        : node.type === "module"
                        ? "linear-gradient(90deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.01) 100%)"
                        : "transparent",
                  }}
                >
                  {/* 하위 feature들의 기간 범위 표시 - Airbnb 스타일 */}
                  {dateRange && (
                    <div
                      className="absolute rounded-lg transition-all duration-200"
                      style={{
                        left: rangeBarLeft,
                        width: rangeBarWidth,
                        top: 6,
                        height: height - 12,
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

            const row = node.row;
            const nodeBars = node.bars || [];

            return (
              <div
                key={node.id}
                className="absolute left-0 cursor-crosshair transition-colors duration-100"
                style={{
                  top,
                  height,
                  width: totalWidth,
                }}
                onMouseDown={(e) => {
                  // 클릭 위치에서 laneIndex 계산 (merge된 레인 지원)
                  const rect = e.currentTarget.getBoundingClientRect();
                  const relativeY = e.clientY - rect.top;
                  const laneIndex = Math.floor(relativeY / LANE_HEIGHT);
                  handleMouseDown(e, row.rowId, row, laneIndex);
                }}
                onMouseMove={(e) => {
                  if (isEditing && !dragCreate?.isActive) {
                    const rect = containerRef.current?.getBoundingClientRect();
                    const nodeRect = e.currentTarget.getBoundingClientRect();
                    if (rect) {
                      const x =
                        e.clientX -
                        rect.left +
                        (containerRef.current?.scrollLeft || 0);
                      // 일 단위로 스냅
                      const snappedX = Math.floor(x / DAY_WIDTH) * DAY_WIDTH;
                      const dayIndex = Math.floor(x / DAY_WIDTH);

                      // 개별 레인 인덱스 계산
                      const relativeY = e.clientY - nodeRect.top;
                      const laneIndex = Math.floor(relativeY / LANE_HEIGHT);

                      // 스냅된 위치가 변경된 경우에만 상태 업데이트 (성능 최적화)
                      if (dayIndex >= 0 && dayIndex < days.length) {
                        setHoverInfo((prev) => {
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
              >
                {/* Bars */}
                {nodeBars.map((bar) => {
                  const barStart = parseLocalDate(bar.startDate);
                  const barEnd = parseLocalDate(bar.endDate);

                  // rangeStart도 자정으로 정규화하여 비교
                  const rangeStartMidnight = new Date(
                    rangeStart.getFullYear(),
                    rangeStart.getMonth(),
                    rangeStart.getDate()
                  );

                  const startOffset = Math.round(
                    (barStart.getTime() - rangeStartMidnight.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const endOffset = Math.round(
                    (barEnd.getTime() - rangeStartMidnight.getTime()) /
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
                      onDoubleClick={() => setShowEditModal(bar)}
                      dayWidth={DAY_WIDTH}
                      rangeStart={rangeStart}
                      onDragDateChange={onDragDateChange}
                      onClearHover={() => setHoverInfo(null)}
                    />
                  );
                })}

                {/* 드래그 프리뷰 - Airbnb 스타일, 개별 레인 지원 */}
                {dragCreate?.rowId === row.rowId && dragPreview && (
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
                )}
              </div>
            );
          })}

          {/* 호버 시 기간 프리뷰 블록 - 개별 레인에 스냅, 연한 회색 */}
          {isEditing && !dragCreate?.isActive && hoverInfo && (
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
          members={members}
        />
      )}

      {/* 수정 모달 */}
      {showEditModal && (
        <EditPlanModal
          isOpen={true}
          onClose={() => setShowEditModal(null)}
          onSave={(data) => {
            updateBar(showEditModal.clientUid, {
              title: data.title,
              stage: data.stage,
              status: data.status,
              assignees: data.assignees,
            });
            setShowEditModal(null);
          }}
          onDelete={() => {
            deleteBar(showEditModal.clientUid);
            setShowEditModal(null);
          }}
          bar={showEditModal}
          members={members}
        />
      )}
    </div>
  );
}

export { DAY_WIDTH, ROW_HEIGHT, LANE_HEIGHT };
