"use client";

import { useEffect, useCallback } from "react";

interface KeyboardShortcutsOptions {
  /** 선택된 Plan ID */
  selectedPlanId?: string;
  /** 활성화 여부 (admin 모드에서만) */
  enabled: boolean;
  /** Delete/Backspace 핸들러 */
  onDelete?: (planId: string) => void;
  /** Cmd/Ctrl + D 핸들러 */
  onDuplicate?: (planId: string) => void;
  /** Cmd/Ctrl + K 핸들러 */
  onCommandPalette?: () => void;
  /** Escape 핸들러 (선택 해제) */
  onEscape?: () => void;
}

/**
 * Admin Plans 키보드 단축키 훅
 * - Delete/Backspace: 선택된 Plan 삭제
 * - Cmd/Ctrl + D: 선택된 Plan 복제
 * - Cmd/Ctrl + K: 커맨드 팔레트 열기
 * - Escape: 선택 해제
 */
export function useKeyboardShortcuts({
  selectedPlanId,
  enabled,
  onDelete,
  onDuplicate,
  onCommandPalette,
  onEscape,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      // 입력 필드에서는 단축키 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        // Escape는 예외적으로 처리
        if (e.key === "Escape") {
          onEscape?.();
        }
        return;
      }

      const isMod = e.metaKey || e.ctrlKey;

      // Cmd/Ctrl + K: 커맨드 팔레트
      if (isMod && e.key === "k") {
        e.preventDefault();
        onCommandPalette?.();
        return;
      }

      // 선택된 Plan이 있을 때만 작동하는 단축키
      if (selectedPlanId) {
        // Delete / Backspace: 삭제
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          onDelete?.(selectedPlanId);
          return;
        }

        // Cmd/Ctrl + D: 복제
        if (isMod && e.key === "d") {
          e.preventDefault();
          onDuplicate?.(selectedPlanId);
          return;
        }
      }

      // Escape: 선택 해제
      if (e.key === "Escape") {
        e.preventDefault();
        onEscape?.();
        return;
      }
    },
    [enabled, selectedPlanId, onDelete, onDuplicate, onCommandPalette, onEscape]
  );

  useEffect(() => {
    if (!enabled) return;
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, handleKeyDown]);
}

/**
 * OS 감지 (Cmd vs Ctrl 표시용)
 */
export function getModifierKey(): string {
  if (typeof window === "undefined") return "Ctrl";
  return navigator.platform.toLowerCase().includes("mac") ? "⌘" : "Ctrl";
}

