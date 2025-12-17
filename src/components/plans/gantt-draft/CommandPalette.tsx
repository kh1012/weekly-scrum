/**
 * Command Palette (Cmd/Ctrl + K)
 * - 빠른 액션 실행
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDraftStore } from "./store";
import {
  SearchIcon,
  PlayIcon,
  StopIcon,
  SaveIcon,
  UndoIcon,
  RedoIcon,
  TrashIcon,
  CalendarIcon,
  FilterIcon,
  HelpIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/common/Icons";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void;
  disabled?: boolean;
  category: "작업" | "편집" | "보기" | "도움말";
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEditing: () => Promise<boolean>;
  onStopEditing: () => Promise<void>;
  onCommit: () => Promise<void>;
  onOpenHelp: () => void;
  isEditing: boolean;
  canEdit: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  onStartEditing,
  onStopEditing,
  onCommit,
  onOpenHelp,
  isEditing,
  canEdit,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const canUndo = useDraftStore((s) => s.canUndo());
  const canRedo = useDraftStore((s) => s.canRedo());
  const undo = useDraftStore((s) => s.undo);
  const redo = useDraftStore((s) => s.redo);
  const selectedBarId = useDraftStore((s) => s.ui.selectedBarId);
  const deleteBar = useDraftStore((s) => s.deleteBar);
  const resetFilters = useDraftStore((s) => s.resetFilters);
  const setZoom = useDraftStore((s) => s.setZoom);
  const zoom = useDraftStore((s) => s.ui.zoom);
  const hasUnsavedChanges = useDraftStore((s) => s.hasUnsavedChanges());

  // 커맨드 목록
  const commands = useMemo<Command[]>(() => [
    // 작업
    {
      id: "start-editing",
      label: "작업 시작",
      shortcut: "",
      icon: <PlayIcon className="w-4 h-4" />,
      action: () => onStartEditing(),
      disabled: isEditing || !canEdit,
      category: "작업",
    },
    {
      id: "stop-editing",
      label: "작업 종료",
      shortcut: "",
      icon: <StopIcon className="w-4 h-4" />,
      action: () => onStopEditing(),
      disabled: !isEditing,
      category: "작업",
    },
    {
      id: "save",
      label: "저장 (Commit)",
      shortcut: "⌘S",
      icon: <SaveIcon className="w-4 h-4" />,
      action: () => onCommit(),
      disabled: !isEditing || !hasUnsavedChanges,
      category: "작업",
    },
    // 편집
    {
      id: "undo",
      label: "실행 취소",
      shortcut: "⌘Z",
      icon: <UndoIcon className="w-4 h-4" />,
      action: undo,
      disabled: !canUndo || !isEditing,
      category: "편집",
    },
    {
      id: "redo",
      label: "다시 실행",
      shortcut: "⌘⇧Z",
      icon: <RedoIcon className="w-4 h-4" />,
      action: redo,
      disabled: !canRedo || !isEditing,
      category: "편집",
    },
    {
      id: "delete-selected",
      label: "선택 항목 삭제",
      shortcut: "Delete",
      icon: <TrashIcon className="w-4 h-4" />,
      action: () => selectedBarId && deleteBar(selectedBarId),
      disabled: !selectedBarId || !isEditing,
      category: "편집",
    },
    // 보기
    {
      id: "go-today",
      label: "오늘로 이동",
      shortcut: "T",
      icon: <CalendarIcon className="w-4 h-4" />,
      action: () => {
        // 오늘로 스크롤 (이벤트 발생)
        window.dispatchEvent(new CustomEvent("gantt:scroll-to-today"));
      },
      category: "보기",
    },
    {
      id: "zoom-week",
      label: "주 단위 보기",
      shortcut: "",
      icon: <ZoomInIcon className="w-4 h-4" />,
      action: () => setZoom("week"),
      disabled: zoom === "week",
      category: "보기",
    },
    {
      id: "zoom-month",
      label: "월 단위 보기",
      shortcut: "",
      icon: <ZoomOutIcon className="w-4 h-4" />,
      action: () => setZoom("month"),
      disabled: zoom === "month",
      category: "보기",
    },
    {
      id: "reset-filters",
      label: "필터 초기화",
      shortcut: "",
      icon: <FilterIcon className="w-4 h-4" />,
      action: resetFilters,
      category: "보기",
    },
    // 도움말
    {
      id: "help",
      label: "도움말 열기",
      shortcut: "?",
      icon: <HelpIcon className="w-4 h-4" />,
      action: onOpenHelp,
      category: "도움말",
    },
  ], [
    isEditing,
    canEdit,
    canUndo,
    canRedo,
    selectedBarId,
    zoom,
    hasUnsavedChanges,
    onStartEditing,
    onStopEditing,
    onCommit,
    undo,
    redo,
    deleteBar,
    resetFilters,
    setZoom,
    onOpenHelp,
  ]);

  // 필터링된 커맨드
  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // 카테고리별 그룹
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    for (const cmd of filteredCommands) {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    }
    return groups;
  }, [filteredCommands]);

  // 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd && !cmd.disabled) {
          cmd.action();
          onClose();
        }
      }
    },
    [filteredCommands, selectedIndex, onClose]
  );

  // 인덱스 리셋
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!isOpen) return null;

  let flatIndex = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      onKeyDown={handleKeyDown}
    >
      {/* 배경 */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* 팔레트 */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: "var(--notion-bg)",
          border: "1px solid var(--notion-border)",
        }}
      >
        {/* 검색 입력 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <SearchIcon
            className="w-5 h-5 flex-shrink-0"
            style={{ color: "var(--notion-text-muted)" }}
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="명령어 검색..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: "var(--notion-text)" }}
          />
          <span
            className="text-xs px-1.5 py-0.5 rounded"
            style={{
              background: "var(--notion-bg-tertiary)",
              color: "var(--notion-text-muted)",
            }}
          >
            ESC
          </span>
        </div>

        {/* 커맨드 목록 */}
        <div className="max-h-80 overflow-y-auto py-2">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div
                className="px-4 py-1.5 text-xs font-medium"
                style={{ color: "var(--notion-text-muted)" }}
              >
                {category}
              </div>
              {cmds.map((cmd) => {
                const idx = flatIndex++;
                const isSelected = idx === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                      cmd.disabled
                        ? "opacity-40 cursor-not-allowed"
                        : isSelected
                        ? "bg-blue-500/10"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                    }`}
                    style={{ color: "var(--notion-text)" }}
                    disabled={cmd.disabled}
                    onClick={() => {
                      if (!cmd.disabled) {
                        cmd.action();
                        onClose();
                      }
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span style={{ color: "var(--notion-text-muted)" }}>
                      {cmd.icon}
                    </span>
                    <span className="flex-1 text-sm">{cmd.label}</span>
                    {cmd.shortcut && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          background: "var(--notion-bg-tertiary)",
                          color: "var(--notion-text-muted)",
                        }}
                      >
                        {cmd.shortcut}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          {filteredCommands.length === 0 && (
            <div
              className="px-4 py-8 text-center text-sm"
              style={{ color: "var(--notion-text-muted)" }}
            >
              검색 결과가 없습니다
            </div>
          )}
        </div>

        {/* 하단 힌트 */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-xs"
          style={{
            borderColor: "var(--notion-border)",
            color: "var(--notion-text-muted)",
          }}
        >
          <span>↑↓ 이동 · Enter 실행 · Esc 닫기</span>
          <span>⌘K 언제든 열기</span>
        </div>
      </div>
    </div>
  );
}

