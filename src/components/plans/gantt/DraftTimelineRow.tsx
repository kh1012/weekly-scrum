"use client";

import { memo, useState, useCallback, useRef } from "react";
import type { DraftPlan } from "./types";
import type { BarLayout } from "./useGanttLayout";
import { ROW_HEIGHT, DAY_WIDTH } from "./useGanttLayout";
import { PlusIcon, StarIcon } from "@/components/common/Icons";

interface DraftTimelineRowProps {
  draft: DraftPlan;
  days: Date[];
  totalWidth: number;
  calculateBarLayout: (startDate: string | null, endDate: string | null) => BarLayout;
  onCreateFromDraft?: (draft: DraftPlan, startDate: string, endDate: string) => Promise<void>;
}

/**
 * 임시 계획 타임라인 행
 * - 드래그로 기간 선택
 * - 선택 완료 시 실제 계획 생성
 */
export const DraftTimelineRow = memo(function DraftTimelineRow({
  draft,
  days,
  totalWidth,
  calculateBarLayout,
  onCreateFromDraft,
}: DraftTimelineRowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 드래그 시작
  const handleMouseDown = useCallback((e: React.MouseEvent, dayIndex: number) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart(dayIndex);
    setDragEnd(dayIndex);
  }, []);

  // 드래그 중
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dayIndex = Math.floor(x / DAY_WIDTH);
    const clampedIndex = Math.max(0, Math.min(days.length - 1, dayIndex));
    setDragEnd(clampedIndex);
  }, [isDragging, days.length]);

  // 드래그 종료
  const handleMouseUp = useCallback(async () => {
    if (!isDragging || dragStart === null || dragEnd === null || !onCreateFromDraft) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    const startIdx = Math.min(dragStart, dragEnd);
    const endIdx = Math.max(dragStart, dragEnd);
    
    const startDate = days[startIdx].toISOString().split("T")[0];
    const endDate = days[endIdx].toISOString().split("T")[0];

    setIsCreating(true);
    try {
      await onCreateFromDraft(draft, startDate, endDate);
    } finally {
      setIsCreating(false);
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
    }
  }, [isDragging, dragStart, dragEnd, days, draft, onCreateFromDraft]);

  // 드래그 영역 계산
  const getDragRange = () => {
    if (dragStart === null || dragEnd === null) return null;
    const startIdx = Math.min(dragStart, dragEnd);
    const endIdx = Math.max(dragStart, dragEnd);
    return {
      left: startIdx * DAY_WIDTH,
      width: (endIdx - startIdx + 1) * DAY_WIDTH,
    };
  };

  // 기존 날짜가 있는 경우 바 표시
  const hasExistingDates = draft.start_date && draft.end_date;
  const barLayout = hasExistingDates
    ? calculateBarLayout(draft.start_date!, draft.end_date!)
    : null;

  const dragRange = getDragRange();

  return (
    <div
      ref={containerRef}
      className="relative border-b"
      style={{
        height: ROW_HEIGHT,
        width: totalWidth,
        minWidth: totalWidth,
        borderColor: "var(--notion-border)",
        background: "rgba(247, 109, 87, 0.03)",
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        if (isDragging) {
          setIsDragging(false);
          setDragStart(null);
          setDragEnd(null);
        }
      }}
    >
      {/* 날 그리드 */}
      <div className="absolute inset-0 flex">
        {days.map((day, index) => {
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          return (
            <div
              key={index}
              className="flex-shrink-0 border-r relative group cursor-crosshair"
              style={{
                width: DAY_WIDTH,
                borderColor: "var(--notion-border)",
                background: isWeekend ? "rgba(0, 0, 0, 0.02)" : "transparent",
              }}
              onMouseDown={(e) => handleMouseDown(e, index)}
            >
              {/* Hover 시 + 버튼 */}
              {!isDragging && (
                <div
                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: "rgba(247, 109, 87, 0.2)",
                      color: "#F76D57",
                    }}
                  >
                    <PlusIcon size={12} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 드래그 선택 영역 */}
      {dragRange && isDragging && (
        <div
          className="absolute top-1 bottom-1 rounded-lg border-2 border-dashed pointer-events-none animate-pulse"
          style={{
            left: dragRange.left,
            width: dragRange.width,
            background: "rgba(247, 109, 87, 0.2)",
            borderColor: "#F76D57",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ background: "#F76D57", color: "white" }}
            >
              {Math.abs((dragEnd ?? 0) - (dragStart ?? 0)) + 1}일
            </span>
          </div>
        </div>
      )}

      {/* 기존 날짜가 있는 경우 바 표시 (아직 저장 안 됨) */}
      {barLayout && barLayout.visible && !isDragging && (
        <div
          className="absolute top-1 bottom-1 rounded-lg flex items-center px-2"
          style={{
            left: barLayout.left,
            width: barLayout.width,
            background: "linear-gradient(135deg, rgba(247, 109, 87, 0.3), rgba(249, 168, 139, 0.3))",
            border: "1px dashed #F76D57",
          }}
        >
          <StarIcon size={12} filled style={{ color: "#F76D57" }} />
          <span className="ml-1 text-xs font-medium truncate" style={{ color: "#F76D57" }}>
            {draft.title}
          </span>
        </div>
      )}

      {/* 생성 중 로딩 */}
      {isCreating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div className="w-5 h-5 border-2 border-[#F76D57] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
});

