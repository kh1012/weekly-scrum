"use client";

import { useEffect, useRef } from "react";
import type { LastWeekNextItem } from "@/lib/data/lastWeekNext";

interface LastWeekNextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: LastWeekNextItem[];
  isLoading: boolean;
}

export function LastWeekNextPanel({
  isOpen,
  onClose,
  items,
  isLoading,
}: LastWeekNextPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Body 스크롤 잠금
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - 클릭해도 닫히지 않음 */}
      <div className="fixed inset-0 bg-black/40 z-[9998] transition-opacity" />

      {/* Popover Panel - 우측 하단에 고정 */}
      <div
        ref={panelRef}
        className="fixed right-6 bottom-20 w-[90vw] sm:w-[520px] max-h-[70vh] bg-white rounded-2xl shadow-2xl z-[9999] flex flex-col animate-in zoom-in-95 fade-in duration-200"
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white rounded-t-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900 mb-1">
                지난 주 Next 참고
              </h2>
              <p className="text-xs text-gray-500">
                지난 주에 작성한 Next입니다. 이번 주 카드 작성 시 참고하세요.
              </p>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/80 transition-colors"
              title="닫기 (ESC)"
            >
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm font-medium text-gray-600 mb-1">
                지난 주 Next가 없습니다
              </p>
              <p className="text-xs text-gray-400">
                이전 주차에 작성된 Next 항목이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all bg-white"
                >
                  {/* Entry 메타 정보 */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {item.feature}
                      </span>
                    </div>
                    {(item.project || item.module) && (
                      <div className="text-[10px] text-gray-500">
                        {item.project}
                        {item.project && item.module && " / "}
                        {item.module}
                      </div>
                    )}
                  </div>

                  {/* Next 리스트 */}
                  <div className="space-y-1.5">
                    {item.next.map((nextItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                        <span className="flex-1">{nextItem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer 안내 */}
        {!isLoading && items.length > 0 && (
          <div className="shrink-0 px-5 py-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <p className="text-xs text-gray-500 text-center">
              💡 참고용입니다. 자동으로 복사되지 않으며, 직접 작성해주세요.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

