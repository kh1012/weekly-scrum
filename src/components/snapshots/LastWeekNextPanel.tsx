"use client";

import { useEffect, useRef, useState } from "react";
import type { LastWeekNextItem } from "@/lib/data/lastWeekNext";

interface LastWeekNextPanelProps {
  isOpen: boolean;
  onClose: () => void;
  items: LastWeekNextItem[];
  isLoading: boolean;
}

const MIN_WIDTH = 360;
const MIN_HEIGHT = 300;
const MAX_WIDTH = 800;
const MAX_HEIGHT = 800;
const DEFAULT_WIDTH = 480;
const DEFAULT_HEIGHT = 500;

export function LastWeekNextPanel({
  isOpen,
  onClose,
  items,
  isLoading,
}: LastWeekNextPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [isResizing, setIsResizing] = useState<"left" | "top" | null>(null);

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

  // Resize 핸들러
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!panelRef.current) return;

      const rect = panelRef.current.getBoundingClientRect();

      if (isResizing === "left") {
        // 좌측 resize: 오른쪽 끝 고정, 왼쪽으로 확장/축소
        const newWidth = rect.right - e.clientX;
        if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
          setWidth(newWidth);
        }
      } else if (isResizing === "top") {
        // 상단 resize: 하단 고정, 위로 확장/축소
        const newHeight = rect.bottom - e.clientY;
        if (newHeight >= MIN_HEIGHT && newHeight <= MAX_HEIGHT) {
          setHeight(newHeight);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  if (!isOpen) return null;

  return (
    <>
      {/* Resize 핸들 - 좌측 */}
      <div
        className="fixed z-[10000] cursor-ew-resize hover:bg-blue-400/30 transition-colors"
        style={{
          right: `${6 + width}px`,
          bottom: "80px",
          width: "4px",
          height: `${height}px`,
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing("left");
        }}
      />

      {/* Resize 핸들 - 상단 */}
      <div
        className="fixed z-[10000] cursor-ns-resize hover:bg-blue-400/30 transition-colors"
        style={{
          right: "24px",
          bottom: `${80 + height}px`,
          width: `${width}px`,
          height: "4px",
        }}
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing("top");
        }}
      />

      {/* Popover Panel - 우측 하단에 고정 */}
      <div
        ref={panelRef}
        className="fixed right-6 bottom-20 bg-white rounded-md shadow-lg z-[9999] flex flex-col animate-in zoom-in-95 fade-in duration-200 border border-[#d0d7de]"
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      >
        {/* Header - GitHub 스타일 */}
        <div className="shrink-0 px-3 py-2 border-b border-[#d0d7de] bg-[#f6f8fa] rounded-t-md">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#24292f]">
              지난 주 Next 참고
            </h2>
            <button
              onClick={onClose}
              className="shrink-0 p-1 rounded hover:bg-[#d0d7de]/50 transition-colors"
              title="닫기 (ESC)"
            >
              <svg
                className="w-4 h-4 text-[#57606a]"
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

        {/* Body - GitHub 스타일 */}
        <div className="flex-1 overflow-y-auto p-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0969da]" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                className="w-12 h-12 text-[#d0d7de] mb-3"
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
              <p className="text-xs font-medium text-[#57606a] mb-0.5">
                지난 주 Next가 없습니다
              </p>
              <p className="text-[10px] text-[#8c959f]">
                이전 주차에 작성된 Next 항목이 없습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-2 border border-[#d0d7de] rounded hover:border-[#0969da] hover:shadow-sm transition-all bg-white"
                >
                  {/* Entry 메타 정보 */}
                  <div className="mb-1.5">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#ddf4ff] text-[#0969da] border border-[#54aeff80]">
                        {item.feature}
                      </span>
                    </div>
                    {(item.project || item.module) && (
                      <div className="text-[9px] text-[#57606a]">
                        {item.project}
                        {item.project && item.module && " / "}
                        {item.module}
                      </div>
                    )}
                  </div>

                  {/* Next 리스트 */}
                  <div className="space-y-1">
                    {item.next.map((nextItem, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-[11px] text-[#24292f] leading-snug"
                      >
                        <span className="text-[#1f883d] mt-0.5 shrink-0">
                          •
                        </span>
                        <span className="flex-1">{nextItem}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer 안내 - GitHub 스타일 */}
        {!isLoading && items.length > 0 && (
          <div className="shrink-0 px-3 py-2 border-t border-[#d0d7de] bg-[#f6f8fa] rounded-b-md">
            <p className="text-[10px] text-[#57606a] text-center">
              참고용입니다. 자동으로 복사되지 않습니다.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
