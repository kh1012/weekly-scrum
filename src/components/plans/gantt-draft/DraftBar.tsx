/**
 * Draft Bar 컴포넌트
 * - Airbnb 스타일 디자인
 * - 안정적인 드래그 처리 (state 기반)
 */

"use client";

import { useCallback, useRef, useState, memo, useEffect } from "react";
import { useDraftStore } from "./store";
import {
  calculateMovedDates,
  calculateResizedDates,
  parseLocalDate,
} from "./laneLayout";
import type { BarWithLane } from "./types";
import type { AssigneeRole } from "@/lib/data/plans";

const LANE_HEIGHT = 48;
const RESIZE_HANDLE_WIDTH = 12;

// 스테이지 이니셜 매핑
function getStageInitial(stage: string): string {
  if (stage.includes("기획")) return "P";
  if (stage.includes("디자인")) return "D";
  if (stage.includes("FE")) return "F";
  if (stage.includes("BE")) return "B";
  if (stage.includes("QA")) return "Q";
  return stage.charAt(0); // fallback
}

// 역할별 색상 및 라벨 (배경/텍스트 쌍)
const ROLE_CONFIG: Record<
  AssigneeRole,
  { label: string; color: string; bg: string; text: string }
> = {
  planner: {
    label: "기획",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#b45309",
  },
  designer: {
    label: "디자인",
    color: "#ec4899",
    bg: "rgba(236, 72, 153, 0.12)",
    text: "#be185d",
  },
  fe: {
    label: "FE",
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.12)",
    text: "#1d4ed8",
  },
  be: {
    label: "BE",
    color: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#047857",
  },
  qa: {
    label: "QA",
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.12)",
    text: "#6d28d9",
  },
};

// 기본 색상 (역할 없을 때)
const DEFAULT_COLOR = {
  color: "#6b7280",
  bg: "rgba(107, 114, 128, 0.08)",
  text: "#374151",
};

interface DraftBarProps {
  bar: BarWithLane;
  left: number;
  width: number;
  lane: number;
  isSelected: boolean;
  isEditing: boolean;
  readOnly?: boolean;
  onSelect: () => void;
  onDoubleClick?: (e?: React.MouseEvent) => void;
  onContextMenu?: (e: React.MouseEvent, bar: BarWithLane) => void;
  dayWidth: number;
  rangeStart: Date;
  /** 드래그 중 기간 정보 콜백 */
  onDragDateChange?: (
    info: { startDate: string; endDate: string } | null
  ) => void;
  /** Bar 위에 마우스가 올라올 때 hover preview 숨김 */
  onClearHover?: () => void;
  /** 현재 Row의 절대 Y offset (다른 Row로 이동 판단용) */
  rowTopOffset?: number;
  /** 드래그 완료 시 절대 Y 위치 콜백 (다른 Row 이동용) */
  onMoveComplete?: (absoluteY: number) => void;
  /** 같은 row의 다른 bars (겹침 감지용) */
  rowBars?: BarWithLane[];
}

type DragMode = "move" | "resize-left" | "resize-right" | null;

/**
 * 날짜 범위 포맷 (짧은 형태: Dec 1-4)
 */
function formatShortDateRange(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate);
  const end = parseLocalDate(endDate);

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const startMonth = monthNames[start.getMonth()];
  const startDay = start.getDate();
  const endDay = end.getDate();

  if (start.getMonth() === end.getMonth()) {
    return `${startMonth} ${startDay}–${endDay}`;
  }
  const endMonth = monthNames[end.getMonth()];
  return `${startMonth} ${startDay}–${endMonth} ${endDay}`;
}

