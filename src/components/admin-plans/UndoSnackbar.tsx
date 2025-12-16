"use client";

import { useEffect, useState, useCallback } from "react";

export interface UndoSnackbarProps {
  /** 스낵바 표시 여부 */
  isVisible: boolean;
  /** 메시지 */
  message: string;
  /** Undo 버튼 클릭 핸들러 */
  onUndo: () => void;
  /** 스낵바 닫기 (타임아웃 또는 수동) */
  onClose: () => void;
  /** 타임아웃 (ms), 기본값 5000 */
  timeout?: number;
}

/**
 * Airbnb 스타일 Undo 스낵바
 * - 하단 중앙에 표시
 * - 5초 후 자동 닫힘
 * - Undo 버튼으로 작업 취소
 */
export function UndoSnackbar({
  isVisible,
  message,
  onUndo,
  onClose,
  timeout = 5000,
}: UndoSnackbarProps) {
  const [progress, setProgress] = useState(100);
  const [isLeaving, setIsLeaving] = useState(false);

  // 타이머 및 프로그레스 바
  useEffect(() => {
    if (!isVisible) {
      setProgress(100);
      setIsLeaving(false);
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + timeout;

    const updateProgress = () => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / timeout) * 100;
      setProgress(newProgress);

      if (remaining > 0) {
        requestAnimationFrame(updateProgress);
      } else {
        // 타임아웃 시 fade out 후 닫기
        setIsLeaving(true);
        setTimeout(onClose, 150);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [isVisible, timeout, onClose]);

  // Undo 클릭 핸들러
  const handleUndo = useCallback(() => {
    setIsLeaving(true);
    setTimeout(() => {
      onUndo();
      onClose();
    }, 100);
  }, [onUndo, onClose]);

  // 닫기 핸들러
  const handleClose = useCallback(() => {
    setIsLeaving(true);
    setTimeout(onClose, 150);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-150 ${
        isLeaving ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
      }`}
      style={{
        animation: isLeaving ? undefined : "snackbarSlideUp 200ms ease-out",
      }}
    >
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden"
        style={{
          background: "var(--notion-bg-elevated, #1a1a1a)",
          color: "var(--notion-text-inverse, #ffffff)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.24)",
          minWidth: 280,
        }}
      >
        {/* 메시지 */}
        <span className="flex-1 text-sm font-medium">{message}</span>

        {/* Undo 버튼 */}
        <button
          onClick={handleUndo}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 hover:scale-105"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            color: "#F76D57",
          }}
        >
          실행취소
        </button>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="w-6 h-6 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white/10"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* 프로그레스 바 */}
        <div
          className="absolute bottom-0 left-0 h-0.5 transition-none"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, #F76D57, #f9a88b)",
          }}
        />
      </div>

      {/* 애니메이션 정의 */}
      <style jsx>{`
        @keyframes snackbarSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 16px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}

