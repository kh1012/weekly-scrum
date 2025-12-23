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
  PlanLink,
  DraftFlag,
} from "./types";
import { FlagLane, FLAG_LANE_HEIGHT } from "./FlagLane";
import { packFlagsIntoLanes } from "./flagLayout";
import { CreateFlagModal } from "./CreateFlagModal";
import { EditFlagModal } from "./EditFlagModal";
import { PlanViewPopover } from "./PlanViewPopover";

const DAY_WIDTH = 40;
const HEADER_HEIGHT = 76; // 38px + 38px (월 + 일, TreePanel 헤더와 동일)

interface DraftTimelineProps {
  rangeStart: Date;
  rangeEnd: Date;
  isEditing: boolean;
  isAdmin?: boolean;
  readOnly?: boolean;
  members?: WorkspaceMemberOption[];
  workspaceId?: string;
  /** 드래그 중 기간 정보 콜백 (FloatingDock 표시용) */
  onDragDateChange?: (
    info: { startDate: string; endDate: string } | null
  ) => void;
  /** 액션 발생 시 락 연장 (남은 시간이 절반 이하일 때) */
  onAction?: () => void;
  /** 외부 스크롤 동기화용 (TreePanel에서 전달) */
  scrollTop?: number;
  onScrollChange?: (scrollTop: number) => void;
  /** 가로 스크롤바 높이 변경 콜백 (TreePanel 하단 정렬용) */
  onScrollbarHeightChange?: (height: number) => void;
}

