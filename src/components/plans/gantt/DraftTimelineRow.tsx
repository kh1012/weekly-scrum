"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { DraftPlan } from "./types";
import type { BarLayout } from "./useGanttLayout";
import { ROW_HEIGHT, DAY_WIDTH, formatLocalDateStr } from "./useGanttLayout";
import { PlusIcon, StarIcon, CheckIcon } from "@/components/common/Icons";

// 타입별 색상 (GanttFilters와 동기화)
const TYPE_COLORS = {
  release: "#ec4899", // 핑크
  sprint: "#f59e0b", // 주황
  feature: "#10b981", // 초록
} as const;

type BarDragType = "move" | "resize-left" | "resize-right";

interface DraftTimelineRowProps {
  draft: DraftPlan;
  days: Date[];
  totalWidth: number;
  calculateBarLayout: (
    startDate: string | null,
    endDate: string | null
  ) => BarLayout;
  /** 날짜만 설정 (기존 방식) */
  onCreateFromDraft?: (draft: DraftPlan, startDate: string, endDate: string) => void;
  /** 완전한 데이터로 업데이트 (새 방식: 기간 + 추가 정보) */
  onUpdateDraftWithDates?: (
    tempId: string,
    updates: Partial<DraftPlan> & { start_date: string; end_date: string }
  ) => void;
  /** 필터 옵션 (프로젝트/모듈/기능 목록) */
  filterOptions?: {
    projects?: string[];
    modules?: string[];
    features?: string[];
  };
}

/**
 * 임시 계획 타임라인 행
 * - 드래그로 기간 선택 (새로 만들기)
 * - 기존 바 드래그로 이동/리사이즈
 * - 팝오버로 추가 정보 입력
 */
