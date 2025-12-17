/**
 * OS 감지 및 단축키 표시 유틸리티
 */

"use client";

import { useState, useEffect } from "react";

export type OS = "mac" | "windows" | "linux" | "unknown";

/**
 * 현재 OS를 감지하는 훅
 */
export function useOS(): OS {
  const [os, setOS] = useState<OS>("unknown");

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes("mac")) {
      setOS("mac");
    } else if (userAgent.includes("win")) {
      setOS("windows");
    } else if (userAgent.includes("linux")) {
      setOS("linux");
    } else {
      setOS("unknown");
    }
  }, []);

  return os;
}

/**
 * OS가 Mac인지 확인
 */
export function useIsMac(): boolean {
  const os = useOS();
  return os === "mac";
}

/**
 * OS에 따른 수정자 키 표시
 * Mac: ⌘ (Command)
 * Windows/Linux: Ctrl
 */
export function useModifierKey(): string {
  const isMac = useIsMac();
  return isMac ? "⌘" : "Ctrl";
}

/**
 * 단축키 문자열을 OS에 맞게 변환
 * 예: "⌘K" → Mac에서는 "⌘K", Windows에서는 "Ctrl+K"
 */
export function useShortcutDisplay(macShortcut: string): string {
  const isMac = useIsMac();
  
  if (isMac) {
    return macShortcut;
  }
  
  // Windows/Linux 변환
  return macShortcut
    .replace(/⌘/g, "Ctrl+")
    .replace(/⇧/g, "Shift+")
    .replace(/⌥/g, "Alt+")
    .replace(/\+$/, ""); // 마지막 + 제거
}

/**
 * 단축키 배열을 OS에 맞게 변환
 */
export function getOSKeys(macKeys: string[]): string[] {
  if (typeof window === "undefined") return macKeys;
  
  const isMac = navigator.userAgent.toLowerCase().includes("mac");
  
  if (isMac) return macKeys;
  
  // Windows/Linux 변환
  return macKeys.map((key) => {
    switch (key) {
      case "⌘":
        return "Ctrl";
      case "⇧":
        return "Shift";
      case "⌥":
        return "Alt";
      default:
        return key;
    }
  });
}

