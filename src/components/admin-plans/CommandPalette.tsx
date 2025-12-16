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

/** 임시 계획 생성 콜백 타입 */
export interface DraftPlanInput {
  type: "feature" | "sprint" | "release";
  title: string;
  project?: string;
  module?: string;
  feature?: string;
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
  /** 임시 계획 생성 핸들러 */
  onCreateDraftPlan?: (input: DraftPlanInput) => void;
  /** 필터 옵션 (프로젝트/모듈/기능 목록) */
  filterOptions?: {
    projects?: string[];
    modules?: string[];
    features?: string[];
  };
}

type InputMode = 
  | { type: "none" }
  | { type: "feature"; step: "title" | "hierarchy" }
  | { type: "sprint" | "release"; step: "title" };

/**
 * Airbnb 스타일 커맨드 팔레트
 * - Cmd/Ctrl + K로 열기
 * - 검색 가능
 * - 키보드 내비게이션
 * - 임시 계획 생성 모드 지원
 */
export function CommandPalette({
  isOpen,
  onClose,
  commands,
  hasSelection,
  onCreateDraftPlan,
  filterOptions,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 입력 모드 상태
  const [inputMode, setInputMode] = useState<InputMode>({ type: "none" });
  const [draftTitle, setDraftTitle] = useState("");
  const [draftProject, setDraftProject] = useState("");
  const [draftModule, setDraftModule] = useState("");
  const [draftFeature, setDraftFeature] = useState("");
  
  // SearchableSelect 관련 상태
  const [projectSearch, setProjectSearch] = useState("");
  const [moduleSearch, setModuleSearch] = useState("");
  const [featureSearch, setFeatureSearch] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<"project" | "module" | "feature" | null>(null);

  const modKey = getModifierKey();

  // 임시 계획 생성 명령어
  const draftCommands: CommandItem[] = useMemo(() => {
    if (!onCreateDraftPlan) return [];
    
    return [
      {
        id: "draft-feature",
        label: "임시 계획 생성하기 (기능)",
        description: "프로젝트, 모듈, 기능을 선택하여 생성",
        icon: CommandIcons.Feature,
        action: () => {
          setInputMode({ type: "feature", step: "title" });
          setDraftTitle("새 기능");
          setDraftProject("");
          setDraftModule("");
          setDraftFeature("");
        },
      },
      {
        id: "draft-sprint",
        label: "임시 계획 생성하기 (스프린트)",
        description: "제목만 입력하여 빠르게 생성",
        icon: CommandIcons.Sprint,
        action: () => {
          setInputMode({ type: "sprint", step: "title" });
          setDraftTitle("새 스프린트");
        },
      },
      {
        id: "draft-release",
        label: "임시 계획 생성하기 (릴리즈)",
        description: "제목만 입력하여 빠르게 생성",
        icon: CommandIcons.Release,
        action: () => {
          setInputMode({ type: "release", step: "title" });
          setDraftTitle("새 릴리즈");
        },
      },
    ];
  }, [onCreateDraftPlan]);

  // 필터링된 명령어
  const filteredCommands = useMemo(() => {
    const allCommands = [...draftCommands, ...commands];
    const available = allCommands.filter(
      (cmd) => !cmd.requiresSelection || hasSelection
    );
    
    if (!query.trim()) return available;
    
    const lowerQuery = query.toLowerCase();
    return available.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lowerQuery) ||
        cmd.description?.toLowerCase().includes(lowerQuery)
    );
  }, [commands, draftCommands, query, hasSelection]);

  // 팔레트 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setInputMode({ type: "none" });
      setDraftTitle("");
      setDraftProject("");
      setDraftModule("");
      setDraftFeature("");
      setProjectSearch("");
      setModuleSearch("");
      setFeatureSearch("");
      setActiveDropdown(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 선택 인덱스 범위 보정
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // 키보드 핸들러 (명령어 목록 모드)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (inputMode.type !== "none") return; // 입력 모드에서는 무시
      
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
            const cmd = filteredCommands[selectedIndex];
            // 임시 계획 생성 명령어는 닫지 않음
            if (cmd.id.startsWith("draft-")) {
              cmd.action();
            } else {
              cmd.action();
              onClose();
            }
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    },
    [filteredCommands, selectedIndex, onClose, inputMode.type]
  );

  // 명령어 실행 (클릭)
  const handleCommandClick = useCallback(
    (command: CommandItem) => {
      // 임시 계획 생성 명령어는 닫지 않음
      if (command.id.startsWith("draft-")) {
        command.action();
      } else {
        command.action();
        onClose();
      }
    },
    [onClose]
  );

  // 입력 모드 키보드 핸들러
  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (inputMode.type === "feature" && inputMode.step === "hierarchy") {
          setInputMode({ type: "feature", step: "title" });
        } else {
          setInputMode({ type: "none" });
        }
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleInputSubmit();
      }
    },
    [inputMode]
  );

  // 입력 제출
  const handleInputSubmit = useCallback(() => {
    if (!onCreateDraftPlan) return;
    
    if (inputMode.type === "feature") {
      if (inputMode.step === "title") {
        // 다음 단계로 이동
        setInputMode({ type: "feature", step: "hierarchy" });
        return;
      }
      // hierarchy 단계에서 생성
      onCreateDraftPlan({
        type: "feature",
        title: draftTitle || "새 기능",
        project: draftProject || "미지정",
        module: draftModule || "미지정",
        feature: draftFeature || "미지정",
      });
    } else if (inputMode.type === "sprint" || inputMode.type === "release") {
      onCreateDraftPlan({
        type: inputMode.type,
        title: draftTitle || (inputMode.type === "sprint" ? "새 스프린트" : "새 릴리즈"),
      });
    }
    
    setInputMode({ type: "none" });
    onClose();
  }, [inputMode, draftTitle, draftProject, draftModule, draftFeature, onCreateDraftPlan, onClose]);

  // 뒤로가기
  const handleInputBack = useCallback(() => {
    if (inputMode.type === "feature" && inputMode.step === "hierarchy") {
      setInputMode({ type: "feature", step: "title" });
    } else {
      setInputMode({ type: "none" });
    }
  }, [inputMode]);

  // 필터된 옵션 목록
  const filteredProjects = useMemo(() => {
    const list = filterOptions?.projects || [];
    if (!projectSearch) return list;
    return list.filter(p => p.toLowerCase().includes(projectSearch.toLowerCase()));
  }, [filterOptions?.projects, projectSearch]);

  const filteredModules = useMemo(() => {
    const list = filterOptions?.modules || [];
    if (!moduleSearch) return list;
    return list.filter(m => m.toLowerCase().includes(moduleSearch.toLowerCase()));
  }, [filterOptions?.modules, moduleSearch]);

  const filteredFeatures = useMemo(() => {
    const list = filterOptions?.features || [];
    if (!featureSearch) return list;
    return list.filter(f => f.toLowerCase().includes(featureSearch.toLowerCase()));
  }, [filterOptions?.features, featureSearch]);

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

  // 입력 모드 UI 렌더링
  const renderInputMode = () => {
    if (inputMode.type === "none") return null;

    const typeLabel = inputMode.type === "feature" ? "기능" : inputMode.type === "sprint" ? "스프린트" : "릴리즈";
    const typeIcon = inputMode.type === "feature" ? CommandIcons.Feature : inputMode.type === "sprint" ? CommandIcons.Sprint : CommandIcons.Release;

    return (
      <>
        {/* 헤더 */}
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <button
            onClick={handleInputBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span
            className="w-8 h-8 flex items-center justify-center rounded-lg"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-muted)" }}
          >
            {typeIcon}
          </span>
          <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
            임시 {typeLabel} 계획 생성
          </span>
        </div>

        {/* 입력 폼 */}
        <div className="p-4 space-y-4">
          {/* 제목 입력 (항상 표시) */}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text-muted)" }}>
              제목 *
            </label>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder={`${typeLabel} 제목을 입력하세요`}
              className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
              style={{
                background: "var(--notion-bg)",
                borderColor: "var(--notion-border)",
                color: "var(--notion-text)",
              }}
              autoFocus
            />
          </div>

          {/* Feature 타입일 때 위계 정보 (step: hierarchy) */}
          {inputMode.type === "feature" && inputMode.step === "hierarchy" && (
            <div className="space-y-3">
              {/* 프로젝트 */}
              <div className="relative">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text-muted)" }}>
                  프로젝트 *
                </label>
                <input
                  type="text"
                  value={draftProject || projectSearch}
                  onChange={(e) => {
                    setDraftProject("");
                    setProjectSearch(e.target.value);
                    setActiveDropdown("project");
                  }}
                  onFocus={() => setActiveDropdown("project")}
                  placeholder="프로젝트 선택 또는 입력"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                  style={{
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                    color: "var(--notion-text)",
                  }}
                />
                {activeDropdown === "project" && filteredProjects.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 max-h-32 overflow-y-auto rounded-lg border z-10"
                    style={{ background: "var(--notion-bg)", borderColor: "var(--notion-border)" }}
                  >
                    {filteredProjects.map((p) => (
                      <button
                        key={p}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-black/5"
                        style={{ color: "var(--notion-text)" }}
                        onClick={() => {
                          setDraftProject(p);
                          setProjectSearch("");
                          setActiveDropdown(null);
                        }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 모듈 */}
              <div className="relative">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text-muted)" }}>
                  모듈 *
                </label>
                <input
                  type="text"
                  value={draftModule || moduleSearch}
                  onChange={(e) => {
                    setDraftModule("");
                    setModuleSearch(e.target.value);
                    setActiveDropdown("module");
                  }}
                  onFocus={() => setActiveDropdown("module")}
                  placeholder="모듈 선택 또는 입력"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                  style={{
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                    color: "var(--notion-text)",
                  }}
                />
                {activeDropdown === "module" && filteredModules.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 max-h-32 overflow-y-auto rounded-lg border z-10"
                    style={{ background: "var(--notion-bg)", borderColor: "var(--notion-border)" }}
                  >
                    {filteredModules.map((m) => (
                      <button
                        key={m}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-black/5"
                        style={{ color: "var(--notion-text)" }}
                        onClick={() => {
                          setDraftModule(m);
                          setModuleSearch("");
                          setActiveDropdown(null);
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 기능명 */}
              <div className="relative">
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--notion-text-muted)" }}>
                  기능명 *
                </label>
                <input
                  type="text"
                  value={draftFeature || featureSearch}
                  onChange={(e) => {
                    setDraftFeature("");
                    setFeatureSearch(e.target.value);
                    setActiveDropdown("feature");
                  }}
                  onFocus={() => setActiveDropdown("feature")}
                  onKeyDown={handleInputKeyDown}
                  placeholder="기능명 선택 또는 입력"
                  className="w-full px-3 py-2.5 rounded-lg border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40"
                  style={{
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                    color: "var(--notion-text)",
                  }}
                />
                {activeDropdown === "feature" && filteredFeatures.length > 0 && (
                  <div
                    className="absolute left-0 right-0 top-full mt-1 max-h-32 overflow-y-auto rounded-lg border z-10"
                    style={{ background: "var(--notion-bg)", borderColor: "var(--notion-border)" }}
                  >
                    {filteredFeatures.map((f) => (
                      <button
                        key={f}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-black/5"
                        style={{ color: "var(--notion-text)" }}
                        onClick={() => {
                          setDraftFeature(f);
                          setFeatureSearch("");
                          setActiveDropdown(null);
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div
          className="flex items-center justify-end gap-2 px-4 py-3 border-t"
          style={{ borderColor: "var(--notion-border)" }}
        >
          <button
            onClick={handleInputBack}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-muted)" }}
          >
            취소
          </button>
          <button
            onClick={handleInputSubmit}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-[#F76D57]/20"
            style={{ background: "linear-gradient(135deg, #F76D57, #f9a88b)" }}
          >
            {inputMode.type === "feature" && inputMode.step === "title" ? "다음" : "생성"}
          </button>
        </div>
      </>
    );
  };

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
        {inputMode.type !== "none" ? (
          renderInputMode()
        ) : (
          <>
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
          </>
        )}

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
  // 기능 (코드)
  Feature: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  // 스프린트 (새로고침)
  Sprint: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  // 릴리즈 (로켓)
  Release: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
    </svg>
  ),
};

