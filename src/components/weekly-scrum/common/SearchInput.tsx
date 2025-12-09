"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { useState, useEffect, useRef, useCallback } from "react";

interface SearchInputProps {
  isMobile?: boolean;
}

// 운영체제 감지
function getOS(): "mac" | "windows" | "other" {
  if (typeof window === "undefined") return "other";
  const userAgent = window.navigator.userAgent.toLowerCase();
  if (userAgent.includes("mac")) return "mac";
  if (userAgent.includes("win")) return "windows";
  return "other";
}

export function SearchInput({ isMobile = false }: SearchInputProps) {
  const { filters, updateFilter } = useScrumContext();
  const [localValue, setLocalValue] = useState(filters.search);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [os, setOS] = useState<"mac" | "windows" | "other">("other");
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedUpdateFilter = useRef<NodeJS.Timeout | null>(null);

  // 운영체제 감지
  useEffect(() => {
    setOS(getOS());
  }, []);

  // 전역 키보드 단축키 (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = os === "mac";
      const isShortcut = isMac
        ? e.metaKey && e.key === "k"
        : e.ctrlKey && e.key === "k";

      if (isShortcut) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [os]);

  useEffect(() => {
    setLocalValue(filters.search);
  }, [filters.search]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      setIsSearching(true);

      if (debouncedUpdateFilter.current) {
        clearTimeout(debouncedUpdateFilter.current);
      }

      debouncedUpdateFilter.current = setTimeout(() => {
        updateFilter("search", newValue);
        setIsSearching(false);
      }, 500);
    },
    [updateFilter]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    updateFilter("search", "");
    setIsSearching(false);
    if (debouncedUpdateFilter.current) {
      clearTimeout(debouncedUpdateFilter.current);
    }
    inputRef.current?.focus();
  }, [updateFilter]);

  // 플레이스홀더 텍스트
  const shortcutHint = os === "mac" ? "⌘K" : "Ctrl+K";
  const placeholder = isMobile ? "검색..." : `검색... (${shortcutHint})`;

  return (
    <div
      className={`relative transition-all duration-300 ease-out ${
        isMobile ? "w-full" : isFocused ? "w-80" : "w-60"
      }`}
    >
      {/* 검색 아이콘 */}
      <svg
        className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 transition-all duration-200"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{
          color: isFocused
            ? "#3b82f6"
            : "var(--notion-text-muted)",
          transform: `translateY(-50%) ${isFocused ? "scale(1.05)" : "scale(1)"}`,
        }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`w-full h-9 pl-10 pr-10 text-sm font-medium rounded-xl transition-all duration-200 ease-out focus:outline-none ${
          isMobile ? "" : ""
        }`}
        style={{
          backgroundColor: isFocused ? "white" : "var(--notion-bg-secondary)",
          border: isFocused 
            ? "1px solid rgba(59, 130, 246, 0.3)" 
            : "1px solid transparent",
          boxShadow: isFocused 
            ? "0 0 0 3px rgba(59, 130, 246, 0.1), 0 4px 12px rgba(0, 0, 0, 0.05)" 
            : "none",
          color: "var(--notion-text)",
        }}
      />

      {/* 로딩/클리어 버튼 */}
      {(localValue || isSearching) && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {isSearching ? (
            <svg
              className="animate-spin w-4 h-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              style={{ color: "#3b82f6" }}
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
          ) : (
            <button
              onClick={handleClear}
              className="flex items-center justify-center w-5 h-5 rounded-full transition-all duration-200 interactive-btn"
              style={{ 
                background: "var(--notion-bg-secondary)",
                color: "var(--notion-text-muted)",
              }}
            >
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
