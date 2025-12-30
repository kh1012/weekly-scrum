/**
 * Flag View Popover
 * - readOnly 모드에서 Flag 상세 정보를 보여주는 팝오버
 */

"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  XIcon,
  CalendarIcon,
  FlagIcon,
  LinkIcon,
} from "@/components/common/Icons";
import type { DraftFlag } from "./types";

interface FlagViewPopoverProps {
  flag: DraftFlag;
  anchorPosition: { x: number; y: number };
  onClose: () => void;
}

export function FlagViewPopover({
  flag,
  anchorPosition,
  onClose,
}: FlagViewPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

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

  // 위치 계산 (화면 밖으로 나가지 않도록)
  const getPopoverPosition = useCallback(() => {
    const popoverWidth = 360;
    const popoverHeight = 300;
    const padding = 16;

    let x = anchorPosition.x;
    let y = anchorPosition.y;

    // 우측 경계 체크
    if (x + popoverWidth > window.innerWidth - padding) {
      x = window.innerWidth - popoverWidth - padding;
    }

    // 좌측 경계 체크
    if (x < padding) {
      x = padding;
    }

    // 하단 경계 체크
    if (y + popoverHeight > window.innerHeight - padding) {
      y = anchorPosition.y - popoverHeight - 8;
    }

    // 상단 경계 체크
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  }, [anchorPosition]);

  const position = getPopoverPosition();
  const hasLinks = flag.links && flag.links.length > 0;
  const flagColor = flag.color || "#ef4444";
  const isPointFlag = flag.startDate === flag.endDate;

  return (
    <div
      ref={popoverRef}
      className="fixed z-[9999] w-[360px] rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in duration-150 flex flex-col max-h-[400px]"
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
        className="flex-shrink-0 flex items-center justify-between px-4 py-3"
        style={{
          background: `linear-gradient(135deg, ${flagColor}15 0%, ${flagColor}08 100%)`,
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${flagColor} 0%, ${flagColor}cc 100%)`,
            }}
          >
            <FlagIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span
            className="px-2 py-0.5 text-xs font-medium rounded-md"
            style={{
              background: `${flagColor}20`,
              color: flagColor,
            }}
          >
            {isPointFlag ? "포인트 Flag" : "범위 Flag"}
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
        {/* 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 leading-snug break-words">
          {flag.title}
        </h3>

        {/* 기간 */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${flagColor} 0%, ${flagColor}cc 100%)`,
            }}
          >
            <CalendarIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-medium">
            {isPointFlag
              ? flag.startDate
              : `${flag.startDate} ~ ${flag.endDate}`}
          </span>
        </div>

        {/* 링크 */}
        {hasLinks && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-700">
              <LinkIcon className="w-4 h-4" />
              관련 링크
            </div>
            <div className="space-y-2">
              {flag.links!.map((link, index) => (
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

        {/* 정보 없음 표시 */}
        {!hasLinks && (
          <div className="text-sm text-gray-400 text-center py-4">
            추가 정보가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

