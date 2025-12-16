"use client";

/**
 * SearchableSelect - 검색 가능한 Select 컴포넌트
 * 
 * 기능:
 * - 드롭다운 선택
 * - 검색 필터링
 * - 직접 입력 모드
 * - Portal 기반 드롭다운 (viewport 감지)
 * - Notion 스타일 테마 지원
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface SearchableSelectProps {
  /** 라벨 */
  label?: string;
  /** 현재 값 */
  value: string;
  /** 선택 옵션 목록 */
  options: readonly string[];
  /** 값 변경 핸들러 */
  onChange: (value: string) => void;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 탭 인덱스 */
  tabIndex?: number;
  /** 컴팩트 모드 */
  compact?: boolean;
  /** 필수 여부 */
  required?: boolean;
  /** Notion 스타일 테마 사용 */
  notionStyle?: boolean;
  /** 비활성화 */
  disabled?: boolean;
  /** 에러 상태 */
  error?: boolean;
  /** 라벨 숨김 */
  hideLabel?: boolean;
}

/**
 * SearchableSelect 공통 컴포넌트
 */
export function SearchableSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "선택...",
  tabIndex,
  compact = false,
  required = false,
  notionStyle = false,
  disabled = false,
  error = false,
  hideLabel = false,
}: SearchableSelectProps) {
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

  // 드롭다운 위치 계산
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const calculateDropdownPosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
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

  const openDropdown = useCallback(() => {
    if (disabled) return;
    calculateDropdownPosition();
    setIsOpen(true);
  }, [calculateDropdownPosition, disabled]);

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

  // Notion 스타일 vs 기본 스타일
  const baseInputStyles = notionStyle
    ? `w-full transition-all focus:outline-none focus:ring-2 focus:ring-[#F76D57]/40 ${
        compact
          ? "px-3 py-2 rounded-lg text-sm"
          : "px-4 py-3 rounded-lg text-sm"
      }`
    : `w-full border transition-all duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 ${
        compact
          ? "px-3 py-2 rounded-lg text-xs"
          : "px-4 py-3 rounded-xl text-sm"
      }`;

  const notionInputStyle: React.CSSProperties = notionStyle
    ? {
        background: "var(--notion-bg)",
        borderColor: error ? "#ef4444" : "var(--notion-border)",
        color: "var(--notion-text)",
        border: `1px solid ${error ? "#ef4444" : "var(--notion-border)"}`,
      }
    : {};

  const labelStyles = notionStyle
    ? { color: "var(--notion-text)" }
    : {};

  // 직접 입력 모드
  if (isCustom) {
    return (
      <div className={compact ? "space-y-1" : "space-y-2"}>
        {label && !hideLabel && (
          <label
            className={`block font-medium ${
              compact ? "text-xs" : "text-sm"
            } ${notionStyle ? "" : "text-gray-700"}`}
            style={labelStyles}
          >
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            tabIndex={tabIndex}
            disabled={disabled}
            className={`${baseInputStyles} flex-1 ${notionStyle ? "" : "bg-white border-gray-200"}`}
            style={notionInputStyle}
          />
          <button
            type="button"
            onClick={() => setIsCustom(false)}
            tabIndex={-1}
            className={`font-medium shrink-0 transition-colors ${
              compact
                ? "px-2.5 py-2 text-xs rounded-lg"
                : "px-4 py-3 text-sm rounded-xl"
            } ${
              notionStyle
                ? "hover:opacity-80"
                : "text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
            style={
              notionStyle
                ? {
                    background: "var(--notion-bg-secondary)",
                    color: "var(--notion-text-muted)",
                  }
                : {}
            }
          >
            목록
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? "space-y-1" : "space-y-2"}>
      {label && !hideLabel && (
        <label
          className={`block font-medium ${
            compact ? "text-xs" : "text-sm"
          } ${notionStyle ? "" : "text-gray-700"}`}
          style={labelStyles}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* 드롭다운 트리거 버튼 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        tabIndex={tabIndex}
        disabled={disabled}
        className={`w-full text-left flex items-center justify-between border transition-all duration-200 ${
          isOpen
            ? notionStyle
              ? "ring-2 ring-[#F76D57]/40"
              : "border-blue-500 ring-2 ring-blue-500/20"
            : notionStyle
              ? "hover:opacity-80"
              : "border-gray-200 hover:border-gray-300"
        } ${
          compact
            ? "px-3 py-2 rounded-lg text-xs"
            : "px-4 py-3 rounded-xl text-sm"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${
          notionStyle ? "" : "bg-white"
        }`}
        style={
          notionStyle
            ? {
                background: "var(--notion-bg)",
                borderColor: error
                  ? "#ef4444"
                  : isOpen
                    ? "#F76D57"
                    : "var(--notion-border)",
                color: "var(--notion-text)",
              }
            : { borderColor: error ? "#ef4444" : undefined }
        }
      >
        <span
          className={value ? "" : ""}
          style={
            notionStyle
              ? { color: value ? "var(--notion-text)" : "var(--notion-text-muted)" }
              : { color: value ? "#111827" : "#9ca3af" }
          }
        >
          {value || placeholder}
        </span>
        <svg
          className={`${
            compact ? "w-4 h-4" : "w-5 h-5"
          } transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          style={{ color: notionStyle ? "var(--notion-text-muted)" : "#9ca3af" }}
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
            className={`rounded-xl shadow-xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150 ${
              notionStyle ? "" : "bg-white border-gray-200"
            }`}
            style={
              notionStyle
                ? {
                    ...dropdownStyle,
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                  }
                : dropdownStyle
            }
          >
            {/* 검색 입력 */}
            <div
              className="p-2 border-b"
              style={
                notionStyle
                  ? { borderColor: "var(--notion-border)" }
                  : { borderColor: "#f3f4f6" }
              }
            >
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색..."
                className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none ${
                  notionStyle
                    ? "focus:ring-1 focus:ring-[#F76D57]/40"
                    : "border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                }`}
                style={
                  notionStyle
                    ? {
                        background: "var(--notion-bg-secondary)",
                        borderColor: "var(--notion-border)",
                        color: "var(--notion-text)",
                      }
                    : {}
                }
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
                        ? notionStyle
                          ? "font-medium"
                          : "bg-blue-50 text-blue-700 font-medium"
                        : notionStyle
                          ? "hover:opacity-80"
                          : "text-gray-700 hover:bg-gray-50"
                    }`}
                    style={
                      notionStyle
                        ? {
                            background:
                              value === opt
                                ? "rgba(247, 109, 87, 0.1)"
                                : "transparent",
                            color:
                              value === opt
                                ? "#F76D57"
                                : "var(--notion-text)",
                          }
                        : {}
                    }
                  >
                    {value === opt && (
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        style={{
                          color: notionStyle ? "#F76D57" : "#2563eb",
                        }}
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
                <div
                  className="px-4 py-3 text-xs text-center"
                  style={{
                    color: notionStyle
                      ? "var(--notion-text-muted)"
                      : "#9ca3af",
                  }}
                >
                  검색 결과 없음
                </div>
              )}
            </div>

            {/* 직접 입력 옵션 */}
            <div
              className="border-t"
              style={
                notionStyle
                  ? { borderColor: "var(--notion-border)" }
                  : { borderColor: "#f3f4f6" }
              }
            >
              <button
                type="button"
                onClick={handleCustomInput}
                className="w-full px-4 py-2.5 text-left text-xs flex items-center gap-2 transition-colors"
                style={
                  notionStyle
                    ? { color: "var(--notion-text-muted)" }
                    : { color: "#4b5563" }
                }
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  style={{
                    color: notionStyle
                      ? "var(--notion-text-muted)"
                      : "#9ca3af",
                  }}
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

export default SearchableSelect;

