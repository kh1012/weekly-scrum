/**
 * Mismatch Review Panel
 *
 * Floating button + popover for reviewing alignment mismatches
 * - RED and ORANGE status plans only
 * - Neutral, non-judgmental tone
 * - Click to focus timeline on the relevant plan
 */

"use client";

import { useState, useRef, useEffect } from "react";
import type { AlignmentMismatch } from "@/lib/alignment/alignmentStatus";

interface MismatchReviewPanelProps {
  mismatches: AlignmentMismatch[];
  onFocusMismatch?: (mismatch: AlignmentMismatch) => void;
}

export function MismatchReviewPanel({
  mismatches,
  onFocusMismatch,
}: MismatchReviewPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Mismatch가 없으면 숨김
  if (mismatches.length === 0) {
    return null;
  }

  const handleMismatchClick = (mismatch: AlignmentMismatch) => {
    onFocusMismatch?.(mismatch);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
        style={{
          background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        }}
        title={`${mismatches.length}개의 검토 항목`}
      >
        {/* Badge with count */}
        <div className="relative flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {mismatches.length > 0 && (
            <span
              className="absolute -top-2 -right-2 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full"
              style={{
                background: "#ef4444",
                color: "white",
              }}
            >
              {mismatches.length}
            </span>
          )}
        </div>
      </button>

      {/* Popover Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 z-50 w-96 max-h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col"
          style={{
            animation: "slideUp 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">
                실행 커버리지 검토
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {mismatches.length}개 항목의 실행 기록 확인이 필요합니다
            </p>
          </div>

          {/* Mismatch List */}
          <div className="flex-1 overflow-y-auto">
            {mismatches.map((mismatch, index) => (
              <button
                key={`${mismatch.planId}-${index}`}
                onClick={() => handleMismatchClick(mismatch)}
                className="w-full px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Status Icon + Meta Path */}
                <div className="flex items-start gap-2 mb-1.5">
                  <div className="shrink-0 mt-0.5">
                    {mismatch.status === "red" ? (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#ef4444" }}
                        title="No execution detected"
                      />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ background: "#f59e0b" }}
                        title="Insufficient coverage"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">
                      {mismatch.metaPath}
                    </div>
                  </div>
                </div>

                {/* Plan Title */}
                {mismatch.planTitle && (
                  <div className="text-xs text-gray-600 ml-5 mb-1 truncate">
                    {mismatch.planTitle}
                  </div>
                )}

                {/* Explanation */}
                <div className="text-xs text-gray-500 ml-5 leading-relaxed">
                  {mismatch.status === "red"
                    ? "No execution snapshot detected within the planned period."
                    : "Execution snapshots exist, but coverage is below the expected range."}
                </div>

                {/* Coverage Stats */}
                <div className="flex items-center gap-3 ml-5 mt-1.5 text-[10px] text-gray-400">
                  <span>
                    실행 {mismatch.actualCount} / 예상 {mismatch.expectedCount}
                  </span>
                  <span>•</span>
                  <span>
                    {mismatch.planStartDate} ~ {mismatch.planEndDate}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Footer Hint */}
          <div className="px-4 py-2.5 border-t border-gray-200 bg-gray-50">
            <p className="text-[10px] text-gray-500 text-center">
              항목을 클릭하면 타임라인에서 해당 계획을 확인할 수 있습니다
            </p>
          </div>
        </div>
      )}

      {/* Slide up animation */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
