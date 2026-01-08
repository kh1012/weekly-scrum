/**
 * Change History Button
 * Plans 변경 이력을 보여주는 버튼 및 팝오버
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChangeHistoryPopover } from "./ChangeHistoryPopover";
import { getPlansChangeHistoryAction } from "@/app/actions/planChangeHistory";
import type { ChangeHistoryResponse } from "@/lib/data/planChangeHistory";

interface ChangeHistoryButtonProps {
  workspaceId: string;
  maxUpdatedAt: string;
  updatedByName?: string;
}

/**
 * 상대 시간 포맷 (예: "3 hours ago")
 */
function formatRelativeTime(isoString: string): string {
  const now = new Date();
  const target = new Date(isoString);
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  }
}

export function ChangeHistoryButton({
  workspaceId,
  maxUpdatedAt,
  updatedByName,
}: ChangeHistoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [cachedData, setCachedData] = useState<ChangeHistoryResponse | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function prefetchData() {
      try {
        const result = await getPlansChangeHistoryAction(workspaceId);
        setCachedData(result);
      } catch (error) {
        console.error("[ChangeHistoryButton] Prefetch error:", error);
        setCachedData({ success: false, groups: [], error: "데이터를 불러올 수 없습니다." });
      } finally {
        setIsInitialLoad(false);
      }
    }

    prefetchData();
  }, [workspaceId]);

  const handleFetchHistory = useCallback(
    async (wsId: string): Promise<ChangeHistoryResponse> => {
      if (cachedData) {
        return cachedData;
      }
      return await getPlansChangeHistoryAction(wsId);
    },
    [cachedData]
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const getPopoverPosition = useCallback(() => {
    if (!buttonRef.current) return { left: 0, top: 0 };

    const rect = buttonRef.current.getBoundingClientRect();
    const padding = 12;
    const popoverWidth = 420;
    const popoverHeight = 480;

    let left = rect.left;
    let top = rect.bottom + padding;

    if (left + popoverWidth > window.innerWidth) {
      left = window.innerWidth - popoverWidth - padding;
    }

    if (left < padding) {
      left = padding;
    }

    if (top + popoverHeight > window.innerHeight) {
      top = rect.top - popoverHeight - padding;
    }

    if (top < padding) {
      top = padding;
    }

    return { left, top };
  }, []);

  const position = getPopoverPosition();

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="hidden md:flex items-center gap-1.5 px-2.5 rounded text-xs font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 transition-all cursor-pointer h-8"
      >
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium text-gray-700">
          {formatRelativeTime(maxUpdatedAt)}
        </span>
        {updatedByName && (
          <>
            <span className="text-gray-400">·</span>
            <span className="font-medium text-gray-700">{updatedByName}</span>
          </>
        )}
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className="fixed z-50 rounded-xl shadow-2xl bg-white animate-in zoom-in-95 fade-in duration-150 border border-gray-200"
          style={{
            left: position.left,
            top: position.top,
            boxShadow:
              "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          }}
        >
          <ChangeHistoryPopover
            workspaceId={workspaceId}
            onFetchHistory={handleFetchHistory}
            isInitialLoad={isInitialLoad}
          />
        </div>
      )}
    </>
  );
}