interface DragCreateState {
  rowId: string;
  startDate: Date;
  endDate: Date;
  project: string;
  module: string;
  feature: string;
  laneIndex: number; // 드래그 시작한 레인 인덱스
}

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
}: DraftTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const flagLaneRef = useRef<HTMLDivElement>(null);

  // Flag 모달 상태
  const [showCreateFlagModal, setShowCreateFlagModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<DraftFlag | null>(null);

  // Flag 스크롤 동기화를 위한 scrollLeft 상태
  const [headerScrollLeft, setHeaderScrollLeft] = useState(0);
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
  
  // readOnly 모드에서 Plan 보기 팝오버 상태
  const [viewPopover, setViewPopover] = useState<{
    bar: DraftBarType;
    position: { x: number; y: number };
  } | null>(null);

  // 휠 클릭 스크롤 상태
  const [middleClickScroll, setMiddleClickScroll] = useState<{
    isActive: boolean;
    startX: number;
    startY: number;
    scrollLeft: number;
    scrollTop: number;
  } | null>(null);

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
  const moveBarToRow = useDraftStore((s) => s.moveBarToRow);

  // Flag 관련
  const flags = useDraftStore((s) => s.flags);
  const selectedFlagId = useDraftStore((s) => s.selectedFlagId);
  const selectFlag = useDraftStore((s) => s.selectFlag);
  const deleteFlagAction = useDraftStore((s) => s.deleteFlag);
  const fetchFlags = useDraftStore((s) => s.fetchFlags);
  const clearPendingFlag = useDraftStore((s) => s.clearPendingFlag);

  // Flag Lane 높이 계산 (FlagLane과 동기화)
  const { laneCount: flagLaneCount, items: flagItems } = useMemo(
    () =>
      packFlagsIntoLanes({
        flags,
        rangeStart,
        rangeEnd,
        dayWidth: DAY_WIDTH,
      }),
    [flags, rangeStart, rangeEnd]
  );
  const flagLaneHeight = Math.max(1, flagLaneCount) * FLAG_LANE_HEIGHT;

  // 기간 강조 표시
  const highlightDateRange = useDraftStore((s) => s.ui.highlightDateRange);
  const setHighlightDateRange = useDraftStore((s) => s.setHighlightDateRange);

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

  // 초기 flags 로드
  useEffect(() => {
    if (workspaceId) {
      fetchFlags(workspaceId);
    }
  }, [workspaceId, fetchFlags]);

  // 헤더 스크롤 동기화 (FlagLane 포함)
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const scrollTop = containerRef.current.scrollTop;
      
      // 가로 스크롤 동기화
      if (headerRef.current) {
        headerRef.current.scrollLeft = scrollLeft;
      }
      if (flagLaneRef.current) {
        flagLaneRef.current.scrollLeft = scrollLeft;
      }
      setHeaderScrollLeft(scrollLeft);
      
      // 세로 스크롤 동기화 (TreePanel과)
      onScrollChange?.(scrollTop);
    }
  }, [onScrollChange]);

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

  // 외부 scrollTop 동기화 (TreePanel에서 전달)
  useEffect(() => {
    if (externalScrollTop !== undefined && containerRef.current) {
      if (containerRef.current.scrollTop !== externalScrollTop) {
        containerRef.current.scrollTop = externalScrollTop;
      }
    }
  }, [externalScrollTop]);

  // 가로 스크롤바 높이 감지 및 전달
  useEffect(() => {
    const checkScrollbarHeight = () => {
      if (containerRef.current && onScrollbarHeightChange) {
        const hasHorizontalScrollbar =
          containerRef.current.scrollWidth > containerRef.current.clientWidth;
        const scrollbarHeight = hasHorizontalScrollbar
          ? containerRef.current.offsetHeight - containerRef.current.clientHeight
          : 0;
        onScrollbarHeightChange(scrollbarHeight);
      }
    };

    // 초기 체크
    checkScrollbarHeight();

    // 리사이즈 시 재체크
    const resizeObserver = new ResizeObserver(checkScrollbarHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [onScrollbarHeightChange]);

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

  // Epic으로 스크롤하는 함수 (날짜 범위 중앙으로 수평 스크롤)
  const scrollToDateRange = useCallback(
    (startDateStr: string, endDateStr: string, smooth = true) => {
      if (!containerRef.current) return;

      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);

      // 시작일과 종료일의 중간 날짜 계산
      const midTime = (startDate.getTime() + endDate.getTime()) / 2;
      const midDate = new Date(midTime);

      // rangeStart 기준으로 일수 차이 계산
      const daysDiff = Math.floor(
        (midDate.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      const totalDays = days.length;

      // 범위 내에 있으면 스크롤
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

  // Epic 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScrollToEpic = (e: CustomEvent<{ rowId: string; startDate: string; endDate: string }>) => {
      const { startDate, endDate } = e.detail;
      scrollToDateRange(startDate, endDate, true);
    };

    window.addEventListener("gantt:scroll-to-epic", handleScrollToEpic as EventListener);
    return () =>
      window.removeEventListener("gantt:scroll-to-epic", handleScrollToEpic as EventListener);
  }, [scrollToDateRange]);

  // Flag 스크롤 이벤트 핸들러
  useEffect(() => {
    const handleScrollToFlag = (e: CustomEvent<{ flagId: string; startDate: string; endDate: string }>) => {
      const { startDate, endDate } = e.detail;
      scrollToDateRange(startDate, endDate, true);
    };

    window.addEventListener("gantt:scroll-to-flag", handleScrollToFlag as EventListener);
    return () =>
      window.removeEventListener("gantt:scroll-to-flag", handleScrollToFlag as EventListener);
  }, [scrollToDateRange]);

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
      // 좌클릭만 허용
      if (e.button !== 0) return;
      
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
    [isEditing, onAction]
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
    // 휠 클릭 스크롤 종료
    if (middleClickScroll?.isActive) {
      setMiddleClickScroll(null);
      return;
    }

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
        laneIndex: dragCreate.laneIndex,
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
        laneIndex: dragCreate.laneIndex,
      });
    }

    setDragCreate(null);
  }, [dragCreate, rangeStart, middleClickScroll]);

  // 휠 클릭 스크롤 시작
  const handleMiddleClickStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 1 || !containerRef.current) return; // 휠 클릭(middle button)이 아니면 종료
    
    e.preventDefault();
    
    // 호버 프리뷰 숨기기
    setHoverInfo(null);
    
    setMiddleClickScroll({
      isActive: true,
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: containerRef.current.scrollLeft,
      scrollTop: containerRef.current.scrollTop,
    });
  }, []);

  // 휠 클릭 스크롤 이동
  const handleMiddleClickMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!middleClickScroll?.isActive || !containerRef.current) return;

    const deltaX = middleClickScroll.startX - e.clientX;
    const deltaY = middleClickScroll.startY - e.clientY;

    containerRef.current.scrollLeft = middleClickScroll.scrollLeft + deltaX;
    containerRef.current.scrollTop = middleClickScroll.scrollTop + deltaY;
  }, [middleClickScroll]);

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
      description?: string;
      links?: PlanLink[];
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
        description: data.description,
        links: data.links,
        preferredLane: showCreateModal.laneIndex,
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
      if (!isEditing) return;

      // 입력 필드에서는 무시
      if (
        (e.target as HTMLElement).tagName === "INPUT" ||
        (e.target as HTMLElement).tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        // Flag 선택 시 flag 삭제
        if (selectedFlagId) {
          deleteFlagAction(selectedFlagId);
          selectFlag(null);
          setHighlightDateRange(null); // 기간 강조도 함께 해제
        }
        // Bar 선택 시 bar 삭제
        else if (selectedBarId) {
          deleteBar(selectedBarId);
          selectBar(undefined);
        }
      } else if (e.key === "Escape") {
        selectBar(undefined);
        selectFlag(null);
        clearPendingFlag();
        setHighlightDateRange(null); // 기간 강조 해제
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isEditing,
    selectedBarId,
    selectedFlagId,
    deleteBar,
    selectBar,
    deleteFlagAction,
    selectFlag,
    clearPendingFlag,
    setHighlightDateRange,
  ]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* 헤더 영역 (가로 스크롤 동기화) - Airbnb 스타일 */}
      <div
        ref={headerRef}
        className="flex-shrink-0 overflow-hidden"
        style={{
          height: HEADER_HEIGHT,
          background: "linear-gradient(180deg, #f8f9fa 0%, #f3f4f6 100%)",
        }}
      >
        {/* 하단 border - 별도 div로 처리 */}
        <div
          className="absolute left-0 right-0 bottom-0 z-10"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
        />
        <div className="relative" style={{ width: totalWidth, height: "100%" }}>
          {/* 월 헤더 - Airbnb 스타일 */}
          <div
            className="absolute top-0 left-0 flex"
            style={{ height: 38 }}
          >
            {/* 하단 border - 별도 div로 처리 */}
            <div
              className="absolute left-0 right-0 bottom-0"
              style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
            />
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

      {/* Flag Lane - 헤더 아래 오버레이 */}
      <div
        ref={flagLaneRef}
        className="flex-shrink-0 overflow-x-auto scrollbar-hide relative"
        style={{
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
        }}
      >
        <FlagLane
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          dayWidth={DAY_WIDTH}
          totalWidth={totalWidth}
          isEditing={isEditing}
          scrollLeft={headerScrollLeft}
          onOpenCreateModal={() => setShowCreateFlagModal(true)}
          onOpenEditModal={(flag) => setEditingFlag(flag)}
        />
      </div>

      {/* 그리드 영역 - Airbnb 스타일 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto relative timeline-scrollbar"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
          minHeight: 0,
          cursor: middleClickScroll?.isActive ? "move" : undefined,
        }}
        onScroll={handleScroll}
        onMouseDown={handleMiddleClickStart}
        onMouseMove={(e) => {
          handleMiddleClickMove(e);
          handleMouseMove(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          handleMouseUp();
          handleCellLeave();
        }}
        onClick={(e) => {
          // 빈 영역 클릭 시 선택 및 강조 해제
          if (e.target === e.currentTarget) {
            selectBar(undefined);
            selectFlag(null);
            setHighlightDateRange(null);
          }
        }}
      >
        <div
          className="relative"
          style={{ width: totalWidth, height: totalHeight }}
        >
          {/* 기간 강조 표시 오버레이 */}
          {highlightDateRange &&
            (() => {
              const highlightStart = parseLocalDate(
                highlightDateRange.startDate
              );
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
              const highlightWidth =
                (clampedEndOffset - clampedStartOffset + 1) * DAY_WIDTH;
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
            })()}

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
                  // 편집 모드이고, 드래그 중이 아니고, 휠 클릭 스크롤 중이 아닐 때만 호버 프리뷰 표시
                  if (isEditing && !dragCreate?.isActive && !middleClickScroll?.isActive) {
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
                      onSelect={() => selectBar(bar.clientUid)}
                      onDoubleClick={(e?: React.MouseEvent) => {
                        // 읽기전용 모드 또는 편집 모드가 아닌 경우: 팝오버 표시
                        if (readOnly || !isEditing) {
                          const rect = (
                            e?.currentTarget as HTMLElement
                          )?.getBoundingClientRect();
                          setViewPopover({
                            bar,
                            position: {
                              x: rect
                                ? rect.left + rect.width / 2
                                : e?.clientX || 0,
                              y: rect ? rect.bottom + 8 : (e?.clientY || 0) + 8,
                            },
                          });
                        } else {
                          // 편집 모드: EditPlanModal 표시
                          setShowEditModal(bar);
                        }
                      }}
                      dayWidth={DAY_WIDTH}
                      rangeStart={rangeStart}
                      onDragDateChange={onDragDateChange}
                      onClearHover={() => setHoverInfo(null)}
                      rowTopOffset={rowTopOffset}
                      onMoveComplete={(absoluteY: number) => {
                        // 마우스 절대 Y 위치로 타겟 Row 찾기
                        // containerRef는 그리드 영역(헤더/플래그 아래)을 가리킴
                        const containerRect =
                          containerRef.current?.getBoundingClientRect();
                        if (!containerRect) return;

                        // 스크롤 보정된 상대 Y 계산
                        // containerRect.top은 이미 헤더/플래그 아래이므로 추가 오프셋 불필요
                        const currentScrollTop =
                          containerRef.current?.scrollTop || 0;
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
                            targetNode.row.domain
                          );
                        }
                      }}
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
              description: data.description,
              links: data.links,
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

      {/* Flag 생성 모달 */}
      <CreateFlagModal
        isOpen={showCreateFlagModal}
        onClose={() => setShowCreateFlagModal(false)}
        workspaceId={workspaceId}
      />

      {/* Flag 수정 모달 */}
      <EditFlagModal
        isOpen={editingFlag !== null}
        onClose={() => setEditingFlag(null)}
        flag={editingFlag}
      />

      {/* readOnly 모드: Plan 보기 팝오버 */}
      {viewPopover && (
        <PlanViewPopover
          bar={viewPopover.bar}
          anchorPosition={viewPopover.position}
          onClose={() => setViewPopover(null)}
        />
      )}
    </div>
  );
}

export { DAY_WIDTH, ROW_HEIGHT, LANE_HEIGHT };
