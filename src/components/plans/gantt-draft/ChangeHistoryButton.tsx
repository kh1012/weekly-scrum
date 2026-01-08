/**
 * Change History Button
 * Plans 변경 이력을 보여주는 버튼 및 팝오버
 */

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChangeHistoryPopover } from "./ChangeHistoryPopover";
import { getPlansChangeHistory } from "@/lib/data/planChangeHistory";
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleFetchHistory = useCallback(
    async (wsId: string): Promise<ChangeHistoryResponse> => {
      return await getPlansChangeHistory(wsId);
    },
    []
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
    const padding = 8;

    let left = rect.left;
    let top = rect.bottom + padding;

    if (left + 384 > window.innerWidth) {
      left = window.innerWidth - 384 - padding;
    }

    if (left < padding) {
      left = padding;
    }

    if (top + 512 > window.innerHeight) {
      top = rect.top - 512 - padding;
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
        className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
      >
        <span>Updated</span>
        <span className="font-semibold text-gray-700">
          {formatRelativeTime(maxUpdatedAt)}
        </span>
        {updatedByName && (
          <>
            <span>by</span>
            <span className="font-semibold text-gray-700">{updatedByName}</span>
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
          className="fixed z-50 rounded-lg shadow-2xl bg-white animate-in zoom-in-95 fade-in duration-150"
          style={{
            left: position.left,
            top: position.top,
            boxShadow:
              "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)",
          }}
        >
          <ChangeHistoryPopover
            workspaceId={workspaceId}
            onFetchHistory={handleFetchHistory}
          />
        </div>
      )}
    </>
  );
}

