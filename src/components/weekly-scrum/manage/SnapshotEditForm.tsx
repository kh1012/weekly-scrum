"use client";

/**
 * 스냅샷 상세 편집 폼 - Airbnb 스타일
 *
 * v2 스키마 기준으로 모든 필드를 편집할 수 있습니다.
 * Tab으로 순차적으로 필드 이동 가능합니다.
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { TempSnapshot } from "./types";
import type { PastWeekTask, Collaborator, Relation } from "@/types/scrum";
import {
  DOMAIN_OPTIONS,
  PROJECT_OPTIONS,
  MODULE_OPTIONS,
  ALL_MODULE_OPTIONS,
  FEATURE_OPTIONS,
  NAME_OPTIONS,
  RELATION_OPTIONS,
  RISK_LEVEL_OPTIONS,
  CUSTOM_INPUT_VALUE,
} from "@/lib/snapshotMetaOptions";
import { ShortcutHint } from "./ShortcutHint";

// 섹션 타입 (PlainTextPreview와 동일)
export type FormSection =
  | "meta"
  | "pastWeek"
  | "pastWeek.tasks"
  | "pastWeek.risks"
  | "pastWeek.riskLevel"
  | "pastWeek.collaborators"
  | "thisWeek"
  | "thisWeek.tasks";

interface SnapshotEditFormProps {
  snapshot: TempSnapshot;
  onUpdate: (updates: Partial<TempSnapshot>) => void;
  /** 컴팩트 모드: padding/margin 30~40% 축소 */
  compact?: boolean;
  /** 1열 레이아웃 모드: 좁은 화면에서 메타 필드를 1열로 배치 */
  singleColumn?: boolean;
  /** 섹션 포커스 콜백 */
  onFocusSection?: (section: FormSection | null) => void;
  /** Name 필드 숨김 (로그인 기반에서는 profile.display_name 사용) */
  hideName?: boolean;
  /** 외부에서 활성화된 섹션 (미리보기 클릭 등) */
  activeSection?: FormSection | null;
}

// 공통 입력 스타일 (일반 모드) - 편집 시 애니메이션
const inputStyles = `
  w-full px-4 py-3 
  border border-gray-200 rounded-xl 
  text-sm text-gray-900 placeholder-gray-400
  bg-white
  transition-all duration-200
  focus:outline-none focus:border-blue-500 focus:typing-glow
  hover:border-gray-300
`;

// 컴팩트 입력 스타일 - 편집 시 애니메이션
const inputStylesCompact = `
  w-full px-3 py-2 
  border border-gray-200 rounded-lg 
  text-xs text-gray-900 placeholder-gray-400
  bg-white
  transition-all duration-200
  focus:outline-none focus:border-blue-500 focus:typing-glow
  hover:border-gray-300
`;

const selectStyles = `
  ${inputStyles}
  appearance-none cursor-pointer
  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] 
  bg-[length:1.5rem_1.5rem] bg-[right_0.75rem_center] bg-no-repeat pr-12
`;

const selectStylesCompact = `
  ${inputStylesCompact}
  appearance-none cursor-pointer
  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%239ca3af%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] 
  bg-[length:1.25rem_1.25rem] bg-[right_0.5rem_center] bg-no-repeat pr-10
`;

/**
 * 커스텀 드롭다운 컴포넌트 - GNB 필터 스타일
 */
