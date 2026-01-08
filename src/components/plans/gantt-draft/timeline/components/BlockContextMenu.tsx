/**
 * BlockContextMenu - 블록 우클릭 컨텍스트 메뉴
 */

"use client";

import { createPortal } from "react-dom";
import { EyeIcon } from "@/components/common/Icons";

interface BlockContextMenuProps {
  position: { x: number; y: number } | null;
  onViewDetails: () => void;
  onClose: () => void;
}

export function BlockContextMenu({
  position,
  onViewDetails,
  onClose,
}: BlockContextMenuProps) {
  if (!position) return null;

  return createPortal(
    <>
      {/* 배경 오버레이 (클릭 시 닫기) */}
      <div
        className="fixed inset-0 z-[9999]"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* 컨텍스트 메뉴 */}
      <div
        className="fixed z-[10000] bg-white border border-[#d0d7de] rounded-md overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        style={{
          left: position.x,
          top: position.y,
          minWidth: 160,
          boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
              onClose();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-2 transition-colors duration-150 hover:bg-[#f6f8fa]"
          >
            <div className="flex-1">
              <div className="text-sm text-[#24292f]">상세정보 보기</div>
            </div>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
