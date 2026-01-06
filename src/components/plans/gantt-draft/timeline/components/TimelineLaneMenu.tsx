/**
 * TimelineLaneMenu - 레인 컨텍스트 메뉴
 */

"use client";

import { createPortal } from "react-dom";
import { PlusIcon, TrashIcon } from "@/components/common/Icons";

interface TimelineLaneMenuProps {
  laneContextMenu: {
    rowId: string;
    laneIndex: number;
    position: { x: number; y: number };
  } | null;
  onAddLane: (position: "above" | "below") => void;
  onDeleteLane: () => void;
}

export function TimelineLaneMenu({
  laneContextMenu,
  onAddLane,
  onDeleteLane,
}: TimelineLaneMenuProps) {
  if (!laneContextMenu) return null;

  return createPortal(
    <div
      className="fixed z-[10000] rounded-xl overflow-hidden"
      style={{
        left: laneContextMenu.position.x,
        top: laneContextMenu.position.y,
        minWidth: 200,
        background: "white",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow:
          "0 16px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)",
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="py-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddLane("below");
          }}
          className="w-full px-4 py-2.5 text-left flex items-center gap-3 group transition-all duration-150"
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
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 group-hover:bg-blue-100 transition-colors">
            <PlusIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">레인 추가</div>
            <div className="text-xs text-gray-500">아래에 새로운 레인 생성</div>
          </div>
        </button>

        <div
          className="mx-3 my-2"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.08) 50%, transparent 100%)",
          }}
        />

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteLane();
          }}
          className="w-full px-4 py-2.5 text-left flex items-center gap-3 group transition-all duration-150"
          style={{
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background =
              "linear-gradient(90deg, rgba(239, 68, 68, 0.06) 0%, rgba(239, 68, 68, 0.02) 100%)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 group-hover:bg-red-100 transition-colors">
            <TrashIcon className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">레인 삭제</div>
            <div className="text-xs text-gray-500">현재 레인 제거</div>
          </div>
        </button>
      </div>
    </div>,
    document.body
  );
}