function MetaField({
  label,
  value,
  options,
  onChange,
  placeholder,
  tabIndex,
  compact,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
  placeholder?: string;
  tabIndex?: number;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustom, setIsCustom] = useState(
    !options.includes(value as never) && value !== ""
  );
  const [searchTerm, setSearchTerm] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // 드롭다운 위치 계산 함수 (viewport 감지: 아래 공간 부족 시 위로)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const calculateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 280; // 예상 드롭다운 높이 (max-h-48 = 192px + 검색 + 직접입력)
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 아래 공간이 부족하고 위 공간이 충분하면 위로 표시
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: "fixed",
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  // 드롭다운 열기 핸들러 - 위치를 먼저 계산한 후 열기
  const openDropdown = useCallback(() => {
    calculateDropdownPosition();
    setIsOpen(true);
  }, [calculateDropdownPosition]);

  // 드롭다운 닫기 핸들러
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
  }, []);

  // 스크롤/리사이즈 시 위치 재계산
  useEffect(() => {
    if (isOpen) {
      const handleScrollOrResize = () => calculateDropdownPosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isOpen, calculateDropdownPosition]);

  // 필터링된 옵션
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (opt: string) => {
    onChange(opt);
    closeDropdown();
    setIsCustom(false);
  };

  const handleCustomInput = () => {
    setIsCustom(true);
    closeDropdown();
    onChange("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const inputClass = compact ? inputStylesCompact : inputStyles;

  if (isCustom) {
    return (
      <div className={compact ? "space-y-1" : "space-y-2"}>
        <label
          className={`block font-medium text-gray-700 ${
            compact ? "text-xs" : "text-sm"
          }`}
        >
          {label}
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || `${label} 입력...`}
            tabIndex={tabIndex}
            className={inputClass}
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            tabIndex={-1}
            className={`font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors shrink-0 ${
              compact
                ? "px-2.5 py-2 text-xs rounded-lg"
                : "px-4 py-3 text-sm rounded-xl"
            }`}
          >
            목록
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      <label
        className={`block font-medium text-gray-700 ${
          compact ? "text-xs" : "text-sm"
        }`}
      >
        {label}
      </label>

      {/* 드롭다운 트리거 버튼 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        tabIndex={tabIndex}
        className={`w-full text-left flex items-center justify-between border transition-all duration-200 ${
          isOpen
            ? "border-blue-500 ring-2 ring-blue-500/20"
            : "border-gray-200 hover:border-gray-300"
        } ${
          compact
            ? "px-3 py-2 rounded-lg text-xs"
            : "px-4 py-3 rounded-xl text-sm"
        } bg-white`}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value || "선택..."}
        </span>
        <svg
          className={`${
            compact ? "w-4 h-4" : "w-5 h-5"
          } text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* 드롭다운 메뉴 (Portal) */}
      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-fadeIn"
          >
            {/* 검색 입력 */}
            <div className="p-2 border-b border-gray-100">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색..."
                className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                autoFocus
              />
            </div>

            {/* 옵션 목록 */}
            <div className="max-h-48 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full px-4 py-2.5 text-left text-xs transition-colors flex items-center gap-2 ${
                      value === opt
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {value === opt && (
                      <svg
                        className="w-3.5 h-3.5 text-blue-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    <span className={value === opt ? "" : "ml-5.5"}>{opt}</span>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-xs text-gray-400 text-center">
                  검색 결과 없음
                </div>
              )}
            </div>

            {/* 직접 입력 옵션 */}
            <div className="border-t border-gray-100">
              <button
                type="button"
                onClick={handleCustomInput}
                className="w-full px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
              >
                <svg
                  className="w-3.5 h-3.5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
                직접 입력...
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

/**
 * Task 편집 컴포넌트 (Past Week) - 25% 단위 슬라이더 포함
 */
function TaskEditor({
  tasks,
  onChange,
  baseTabIndex,
  compact,
}: {
  tasks: PastWeekTask[];
  onChange: (tasks: PastWeekTask[]) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  // 새 항목 추가 후 포커스 이동
  useEffect(() => {
    if (focusIndex !== null && inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, tasks.length]);

  const addTask = () => {
    const newIndex = tasks.length;
    onChange([...tasks, { title: "", progress: 0 }]);
    setFocusIndex(newIndex);
  };

  // 단축키 핸들러: Ctrl+Alt+↓ 또는 Cmd+Option+↓
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey && e.altKey && e.key === "ArrowDown") ||
      (e.metaKey && e.altKey && e.key === "ArrowDown")
    ) {
      e.preventDefault();
      addTask();
    }
  };

  const updateTask = (
    index: number,
    field: keyof PastWeekTask,
    value: string | number
  ) => {
    const newTasks = [...tasks];
    if (field === "title") {
      newTasks[index] = { ...newTasks[index], title: value as string };
    } else {
      newTasks[index] = {
        ...newTasks[index],
        progress: Math.min(100, Math.max(0, Number(value))),
      };
    }
    onChange(newTasks);
  };

  const removeTask = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  // 슬라이더 값을 25% 단위로 스냅
  const snapToStep = (value: number) => Math.round(value / 25) * 25;

  return (
    <div
      className={`divide-y divide-gray-100 border border-gray-200 overflow-hidden bg-white ${
        compact ? "rounded-lg" : "rounded-xl"
      }`}
    >
      {tasks.map((task, index) => (
        <div
          key={index}
          className={`group bg-white hover:bg-gray-50 transition-colors ${
            compact ? "px-2.5 py-2" : "px-4 py-3"
          }`}
        >
          {/* 상단: 제목 + 삭제 */}
          <div className="flex items-center gap-2">
            <input
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              value={task.title}
              onChange={(e) => updateTask(index, "title", e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="작업 내용..."
              tabIndex={baseTabIndex + index * 2}
              className={`flex-1 bg-transparent border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white ${
                compact
                  ? "px-2 py-1.5 rounded text-xs"
                  : "px-3 py-2 rounded-lg text-sm"
              }`}
            />
            <button
              type="button"
              onClick={() => removeTask(index)}
              tabIndex={-1}
              className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 ${
                compact ? "p-1" : "p-2"
              }`}
            >
              <svg
                className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* 하단: 프로그레스바 + 진행률 선택 - 한 줄 컴팩트 */}
          <div
            className={`flex items-center gap-2 ${compact ? "mt-2" : "mt-3"}`}
          >
            {/* 프로그레스바 (클릭/드래그 가능) */}
            <div
              className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const percent =
                  Math.round(
                    (((e.clientX - rect.left) / rect.width) * 100) / 25
                  ) * 25;
                updateTask(
                  index,
                  "progress",
                  Math.max(0, Math.min(100, percent))
                );
              }}
              onMouseDown={(e) => {
                const bar = e.currentTarget;
                const handleDrag = (moveEvent: MouseEvent) => {
                  const rect = bar.getBoundingClientRect();
                  const percent =
                    Math.round(
                      (((moveEvent.clientX - rect.left) / rect.width) * 100) /
                        25
                    ) * 25;
                  updateTask(
                    index,
                    "progress",
                    Math.max(0, Math.min(100, percent))
                  );
                };
                const handleUp = () => {
                  document.removeEventListener("mousemove", handleDrag);
                  document.removeEventListener("mouseup", handleUp);
                };
                document.addEventListener("mousemove", handleDrag);
                document.addEventListener("mouseup", handleUp);
              }}
            >
              <div
                className={`h-full rounded-full transition-all duration-150 ${
                  task.progress === 100 ? "bg-emerald-500" : "bg-gray-900"
                }`}
                style={{ width: `${task.progress}%` }}
              />
            </div>

            {/* 반응형: 넓으면 버튼, 좁으면 셀렉트 */}
            {/* 버튼 그룹 (md 이상) */}
            <div className="hidden md:flex items-center gap-0.5 shrink-0">
              {[0, 25, 50, 75, 100].map((value) => {
                const isSelected = task.progress === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => updateTask(index, "progress", value)}
                    tabIndex={-1}
                    className={`
                      px-2 py-1 text-xs font-medium rounded transition-all
                      ${
                        isSelected
                          ? task.progress === 100
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-900 text-white"
                          : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      }
                    `}
                  >
                    {value}
                  </button>
                );
              })}
            </div>

            {/* 셀렉트 (md 미만) */}
            <select
              value={snapToStep(task.progress)}
              onChange={(e) =>
                updateTask(index, "progress", Number(e.target.value))
              }
              tabIndex={baseTabIndex + index * 2 + 1}
              className={`md:hidden shrink-0 bg-gray-100 border-0 rounded-lg font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-900 ${
                task.progress === 100 ? "text-emerald-600" : "text-gray-700"
              } ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}`}
            >
              {[0, 25, 50, 75, 100].map((value) => (
                <option key={value} value={value}>
                  {value}%
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
      <div className="border-t border-gray-100">
        <button
          type="button"
          onClick={addTask}
          tabIndex={-1}
          className={`w-full flex items-center justify-center gap-2 font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors ${
            compact ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm"
          }`}
        >
          <svg
            className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          작업 추가
        </button>
        <ShortcutHint label="새 항목 추가" />
      </div>
    </div>
  );
}

/**
 * This Week Task 편집 컴포넌트
 */
function ThisWeekTaskEditor({
  tasks,
  onChange,
  baseTabIndex,
  compact,
}: {
  tasks: string[];
  onChange: (tasks: string[]) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusIndex, setFocusIndex] = useState<number | null>(null);

  // 새 항목 추가 후 포커스 이동
  useEffect(() => {
    if (focusIndex !== null && inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex]?.focus();
      setFocusIndex(null);
    }
  }, [focusIndex, tasks.length]);

  const addTask = () => {
    const newIndex = tasks.length;
    onChange([...tasks, ""]);
    setFocusIndex(newIndex);
  };

  const updateTask = (index: number, value: string) => {
    const newTasks = [...tasks];
    newTasks[index] = value;
    onChange(newTasks);
  };

  const removeTask = (index: number) => {
    onChange(tasks.filter((_, i) => i !== index));
  };

  // 단축키 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey && e.altKey && e.key === "ArrowDown") ||
      (e.metaKey && e.altKey && e.key === "ArrowDown")
    ) {
      e.preventDefault();
      addTask();
    }
  };

  return (
    <div
      className={`divide-y divide-gray-100 border border-gray-200 overflow-hidden bg-white ${
        compact ? "rounded-lg" : "rounded-xl"
      }`}
    >
      {tasks.map((task, index) => (
        <div
          key={index}
          className={`group flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors ${
            compact ? "px-2.5 py-2" : "px-4 py-3"
          }`}
        >
          <div
            className={`rounded-full bg-emerald-400 shrink-0 ${
              compact ? "w-1.5 h-1.5" : "w-2 h-2"
            }`}
          />
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            value={task}
            onChange={(e) => updateTask(index, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="계획 작업..."
            tabIndex={baseTabIndex + index}
            className={`flex-1 bg-transparent border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white ${
              compact
                ? "px-2 py-1.5 rounded text-xs"
                : "px-3 py-2 rounded-lg text-sm"
            }`}
          />
          <button
            type="button"
            onClick={() => removeTask(index)}
            tabIndex={-1}
            className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ${
              compact ? "p-1" : "p-2"
            }`}
          >
            <svg
              className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
      <div className="border-t border-gray-100">
        <button
          type="button"
          onClick={addTask}
          tabIndex={-1}
          className={`w-full flex items-center justify-center gap-2 font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors ${
            compact ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm"
          }`}
        >
          <svg
            className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          계획 추가
        </button>
        <ShortcutHint label="새 항목 추가" />
      </div>
    </div>
  );
}

/**
 * Risk 편집 컴포넌트 - 리스크 추가 버튼 기본 제공
 * RiskLevel 선택은 상위에서 Risks 레이블 우측에 표시
 */
function RiskEditor({
  risks,
  onChange,
  onAddRisk,
  onRemoveAllRisks,
  baseTabIndex,
  compact,
}: {
  risks: string[] | null;
  onChange: (risks: string[] | null) => void;
  onAddRisk: () => void;
  onRemoveAllRisks: () => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const actualRisks = risks || [];
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevLengthRef = useRef(actualRisks.length);

  // 새 항목 추가 후 포커스 이동 (배열 길이 변화 감지)
  useEffect(() => {
    if (actualRisks.length > prevLengthRef.current) {
      const newIndex = actualRisks.length - 1;
      inputRefs.current[newIndex]?.focus();
    }
    prevLengthRef.current = actualRisks.length;
  }, [actualRisks.length]);

  // 단축키 핸들러: Ctrl+Alt+↓ 또는 Cmd+Option+↓
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (
      (e.ctrlKey && e.altKey && e.key === "ArrowDown") ||
      (e.metaKey && e.altKey && e.key === "ArrowDown")
    ) {
      e.preventDefault();
      onAddRisk();
    }
  };

  const updateRisk = (index: number, value: string) => {
    const newRisks = [...actualRisks];
    newRisks[index] = value;
    onChange(newRisks);
  };

  const removeRisk = (index: number) => {
    const newRisks = actualRisks.filter((_, i) => i !== index);
    if (newRisks.length === 0) {
      onRemoveAllRisks();
    } else {
      onChange(newRisks);
    }
  };

  return (
    <div
      className={`divide-y divide-gray-100 border border-gray-200 overflow-hidden bg-white ${
        compact ? "rounded-lg" : "rounded-xl"
      }`}
    >
      {/* 리스크 목록 */}
      {actualRisks.map((risk, index) => (
        <div
          key={index}
          className={`group flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors ${
            compact ? "px-2.5 py-2" : "px-4 py-3"
          }`}
        >
          <div
            className={`rounded-full bg-orange-400 shrink-0 ${
              compact ? "w-1.5 h-1.5" : "w-2 h-2"
            }`}
          />
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            value={risk}
            onChange={(e) => updateRisk(index, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="리스크 내용..."
            tabIndex={baseTabIndex + index}
            className={`flex-1 bg-transparent border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent focus:bg-white ${
              compact
                ? "px-2 py-1.5 rounded text-xs"
                : "px-3 py-2 rounded-lg text-sm"
            }`}
          />
          <button
            type="button"
            onClick={() => removeRisk(index)}
            tabIndex={-1}
            className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all shrink-0 ${
              compact ? "p-1" : "p-2"
            }`}
          >
            <svg
              className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      ))}
      {/* 리스크 추가 버튼 */}
      <div className="border-t border-gray-100">
        <button
          type="button"
          onClick={onAddRisk}
          tabIndex={-1}
          className={`w-full flex items-center justify-center gap-2 font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors ${
            compact ? "px-2.5 py-2 text-xs" : "px-4 py-3 text-sm"
          }`}
        >
          <svg
            className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          리스크 추가
        </button>
        <ShortcutHint label="새 항목 추가" />
      </div>
    </div>
  );
}

// Relation 아이콘 및 설명 - 직관적인 화살표 스타일
const RELATION_INFO: Record<
  Relation,
  {
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
    activeColor: string;
  }
> = {
  pair: {
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
        />
      </svg>
    ),
    label: "페어",
    description: "함께 작업",
    color: "text-gray-300 hover:text-gray-400",
    activeColor: "text-purple-500",
  },
  pre: {
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
    ),
    label: "선행",
    description: "나에게 전달",
    color: "text-gray-300 hover:text-gray-400",
    activeColor: "text-blue-500",
  },
  post: {
    icon: (
      <svg
        className="w-3.5 h-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
        />
      </svg>
    ),
    label: "후행",
    description: "내가 전달",
    color: "text-gray-300 hover:text-gray-400",
    activeColor: "text-emerald-500",
  },
};

/**
 * Collaborator 편집 컴포넌트 - 아이콘 + 툴팁 + 체크박스 형태
 */
function CollaboratorEditor({
  collaborators,
  onChange,
  baseTabIndex,
  compact,
}: {
  collaborators: Collaborator[];
  onChange: (collaborators: Collaborator[]) => void;
  baseTabIndex: number;
  compact?: boolean;
}) {
  const [customModes, setCustomModes] = useState<Record<number, boolean>>({});
  const [multiModes, setMultiModes] = useState<Record<number, boolean>>({});
  const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(
    null
  );
  const [isMultiAddOpen, setIsMultiAddOpen] = useState(false);
  const [multiAddSelections, setMultiAddSelections] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [multiAddSearchTerm, setMultiAddSearchTerm] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [multiAddDropdownStyle, setMultiAddDropdownStyle] =
    useState<React.CSSProperties>({});
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const multiAddRef = useRef<HTMLDivElement>(null);
  const multiAddButtonRef = useRef<HTMLButtonElement>(null);
  const portalDropdownRef = useRef<HTMLDivElement>(null);
  const multiAddPortalRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownIndex !== null) {
        const buttonRef = buttonRefs.current[openDropdownIndex];
        const portalRef = portalDropdownRef.current;
        if (
          buttonRef &&
          !buttonRef.contains(e.target as Node) &&
          (!portalRef || !portalRef.contains(e.target as Node))
        ) {
          setOpenDropdownIndex(null);
          setSearchTerm("");
        }
      }
      if (isMultiAddOpen) {
        const portalRef = multiAddPortalRef.current;
        if (
          multiAddButtonRef.current &&
          !multiAddButtonRef.current.contains(e.target as Node) &&
          (!portalRef || !portalRef.contains(e.target as Node))
        ) {
          setIsMultiAddOpen(false);
          setMultiAddSelections(new Set());
          setMultiAddSearchTerm("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownIndex, isMultiAddOpen]);

  // 협업자 드롭다운 위치 계산 함수 (viewport 감지: 아래 공간 부족 시 위로)
  const calculateCollaboratorDropdownPosition = useCallback((index: number) => {
    if (buttonRefs.current[index]) {
      const rect = buttonRefs.current[index]!.getBoundingClientRect();
      const dropdownHeight = 280; // 예상 드롭다운 높이
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 아래 공간이 부족하고 위 공간이 충분하면 위로 표시
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setDropdownStyle({
        position: "fixed",
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  // 여러 명 추가 드롭다운 위치 계산 함수 (viewport 감지)
  const calculateMultiAddDropdownPosition = useCallback(() => {
    if (multiAddButtonRef.current) {
      const rect = multiAddButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 280; // 예상 드롭다운 높이
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // 아래 공간이 부족하고 위 공간이 충분하면 위로 표시
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setMultiAddDropdownStyle({
        position: "fixed",
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  // 협업자 드롭다운 열기 핸들러
  const openCollaboratorDropdown = useCallback(
    (index: number) => {
      calculateCollaboratorDropdownPosition(index);
      setOpenDropdownIndex(index);
      setSearchTerm("");
    },
    [calculateCollaboratorDropdownPosition]
  );

  // 여러 명 추가 드롭다운 열기 핸들러
  const openMultiAddDropdown = useCallback(() => {
    calculateMultiAddDropdownPosition();
    setIsMultiAddOpen(true);
    setMultiAddSearchTerm("");
  }, [calculateMultiAddDropdownPosition]);

  // 스크롤/리사이즈 시 위치 재계산
  useEffect(() => {
    if (openDropdownIndex !== null) {
      const handleScrollOrResize = () =>
        calculateCollaboratorDropdownPosition(openDropdownIndex);
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [openDropdownIndex, calculateCollaboratorDropdownPosition]);

  useEffect(() => {
    if (isMultiAddOpen) {
      const handleScrollOrResize = () => calculateMultiAddDropdownPosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isMultiAddOpen, calculateMultiAddDropdownPosition]);

  const addCollaborator = () => {
    onChange([...collaborators, { name: "", relations: ["pair"] }]);
  };

  // 여러 명 동시 추가
  const addMultipleCollaborators = () => {
    if (multiAddSelections.size === 0) return;
    const newCollaborators = Array.from(multiAddSelections).map((name) => ({
      name,
      relations: ["pair"] as Relation[],
    }));
    onChange([...collaborators, ...newCollaborators]);
    setMultiAddSelections(new Set());
    setIsMultiAddOpen(false);
  };

  const toggleMultiAddSelection = (name: string) => {
    setMultiAddSelections((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // 이미 추가된 협업자는 제외
  const availableNames = NAME_OPTIONS.filter(
    (name) => !collaborators.some((c) => c.name === name)
  );

  const updateName = (index: number, name: string) => {
    const newCollaborators = [...collaborators];
    newCollaborators[index] = { ...newCollaborators[index], name };
    onChange(newCollaborators);
    setOpenDropdownIndex(null);
  };

  const toggleMultiMode = (index: number) => {
    setMultiModes((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleRelation = (index: number, rel: Relation) => {
    const newCollaborators = [...collaborators];
    const currentRelations =
      newCollaborators[index].relations ||
      (newCollaborators[index].relation
        ? [newCollaborators[index].relation as Relation]
        : ["pair"]);
    const isMulti = multiModes[index];

    let newRelations: Relation[];
    if (isMulti) {
      if (currentRelations.includes(rel)) {
        if (currentRelations.length > 1) {
          newRelations = currentRelations.filter((r) => r !== rel);
        } else {
          newRelations = currentRelations;
        }
      } else {
        newRelations = [...currentRelations, rel];
      }
    } else {
      newRelations = [rel];
    }

    newCollaborators[index] = {
      name: newCollaborators[index].name,
      relations: newRelations,
    };
    onChange(newCollaborators);
  };

  const toggleCustomMode = (index: number, enable: boolean) => {
    setCustomModes((prev) => ({ ...prev, [index]: enable }));
    if (enable) {
      updateName(index, "");
    }
  };

  const removeCollaborator = (index: number) => {
    onChange(collaborators.filter((_, i) => i !== index));
    setCustomModes((prev) => {
      const newModes: Record<number, boolean> = {};
      Object.keys(prev).forEach((key) => {
        const k = parseInt(key, 10);
        if (k < index) newModes[k] = prev[k];
        else if (k > index) newModes[k - 1] = prev[k];
      });
      return newModes;
    });
  };

  const isCustomMode = (index: number, name: string) => {
    if (customModes[index] !== undefined) return customModes[index];
    return name !== "" && !NAME_OPTIONS.includes(name as never);
  };

  // 해당 index 협업자에게 사용 가능한 이름 목록 (자신 제외, 다른 협업자가 사용 중인 이름 제외)
  const getAvailableNamesForIndex = (index: number) => {
    const currentName = collaborators[index]?.name;
    return NAME_OPTIONS.filter(
      (name) =>
        name === currentName ||
        !collaborators.some((c, i) => i !== index && c.name === name)
    );
  };

  return (
    <div
      className={`divide-y divide-gray-100 border border-gray-200 ${
        compact ? "rounded-lg" : "rounded-xl"
      }`}
    >
      {collaborators.map((collab, index) => {
        const relations = collab.relations || [];
        const availableNamesForThis = getAvailableNamesForIndex(index);

        return (
          <div
            key={index}
            className={`group flex items-center gap-2 bg-white hover:bg-gray-50 transition-colors ${
              compact ? "px-2.5 py-2" : "px-4 py-3"
            }`}
          >
            {/* 이름 */}
            <div
              className="flex-1 min-w-0"
              ref={(el) => {
                dropdownRefs.current[index] = el;
              }}
            >
              {isCustomMode(index, collab.name) ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={collab.name}
                    onChange={(e) => {
                      const newCollaborators = [...collaborators];
                      newCollaborators[index] = {
                        ...newCollaborators[index],
                        name: e.target.value,
                      };
                      onChange(newCollaborators);
                    }}
                    placeholder="협업자 이름..."
                    tabIndex={baseTabIndex + index}
                    className={`flex-1 bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent ${
                      compact
                        ? "px-2 py-1.5 rounded text-xs"
                        : "px-3 py-2 rounded-lg text-sm"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => toggleCustomMode(index, false)}
                    tabIndex={-1}
                    className={`text-gray-600 border border-gray-200 hover:bg-white ${
                      compact
                        ? "px-2 py-1.5 text-xs rounded"
                        : "px-3 py-2 text-sm rounded-lg"
                    }`}
                  >
                    목록
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    ref={(el) => {
                      buttonRefs.current[index] = el;
                    }}
                    type="button"
                    onClick={() => {
                      if (openDropdownIndex === index) {
                        setOpenDropdownIndex(null);
                        setSearchTerm("");
                      } else {
                        openCollaboratorDropdown(index);
                      }
                    }}
                    tabIndex={baseTabIndex + index}
                    className={`w-full text-left bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent flex items-center justify-between ${
                      compact
                        ? "px-2 py-1.5 rounded text-xs"
                        : "px-3 py-2 rounded-lg text-sm"
                    }`}
                  >
                    <span
                      className={
                        collab.name ? "text-gray-900" : "text-gray-400"
                      }
                    >
                      {collab.name || "선택..."}
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        openDropdownIndex === index ? "rotate-180" : ""
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                  {openDropdownIndex === index &&
                    createPortal(
                      <div
                        ref={portalDropdownRef}
                        style={dropdownStyle}
                        className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-fadeIn"
                      >
                        {/* 검색 입력 */}
                        <div className="p-2 border-b border-gray-100">
                          <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="검색..."
                            className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                            autoFocus
                          />
                        </div>
                        {/* 옵션 목록 */}
                        <div className="max-h-48 overflow-y-auto">
                          {availableNamesForThis.filter((name) =>
                            name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          ).length > 0 ? (
                            availableNamesForThis
                              .filter((name) =>
                                name
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase())
                              )
                              .map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => {
                                    updateName(index, name);
                                    setSearchTerm("");
                                  }}
                                  className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                    collab.name === name
                                      ? "bg-blue-50 text-blue-600 font-medium"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {collab.name === name && (
                                    <svg
                                      className="w-3.5 h-3.5 text-blue-600"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={2}
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  )}
                                  <span
                                    className={
                                      collab.name === name ? "" : "ml-5.5"
                                    }
                                  >
                                    {name}
                                  </span>
                                </button>
                              ))
                          ) : (
                            <div className="px-4 py-3 text-xs text-gray-400 text-center">
                              검색 결과 없음
                            </div>
                          )}
                        </div>
                        {/* 직접 입력 옵션 */}
                        <div className="border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => {
                              toggleCustomMode(index, true);
                              setOpenDropdownIndex(null);
                              setSearchTerm("");
                            }}
                            className="w-full px-4 py-2.5 text-left text-xs text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <svg
                              className="w-3.5 h-3.5 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                            직접 입력...
                          </button>
                        </div>
                      </div>,
                      document.body
                    )}
                </div>
              )}
            </div>

            {/* 관계 - 미니멀 아이콘 버튼 */}
            <div className="flex items-center gap-0.5 shrink-0 overflow-visible">
              {/* 멀티 선택 토글 */}
              <div className="relative group/multi">
                <button
                  type="button"
                  onClick={() => toggleMultiMode(index)}
                  tabIndex={-1}
                  className={`
                    flex items-center justify-center transition-all p-1 rounded mr-1
                    ${
                      multiModes[index]
                        ? "text-gray-700 bg-gray-100"
                        : "text-gray-300 hover:text-gray-400"
                    }
                  `}
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                    />
                  </svg>
                </button>
                {/* 툴팁 */}
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/multi:opacity-100 transition-opacity pointer-events-none"
                  style={{ zIndex: 9999 }}
                >
                  {multiModes[index]
                    ? "단일 선택으로 전환"
                    : "다중 선택으로 전환"}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
              </div>
              {RELATION_OPTIONS.map((rel) => {
                const isSelected = relations.includes(rel);
                const info = RELATION_INFO[rel];
                return (
                  <div key={rel} className="relative group/tooltip">
                    <button
                      type="button"
                      onClick={() => toggleRelation(index, rel)}
                      tabIndex={-1}
                      className={`
                        flex items-center justify-center transition-all p-1 rounded
                        ${isSelected ? info.activeColor : info.color}
                      `}
                      aria-label={info.label}
                    >
                      {info.icon}
                    </button>
                    {/* 툴팁 - fixed 포지션으로 overflow 해결 */}
                    <div
                      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none"
                      style={{ zIndex: 9999 }}
                    >
                      {info.label}: {info.description}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => removeCollaborator(index)}
              tabIndex={-1}
              className={`text-gray-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all ${
                compact ? "p-1" : "p-2"
              }`}
            >
              <svg
                className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}
      {/* 하단 버튼 영역 */}
      <div
        className={`flex items-center gap-2 bg-white rounded-lg ${
          compact ? "px-2.5 py-2" : "px-4 py-3"
        }`}
      >
        {/* 협업자 추가 (1명) */}
        <button
          type="button"
          onClick={addCollaborator}
          tabIndex={-1}
          className={`flex-1 flex items-center justify-center gap-2 font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg ${
            compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
          }`}
        >
          <svg
            className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          추가
        </button>

        {/* 여러 명 추가 */}
        <div className="relative flex-1" ref={multiAddRef}>
          <button
            ref={multiAddButtonRef}
            type="button"
            onClick={() => {
              if (isMultiAddOpen) {
                setIsMultiAddOpen(false);
                setMultiAddSearchTerm("");
              } else {
                openMultiAddDropdown();
              }
            }}
            tabIndex={-1}
            className={`w-full flex items-center justify-center gap-2 font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors border border-blue-200 rounded-lg ${
              compact ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm"
            }`}
          >
            <svg
              className={compact ? "w-3.5 h-3.5" : "w-4 h-4"}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            여러 명
          </button>

          {/* 여러 명 추가 드롭다운 (Portal) */}
          {isMultiAddOpen &&
            createPortal(
              <div
                ref={multiAddPortalRef}
                style={multiAddDropdownStyle}
                className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden animate-fadeIn"
              >
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">
                      여러 명 선택
                    </span>
                    {multiAddSelections.size > 0 && (
                      <span className="text-[10px] text-blue-600 font-medium">
                        {multiAddSelections.size}명 선택
                      </span>
                    )}
                  </div>
                  {/* 검색 입력 */}
                  <input
                    type="text"
                    value={multiAddSearchTerm}
                    onChange={(e) => setMultiAddSearchTerm(e.target.value)}
                    placeholder="검색..."
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    autoFocus
                  />
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {availableNames.filter((name) =>
                    name
                      .toLowerCase()
                      .includes(multiAddSearchTerm.toLowerCase())
                  ).length > 0 ? (
                    availableNames
                      .filter((name) =>
                        name
                          .toLowerCase()
                          .includes(multiAddSearchTerm.toLowerCase())
                      )
                      .map((name) => (
                        <label
                          key={name}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={multiAddSelections.has(name)}
                            onChange={() => toggleMultiAddSelection(name)}
                            className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-xs text-gray-700">{name}</span>
                        </label>
                      ))
                  ) : (
                    <div className="px-2 py-3 text-xs text-gray-400 text-center">
                      {availableNames.length === 0
                        ? "추가 가능한 협업자가 없습니다"
                        : "검색 결과 없음"}
                    </div>
                  )}
                </div>
                {multiAddSelections.size > 0 && (
                  <div className="p-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => {
                        addMultipleCollaborators();
                        setMultiAddSearchTerm("");
                      }}
                      className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                    >
                      {multiAddSelections.size}명 추가하기
                    </button>
                  </div>
                )}
              </div>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
}

export function SnapshotEditForm({
  snapshot,
  onUpdate,
  compact = false,
  singleColumn = false,
  onFocusSection,
  hideName = false,
  activeSection,
}: SnapshotEditFormProps) {
  const moduleOptions =
    snapshot.project && MODULE_OPTIONS[snapshot.project]
      ? MODULE_OPTIONS[snapshot.project]
      : ALL_MODULE_OPTIONS;

  const handleMetaChange = useCallback(
    (field: keyof TempSnapshot, value: string) => {
      onUpdate({ [field]: value } as Partial<TempSnapshot>);
    },
    [onUpdate]
  );

  const handlePastWeekChange = useCallback(
    (
      field: keyof TempSnapshot["pastWeek"],
      value:
        | PastWeekTask[]
        | string[]
        | Collaborator[]
        | number
        | null
        | 0
        | 1
        | 2
        | 3
    ) => {
      onUpdate({
        pastWeek: { ...snapshot.pastWeek, [field]: value },
      });
    },
    [onUpdate, snapshot.pastWeek]
  );

  const handleThisWeekChange = useCallback(
    (tasks: string[]) => {
      onUpdate({ thisWeek: { tasks } });
    },
    [onUpdate]
  );

  // 컴팩트 모드 스타일
  const contentPadding = compact ? "p-3" : "p-6";
  const sectionGap = compact ? "gap-3" : "gap-4";
  const innerSpace = compact ? "space-y-3" : "space-y-4";
  const gridGap = compact ? "gap-2" : "gap-3";
  const labelMargin = compact ? "mb-1.5" : "mb-2";
  const labelSize = compact ? "text-[11px]" : "text-xs";

  // 1열/2열 그리드 레이아웃
  const gridCols = singleColumn ? "grid-cols-1" : "grid-cols-2";

  // 포커스 상태에 따른 섹션 스타일
  const [currentFocus, setCurrentFocus] = useState<FormSection | null>(null);
  // 영역별 흐리게 처리 토글 (기본: 켜짐)
  const [isFocusDimEnabled, setIsFocusDimEnabled] = useState(true);

  // 콘텐츠 영역 ref
  const contentRef = useRef<HTMLDivElement>(null);

  // 외부에서 activeSection이 변경되면 내부 상태도 동기화하고 해당 섹션의 첫 번째 입력에 포커스
  useEffect(() => {
    if (activeSection !== undefined) {
      setCurrentFocus(activeSection);

      // 해당 섹션의 첫 번째 입력 요소에 포커스
      if (activeSection && contentRef.current) {
        // 약간의 딜레이 후 포커스 (렌더링 완료 후)
        setTimeout(() => {
          const sectionEl = contentRef.current?.querySelector(
            `[data-section="${activeSection}"]`
          );
          if (sectionEl) {
            // 해당 섹션 내의 첫 번째 focusable 요소 찾기
            const focusable = sectionEl.querySelector<HTMLElement>(
              'button[tabindex]:not([tabindex="-1"]), input:not([type="hidden"]), select, textarea'
            );
            if (focusable) {
              focusable.focus();
            }
          }
        }, 50);
      }
    }
  }, [activeSection]);

  const handleFocus = (section: FormSection) => {
    setCurrentFocus(section);
    onFocusSection?.(section);
  };

  const getSectionOpacity = (section: FormSection, isHovered?: boolean) => {
    // hover 시 항상 100%
    if (isHovered) return "opacity-100";
    // 토글이 꺼져 있거나 포커스가 없으면 항상 100%
    if (!isFocusDimEnabled || !currentFocus) return "opacity-100";
    if (
      currentFocus === section ||
      currentFocus.startsWith(section + ".") ||
      section.startsWith(currentFocus.split(".")[0])
    ) {
      return "opacity-100";
    }
    return "opacity-60";
  };

  // 섹션 좌측 border 스타일 (항상 border 표시, 선택 시 색상 변경)
  const getSectionBorderStyle = (section: FormSection) => {
    const isActive =
      currentFocus === section ||
      currentFocus?.startsWith(section + ".") ||
      section.startsWith(currentFocus?.split(".")[0] || "");
    if (isActive) {
      return "border-l-2 border-l-blue-500 pl-4 ml-0";
    }
    return "border-l-2 border-l-gray-200 pl-4 ml-0 hover:border-l-gray-300";
  };

  // 서브섹션 좌측 border 스타일
  const getSubSectionBorderStyle = (section: FormSection) => {
    const isActive = currentFocus === section;
    if (isActive) {
      return "border-l-2 border-l-blue-400 pl-3 -ml-px";
    }
    return "border-l-2 border-l-transparent pl-3 -ml-px hover:border-l-gray-200";
  };

  const getFocusAccent = (section: FormSection) => {
    if (!currentFocus) return "";
    if (currentFocus === section || currentFocus.startsWith(section + ".")) {
      return "";
    }
    return "";
  };

  return (
    <div className="flex flex-col min-h-0 h-full">
      {/* 헤더 - PlainTextPreview와 높이 동일 (h-12), 고정 */}
      <div className="h-12 border-b border-gray-100 bg-white shrink-0 sticky top-0 z-10">
        <div className="h-full px-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-800">
              스냅샷 편집
            </span>
          </div>
          {/* 영역별 흐리게 처리 토글 */}
          <button
            type="button"
            onClick={() => setIsFocusDimEnabled(!isFocusDimEnabled)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
              isFocusDimEnabled
                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
            title={
              isFocusDimEnabled
                ? "영역 포커스 효과 끄기"
                : "영역 포커스 효과 켜기"
            }
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              {isFocusDimEnabled ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              )}
            </svg>
            포커스
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 - 문서 스타일 레이아웃 */}
      <div
        ref={contentRef}
        className={`flex-1 overflow-y-auto min-h-0 ${
          compact ? "px-4 py-4" : "px-6 py-6"
        }`}
      >
        {/* 메타 정보 - 문서 헤더 스타일 */}
        <section
          data-section="meta"
          className={`mb-8 transition-all duration-200 group/meta hover:opacity-100 ${getSectionOpacity(
            "meta"
          )} ${getSectionBorderStyle("meta")}`}
          onFocus={() => handleFocus("meta")}
          onClick={() => handleFocus("meta")}
        >
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 transition-colors duration-200 group-hover/meta:text-gray-600">
            메타 정보
          </h2>
          <div className="border-b border-gray-100 mb-4" />
          <div
            className={`grid ${gridCols} ${
              compact ? "gap-x-3 gap-y-2" : "gap-x-4 gap-y-3"
            }`}
          >
            {!hideName && (
              <MetaField
                label="Name"
                value={snapshot.name}
                options={NAME_OPTIONS}
                onChange={(v) => handleMetaChange("name", v)}
                placeholder="작성자 이름"
                tabIndex={1}
                compact={compact}
              />
            )}
            <MetaField
              label="Domain"
              value={snapshot.domain}
              options={DOMAIN_OPTIONS}
              onChange={(v) => handleMetaChange("domain", v)}
              tabIndex={hideName ? 1 : 2}
              compact={compact}
            />
            <MetaField
              label="Project"
              value={snapshot.project}
              options={PROJECT_OPTIONS}
              onChange={(v) => handleMetaChange("project", v)}
              tabIndex={hideName ? 2 : 3}
              compact={compact}
            />
            <MetaField
              label="Module"
              value={snapshot.module}
              options={moduleOptions}
              onChange={(v) => handleMetaChange("module", v)}
              tabIndex={hideName ? 3 : 4}
              compact={compact}
            />
            <div className={singleColumn ? "" : "col-span-2"}>
              <MetaField
                label="Feature"
                value={snapshot.feature}
                options={FEATURE_OPTIONS}
                onChange={(v) => handleMetaChange("feature", v)}
                placeholder="기능명 (예: Rich-note)"
                tabIndex={hideName ? 4 : 5}
                compact={compact}
              />
            </div>
          </div>
        </section>

        {/* Past Week - 챕터 스타일 */}
        <section
          data-section="pastWeek"
          className={`mb-10 transition-all duration-200 group/pastweek hover:opacity-100 ${getSectionOpacity(
            "pastWeek"
          )} ${getSectionBorderStyle("pastWeek")}`}
          onClick={() => handleFocus("pastWeek")}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider transition-colors duration-200 group-hover/pastweek:text-gray-600">
              Past Week
            </h2>

            {/* This Week → Past Week 가져오기 버튼 */}
            {snapshot.thisWeek.tasks.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const newTasks = snapshot.thisWeek.tasks.map((title) => ({
                    title,
                    progress: 0,
                  }));
                  onUpdate({
                    pastWeek: { ...snapshot.pastWeek, tasks: newTasks },
                    thisWeek: { tasks: [] },
                  });
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                title="This Week 작업을 Past Week로 복사합니다"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                  />
                </svg>
                This Week에서 가져오기
              </button>
            )}
          </div>
          <div className="border-b border-gray-100 mb-4" />

          <div className="space-y-6">
            {/* Tasks 서브섹션 */}
            <div
              data-section="pastWeek.tasks"
              className={`transition-all duration-200 ${getSectionOpacity(
                "pastWeek.tasks"
              )} ${getSubSectionBorderStyle("pastWeek.tasks")}`}
              onFocus={() => handleFocus("pastWeek.tasks")}
              onClick={(e) => {
                e.stopPropagation();
                handleFocus("pastWeek.tasks");
              }}
            >
              <h3
                className={`flex items-center gap-1.5 ${labelSize} font-semibold text-gray-700 ${labelMargin}`}
              >
                <svg
                  className="w-3.5 h-3.5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
                Tasks
              </h3>
              <TaskEditor
                tasks={snapshot.pastWeek.tasks}
                onChange={(tasks) => handlePastWeekChange("tasks", tasks)}
                baseTabIndex={10}
                compact={compact}
              />
            </div>

            {/* Risks 서브섹션 */}
            <div
              data-section="pastWeek.risks"
              className={`transition-all duration-200 ${getSectionOpacity(
                "pastWeek.risks"
              )} ${getSubSectionBorderStyle("pastWeek.risks")}`}
              onFocus={() => handleFocus("pastWeek.risks")}
              onClick={(e) => {
                e.stopPropagation();
                handleFocus("pastWeek.risks");
              }}
            >
              <div
                className={`flex items-center justify-between ${labelMargin}`}
              >
                <h3
                  className={`flex items-center gap-1.5 ${labelSize} font-semibold text-gray-700`}
                >
                  <svg
                    className="w-3.5 h-3.5 text-amber-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Risks
                </h3>
                {/* RiskLevel 선택 (리스크가 있을 때만) */}
                {snapshot.pastWeek.risk &&
                  snapshot.pastWeek.risk.length > 0 && (
                    <div className="flex items-center gap-0.5 bg-gray-50 rounded-md p-0.5">
                      {[
                        {
                          value: 0,
                          label: "없음",
                          color: "bg-emerald-500",
                          hoverColor: "hover:bg-emerald-50",
                        },
                        {
                          value: 1,
                          label: "경미",
                          color: "bg-yellow-500",
                          hoverColor: "hover:bg-yellow-50",
                        },
                        {
                          value: 2,
                          label: "중간",
                          color: "bg-orange-500",
                          hoverColor: "hover:bg-orange-50",
                        },
                        {
                          value: 3,
                          label: "심각",
                          color: "bg-rose-500",
                          hoverColor: "hover:bg-rose-50",
                        },
                      ].map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() =>
                            handlePastWeekChange(
                              "riskLevel",
                              level.value as 0 | 1 | 2 | 3
                            )
                          }
                          className={`
                          px-1.5 py-0.5 text-[10px] rounded font-medium transition-all
                          ${
                            snapshot.pastWeek.riskLevel === level.value
                              ? `${level.color} text-white shadow-sm`
                              : `text-gray-400 ${level.hoverColor} hover:text-gray-600`
                          }
                        `}
                        >
                          {level.label}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
              <RiskEditor
                risks={snapshot.pastWeek.risk}
                onChange={(risks) => handlePastWeekChange("risk", risks)}
                onAddRisk={() => {
                  const newRisks = [...(snapshot.pastWeek.risk || []), ""];
                  onUpdate({
                    pastWeek: {
                      ...snapshot.pastWeek,
                      risk: newRisks,
                      riskLevel:
                        snapshot.pastWeek.risk === null
                          ? 0
                          : snapshot.pastWeek.riskLevel,
                    },
                  });
                }}
                onRemoveAllRisks={() => {
                  onUpdate({
                    pastWeek: {
                      ...snapshot.pastWeek,
                      risk: null,
                      riskLevel: null,
                    },
                  });
                }}
                baseTabIndex={50}
                compact={compact}
              />
            </div>

            {/* Collaborators 서브섹션 */}
            <div
              data-section="pastWeek.collaborators"
              className={`transition-all duration-200 ${getSectionOpacity(
                "pastWeek.collaborators"
              )} ${getSubSectionBorderStyle("pastWeek.collaborators")}`}
              onFocus={() => handleFocus("pastWeek.collaborators")}
              onClick={(e) => {
                e.stopPropagation();
                handleFocus("pastWeek.collaborators");
              }}
            >
              <h3
                className={`flex items-center gap-1.5 ${labelSize} font-semibold text-gray-700 ${labelMargin}`}
              >
                <svg
                  className="w-3.5 h-3.5 text-violet-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                Collaborators
              </h3>
              <CollaboratorEditor
                collaborators={snapshot.pastWeek.collaborators}
                onChange={(collabs) =>
                  handlePastWeekChange("collaborators", collabs)
                }
                baseTabIndex={70}
                compact={compact}
              />
            </div>
          </div>
        </section>

        {/* This Week - 챕터 스타일 */}
        <section
          data-section="thisWeek"
          className={`transition-all duration-200 group/thisweek hover:opacity-100 ${getSectionOpacity(
            "thisWeek"
          )} ${getSectionBorderStyle("thisWeek")}`}
          onClick={() => handleFocus("thisWeek")}
        >
          <div className="mb-3">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider transition-colors duration-200 group-hover/thisweek:text-gray-600">
              This Week
            </h2>
          </div>
          <div className="border-b border-gray-100 mb-4" />

          <div
            data-section="thisWeek.tasks"
            className={`transition-all duration-200 ${getSectionOpacity(
              "thisWeek.tasks"
            )} ${getSubSectionBorderStyle("thisWeek.tasks")}`}
            onFocus={() => handleFocus("thisWeek.tasks")}
            onClick={(e) => {
              e.stopPropagation();
              handleFocus("thisWeek.tasks");
            }}
          >
            <h3
              className={`flex items-center gap-1.5 ${labelSize} font-semibold text-gray-700 ${labelMargin}`}
            >
              <svg
                className="w-3.5 h-3.5 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              Tasks
            </h3>
            <ThisWeekTaskEditor
              tasks={snapshot.thisWeek.tasks}
              onChange={handleThisWeekChange}
              baseTabIndex={100}
              compact={compact}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
