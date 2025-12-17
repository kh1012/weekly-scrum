/**
 * 작업 종료 확인 모달
 * - Airbnb 스타일 디자인
 * - 3가지 옵션: 저장하고 종료, 변경사항 폐기, 취소
 */

"use client";

import { XIcon, SaveIcon } from "@/components/common/Icons";

interface ConfirmDiscardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onSaveAndClose?: () => void;
  changesCount?: number;
}

export function ConfirmDiscardModal({
  isOpen,
  onClose,
  onConfirm,
  onSaveAndClose,
  changesCount = 0,
}: ConfirmDiscardModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* 상단 경고 배너 */}
        <div
          className="px-6 py-4"
          style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/20">
              <span className="text-xl">⚠️</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-900">
                작업 종료
              </h3>
              <p className="text-sm text-amber-700">
                저장되지 않은 변경사항이 있습니다
              </p>
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-200/50 rounded-lg transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>

        {/* 본문 */}
        <div className="px-6 py-5">
          <p className="text-gray-600 leading-relaxed">
            {changesCount > 0 && (
              <span className="font-semibold text-gray-900">{changesCount}개의 변경사항</span>
            )}
            {changesCount > 0 ? "이 " : "변경사항이 "}
            저장되지 않았습니다.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            어떻게 하시겠습니까?
          </p>
        </div>

        {/* 버튼 - 3가지 옵션 */}
        <div className="px-6 py-4 bg-gray-50 space-y-3">
          {/* 저장하고 종료 */}
          {onSaveAndClose && (
            <button
              onClick={() => {
                onSaveAndClose();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all hover:shadow-lg active:scale-[0.98] text-white"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              }}
            >
              <SaveIcon className="w-4 h-4" />
              저장하고 종료
            </button>
          )}

          {/* 변경사항 폐기 */}
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full px-4 py-3 rounded-xl font-medium transition-all hover:opacity-90 active:scale-[0.98] text-white"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            }}
          >
            변경사항 폐기
          </button>

          {/* 취소 */}
          <button
            onClick={onClose}
            className="w-full px-4 py-3 rounded-xl font-medium transition-all hover:bg-gray-200 active:scale-[0.98]"
            style={{
              background: "#e5e7eb",
              color: "#374151",
            }}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

