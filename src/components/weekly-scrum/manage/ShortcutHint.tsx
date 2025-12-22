"use client";

/**
 * OS별 단축키 힌트 컴포넌트
 * 
 * Mac: ⌥ + ⌘ + ↓
 * Windows: Ctrl + Alt + ↓
 */

import { useState, useEffect } from "react";
import { getOS, type OSType } from "@/lib/ui/getOS";

interface ShortcutHintProps {
  /** 힌트 라벨 (예: "새 항목 추가") */
  label: string;
}

export function ShortcutHint({ label }: ShortcutHintProps) {
  const [os, setOs] = useState<OSType>("other");

  // 클라이언트에서만 OS 감지 (hydration mismatch 방지)
  useEffect(() => {
    setOs(getOS());
  }, []);

  // Mac: ⌥ + ⌘ + ↓
  // Windows/Other: Ctrl + Alt + ↓
  const isMacOS = os === "mac";

  if (isMacOS) {
    return (
      <div className="px-3 py-1.5 text-[10px] text-gray-400 text-center border-t border-gray-50">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">⌥</kbd>
        <span className="mx-0.5">+</span>
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">⌘</kbd>
        <span className="mx-0.5">+</span>
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">↓</kbd>
        <span className="ml-1">{label}</span>
      </div>
    );
  }

  // Windows 또는 기타 OS
  return (
    <div className="px-3 py-1.5 text-[10px] text-gray-400 text-center border-t border-gray-50">
      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">Ctrl</kbd>
      <span className="mx-0.5">+</span>
      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">Alt</kbd>
      <span className="mx-0.5">+</span>
      <kbd className="px-1 py-0.5 bg-gray-100 rounded text-[9px]">↓</kbd>
      <span className="ml-1">{label}</span>
    </div>
  );
}











