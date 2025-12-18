/**
 * Command Palette (Cmd/Ctrl + K)
 * - 빠른 액션 실행
 */

"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useDraftStore } from "./store";
import { useIsMac } from "./useOS";
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
  FolderIcon,
  PlusIcon,
  CopyIcon,
} from "@/components/common/Icons";

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: React.ReactNode;
  action: () => void | Promise<void>;
  disabled?: boolean;
  category: "작업" | "편집" | "보기" | "기간 설정" | "도움말";
  /** true이면 action 실행 후 팔레트를 닫지 않음 */
  keepOpen?: boolean;
  /** true이면 로딩 스피너 표시 (async 작업) */
  showLoading?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onStartEditing: () => Promise<boolean>;
  onStopEditing: () => Promise<void>;
  onCommit: () => Promise<void>;
  onOpenHelp: () => void;
  onAddRow: () => void;
  isEditing: boolean;
  canEdit: boolean;
  /** 기간 설정 */
  rangeMonths?: number;
  rangeStart?: Date;
  rangeEnd?: Date;
  onRangeMonthsChange?: (months: number) => void;
  onCustomRangeChange?: (start: Date, end: Date) => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onStartEditing,
  onStopEditing,
  onCommit,
  onOpenHelp,
  onAddRow,
  isEditing,
  canEdit,
  rangeMonths = 3,
  rangeStart,
  rangeEnd,
  onRangeMonthsChange,
  onCustomRangeChange,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [loadingCommandId, setLoadingCommandId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  
  // 커스텀 범위 입력 상태
  const currentYear = new Date().getFullYear();
  const [customStartYear, setCustomStartYear] = useState(
    rangeStart ? rangeStart.getFullYear() : currentYear
  );
  const [customStartMonth, setCustomStartMonth] = useState(
    rangeStart ? rangeStart.getMonth() + 1 : new Date().getMonth() + 1
  );
  const [customEndYear, setCustomEndYear] = useState(
    rangeEnd ? rangeEnd.getFullYear() : currentYear
  );
  const [customEndMonth, setCustomEndMonth] = useState(
    rangeEnd ? rangeEnd.getMonth() + 1 : new Date().getMonth() + 1
  );

  const isMac = useIsMac();

  // 단축키를 OS에 맞게 변환
  const formatShortcut = useCallback(
    (shortcut: string | undefined): string => {
      if (!shortcut) return "";
      if (isMac) return shortcut;

      // Windows/Linux 변환
      return shortcut
        .replace(/⌘/g, "Ctrl+")
        .replace(/⇧/g, "Shift+")
        .replace(/⌥/g, "Alt+")
        .replace(/\+$/, "");
    },
    [isMac]
  );

  const canUndo = useDraftStore((s) => s.canUndo());
  const canRedo = useDraftStore((s) => s.canRedo());
  const undo = useDraftStore((s) => s.undo);
  const redo = useDraftStore((s) => s.redo);
  const selectedBarId = useDraftStore((s) => s.ui.selectedBarId);
  const deleteBar = useDraftStore((s) => s.deleteBar);
  const duplicateBar = useDraftStore((s) => s.duplicateBar);
  const resetFilters = useDraftStore((s) => s.resetFilters);
  const setZoom = useDraftStore((s) => s.setZoom);
  const zoom = useDraftStore((s) => s.ui.zoom);
  const hasUnsavedChanges = useDraftStore((s) => s.hasUnsavedChanges());

  // 커맨드 목록 (disabled 필터링은 나중에)
  const allCommands = useMemo<Command[]>(
    () => [
      // 작업
      {
        id: "start-editing",
        label: "작업 시작",
        shortcut: "",
        icon: <PlayIcon className="w-4 h-4" />,
        action: async () => {
          await onStartEditing();
        },
        // 필터에서 !isEditing일 때만 표시하므로 항상 활성화
        disabled: false,
        category: "작업",
        showLoading: true,
      },
      {
        id: "stop-editing",
        label: "작업 종료",
        shortcut: "",
        icon: <StopIcon className="w-4 h-4" />,
        action: async () => {
          await onStopEditing();
        },
        // 필터에서 isEditing일 때만 표시하므로 항상 활성화
        disabled: false,
        category: "작업",
        showLoading: true,
      },
      {
        id: "save",
        label: "저장 (Commit)",
        shortcut: "⌘S",
        icon: <SaveIcon className="w-4 h-4" />,
        action: async () => {
          await onCommit();
        },
        disabled: !isEditing || !hasUnsavedChanges,
        category: "작업",
        showLoading: true,
      },
      {
        id: "add-row",
        label: "새 기능 추가",
        shortcut: "",
        icon: <PlusIcon className="w-4 h-4" />,
        action: onAddRow,
        disabled: !isEditing,
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
      {
        id: "duplicate-bar",
        label: "선택 항목 복제",
        shortcut: "⌘D",
        icon: <CopyIcon className="w-4 h-4" />,
        action: () => selectedBarId && duplicateBar(selectedBarId),
        disabled: !selectedBarId || !isEditing,
        category: "편집",
      },
      // 보기
      {
        id: "go-today",
        label: "오늘로 이동",
        shortcut: "",
        icon: <CalendarIcon className="w-4 h-4" />,
        action: () => {
          // 오늘로 스크롤 (이벤트 발생)
          window.dispatchEvent(new CustomEvent("gantt:scroll-to-today"));
        },
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
      // 기간 설정
      {
        id: "range-3",
        label: `기간: 3개월${rangeMonths === 3 ? " ✓" : ""}`,
        shortcut: "",
        icon: <CalendarIcon className="w-4 h-4" />,
        action: () => onRangeMonthsChange?.(3),
        category: "기간 설정",
      },
      {
        id: "range-4",
        label: `기간: 4개월${rangeMonths === 4 ? " ✓" : ""}`,
        shortcut: "",
        icon: <CalendarIcon className="w-4 h-4" />,
        action: () => onRangeMonthsChange?.(4),
        category: "기간 설정",
      },
      {
        id: "range-5",
        label: `기간: 5개월${rangeMonths === 5 ? " ✓" : ""}`,
        shortcut: "",
        icon: <CalendarIcon className="w-4 h-4" />,
        action: () => onRangeMonthsChange?.(5),
        category: "기간 설정",
      },
      {
        id: "range-6",
        label: `기간: 6개월${rangeMonths === 6 ? " ✓" : ""}`,
        shortcut: "",
        icon: <CalendarIcon className="w-4 h-4" />,
        action: () => onRangeMonthsChange?.(6),
        category: "기간 설정",
      },
      {
        id: "range-custom",
        label: `기간: 직접 선택${rangeMonths === 0 ? " ✓" : ""}`,
        shortcut: "",
        icon: <CalendarIcon className="w-4 h-4" />,
        action: () => setShowCustomRange(true),
        category: "기간 설정",
        keepOpen: true,
      },
      // 도움말
      {
        id: "help",
        label: "도움말 열기",
        shortcut: "",
        icon: <HelpIcon className="w-4 h-4" />,
        action: onOpenHelp,
        category: "도움말",
      },
    ],
    [
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
      onAddRow,
      undo,
      redo,
      deleteBar,
      duplicateBar,
      resetFilters,
      setZoom,
      onOpenHelp,
      rangeMonths,
      onRangeMonthsChange,
    ]
  );

  // 모든 명령 표시 (작업 시작/종료만 상태에 따라 하나만 표시)
  // 비활성화된 명령도 표시하되 실행 불가 처리
  const commands = useMemo(() => {
    return allCommands.filter((cmd) => {
      // 작업 시작: 편집 중이 아니면 표시
      if (cmd.id === "start-editing") {
        return !isEditing;
      }
      // 작업 종료: 편집 중이면 표시
      if (cmd.id === "stop-editing") {
        return isEditing;
      }
      // 나머지는 모두 표시 (disabled 여부와 관계없이)
      return true;
    });
  }, [allCommands, isEditing]);

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

  // 명령 실행 함수
  const executeCommand = useCallback(
    async (cmd: Command) => {
      if (cmd.disabled || loadingCommandId !== null) return;

      // 로딩 표시가 필요한 명령
      if (cmd.showLoading) {
        setLoadingCommandId(cmd.id);
        try {
          await cmd.action();
        } finally {
          setLoadingCommandId(null);
          if (!cmd.keepOpen) {
            onClose();
          }
        }
      } else {
        const result = cmd.action();
        if (!cmd.keepOpen) {
          if (result instanceof Promise) {
            result.finally(() => onClose());
          } else {
            onClose();
          }
        }
      }
    },
    [loadingCommandId, onClose]
  );

  // 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      // 첫 번째 활성화된 항목으로 선택
      const firstEnabledIndex = commands.findIndex((cmd) => !cmd.disabled);
      setSelectedIndex(firstEnabledIndex >= 0 ? firstEnabledIndex : 0);
      setShowCustomRange(false);
      setLoadingCommandId(null);
      // 커스텀 범위 값도 현재 설정으로 초기화
      if (rangeStart) {
        setCustomStartYear(rangeStart.getFullYear());
        setCustomStartMonth(rangeStart.getMonth() + 1);
      }
      if (rangeEnd) {
        setCustomEndYear(rangeEnd.getFullYear());
        setCustomEndMonth(rangeEnd.getMonth() + 1);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, rangeStart, rangeEnd, commands]);

  // 다음 활성화된 항목 찾기 (disabled 스킵)
  const findNextEnabledIndex = useCallback(
    (currentIndex: number, direction: 1 | -1): number => {
      const len = filteredCommands.length;
      if (len === 0) return 0;

      let nextIndex = currentIndex;
      let attempts = 0;

      do {
        nextIndex = direction === 1
          ? (nextIndex + 1) % len
          : (nextIndex - 1 + len) % len;
        attempts++;
        // 모든 항목이 disabled면 무한 루프 방지
        if (attempts >= len) return currentIndex;
      } while (filteredCommands[nextIndex]?.disabled);

      return nextIndex;
    },
    [filteredCommands]
  );

  // 키보드 네비게이션
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => findNextEnabledIndex(prev, 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => findNextEnabledIndex(prev, -1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const cmd = filteredCommands[selectedIndex];
        if (cmd && !cmd.disabled && loadingCommandId === null) {
          executeCommand(cmd);
        }
      }
    },
    [filteredCommands, selectedIndex, onClose, loadingCommandId, executeCommand, findNextEnabledIndex]
  );

  // 인덱스 리셋 (첫 번째 활성화된 항목으로)
  useEffect(() => {
    const firstEnabledIndex = filteredCommands.findIndex((cmd) => !cmd.disabled);
    setSelectedIndex(firstEnabledIndex >= 0 ? firstEnabledIndex : 0);
  }, [query, filteredCommands]);

  // 선택된 항목으로 스크롤
  useEffect(() => {
    const selectedItem = itemRefs.current.get(selectedIndex);
    if (selectedItem && listRef.current) {
      selectedItem.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

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
            onKeyDown={handleKeyDown}
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

        {/* 커맨드 목록 또는 커스텀 범위 입력 */}
        {showCustomRange ? (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
                기간 직접 선택
              </span>
              <button
                onClick={() => setShowCustomRange(false)}
                className="text-xs px-2 py-1 rounded hover:bg-gray-100"
                style={{ color: "var(--notion-text-muted)" }}
              >
                ← 뒤로
              </button>
            </div>

            {/* 시작월 */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--notion-text-muted)" }}>
                시작월
              </label>
              <div className="flex gap-2">
                <select
                  value={customStartYear}
                  onChange={(e) => setCustomStartYear(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--notion-bg)", borderColor: "var(--notion-border)", color: "var(--notion-text)" }}
                >
                  {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  value={customStartMonth}
                  onChange={(e) => setCustomStartMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--notion-bg)", borderColor: "var(--notion-border)", color: "var(--notion-text)" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 종료월 */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--notion-text-muted)" }}>
                종료월
              </label>
              <div className="flex gap-2">
                <select
                  value={customEndYear}
                  onChange={(e) => setCustomEndYear(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--notion-bg)", borderColor: "var(--notion-border)", color: "var(--notion-text)" }}
                >
                  {[currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                    <option key={y} value={y}>{y}년</option>
                  ))}
                </select>
                <select
                  value={customEndMonth}
                  onChange={(e) => setCustomEndMonth(Number(e.target.value))}
                  className="flex-1 px-3 py-2 rounded-lg text-sm border outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ background: "var(--notion-bg)", borderColor: "var(--notion-border)", color: "var(--notion-text)" }}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>{m}월</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 적용 버튼 */}
            <button
              onClick={() => {
                const start = new Date(customStartYear, customStartMonth - 1, 1);
                const end = new Date(customEndYear, customEndMonth, 0); // 해당 월의 마지막 날
                onCustomRangeChange?.(start, end);
                setShowCustomRange(false);
                onClose();
              }}
              className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:shadow-md"
              style={{ background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" }}
            >
              ✓ 적용
            </button>
          </div>
        ) : (
          <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category}>
                <div
                  className="px-4 py-1.5 text-xs font-medium"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  {category}
                </div>
                {cmds.map((cmd) => {
                  // filteredCommands에서의 실제 인덱스 사용 (순서 일관성 보장)
                  const idx = filteredCommands.indexOf(cmd);
                  const isSelected = idx === selectedIndex;
                  const isLoading = loadingCommandId === cmd.id;
                  const isDisabled = cmd.disabled;

                  return (
                    <button
                      key={cmd.id}
                      ref={(el) => {
                        if (el && idx >= 0) itemRefs.current.set(idx, el);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? "bg-blue-500/10"
                          : isDisabled
                          ? ""
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                      } ${isLoading ? "cursor-wait" : isDisabled ? "cursor-not-allowed" : ""}`}
                      style={{ 
                        color: "var(--notion-text)",
                        opacity: isDisabled ? 0.4 : isLoading ? 0.7 : 1,
                      }}
                      onClick={() => !isDisabled && executeCommand(cmd)}
                      onMouseEnter={() => idx >= 0 && setSelectedIndex(idx)}
                      disabled={isLoading || loadingCommandId !== null}
                    >
                      <span style={{ color: "var(--notion-text-muted)" }}>
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : (
                          cmd.icon
                        )}
                      </span>
                      <span className="flex-1 text-sm">{cmd.label}</span>
                      {isLoading && (
                        <span className="text-xs text-gray-400">처리 중...</span>
                      )}
                      {!isLoading && cmd.shortcut && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded font-mono"
                          style={{
                            background: "var(--notion-bg-tertiary)",
                            color: "var(--notion-text-muted)",
                          }}
                        >
                          {formatShortcut(cmd.shortcut)}
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
        )}

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
