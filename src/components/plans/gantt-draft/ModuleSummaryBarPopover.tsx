/**
 * ModuleSummaryBarPopover 컴포넌트
 * - Summarized 모드에서 ModuleSummaryBar 클릭 시 표시되는 상세 정보 팝오버
 * - 모듈명, 참여인원, 기능명 리스트, 기간 일 수, 속한 Flags 표시
 */

"use client";

import { useCallback, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  XIcon,
  CalendarIcon,
  UserIcon,
  CubeIcon,
  FlagIcon,
} from "@/components/common/Icons";
import type { DraftFlag } from "./types";

interface ModuleSummaryBarPopoverProps {
  module: string;
  project: string;
  startDate: string;
  endDate: string;
  featureCount: number;
  features: string[]; // 기능명 리스트
  assignees: Array<{ userId: string; displayName?: string; role: string }>;
  flags: DraftFlag[]; // 겹치는 Flags
  anchorRect: DOMRect | null;
  onClose: () => void;
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  planner: { label: "기획", color: "#f59e0b" },
  designer: { label: "디자인", color: "#ec4899" },
  fe: { label: "FE", color: "#3b82f6" },
  be: { label: "BE", color: "#10b981" },
  qa: { label: "QA", color: "#8b5cf6" },
};

/**
 * 기간 일 수 계산 (시작일과 종료일 포함)
 */
function getDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * 날짜 포맷 (YYYY.MM.DD)
 */
function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${year}.${month}.${day}`;
}

export function ModuleSummaryBarPopover({
  module,
  project,
  startDate,
  endDate,
  featureCount,
  features,
  assignees,
  flags,
  anchorRect,
  onClose,
}: ModuleSummaryBarPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // 기간 일 수 계산
  const durationDays = useMemo(() => getDuration(startDate, endDate), [startDate, endDate]);

  // 역할별 담당자 그룹핑
  const assigneesByRole = useMemo(() => {
    const grouped: Record<string, typeof assignees> = {};
    for (const assignee of assignees) {
      if (!grouped[assignee.role]) {
        grouped[assignee.role] = [];
      }
      grouped[assignee.role].push(assignee);
    }
    return grouped;
  }, [assignees]);

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

    // 약간의 딜레이 후 이벤트 등록 (클릭으로 열릴 때 바로 닫히는 것 방지)
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  // 위치 계산 (화면 밖으로 나가지 않도록)
  const getPopoverPosition = useCallback(() => {
    if (!anchorRect) return { x: 0, y: 0 };

    const popoverWidth = 480;
    const popoverHeight = 600;
    const padding = 16;

    let x = anchorRect.left + anchorRect.width / 2 - popoverWidth / 2;
    let y = anchorRect.bottom + 12;

    // 우측 경계 체크
    if (x + popoverWidth > window.innerWidth - padding) {
      x = window.innerWidth - popoverWidth - padding;
    }

    // 좌측 경계 체크
    if (x < padding) {
      x = padding;
    }

    // 하단 경계 체크 (팝오버가 화면 밖으로 나가면 위쪽에 표시)
    if (y + popoverHeight > window.innerHeight - padding) {
      y = anchorRect.top - popoverHeight - 12;
    }

    // 상단 경계 체크
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  }, [anchorRect]);

  if (!anchorRect) return null;

  const position = getPopoverPosition();

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-[480px] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[600px]"
      style={{
        left: position.x,
        top: position.y,
        background: "white",
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      }}
    >
      {/* 헤더 */}
      <div
        className="flex-shrink-0 px-5 py-4 rounded-t-2xl"
        style={{
          background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              }}
            >
              <CubeIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="text-base font-semibold text-gray-900">{module}</div>
              <div className="text-xs text-gray-500 mt-0.5">{project}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-150 active:scale-95"
          >
            <XIcon className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* 기간 정보 */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500 mb-1">기간</div>
            <div className="text-sm text-gray-900">
              {formatDate(startDate)} - {formatDate(endDate)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              총 {durationDays}일
            </div>
          </div>
        </div>

        {/* 기능 개수 */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <CubeIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="text-xs font-medium text-gray-500 mb-1">기능</div>
            <div className="text-sm text-gray-900">
              {featureCount}개 기능
            </div>
          </div>
        </div>

        {/* 기능명 리스트 */}
        {features.length > 0 && (
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs font-medium text-gray-700 mb-2">기능 목록</div>
            <div className="space-y-1.5 max-h-40 overflow-y-auto">
              {features.map((feature, idx) => (
                <div
                  key={idx}
                  className="text-sm text-gray-600 flex items-center gap-2"
                >
                  <span className="w-1 h-1 rounded-full bg-gray-400 flex-shrink-0" />
                  <span className="truncate">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 담당자 정보 (역할별 그룹핑) */}
        {assignees.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
              <UserIcon className="w-4 h-4 text-green-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 mb-2">참여인원</div>
              <div className="space-y-2">
                {Object.entries(assigneesByRole).map(([role, members]) => {
                  const roleConfig = ROLE_CONFIG[role] || { label: role, color: "#6b7280" };
                  return (
                    <div key={role} className="flex items-start gap-2">
                      <span
                        className="px-2 py-0.5 text-xs font-medium rounded flex-shrink-0"
                        style={{
                          background: `${roleConfig.color}20`,
                          color: roleConfig.color,
                        }}
                      >
                        {roleConfig.label}
                      </span>
                      <div className="flex-1 flex flex-wrap gap-1.5">
                        {members.map((member, idx) => (
                          <span
                            key={idx}
                            className="text-xs text-gray-700 bg-white px-2 py-0.5 rounded border border-gray-200"
                          >
                            {member.displayName || member.userId}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Flags 정보 */}
        {flags.length > 0 && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
              <FlagIcon className="w-4 h-4 text-red-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-gray-500 mb-2">관련 Flags</div>
              <div className="space-y-2">
                {flags.map((flag) => (
                  <div
                    key={flag.clientId}
                    className="flex items-center gap-2 p-2 rounded-lg bg-white border border-gray-200"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: flag.color || "#ef4444" }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">{flag.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {formatDate(flag.startDate)}
                        {flag.startDate !== flag.endDate && ` - ${formatDate(flag.endDate)}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

