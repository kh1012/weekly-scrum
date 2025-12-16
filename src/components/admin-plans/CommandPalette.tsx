"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { getModifierKey } from "./useKeyboardShortcuts";

export interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  /** 선택된 Plan이 있어야 활성화 */
  requiresSelection?: boolean;
}

export interface CommandPaletteProps {
  /** 팔레트 표시 여부 */
  isOpen: boolean;
  /** 닫기 핸들러 */
  onClose: () => void;
  /** 명령어 목록 */
  commands: CommandItem[];
  /** 선택된 Plan이 있는지 */
  hasSelection: boolean;
}

/**
 * Airbnb 스타일 커맨드 팔레트
 * - Cmd/Ctrl + K로 열기
 * - 검색 가능
 * - 키보드 내비게이션
 */
export function CommandPalette({
  isOpen,
  onClose,
  commands,
  hasSelection,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const modKey = getModifierKey();

  // 필터링된 명령어
  const filteredCommands = useMemo(() => {
    const available = commands.filter(
      (cmd) => !cmd.requiresSelection || hasSelection
    );
    
    if (!query.trim()) return available;
    
    const lowerQuery = query.toLowerCase();
    return available.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery)
    );
  }, [commands, query, hasSelection]);

  // 팔레트 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 선택 인덱스 범위 보정
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // 키보드 핸들러
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            filteredCommands[selectedIndex].action();
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // 명령어 실행
  const handleCommandClick = useCallback(
    (command: CommandItem) => {
      command.action();
      onClose();
    },
    [onClose]
  );

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-command-palette]")) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in-0 duration-150"
        onClick={onClose}
      />

      {/* 팔레트 */}
      <div
        data-command-palette
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
        style={{
          background: "var(--notion-bg)",
          boxShadow: "0 24px 48px rgba(0, 0, 0, 0.2)",
          border: "1px solid var(--notion-border)",
        }}
      >
        {/* 검색 입력 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <svg
            className="w-5 h-5 shrink-0"
            style={{ color: "var(--notion-text-muted)" }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="명령어 검색..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--notion-text)" }}
          />
          <kbd
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
              border: "1px solid var(--notion-border)",
            }}
          >
            ESC
          </kbd>
        </div>

        {/* 명령어 목록 */}
        <div
          ref={listRef}
          className="max-h-80 overflow-y-auto py-2"
        >
          {filteredCommands.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--notion-text-muted)" }}
            >
              일치하는 명령어가 없습니다
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <button
                key={command.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors duration-100"
                style={{
                  background:
                    index === selectedIndex
                      ? "var(--notion-bg-secondary)"
                      : "transparent",
                  color: "var(--notion-text)",
                }}
                onClick={() => handleCommandClick(command)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {/* 아이콘 */}
                {command.icon && (
                  <span
                    className="w-8 h-8 flex items-center justify-center rounded-lg shrink-0"
                    style={{
                      background: "var(--notion-bg-secondary)",
                      color: "var(--notion-text-muted)",
                    }}
                  >
                    {command.icon}
                  </span>
                )}

                {/* 레이블 & 설명 */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {command.label}
                  </div>
                  {command.description && (
                    <div
                      className="text-xs truncate"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      {command.description}
                    </div>
                  )}
                </div>

                {/* 단축키 */}
                {command.shortcut && (
                  <kbd
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                    style={{
                      background: "var(--notion-bg-secondary)",
                      color: "var(--notion-text-muted)",
                      border: "1px solid var(--notion-border)",
                    }}
                  >
                    {command.shortcut.replace("Mod", modKey)}
                  </kbd>
                )}
              </button>
            ))
          )}
        </div>

        {/* 하단 힌트 */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-[10px]"
          style={{
            borderColor: "var(--notion-border)",
            color: "var(--notion-text-muted)",
          }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-black/5">↑↓</kbd>
              <span>이동</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-black/5">Enter</kbd>
              <span>실행</span>
            </span>
          </div>
          {!hasSelection && (
            <span style={{ color: "#f59e0b" }}>
              💡 Plan을 선택하면 더 많은 명령어가 표시됩니다
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 기본 아이콘 컴포넌트들
 */
export const CommandIcons = {
  Plus: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  Trash: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  Duplicate: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  Status: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Stage: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  User: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

