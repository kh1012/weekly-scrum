/**
 * 저장 결과 모달
 */

"use client";

import { useEffect } from "react";
import { CheckIcon, XIcon, AlertIcon } from "@/components/common/Icons";

interface SaveResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: {
    success: boolean;
    upsertedCount?: number;
    deletedCount?: number;
    error?: string;
  } | null;
  onRefresh?: () => void;
}

export function SaveResultModal({
  isOpen,
  onClose,
  result,
  onRefresh,
}: SaveResultModalProps) {
  // ESC로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !result) return null;

  const handleConfirm = () => {
    onClose();
    if (result.success && onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* 모달 */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: "var(--notion-bg)" }}
      >
        {/* 헤더 */}
        <div
          className="flex items-center justify-center py-6"
          style={{
            background: result.success
              ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
              : "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
          }}
        >
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            {result.success ? (
              <CheckIcon className="w-10 h-10 text-white" />
            ) : (
              <XIcon className="w-10 h-10 text-white" />
            )}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 text-center">
          <h3
            className="text-lg font-semibold mb-2"
            style={{ color: "var(--notion-text)" }}
          >
            {result.success ? "저장 완료!" : "저장 실패"}
          </h3>

          {result.success ? (
            <div className="space-y-2">
              {(result.upsertedCount ?? 0) > 0 && (
                <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
                  <span className="font-medium" style={{ color: "#10b981" }}>
                    {result.upsertedCount}개
                  </span>{" "}
                  계획이 저장되었습니다
                </p>
              )}
              {(result.deletedCount ?? 0) > 0 && (
                <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
                  <span className="font-medium" style={{ color: "#ef4444" }}>
                    {result.deletedCount}개
                  </span>{" "}
                  계획이 삭제되었습니다
                </p>
              )}
              {(result.upsertedCount ?? 0) === 0 && (result.deletedCount ?? 0) === 0 && (
                <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
                  변경 사항이 없습니다
                </p>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
              <AlertIcon className="w-5 h-5 flex-shrink-0" style={{ color: "#ef4444" }} />
              <p className="text-sm text-left" style={{ color: "#ef4444" }}>
                {result.error || "알 수 없는 오류가 발생했습니다."}
              </p>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="px-6 pb-6">
          <button
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-lg font-medium transition-colors"
            style={{
              background: result.success ? "#10b981" : "var(--notion-bg-tertiary)",
              color: result.success ? "white" : "var(--notion-text)",
            }}
          >
            {result.success ? "확인" : "닫기"}
          </button>
        </div>
      </div>
    </div>
  );
}