export const DraftTimelineRow = memo(function DraftTimelineRow({
  draft,
  days,
  totalWidth,
  calculateBarLayout,
  onCreateFromDraft,
  onUpdateDraftWithDates,
  filterOptions,
}: DraftTimelineRowProps) {
  // 새 기간 선택 드래그
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 기존 바 드래그 (이동/리사이즈)
  const [barDragType, setBarDragType] = useState<BarDragType | null>(null);
  const [barDragStartX, setBarDragStartX] = useState<number>(0);
  const [barOriginalStart, setBarOriginalStart] = useState<string>("");
  const [barOriginalEnd, setBarOriginalEnd] = useState<string>("");
  const [barCurrentStart, setBarCurrentStart] = useState<string>("");
  const [barCurrentEnd, setBarCurrentEnd] = useState<string>("");
  const [isBarHovered, setIsBarHovered] = useState(false);

  // 팝오버 상태
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [pendingDates, setPendingDates] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const projectInputRef = useRef<HTMLInputElement>(null);

  // 팝오버 입력 상태
  const [formData, setFormData] = useState({
    title: draft.title || "",
    project: draft.project || "",
    module: draft.module || "",
    feature: draft.feature || "",
  });

  // 타입별 색상
  const typeColor = TYPE_COLORS[draft.type];

  // 기존 날짜가 있는 경우 바 표시
  const hasExistingDates = draft.start_date && draft.end_date;
  
  // 바 레이아웃 계산 (드래그 중이면 현재 값, 아니면 원래 값)
  const displayStart = barDragType ? barCurrentStart : (draft.start_date || "");
  const displayEnd = barDragType ? barCurrentEnd : (draft.end_date || "");
  const barLayout = hasExistingDates || barDragType
    ? calculateBarLayout(displayStart || null, displayEnd || null)
    : null;

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

  const dragRange = getDragRange();

  // 기능 타입 표시용 레이블
  const getDisplayLabel = () => {
    if (draft.type === "feature") {
      const parts = [draft.project, draft.module, draft.feature].filter(Boolean);
      return parts.length > 0 ? parts.join(" / ") : "기능";
    }
    return draft.title || (draft.type === "release" ? "릴리즈" : "스프린트");
  };

  // X 좌표를 날짜로 변환
  const xToDateString = useCallback((x: number): string => {
    const dayIndex = Math.floor(x / DAY_WIDTH);
    const clampedIndex = Math.max(0, Math.min(days.length - 1, dayIndex));
    return formatLocalDateStr(days[clampedIndex]);
  }, [days]);

  // ==================== 새 기간 선택 드래그 ====================
  
  const handleMouseDown = useCallback((e: React.MouseEvent, dayIndex: number) => {
    if (barDragType) return; // 바 드래그 중이면 무시
    e.preventDefault();
    setIsDragging(true);
    setDragStart(dayIndex);
    setDragEnd(dayIndex);
  }, [barDragType]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const dayIndex = Math.floor(x / DAY_WIDTH);
    const clampedIndex = Math.max(0, Math.min(days.length - 1, dayIndex));
    setDragEnd(clampedIndex);
  }, [isDragging, days.length]);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || dragStart === null || dragEnd === null) {
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      const startIdx = Math.min(dragStart, dragEnd);
      const endIdx = Math.max(dragStart, dragEnd);

      const startDate = formatLocalDateStr(days[startIdx]);
      const endDate = formatLocalDateStr(days[endIdx]);

      // 새 방식: 팝오버로 추가 정보 입력
      setPendingDates({ start: startDate, end: endDate });
      setFormData({
        title: draft.title || "",
        project: draft.project || "",
        module: draft.module || "",
        feature: draft.feature || "",
      });

      setPopoverPosition({ x: e.clientX, y: e.clientY });
      setShowPopover(true);

      setIsDragging(false);
    },
    [isDragging, dragStart, dragEnd, days, draft]
  );

  // ==================== 기존 바 드래그 (이동/리사이즈) ====================
  
  const handleBarMouseDown = useCallback((e: React.MouseEvent, type: BarDragType) => {
    if (!draft.start_date || !draft.end_date) return;
    e.preventDefault();
    e.stopPropagation();
    
    setBarDragType(type);
    setBarDragStartX(e.clientX);
    setBarOriginalStart(draft.start_date);
    setBarOriginalEnd(draft.end_date);
    setBarCurrentStart(draft.start_date);
    setBarCurrentEnd(draft.end_date);
  }, [draft.start_date, draft.end_date]);

  // 바 드래그 글로벌 이벤트
  useEffect(() => {
    if (!barDragType) return;

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - barDragStartX;
      const deltaDays = Math.round(deltaX / DAY_WIDTH);
      
      if (deltaDays === 0 && barCurrentStart === barOriginalStart && barCurrentEnd === barOriginalEnd) {
        return;
      }

      let newStart = barCurrentStart;
      let newEnd = barCurrentEnd;

      if (barDragType === "move") {
        const startDate = new Date(barOriginalStart);
        const endDate = new Date(barOriginalEnd);
        startDate.setDate(startDate.getDate() + deltaDays);
        endDate.setDate(endDate.getDate() + deltaDays);
        newStart = formatLocalDateStr(startDate);
        newEnd = formatLocalDateStr(endDate);
      } else if (barDragType === "resize-left") {
        const startDate = new Date(barOriginalStart);
        startDate.setDate(startDate.getDate() + deltaDays);
        newStart = formatLocalDateStr(startDate);
        
        // Validation: start <= end
        if (new Date(newStart) > new Date(barOriginalEnd)) {
          newStart = barOriginalEnd;
        }
      } else if (barDragType === "resize-right") {
        const endDate = new Date(barOriginalEnd);
        endDate.setDate(endDate.getDate() + deltaDays);
        newEnd = formatLocalDateStr(endDate);
        
        // Validation: end >= start
        if (new Date(newEnd) < new Date(barOriginalStart)) {
          newEnd = barOriginalStart;
        }
      }

      setBarCurrentStart(newStart);
      setBarCurrentEnd(newEnd);
    };

    const handleGlobalMouseUp = () => {
      if (!barDragType) return;

      // 변경이 있으면 업데이트
      const hasChanged = barCurrentStart !== barOriginalStart || barCurrentEnd !== barOriginalEnd;
      if (hasChanged && onUpdateDraftWithDates) {
        onUpdateDraftWithDates(draft.tempId, {
          start_date: barCurrentStart,
          end_date: barCurrentEnd,
        });
      }

      setBarDragType(null);
      setBarDragStartX(0);
      setBarOriginalStart("");
      setBarOriginalEnd("");
      setBarCurrentStart("");
      setBarCurrentEnd("");
    };

    window.addEventListener("mousemove", handleGlobalMouseMove);
    window.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleGlobalMouseMove);
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [barDragType, barDragStartX, barOriginalStart, barOriginalEnd, barCurrentStart, barCurrentEnd, draft.tempId, onUpdateDraftWithDates]);

  // ==================== 팝오버 ====================

  useEffect(() => {
    if (!showPopover) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false);
        setDragStart(null);
        setDragEnd(null);
        setPendingDates(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showPopover]);

  useEffect(() => {
    if (showPopover) {
      setTimeout(() => projectInputRef.current?.focus(), 50);
    }
  }, [showPopover]);

  const handlePopoverSubmit = useCallback(() => {
    if (!pendingDates) return;

    if (draft.type === "feature") {
      if (!formData.project || !formData.module || !formData.feature) {
        alert("프로젝트, 모듈, 기능명을 모두 입력해주세요.");
        return;
      }
    } else {
      if (!formData.title) {
        alert("제목을 입력해주세요.");
        return;
      }
    }

    if (onUpdateDraftWithDates) {
      onUpdateDraftWithDates(draft.tempId, {
        title: formData.title,
        project: formData.project,
        module: formData.module,
        feature: formData.feature,
        start_date: pendingDates.start,
        end_date: pendingDates.end,
      });
    } else if (onCreateFromDraft) {
      onCreateFromDraft(
        { ...draft, ...formData },
        pendingDates.start,
        pendingDates.end
      );
    }

    setShowPopover(false);
    setDragStart(null);
    setDragEnd(null);
    setPendingDates(null);
  }, [pendingDates, formData, draft, onUpdateDraftWithDates, onCreateFromDraft]);

  const handlePopoverKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handlePopoverSubmit();
      } else if (e.key === "Escape") {
        setShowPopover(false);
        setDragStart(null);
        setDragEnd(null);
        setPendingDates(null);
      }
    },
    [handlePopoverSubmit]
  );

  // 바 더블클릭 시 팝오버 열기 (편집)
  const handleBarDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!draft.start_date || !draft.end_date) return;
    e.preventDefault();
    e.stopPropagation();
    
    setPendingDates({ start: draft.start_date, end: draft.end_date });
    setFormData({
      title: draft.title || "",
      project: draft.project || "",
      module: draft.module || "",
      feature: draft.feature || "",
    });
    setPopoverPosition({ x: e.clientX, y: e.clientY });
    setShowPopover(true);
  }, [draft]);

  return (
    <div
      ref={containerRef}
      className="relative border-b"
      style={{
        height: ROW_HEIGHT,
        width: totalWidth,
        minWidth: totalWidth,
        borderColor: "var(--notion-border)",
        background: `${typeColor}06`,
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
      {/* 날짜 그리드 */}
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
              {!isDragging && !barDragType && !hasExistingDates && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: `${typeColor}30`,
                      color: typeColor,
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

      {/* 드래그 선택 영역 (새 기간 선택) */}
      {dragRange && isDragging && (
        <div
          className="absolute top-1 bottom-1 rounded-lg border-2 border-dashed pointer-events-none animate-pulse"
          style={{
            left: dragRange.left,
            width: dragRange.width,
            background: `${typeColor}25`,
            borderColor: typeColor,
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-xs font-medium px-2 py-1 rounded"
              style={{ background: typeColor, color: "white" }}
            >
              {Math.abs((dragEnd ?? 0) - (dragStart ?? 0)) + 1}일
            </span>
          </div>
        </div>
      )}

      {/* 기존 날짜가 있는 경우 바 표시 (드래그/리사이즈 가능) */}
      {barLayout && barLayout.visible && !isDragging && (
        <div
          className="absolute top-1 bottom-1 rounded-lg flex items-center px-2 group cursor-grab"
          style={{
            left: barLayout.left,
            width: barLayout.width,
            background: `linear-gradient(135deg, ${typeColor}40, ${typeColor}20)`,
            border: barDragType || isBarHovered 
              ? `2px solid ${typeColor}` 
              : `1px dashed ${typeColor}`,
            boxShadow: barDragType 
              ? `0 4px 12px ${typeColor}30`
              : isBarHovered 
                ? `0 2px 8px ${typeColor}20`
                : "none",
            transition: barDragType ? "none" : "all 150ms ease-out",
            cursor: barDragType ? "grabbing" : "grab",
            zIndex: barDragType ? 100 : isBarHovered ? 10 : 1,
          }}
          onMouseEnter={() => setIsBarHovered(true)}
          onMouseLeave={() => setIsBarHovered(false)}
          onMouseDown={(e) => handleBarMouseDown(e, "move")}
          onDoubleClick={handleBarDoubleClick}
        >
          {/* Left Resize Handle */}
          <div
            data-resize-handle="left"
            className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
            style={{ borderRadius: "8px 0 0 8px" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleBarMouseDown(e, "resize-left");
            }}
          >
            <div
              className="w-1 h-4 rounded-full transition-all duration-150"
              style={{
                background: isBarHovered ? typeColor : `${typeColor}50`,
                opacity: isBarHovered ? 0.8 : 0.4,
              }}
            />
          </div>

          {/* 콘텐츠 */}
          <StarIcon size={12} filled style={{ color: typeColor, flexShrink: 0 }} />
          <span 
            className="ml-1 text-xs font-medium truncate" 
            style={{ color: typeColor }}
            title="더블클릭하여 편집"
          >
            {getDisplayLabel()}
          </span>

          {/* Right Resize Handle */}
          <div
            data-resize-handle="right"
            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center justify-center"
            style={{ borderRadius: "0 8px 8px 0" }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleBarMouseDown(e, "resize-right");
            }}
          >
            <div
              className="w-1 h-4 rounded-full transition-all duration-150"
              style={{
                background: isBarHovered ? typeColor : `${typeColor}50`,
                opacity: isBarHovered ? 0.8 : 0.4,
              }}
            />
          </div>
        </div>
      )}

      {/* 생성 중 로딩 */}
      {isCreating && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50">
          <div
            className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: typeColor, borderTopColor: "transparent" }}
          />
        </div>
      )}

      {/* 추가 정보 입력 팝오버 */}
      {showPopover &&
        pendingDates &&
        createPortal(
          <div
            ref={popoverRef}
            className="fixed z-50 rounded-xl shadow-2xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={{
              left: Math.min(popoverPosition.x, window.innerWidth - 320),
              top: popoverPosition.y + 10,
              width: 300,
              background: "var(--notion-bg)",
              borderColor: "var(--notion-border)",
            }}
            onKeyDown={handlePopoverKeyDown}
          >
            {/* 헤더 */}
            <div
              className="px-4 py-3 border-b flex items-center gap-2"
              style={{
                background: `${typeColor}10`,
                borderColor: "var(--notion-border)",
              }}
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ background: typeColor }}
              >
                <StarIcon size={12} style={{ color: "white" }} />
              </div>
              <div>
                <div
                  className="text-sm font-medium"
                  style={{ color: "var(--notion-text)" }}
                >
                  {draft.type === "feature"
                    ? "기능 정보 입력"
                    : draft.type === "sprint"
                    ? "스프린트 정보 입력"
                    : "릴리즈 정보 입력"}
                </div>
                <div
                  className="text-xs"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  {pendingDates.start} ~ {pendingDates.end}
                </div>
              </div>
            </div>

            {/* 입력 폼 */}
            <div className="p-4 space-y-3">
              {draft.type === "feature" ? (
                <>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      프로젝트 *
                    </label>
                    <input
                      ref={projectInputRef}
                      type="text"
                      value={formData.project}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          project: e.target.value,
                        }))
                      }
                      placeholder="프로젝트명"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/40"
                      style={{
                        background: "var(--notion-bg)",
                        borderColor: "var(--notion-border)",
                        color: "var(--notion-text)",
                      }}
                      list={`project-suggestions-${draft.tempId}`}
                    />
                    {filterOptions?.projects && (
                      <datalist id={`project-suggestions-${draft.tempId}`}>
                        {filterOptions.projects.map((p) => (
                          <option key={p} value={p} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      모듈 *
                    </label>
                    <input
                      type="text"
                      value={formData.module}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          module: e.target.value,
                        }))
                      }
                      placeholder="모듈명"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/40"
                      style={{
                        background: "var(--notion-bg)",
                        borderColor: "var(--notion-border)",
                        color: "var(--notion-text)",
                      }}
                      list={`module-suggestions-${draft.tempId}`}
                    />
                    {filterOptions?.modules && (
                      <datalist id={`module-suggestions-${draft.tempId}`}>
                        {filterOptions.modules.map((m) => (
                          <option key={m} value={m} />
                        ))}
                      </datalist>
                    )}
                  </div>
                  <div>
                    <label
                      className="block text-xs font-medium mb-1"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      기능명 *
                    </label>
                    <input
                      type="text"
                      value={formData.feature}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          feature: e.target.value,
                        }))
                      }
                      placeholder="기능명"
                      className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/40"
                      style={{
                        background: "var(--notion-bg)",
                        borderColor: "var(--notion-border)",
                        color: "var(--notion-text)",
                      }}
                      list={`feature-suggestions-${draft.tempId}`}
                    />
                    {filterOptions?.features && (
                      <datalist id={`feature-suggestions-${draft.tempId}`}>
                        {filterOptions.features.map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label
                    className="block text-xs font-medium mb-1"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    제목 *
                  </label>
                  <input
                    ref={projectInputRef}
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder={`${
                      draft.type === "sprint" ? "스프린트" : "릴리즈"
                    } 제목`}
                    className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/40"
                    style={{
                      background: "var(--notion-bg)",
                      borderColor: "var(--notion-border)",
                      color: "var(--notion-text)",
                    }}
                  />
                </div>
              )}
            </div>

            {/* 버튼 */}
            <div
              className="px-4 py-3 border-t flex justify-end gap-2"
              style={{ borderColor: "var(--notion-border)" }}
            >
              <button
                onClick={() => {
                  setShowPopover(false);
                  setDragStart(null);
                  setDragEnd(null);
                  setPendingDates(null);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-black/5"
                style={{ color: "var(--notion-text-muted)" }}
              >
                취소
              </button>
              <button
                onClick={handlePopoverSubmit}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                style={{ background: typeColor }}
              >
                <CheckIcon size={12} />
                완료
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
});
