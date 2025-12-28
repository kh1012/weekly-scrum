"use client";

/**
 * MultiSelectDropdown - 체크박스 기반 다중 선택 드롭다운
 * 
 * 기능:
 * - 체크박스 기반 다중 선택
 * - 검색 필터링
 * - Portal 기반 드롭다운 (viewport 감지)
 * - GitHub 스타일 테마
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface MultiSelectDropdownProps {
  /** 라벨 */
  label?: string;
  /** 선택된 값들 */
  value: string[];
  /** 선택 옵션 목록 */
  options: readonly string[];
  /** 값 변경 핸들러 */
  onChange: (value: string[]) => void;
  /** 플레이스홀더 */
  placeholder?: string;
  /** 비활성화 */
  disabled?: boolean;
  /** 라벨 숨김 */
  hideLabel?: boolean;
}

/**
 * MultiSelectDropdown 공통 컴포넌트
 */
export function MultiSelectDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "선택...",
  disabled = false,
  hideLabel = false,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
      const dropdownHeight = 300;
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

  const handleToggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const handleSelectAll = () => {
    if (value.length === filteredOptions.length) {
      onChange([]);
    } else {
      onChange([...filteredOptions]);
    }
  };

  const displayText = value.length > 0
    ? `${value.length}개 선택됨`
    : placeholder;

  return (
    <div className="space-y-2">
      {label && !hideLabel && (
        <label className="block text-sm font-medium text-[#24292f]">
          {label}
        </label>
      )}

      {/* 드롭다운 트리거 버튼 */}
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? closeDropdown() : openDropdown())}
        disabled={disabled}
        className={`w-full text-left flex items-center justify-between border border-[#d0d7de] rounded-md px-3 py-2 text-sm bg-white transition-all duration-200 ${
          isOpen
            ? "ring-2 ring-[#0969da] border-[#0969da]"
            : "hover:border-[#8c959f]"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span className={value.length > 0 ? "text-[#24292f]" : "text-[#57606a]"}>
          {displayText}
        </span>
        <svg
          className={`w-4 h-4 transition-transform text-[#57606a] ${isOpen ? "rotate-180" : ""}`}
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
            className="rounded-md shadow-lg border border-[#d0d7de] bg-white overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={dropdownStyle}
          >
            {/* 검색 입력 */}
            <div className="p-2 border-b border-[#d0d7de]">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="검색..."
                className="w-full px-3 py-1.5 text-xs border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
                autoFocus
              />
            </div>

            {/* 전체 선택/해제 */}
            {filteredOptions.length > 0 && (
              <div className="p-2 border-b border-[#d0d7de]">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="w-full px-2 py-1.5 text-xs text-left text-[#0969da] hover:bg-[#f6f8fa] rounded transition-colors"
                >
                  {value.length === filteredOptions.length
                    ? "전체 해제"
                    : "전체 선택"}
                </button>
              </div>
            )}

            {/* 옵션 목록 */}
            <div className="max-h-60 overflow-y-auto">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isChecked = value.includes(opt);
                  return (
                    <label
                      key={opt}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-[#f6f8fa] transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggle(opt)}
                        className="w-4 h-4 text-[#0969da] border-[#d0d7de] rounded focus:ring-2 focus:ring-[#0969da]"
                      />
                      <span className="text-[#24292f]">{opt}</span>
                    </label>
                  );
                })
              ) : (
                <div className="px-4 py-3 text-xs text-center text-[#57606a]">
                  검색 결과 없음
                </div>
              )}
            </div>

            {/* 선택 현황 */}
            {value.length > 0 && (
              <div className="p-2 border-t border-[#d0d7de] bg-[#f6f8fa]">
                <div className="flex items-center justify-between text-xs text-[#57606a]">
                  <span>{value.length}개 선택됨</span>
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-[#0969da] hover:text-[#0550ae] transition-colors"
                  >
                    모두 지우기
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}

export default MultiSelectDropdown;