export const DraftBar = memo(function DraftBar({
  bar,
  left,
  width,
  lane,
  isSelected,
  isEditing,
  readOnly = false,
  onSelect,
  onDoubleClick,
  onContextMenu,
  dayWidth,
  rangeStart,
  onDragDateChange,
  onClearHover,
  rowTopOffset,
  onMoveComplete,
  rowBars = [],
}: DraftBarProps) {
  const updateBar = useDraftStore((s) => s.updateBar);
  const deleteBar = useDraftStore((s) => s.deleteBar);

  const barRef = useRef<HTMLDivElement>(null);
  const [dragMode, setDragMode] = useState<DragMode>(null);
  const [dragOffset, setDragOffset] = useState({ left: 0, width: 0, top: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [showAlignmentPopover, setShowAlignmentPopover] = useState(false);
  const alignmentPopoverRef = useRef<HTMLDivElement>(null);

  // Snapshot 블록인지 확인
  const isSnapshot = bar.isSnapshot === true;
  const avgProgress = bar.avgProgress || 0;
  const snapshotYear = bar.year;
  const snapshotWeek = bar.week;
  const authorName = bar.authorName;
  const isMerged = bar.isMerged || false;
  const mergedWeeks = bar.mergedWeeks || [];
  
  // Alignment 상태 (Plan only)
  const alignmentStatus = bar.alignmentStatus as "green" | "orange" | "red" | null;

  // 첫 번째 담당자의 역할 기반 색상 (없으면 기본 회색)
  const primaryRole = bar.assignees?.[0]?.role;
  const roleColor = primaryRole ? ROLE_CONFIG[primaryRole] : null;

  // Snapshot은 하얀색 배경에 검정 border 사용
  const barColor = isSnapshot
    ? { color: "#000000", bg: "#ffffff", text: "#000000" }
    : roleColor || DEFAULT_COLOR;

  // Alignment popover 외부 클릭 감지
  useEffect(() => {
    if (!showAlignmentPopover) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        alignmentPopoverRef.current &&
        !alignmentPopoverRef.current.contains(event.target as Node)
      ) {
        setShowAlignmentPopover(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showAlignmentPopover]);

  // 드래그 시작
  const handleMouseDown = useCallback(
    (e: React.MouseEvent, mode: DragMode) => {
      if (!isEditing) return;

      e.stopPropagation();
      e.preventDefault();

      setDragMode(mode);
      setDragOffset({ left: 0, width: 0, top: 0 });

      const startX = e.clientX;
      const startY = e.clientY;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;

        if (mode === "move") {
          setDragOffset({ left: deltaX, width: 0, top: deltaY });
          // 실시간 기간 정보 전달
          const newDates = calculateMovedDates(
            bar,
            deltaX,
            rangeStart,
            dayWidth
          );
          onDragDateChange?.(newDates);
        } else if (mode === "resize-left") {
          setDragOffset({ left: deltaX, width: -deltaX, top: 0 });
          const newDates = calculateResizedDates(
            bar,
            "start",
            deltaX,
            rangeStart,
            dayWidth
          );
          onDragDateChange?.(newDates);
        } else if (mode === "resize-right") {
          setDragOffset({ left: 0, width: deltaX, top: 0 });
          const newDates = calculateResizedDates(
            bar,
            "end",
            deltaX,
            rangeStart,
            dayWidth
          );
          onDragDateChange?.(newDates);
        }
      };

      const handleMouseUp = (upEvent: MouseEvent) => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);

        const deltaX = upEvent.clientX - startX;
        const deltaY = upEvent.clientY - startY;
        const laneDelta = Math.round(deltaY / LANE_HEIGHT);

        if (Math.abs(deltaX) > 10 || Math.abs(laneDelta) >= 1) {
          if (mode === "move") {
            const newDates = calculateMovedDates(
              bar,
              deltaX,
              rangeStart,
              dayWidth
            );
            const newPreferredLane = Math.max(0, lane + laneDelta);

            // 다른 Row로 이동 체크: onMoveComplete 콜백이 있고 Y 이동이 크면
            // 절대 Y 위치를 전달하여 DraftTimeline에서 타겟 Row 판단
            if (onMoveComplete && rowTopOffset !== undefined) {
              const absoluteY = upEvent.clientY;
              onMoveComplete(absoluteY);
            }

            // 먼저 드래그 중인 블록을 타겟 레인에 배치
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
              preferredLane: newPreferredLane,
            });

            // 겹침 처리: 연쇄적으로 충돌 해결
            // 레인별로 블록 그룹화 (현재 레인 기준)
            const barsByLane = new Map<number, typeof rowBars>();
            rowBars.forEach((b) => {
              if (b.clientUid === bar.clientUid) return; // 드래그 블록 제외
              const lane = b.preferredLane ?? b.lane;
              if (!barsByLane.has(lane)) {
                barsByLane.set(lane, []);
              }
              barsByLane.get(lane)!.push(b);
            });

            // 타겟 레인부터 아래로 순회하며 연쇄적으로 밀기
            const maxLane = Math.max(...Array.from(barsByLane.keys()), newPreferredLane);
            const blocksToMove = new Map<string, number>(); // clientUid -> 새 레인
            
            for (let currentLane = newPreferredLane; currentLane <= maxLane + 1; currentLane++) {
              const barsInCurrentLane = barsByLane.get(currentLane) || [];
              
              // 이 레인에 이동해야 할 블록이 있는지 확인 (이전 단계에서 밀린 블록)
              const incomingBars = Array.from(blocksToMove.entries())
                .filter(([_, targetLane]) => targetLane === currentLane)
                .map(([clientUid, _]) => rowBars.find((b) => b.clientUid === clientUid)!)
                .filter(Boolean);
              
              // 드래그 블록이 이 레인에 배치되는지 확인
              const isDraggedBarHere = currentLane === newPreferredLane;
              
              // 현재 레인에 있는 블록들 중 날짜가 겹치는 것이 있는지 확인
              const hasConflict = barsInCurrentLane.some((existingBar) => {
                // 이미 이동 예정인 블록은 제외
                if (blocksToMove.has(existingBar.clientUid)) return false;
                
                const existingStart = new Date(existingBar.startDate).getTime();
                const existingEnd = new Date(existingBar.endDate).getTime();
                
                // 드래그 블록과의 충돌 검사
                if (isDraggedBarHere) {
                  const dragStart = new Date(newDates.startDate).getTime();
                  const dragEnd = new Date(newDates.endDate).getTime();
                  if (!(dragEnd < existingStart || dragStart > existingEnd)) {
                    return true;
                  }
                }
                
                // 위에서 밀려온 블록들과의 충돌 검사
                return incomingBars.some((incomingBar) => {
                  const incomingStart = new Date(incomingBar.startDate).getTime();
                  const incomingEnd = new Date(incomingBar.endDate).getTime();
                  return !(incomingEnd < existingStart || incomingStart > existingEnd);
                });
              });
              
              // 충돌이 있으면 현재 레인의 블록들을 한 칸 아래로 이동 예약
              if (hasConflict) {
                barsInCurrentLane.forEach((b) => {
                  if (!blocksToMove.has(b.clientUid)) {
                    blocksToMove.set(b.clientUid, currentLane + 1);
                  }
                });
              }
            }
            
            // 예약된 모든 블록 이동 실행
            blocksToMove.forEach((newLane, clientUid) => {
              updateBar(clientUid, {
                preferredLane: newLane,
              });
            });
          } else if (mode === "resize-left") {
            const newDates = calculateResizedDates(
              bar,
              "start",
              deltaX,
              rangeStart,
              dayWidth
            );
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
            });
          } else if (mode === "resize-right") {
            const newDates = calculateResizedDates(
              bar,
              "end",
              deltaX,
              rangeStart,
              dayWidth
            );
            updateBar(bar.clientUid, {
              startDate: newDates.startDate,
              endDate: newDates.endDate,
            });
          }
        }

        setDragMode(null);
        setDragOffset({ left: 0, width: 0, top: 0 });
        onDragDateChange?.(null); // 드래그 종료 시 초기화
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [isEditing, bar, updateBar, dayWidth, rangeStart, lane, onDragDateChange, onMoveComplete, rowTopOffset, rowBars]
  );

  // 클릭 핸들링
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();
      barRef.current?.focus();
    },
    [onSelect]
  );

  // 더블클릭 핸들링 (수정 모달/팝오버 열기)
  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDoubleClick) {
        // isEditing 여부와 관계없이 항상 호출 (readOnly 모드에서도 팝오버 표시)
        onDoubleClick(e);
      }
    },
    [onDoubleClick]
  );

  // 키보드 핸들링 (Delete)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isEditing) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        deleteBar(bar.clientUid);
      }
    },
    [isEditing, deleteBar, bar.clientUid]
  );

  const isDragging = dragMode !== null;
  const dateLabel = formatShortDateRange(bar.startDate, bar.endDate);

  // 드래그 중 위치/크기 계산
  const currentLeft = left + dragOffset.left;
  const currentWidth = Math.max(dayWidth, width + dragOffset.width);
  const currentTop = lane * LANE_HEIGHT + 4 + dragOffset.top;

  return (
    <div
      ref={barRef}
      className="absolute flex flex-col justify-center group outline-none"
      style={{
        left: currentLeft,
        width: currentWidth,
        height: LANE_HEIGHT - 8,
        top: currentTop,
        // Airbnb 스타일: 더 둥근 끝
        borderRadius: 10,
        // Snapshot은 하얀색 배경, Plan은 투명하게
        background: isSnapshot
          ? "#ffffff" // 하얀색 배경
          : barColor.bg.replace(/[\d.]+\)$/, '0.06)'), // Plan 배경을 더 투명하게 (0.12 → 0.06)
        // Snapshot은 검정 1px 테두리, Plan은 투명하게
        border: isSnapshot
          ? "1px solid #000000" // 검정 테두리
          : `1px solid ${isSelected ? barColor.color : `${barColor.color}20`}`, // Plan 테두리를 더 투명하게
        // 호버/선택 시 그림자 & lift 효과
        boxShadow: isSnapshot
          ? (isSelected
              ? "0 0 0 3px rgba(59, 130, 246, 0.3), 0 2px 6px rgba(0, 0, 0, 0.1)" // 선택 시 포커스 링 + 기본 그림자
              : "0 2px 6px rgba(0, 0, 0, 0.1)") // 항상 그림자 표시
          : (isSelected
              ? `0 2px 12px ${barColor.color}20, 0 0 0 2px ${barColor.color}20` // Plan 선택 시 더 약한 그림자
              : isHovered
              ? "0 2px 8px rgba(0, 0, 0, 0.06)" // Plan 호버 시 약한 그림자
              : "0 1px 2px rgba(0, 0, 0, 0.03)"), // Plan 기본 그림자 (거의 투명)
        // Airbnb 스타일: 호버 시 lift
        transform:
          isHovered && !isDragging ? "translateY(-1px)" : "translateY(0)",
        // 드래그 중에는 transition 없음
        transition: isDragging
          ? "none"
          : "transform 150ms ease-out, box-shadow 150ms ease-out",
        // z-index
        zIndex: isDragging ? 100 : isSelected ? 10 : isHovered ? 5 : 1,
        // 커서
        cursor: isEditing ? (isDragging ? "grabbing" : "grab") : "pointer",
        // 드래그 중 반투명
        opacity: isDragging ? 0.9 : 1,
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        // 읽기모드일 때만 우클릭 메뉴 열기
        if (readOnly && onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, bar);
        }
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        onClearHover?.();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onMouseMove={(e) => e.stopPropagation()} // 부모의 hover line 표시 방지
      onKeyDown={handleKeyDown}
      tabIndex={isEditing ? 0 : -1}
    >
      {/* 좌측 리사이즈 핸들 */}
      {isEditing && (
        <div
          className="absolute left-0 top-0 bottom-0 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
          style={{
            width: RESIZE_HANDLE_WIDTH,
            borderRadius: "8px 0 0 8px",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize-left")}
        >
          <div
            className="w-1 h-4 rounded-full transition-all duration-150"
            style={{
              background: isHovered ? barColor.color : `${barColor.color}50`,
              opacity: isHovered ? 0.8 : 0.4,
            }}
          />
        </div>
      )}

      {/* Alignment 상태 인디케이터 (Plan only) - 우측 상단 원형 */}
      {!isSnapshot && alignmentStatus && (
        <div className="absolute right-1 top-1 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAlignmentPopover(!showAlignmentPopover);
            }}
            className="w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-125 transition-transform"
            style={{
              background:
                alignmentStatus === "green"
                  ? "rgb(16, 185, 129)" // emerald-500
                  : alignmentStatus === "orange"
                  ? "rgb(251, 146, 60)" // orange-500
                  : "rgb(244, 63, 94)", // rose-500
            }}
            title="클릭하여 상세 정보 확인"
          />

          {/* Alignment Debug Tooltip */}
          {showAlignmentPopover && (
            <div
              ref={alignmentPopoverRef}
              className="absolute top-6 right-0 w-80 bg-gray-900 text-white rounded-lg shadow-2xl z-50 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowAlignmentPopover(false)}
                className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="max-h-96 overflow-y-auto pr-5">
                {/* Status */}
                <div className="mb-3 pb-3 border-b border-gray-700">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background:
                          alignmentStatus === "green"
                            ? "rgb(16, 185, 129)"
                            : alignmentStatus === "orange"
                            ? "rgb(251, 146, 60)"
                            : "rgb(244, 63, 94)",
                      }}
                    />
                    <span className="text-xs font-medium">
                      {alignmentStatus === "green"
                        ? "양호"
                        : alignmentStatus === "orange"
                        ? "부족"
                        : "실행 기록 없음"}
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 ml-4">
                    실행 {bar.alignmentActualCount || 0}회 / 예상{" "}
                    {bar.alignmentExpectedCount || 0}회
                  </div>
                </div>

                {/* Debug Info */}
                {bar.alignmentDebugInfo && (
                  <>
                    {/* Plan Info */}
                    <div className="mb-3">
                      <div className="text-[10px] text-gray-400 mb-1">계획 정보</div>
                      <div className="text-[10px] space-y-0.5">
                        <div className="text-gray-300 break-all">
                          <span className="text-gray-500">MetaKey:</span>{" "}
                          {bar.alignmentDebugInfo.planMetaKey}
                        </div>
                        <div className="text-gray-300">
                          <span className="text-gray-500">기간:</span>{" "}
                          {bar.alignmentDebugInfo.planDateRange}
                        </div>
                      </div>
                    </div>

                    {/* Matching Snapshots */}
                    {bar.alignmentDebugInfo.matchingSnapshots.length > 0 && (
                      <div className="mb-3 pb-3 border-b border-gray-700">
                        <div className="text-[10px] text-emerald-400 mb-1.5">
                          ✓ 매칭된 스냅샷 ({bar.alignmentDebugInfo.matchingSnapshots.length}개)
                        </div>
                        <div className="space-y-1.5">
                          {bar.alignmentDebugInfo.matchingSnapshots.map((s, i) => (
                            <div key={i} className="text-[10px] text-gray-300 pl-3">
                              <div className="text-emerald-300">
                                {i + 1}. {s.startDate}
                              </div>
                              <div className="text-gray-400 break-all">{s.metaKey}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filtered Out Snapshots */}
                    {bar.alignmentDebugInfo.filteredOutSnapshots.length > 0 && (
                      <div>
                        <div className="text-[10px] text-rose-400 mb-1.5">
                          ✗ 필터링된 스냅샷 ({bar.alignmentDebugInfo.filteredOutSnapshots.length}개)
                        </div>
                        <div className="space-y-1.5">
                          {bar.alignmentDebugInfo.filteredOutSnapshots
                            .slice(0, 10)
                            .map((s, i) => (
                              <div key={i} className="text-[10px] text-gray-300 pl-3">
                                <div className="text-rose-300">
                                  {i + 1}. {s.startDate}
                                </div>
                                <div className="text-gray-400 break-all">{s.metaKey}</div>
                                <div className="text-rose-400 mt-0.5">→ {s.reason}</div>
                              </div>
                            ))}
                          {bar.alignmentDebugInfo.filteredOutSnapshots.length > 10 && (
                            <div className="text-[10px] text-gray-500 text-center py-1">
                              ... 외 {bar.alignmentDebugInfo.filteredOutSnapshots.length - 10}개
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 콘텐츠 영역 - Snapshot과 일반 블록 구분 */}
      {isSnapshot ? (
        /* Snapshot 블록 레이아웃 - 2행 */
        <div
          className="relative px-2 py-1 flex flex-col justify-center min-w-0 gap-1"
          onMouseDown={(e) => handleMouseDown(e, "move")}
        >
          {/* 원형 진행률 - absolute 우측 중앙 */}
          {currentWidth > 60 && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8">
              <svg className="w-8 h-8 -rotate-90">
                {/* 배경 원 */}
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="4"
                />
                {/* 진행률 원 */}
                <circle
                  cx="16"
                  cy="16"
                  r="12"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="4"
                  strokeDasharray={`${(avgProgress / 100) * 75.4} 75.4`}
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="absolute inset-0 flex items-center justify-center text-[9px] font-bold"
                style={{ color: "#6b7280" }}
              >
                {Math.round(avgProgress)}
              </span>
            </div>
          )}

          {/* 1행: 주차 태그 + 작성자 + 병합 표시 */}
          <div className="flex items-center gap-1.5 min-w-0 pr-8">
            {snapshotYear && snapshotWeek && (
              <>
                {/* 주차 태그 (병합된 경우 범위 표시) */}
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold rounded shrink-0"
                  style={{
                    background: "#9ca3af",
                    color: "white",
                  }}
                  title="Snapshot Entry"
                >
                  {isMerged && mergedWeeks.length > 0
                    ? `${String(mergedWeeks[0].year).slice(2)} ${mergedWeeks[0].week}-${mergedWeeks[mergedWeeks.length - 1].week}`
                    : `${String(snapshotYear).slice(2)} ${snapshotWeek}`}
                </span>

                {/* 작성자 이름 (단순 텍스트) */}
                {authorName && (
                  <span
                    className="text-[10px] font-medium shrink-0"
                    style={{ color: "#374151" }}
                  >
                    {authorName}
                  </span>
                )}

                {/* 병합 표시 */}
                {isMerged && (
                  <span
                    className="text-[9px] font-medium shrink-0"
                    style={{ color: "#10b981" }}
                  >
                    ✓ 결합됨
                  </span>
                )}
              </>
            )}
          </div>

          {/* 2행: 기능명 */}
          <span
            className="truncate text-[11px] font-semibold leading-tight pr-8"
            style={{ color: "#374151" }}
            title={bar.title}
          >
            {bar.title}
          </span>
        </div>
      ) : (
        /* 일반 블록 레이아웃 */
        <div
          className="px-2 py-0.5 flex flex-col justify-center min-w-0 gap-0.5"
          onMouseDown={(e) => handleMouseDown(e, "move")}
        >
          {/* 1행: 스테이지 + 담당자 + 기간 */}
          <div className="flex items-center justify-between gap-1 min-w-0">
            {/* 좌측 그룹: 스테이지 + 담당자 */}
            <div className="flex items-center gap-1 min-w-0">
              {/* 스테이지 이니셜 태그 (항상 표시) */}
              {bar.stage ? (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold rounded shrink-0"
                  style={{
                    background: barColor.color,
                    color: "white",
                  }}
                  title={bar.stage}
                >
                  {getStageInitial(bar.stage)}
                </span>
              ) : (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-medium rounded shrink-0"
                  style={{ background: "#e5e7eb", color: "#6b7280" }}
                >
                  -
                </span>
              )}

              {/* Snapshot: 작성자 이름 / Plan: 담당자 이름 (너비 > 40, 2칸부터) */}
              {currentWidth > 40 && (
                <>
                  {isSnapshot && authorName ? (
                    <span
                      className="px-1.5 py-0.5 text-[9px] font-medium rounded shrink-0 truncate"
                      style={{ 
                        background: "#f6f8fa", 
                        color: "#24292f",
                        border: "1px solid #d0d7de",
                      }}
                      title={`작성자: ${authorName}`}
                    >
                      {authorName}
                    </span>
                  ) : (
                    bar.assignees &&
                    bar.assignees.length > 0 && (
                      <span
                        className="text-[9px] font-medium truncate"
                        style={{ color: barColor.text, opacity: 0.8 }}
                        title={bar.assignees
                          .map((a) => a.displayName || a.userId)
                          .join(", ")}
                      >
                        {bar.assignees[0]?.displayName ||
                          bar.assignees[0]?.userId?.slice(0, 8)}
                        {bar.assignees.length > 1 &&
                          ` +${bar.assignees.length - 1}`}
                      </span>
                    )
                  )}
                </>
              )}
            </div>

            {/* 우측: 기간 표시 (너비 > 120, 3칸부터) */}
            {currentWidth > 120 && (
              <span
                className="text-[9px] font-medium shrink-0"
                style={{ color: barColor.text, opacity: 0.7 }}
              >
                {dateLabel}
              </span>
            )}
          </div>

          {/* 2행: 타이틀 */}
          <span
            className="truncate text-[11px] font-medium leading-tight"
            style={{ color: barColor.text }}
            title={bar.title}
          >
            {bar.title}
          </span>
        </div>
      )}

      {/* 우측 리사이즈 핸들 */}
      {isEditing && (
        <div
          className="absolute right-0 top-0 bottom-0 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
          style={{
            width: RESIZE_HANDLE_WIDTH,
            borderRadius: "0 8px 8px 0",
          }}
          onMouseDown={(e) => handleMouseDown(e, "resize-right")}
        >
          <div
            className="w-1 h-4 rounded-full transition-all duration-150"
            style={{
              background: isHovered ? barColor.color : `${barColor.color}50`,
              opacity: isHovered ? 0.8 : 0.4,
            }}
          />
        </div>
      )}

      {/* 변경됨 표시 */}
      {bar.dirty && (
        <div
          className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
          style={{ background: "#f59e0b" }}
          title="변경됨"
        />
      )}
    </div>
  );
});
