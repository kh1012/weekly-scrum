"use client";

import { memo, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { DraftPlan } from "./types";
import type { BarLayout } from "./useGanttLayout";
import { ROW_HEIGHT, DAY_WIDTH } from "./useGanttLayout";
import { PlusIcon, StarIcon, CheckIcon } from "@/components/common/Icons";

// 타입별 색상 (GanttFilters와 동기화)
const TYPE_COLORS = {
  release: "#ec4899", // 핑크
  sprint: "#f59e0b", // 주황
  feature: "#10b981", // 초록
} as const;

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
 * - 드래그로 기간 선택
 * - 기간 선택 완료 시 팝오버로 추가 정보 입력
 * - 입력 완료 시 임시 계획 데이터 완성
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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // 드래그 종료 - 팝오버 표시
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

      const startDate = days[startIdx].toISOString().split("T")[0];
      const endDate = days[endIdx].toISOString().split("T")[0];

      // 기존 방식: 날짜만 설정 (draft에 이미 정보가 있는 경우)
      if (
        onCreateFromDraft &&
        !onUpdateDraftWithDates &&
        draft.project &&
        draft.module &&
        draft.feature
      ) {
        onCreateFromDraft(draft, startDate, endDate);
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
        return;
      }

      // 새 방식: 팝오버로 추가 정보 입력
      setPendingDates({ start: startDate, end: endDate });
      setFormData({
        title: draft.title || "",
        project: draft.project || "",
        module: draft.module || "",
        feature: draft.feature || "",
      });

      // 팝오버 위치 설정 (마우스 위치 기준)
      setPopoverPosition({ x: e.clientX, y: e.clientY });
      setShowPopover(true);

      setIsDragging(false);
      // dragStart, dragEnd는 팝오버가 닫힐 때 초기화
    },
    [isDragging, dragStart, dragEnd, days, draft, onCreateFromDraft, onUpdateDraftWithDates]
  );

  // 팝오버 외부 클릭 시 닫기
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

  // 팝오버 열릴 때 포커스
  useEffect(() => {
    if (showPopover) {
      setTimeout(() => projectInputRef.current?.focus(), 50);
    }
  }, [showPopover]);

  // 팝오버 제출
  const handlePopoverSubmit = useCallback(() => {
    if (!pendingDates) return;

    // 기능 타입인 경우 프로젝트/모듈/기능명 필수
    if (draft.type === "feature") {
      if (!formData.project || !formData.module || !formData.feature) {
        alert("프로젝트, 모듈, 기능명을 모두 입력해주세요.");
        return;
      }
    } else {
      // 스프린트/릴리즈는 제목 필수
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
      // 폴백: 기존 방식
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

  // 팝오버 키보드 핸들러
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

  // 타입별 색상
  const typeColor = TYPE_COLORS[draft.type];

  // 기존 날짜가 있는 경우 바 표시
  const hasExistingDates = draft.start_date && draft.end_date;
  const barLayout = hasExistingDates
    ? calculateBarLayout(draft.start_date!, draft.end_date!)
    : null;

  const dragRange = getDragRange();

  // 기능 타입 표시용 레이블
  const getDisplayLabel = () => {
    if (draft.type === "feature") {
      const parts = [draft.project, draft.module, draft.feature].filter(Boolean);
      return parts.length > 0 ? parts.join(" / ") : "기능";
    }
    return draft.title || (draft.type === "release" ? "릴리즈" : "스프린트");
  };

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

      {/* 드래그 선택 영역 */}
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

      {/* 기존 날짜가 있는 경우 바 표시 (아직 저장 안 됨) */}
      {barLayout && barLayout.visible && !isDragging && (
        <div
          className="absolute top-1 bottom-1 rounded-lg flex items-center px-2"
          style={{
            left: barLayout.left,
            width: barLayout.width,
            background: `linear-gradient(135deg, ${typeColor}40, ${typeColor}20)`,
            border: `1px dashed ${typeColor}`,
          }}
        >
          <StarIcon size={12} filled style={{ color: typeColor }} />
          <span className="ml-1 text-xs font-medium truncate" style={{ color: typeColor }}>
            {getDisplayLabel()}
          </span>
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
                // 기능 타입: 프로젝트/모듈/기능명
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
                      list="project-suggestions"
                    />
                    {filterOptions?.projects && (
                      <datalist id="project-suggestions">
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
                      list="module-suggestions"
                    />
                    {filterOptions?.modules && (
                      <datalist id="module-suggestions">
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
                      list="feature-suggestions"
                    />
                    {filterOptions?.features && (
                      <datalist id="feature-suggestions">
                        {filterOptions.features.map((f) => (
                          <option key={f} value={f} />
                        ))}
                      </datalist>
                    )}
                  </div>
                </>
              ) : (
                // 스프린트/릴리즈: 제목만
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

