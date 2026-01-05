/**
 * Plan View Popover
 * - readOnly 모드에서 Plan 데이터를 보여주는 팝오버
 * - 리사이즈 가능
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  XIcon,
  CalendarIcon,
  UserIcon,
  LinkIcon,
} from "@/components/common/Icons";
import type { DraftBar } from "./types";

// localStorage 키
const POPOVER_SIZE_KEY = "plan-view-popover-size";

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  planner: { label: "기획", color: "#f59e0b" },
  designer: { label: "디자인", color: "#ec4899" },
  fe: { label: "FE", color: "#3b82f6" },
  be: { label: "BE", color: "#10b981" },
  qa: { label: "QA", color: "#8b5cf6" },
};

interface PlanViewPopoverProps {
  bar: DraftBar & {
    isSnapshot?: boolean;
    past_week?: {
      tasks?: Array<{ title: string; progress: number }>;
      progress?: string;
      next?: string;
      risk?: string;
      memo?: string;
    };
  };
  anchorPosition: { x: number; y: number };
  onClose: () => void;
}

export function PlanViewPopover({
  bar,
  anchorPosition,
  onClose,
}: PlanViewPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // rowId에서 프로젝트, 모듈, 기능 추출
  const [project, module, feature] = bar.rowId.split("::");

  // 팝오버 크기 상태 (localStorage에서 불러오기)
  const [size, setSize] = useState(() => {
    try {
      const stored = localStorage.getItem(POPOVER_SIZE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // localStorage 접근 실패 시 무시
    }
    return { width: 360, height: 400 }; // 기본 크기
  });

  // 리사이즈 상태
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{ x: number; y: number; width: number; height: number } | null>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // 리사이즈 핸들러
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height,
    };
  }, [size]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const newWidth = Math.max(320, Math.min(800, resizeStartRef.current.width + deltaX));
      const newHeight = Math.max(300, Math.min(800, resizeStartRef.current.height + deltaY));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // localStorage에 저장
      try {
        localStorage.setItem(POPOVER_SIZE_KEY, JSON.stringify(size));
      } catch {
        // localStorage 접근 실패 시 무시
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, size]);

  // 위치 계산 (화면 밖으로 나가지 않도록)
  const getPopoverPosition = useCallback(() => {
    const padding = 16;

    let x = anchorPosition.x;
    let y = anchorPosition.y;

    // 우측 경계 체크
    if (x + size.width > window.innerWidth - padding) {
      x = window.innerWidth - size.width - padding;
    }

    // 좌측 경계 체크
    if (x < padding) {
      x = padding;
    }

    // 하단 경계 체크
    if (y + size.height > window.innerHeight - padding) {
      y = anchorPosition.y - size.height - 8;
    }

    // 상단 경계 체크
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  }, [anchorPosition, size]);

  const position = getPopoverPosition();
  const hasLinks = bar.links && bar.links.length > 0;
  const hasDescription = bar.description && bar.description.trim().length > 0;

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-150 flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        background: "white",
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
        cursor: isResizing ? "nwse-resize" : "default",
      }}
    >
      {/* 헤더 */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-4 py-3 rounded-t-2xl"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-0.5 text-xs font-medium rounded-md"
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
            }}
          >
            {bar.stage}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-md ${
              bar.status === "완료"
                ? "bg-green-100 text-green-700"
                : bar.status === "보류"
                ? "bg-yellow-100 text-yellow-700"
                : bar.status === "취소"
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {bar.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-all duration-150 active:scale-95"
        >
          <XIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="font-medium text-gray-700">{project}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-gray-700">{module}</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="font-medium text-gray-900">{feature}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 leading-snug">
          {bar.title}
        </h3>

        {/* 기간 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            }}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-medium">
            {bar.startDate} ~ {bar.endDate}
          </span>
        </div>

        {/* 담당자 */}
        {bar.assignees && bar.assignees.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <UserIcon className="w-4 h-4" />
              담당자
            </div>
            <div className="flex flex-wrap gap-2">
              {bar.assignees.map((assignee, index) => {
                const roleConfig = ROLE_CONFIG[assignee.role] || {
                  label: assignee.role,
                  color: "#6b7280",
                };
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ background: "#f8fafc" }}
                  >
                    <span
                      className="px-2 py-0.5 text-xs font-bold rounded-md text-white"
                      style={{ background: roleConfig.color }}
                    >
                      {roleConfig.label}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {assignee.displayName || assignee.userId}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 설명 */}
        {hasDescription && (
          <div className="space-y-2">
            <div className="text-sm font-semibold text-gray-700">설명</div>
            <div
              className="text-sm text-gray-600 leading-relaxed p-3 rounded-lg whitespace-pre-wrap"
              style={{ background: "#f8fafc" }}
            >
              {bar.description}
            </div>
          </div>
        )}

        {/* 링크 */}
        {hasLinks && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <LinkIcon className="w-4 h-4" />
              관련 링크
            </div>
            <div className="space-y-2">
              {bar.links!.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-blue-50 transition-colors group"
                  style={{ background: "#f8fafc" }}
                >
                  <LinkIcon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-blue-600 group-hover:underline truncate">
                      {link.label || link.url}
                    </div>
                    {link.label && (
                      <div className="text-xs text-gray-400 truncate">
                        {link.url}
                      </div>
                    )}
                  </div>
                  <svg
                    className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Snapshot 정보 */}
        {bar.isSnapshot && bar.past_week && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <span className="px-2 py-1 bg-gray-600 text-white text-xs font-bold rounded">
                📸 Snapshot Entry
              </span>
            </div>

            {/* Tasks */}
            {bar.past_week.tasks && bar.past_week.tasks.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">작업 내역</div>
                <div className="space-y-1.5">
                  {bar.past_week.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm p-2 rounded-lg"
                      style={{ background: "#f8fafc" }}
                    >
                      <div className="flex-1">{task.title}</div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-20 h-1.5 rounded-full overflow-hidden"
                          style={{ background: "#e5e7eb" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${task.progress}%`,
                              background:
                                "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
                            }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-10 text-right">
                          {task.progress}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress */}
            {bar.past_week.progress && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">진행 상황</div>
                <div
                  className="text-sm text-gray-600 leading-relaxed p-3 rounded-lg whitespace-pre-wrap"
                  style={{ background: "#f8fafc" }}
                >
                  {bar.past_week.progress}
                </div>
              </div>
            )}

            {/* Next */}
            {bar.past_week.next && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">다음 계획</div>
                <div
                  className="text-sm text-gray-600 leading-relaxed p-3 rounded-lg whitespace-pre-wrap"
                  style={{ background: "#f8fafc" }}
                >
                  {bar.past_week.next}
                </div>
              </div>
            )}

            {/* Risk */}
            {bar.past_week.risk && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">리스크</div>
                <div
                  className="text-sm text-red-600 leading-relaxed p-3 rounded-lg whitespace-pre-wrap"
                  style={{ background: "#fef2f2" }}
                >
                  {bar.past_week.risk}
                </div>
              </div>
            )}

            {/* Memo */}
            {bar.past_week.memo && (
              <div className="space-y-2">
                <div className="text-sm font-semibold text-gray-700">메모</div>
                <div
                  className="text-sm text-gray-600 leading-relaxed p-3 rounded-lg whitespace-pre-wrap"
                  style={{ background: "#f8fafc" }}
                >
                  {bar.past_week.memo}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 정보 없음 표시 (Plans만) */}
        {!bar.isSnapshot && !hasDescription && !hasLinks && bar.assignees?.length === 0 && (
          <div className="text-sm text-gray-400 text-center py-4">
            추가 정보가 없습니다
          </div>
        )}
      </div>

      {/* 리사이즈 핸들 */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 w-8 h-8 cursor-nwse-resize"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}

