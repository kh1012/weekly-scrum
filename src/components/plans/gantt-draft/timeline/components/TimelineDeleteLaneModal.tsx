/**
 * TimelineDeleteLaneModal - 레인 삭제 확인 모달
 */

"use client";

import { createPortal } from "react-dom";
import { TrashIcon } from "@/components/common/Icons";

interface TimelineDeleteLaneModalProps {
  deleteLaneConfirm: {
    rowId: string;
    laneIndex: number;
    visibleBarsCount: number;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function TimelineDeleteLaneModal({
  deleteLaneConfirm,
  onConfirm,
  onCancel,
}: TimelineDeleteLaneModalProps) {
  if (!deleteLaneConfirm) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.5)" }}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          background: "white",
          boxShadow:
            "0 20px 60px rgba(0, 0, 0, 0.3), 0 8px 16px rgba(0, 0, 0, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div
          className="px-6 py-5"
          style={{
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
              <TrashIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">레인 삭제 확인</h3>
              <p className="text-sm text-white/80">
                {deleteLaneConfirm.visibleBarsCount}개의 계획이 있습니다
              </p>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          <p className="text-sm text-gray-700 leading-relaxed">
            이 레인에는 현재{" "}
            <span className="font-bold text-red-600">
              {deleteLaneConfirm.visibleBarsCount}개의 계획
            </span>
            이 있습니다.
            <br />
            <br />
            레인을 삭제하면 해당 계획들은 다른 레인으로 자동 재배치됩니다.
            <br />
            계속하시겠습니까?
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 px-6 pb-6" style={{ background: "#f9fafb" }}>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-95"
            style={{
              background: "white",
              border: "1px solid #e5e7eb",
              color: "#6b7280",
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 rounded-xl text-sm font-bold text-white transition-all duration-150 active:scale-95 shadow-lg hover:shadow-xl"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            }}
          >
            삭제
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

