"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface QuickCreatePopoverProps {
  /** 팝오버가 표시될 위치 (절대 좌표) */
  position: { x: number; y: number };
  /** 선택된 날짜 */
  date: Date;
  /** 컨텍스트 정보 (project/module/feature) */
  context: {
    project: string;
    module: string;
    feature: string;
  };
  /** 생성 핸들러 */
  onCreate: (title: string) => Promise<void>;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * Airbnb 스타일의 Quick Create 팝오버
 * - 타이틀 입력만으로 빠른 Plan 생성
 * - Enter로 생성, Esc로 취소
 * - 최소한의 UI로 빠른 워크플로우 지원
 */
export function QuickCreatePopover({
  position,
  date,
  context,
  onCreate,
  onClose,
  isLoading = false,
}: QuickCreatePopoverProps) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 날짜 포맷팅
  const formattedDate = date.toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
  });

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  // Keyboard handler
  const handleKeyDown = useCallback(
    async (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!title.trim()) {
          setError("제목을 입력해주세요");
          return;
        }
        try {
          await onCreate(title.trim());
          // 성공 시 자동으로 닫힘 (부모에서 처리)
        } catch {
          setError("생성에 실패했습니다");
        }
      }
    },
    [title, onCreate, onClose]
  );

  // 뷰포트 내 위치 조정
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 320),
    y: Math.min(position.y, window.innerHeight - 200),
  };

  return (
    <div
      ref={popoverRef}
      className="fixed z-50 animate-in fade-in-0 zoom-in-95 duration-150"
      style={{
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        // Airbnb 스타일: 부드러운 그림자, 둥근 모서리
        filter: "drop-shadow(0 4px 24px rgba(0, 0, 0, 0.12))",
      }}
    >
      <div
        className="w-72 rounded-2xl overflow-hidden"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* 헤더: 날짜 & 컨텍스트 */}
        <div
          className="px-4 py-3 border-b"
          style={{
            background: "var(--notion-bg-secondary)",
            borderColor: "rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-medium"
              style={{ color: "var(--notion-text-muted)" }}
            >
              {formattedDate}
            </span>
            <button
              onClick={onClose}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/5 transition-colors duration-150"
              style={{ color: "var(--notion-text-muted)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {context.feature && (
            <div
              className="mt-1 text-xs truncate"
              style={{ color: "var(--notion-text-muted)" }}
            >
              {context.project} / {context.module} / {context.feature}
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="p-4">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="계획 제목 입력..."
            disabled={isLoading}
            className="w-full px-3 py-2.5 rounded-xl text-sm transition-all duration-150 outline-none"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text)",
              border: error
                ? "2px solid rgba(239, 68, 68, 0.5)"
                : "2px solid transparent",
            }}
          />

          {/* 에러 메시지 */}
          {error && (
            <p className="mt-2 text-xs text-red-500 animate-in fade-in-0 duration-150">
              {error}
            </p>
          )}

          {/* 힌트 */}
          <div
            className="mt-3 flex items-center gap-2 text-[11px]"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <span className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  background: "var(--notion-bg-secondary)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                Enter
              </kbd>
              <span>생성</span>
            </span>
            <span className="opacity-50">·</span>
            <span className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{
                  background: "var(--notion-bg-secondary)",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                }}
              >
                Esc
              </kbd>
              <span>취소</span>
            </span>
          </div>
        </div>

        {/* 로딩 오버레이 */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
            <div className="flex items-center gap-2 text-sm" style={{ color: "var(--notion-text-muted)" }}>
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>생성 중...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

