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
        className="fixed z-[10000] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        style={{
          left: position.x,
          top: position.y,
          minWidth: 200,
          background: "white",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          boxShadow:
            "0 16px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)",
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
              onClose();
            }}
            className="w-full px-4 py-2 text-left flex items-center gap-2 group transition-all duration-150"
            style={{
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background =
                "linear-gradient(90deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <div className="flex-1">
              <div className="text-sm  text-gray-900">상세정보 보기</div>
            </div>
          </button>
        </div>
      </div>
    </>,
    document.body
  );
}
