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

// localStorage 키 (Plans와 Snapshots 별도)
const PLAN_POPOVER_SIZE_KEY = "plan-view-popover-size";
const SNAPSHOT_POPOVER_SIZE_KEY = "snapshot-view-popover-size";

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
    this_week?: {
      tasks?: string[];
    };
    collaborators?: Array<{ name: string; relations?: string[] }>;
    risks?: string[];
    risk_level?: number;
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
    const storageKey = bar.isSnapshot
      ? SNAPSHOT_POPOVER_SIZE_KEY
      : PLAN_POPOVER_SIZE_KEY;
    const defaultSize = bar.isSnapshot
      ? { width: 380, height: 520 } // Snapshot: 더 컴팩트한 크기
      : { width: 320, height: 360 }; // Plan: 더 컴팩트한 크기

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // localStorage 접근 실패 시 무시
    }
    return defaultSize;
  });

  // 리사이즈 상태
  const [isResizing, setIsResizing] = useState(false);
  const resizeStartRef = useRef<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

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
  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsResizing(true);
      resizeStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height,
      };
    },
    [size]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeStartRef.current) return;

      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      const newWidth = Math.max(
        320,
        Math.min(800, resizeStartRef.current.width + deltaX)
      );
      const newHeight = Math.max(
        300,
        Math.min(800, resizeStartRef.current.height + deltaY)
      );

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // localStorage에 저장 (Plans와 Snapshots 별도)
      const storageKey = bar.isSnapshot
        ? SNAPSHOT_POPOVER_SIZE_KEY
        : PLAN_POPOVER_SIZE_KEY;
      try {
        localStorage.setItem(storageKey, JSON.stringify(size));
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
      className="fixed z-50 bg-white border border-[#d0d7de] rounded-md animate-in zoom-in-95 fade-in duration-150 flex flex-col"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
        cursor: isResizing ? "nwse-resize" : "default",
      }}
    >
      {/* 헤더 */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 py-2 rounded-t-md bg-[#f6f8fa] border-b border-[#d0d7de]"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="px-1.5 py-0.5 text-xs font-medium rounded"
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
            }}
          >
            {bar.stage}
          </span>
          <span
            className={`px-1.5 py-0.5 text-xs font-medium rounded ${
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
          className="p-1 rounded hover:bg-[#d0d7de] transition-colors duration-150"
        >
          <XIcon className="w-3.5 h-3.5 text-[#57606a]" />
        </button>
      </div>

      {/* 콘텐츠 */}
      <div className="p-3 space-y-3 overflow-y-auto flex-1 min-h-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-[#57606a]">
          <span className="font-medium text-[#24292f]">{project}</span>
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-medium text-[#24292f]">{module}</span>
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="font-medium text-[#24292f]">{feature}</span>
        </div>

        {/* 제목 */}
        <h3 className="text-base font-semibold text-[#24292f] leading-snug">
          {bar.title}
        </h3>

        {/* 기간 */}
        <div className="flex items-center gap-2 text-sm text-[#57606a]">
          <div className="w-6 h-6 rounded bg-[#ddf4ff] flex items-center justify-center">
            <CalendarIcon className="w-3 h-3 text-[#0969da]" />
          </div>
          <span className="font-medium text-[#24292f]">
            {bar.startDate} ~ {bar.endDate}
          </span>
        </div>

        {/* 담당자 */}
        {bar.assignees && bar.assignees.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-semibold text-[#24292f]">
              <UserIcon className="w-3.5 h-3.5" />
              담당자
            </div>
            <div className="flex flex-wrap gap-1.5">
              {bar.assignees.map((assignee, index) => {
                const roleConfig = ROLE_CONFIG[assignee.role] || {
                  label: assignee.role,
                  color: "#6b7280",
                };
                return (
                  <div
                    key={index}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-[#f6f8fa] border border-[#d0d7de]"
                  >
                    <span
                      className="px-1.5 py-0.5 text-xs font-medium rounded text-white"
                      style={{ background: roleConfig.color }}
                    >
                      {roleConfig.label}
                    </span>
                    <span className="text-xs font-medium text-[#24292f]">
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
          <div className="space-y-1.5">
            <div className="text-xs font-semibold text-[#24292f]">설명</div>
            <div className="text-xs text-[#57606a] leading-relaxed p-2 rounded bg-[#f6f8fa] border border-[#d0d7de] whitespace-pre-wrap">
              {bar.description}
            </div>
          </div>
        )}

        {/* 링크 */}
        {hasLinks && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1 text-xs font-semibold text-[#24292f]">
              <LinkIcon className="w-3.5 h-3.5" />
              관련 링크
            </div>
            <div className="space-y-1.5">
              {bar.links!.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded bg-[#f6f8fa] border border-[#d0d7de] hover:bg-[#ddf4ff] hover:border-[#0969da] transition-colors group"
                >
                  <LinkIcon className="w-3 h-3 text-[#0969da] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[#0969da] group-hover:underline truncate">
                      {link.label || link.url}
                    </div>
                    {link.label && (
                      <div className="text-xs text-[#57606a] truncate">
                        {link.url}
                      </div>
                    )}
                  </div>
                  <svg
                    className="w-3 h-3 text-[#57606a] group-hover:text-[#0969da] transition-colors flex-shrink-0"
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
          <div className="space-y-3 border-t border-[#d0d7de] pt-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-[#24292f] text-white text-xs font-medium rounded">
                📸 Snapshot Entry
              </span>
            </div>

            {/* Tasks */}
            {bar.past_week.tasks && bar.past_week.tasks.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#24292f]">
                  PROGRESS
                </div>
                <div className="space-y-1">
                  {bar.past_week.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-xs p-2 rounded bg-[#f6f8fa] border border-[#d0d7de]"
                    >
                      <div className="flex-1">{task.title}</div>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-16 h-1.5 rounded-full overflow-hidden bg-[#d0d7de]"
                        >
                          <div
                            className="h-full rounded-full bg-[#1a7f37]"
                            style={{
                              width: `${task.progress}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[#57606a] w-8 text-right">
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
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#24292f]">
                  진행 상황
                </div>
                <div className="text-xs text-[#57606a] leading-relaxed p-2 rounded bg-[#f6f8fa] border border-[#d0d7de] whitespace-pre-wrap">
                  {bar.past_week.progress}
                </div>
              </div>
            )}

            {/* Next */}
            {bar.this_week?.tasks && bar.this_week.tasks.length > 0 ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#24292f]">NEXT</div>
                <ul className="space-y-1">
                  {bar.this_week.tasks.map((task, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-xs p-2 rounded bg-[#f6f8fa] border border-[#d0d7de]"
                    >
                      <span className="text-[#57606a] mt-0.5">•</span>
                      <span className="flex-1 text-[#24292f]">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : bar.past_week?.next ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#24292f]">NEXT</div>
                <div className="text-xs text-[#57606a] leading-relaxed p-2 rounded bg-[#f6f8fa] border border-[#d0d7de] whitespace-pre-wrap">
                  {bar.past_week.next}
                </div>
              </div>
            ) : null}

            {/* Risk */}
            {(bar.risks && bar.risks.length > 0) || bar.risk_level ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-semibold text-[#24292f]">
                    RISK
                  </div>
                  {bar.risk_level && bar.risk_level > 0 && (
                    <span
                      className={`px-1.5 py-0.5 text-xs font-medium rounded ${
                        bar.risk_level >= 3
                          ? "bg-red-100 text-red-600 border border-red-200"
                          : bar.risk_level >= 2
                          ? "bg-orange-100 text-orange-600 border border-orange-200"
                          : "bg-yellow-100 text-yellow-600 border border-yellow-200"
                      }`}
                    >
                      Lv.{bar.risk_level}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#cf222e] leading-relaxed p-2 rounded bg-[#ffebe9] border border-[#ff8182]">
                  {bar.risks && bar.risks.length > 0 ? (
                    <ul className="space-y-1">
                      {bar.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-[#cf222e] mt-0.5">•</span>
                          <span className="flex-1">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>미정</span>
                  )}
                </div>
              </div>
            ) : bar.past_week?.risk ? (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#24292f]">RISK</div>
                <div className="text-xs text-[#cf222e] leading-relaxed p-2 rounded bg-[#ffebe9] border border-[#ff8182] whitespace-pre-wrap">
                  {bar.past_week.risk}
                </div>
              </div>
            ) : null}

            {/* Collaborators (WITH) */}
            {bar.collaborators && bar.collaborators.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#24292f]">WITH</div>
                <div className="flex flex-wrap gap-1.5">
                  {bar.collaborators.map((c, i) => {
                    const relation = c.relations?.[0];
                    const styles = {
                      pair: {
                        bg: "#f3e8ff",
                        text: "#7c3aed",
                        label: "페어",
                        border: "#d8b4fe",
                      },
                      pre: {
                        bg: "#dbeafe",
                        text: "#2563eb",
                        label: "선행",
                        border: "#93c5fd",
                      },
                      post: {
                        bg: "#d1fae5",
                        text: "#059669",
                        label: "후행",
                        border: "#6ee7b7",
                      },
                    };
                    const style = styles[relation as keyof typeof styles] || {
                      bg: "#f3f4f6",
                      text: "#6b7280",
                      label: "",
                      border: "#d1d5db",
                    };
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        {c.name}
                        {style.label && (
                          <span className="opacity-75 text-xs">
                            ({style.label})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Memo */}
            {bar.past_week.memo && (
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[#24292f]">메모</div>
                <div className="text-xs text-[#57606a] leading-relaxed p-2 rounded bg-[#f6f8fa] border border-[#d0d7de] whitespace-pre-wrap">
                  {bar.past_week.memo}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 정보 없음 표시 (Plans만) */}
        {!bar.isSnapshot && !hasDescription && !hasLinks && (
          <div className="text-xs text-[#57606a] text-center py-3">
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
