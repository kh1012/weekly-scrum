"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface CustomSelectOption {
  value: string | number;
  label: string;
}

interface CustomSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: CustomSelectOption[];
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
}

export function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  style = {},
  placeholder = "선택",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const selectedOption = options.find((opt) => opt.value === value);
  const displayText = selectedOption?.label || placeholder;

  // 드롭다운 위치 계산
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = Math.min(options.length * 36 + 16, 300); // 최대 300px

      let top = buttonRect.bottom + 4;
      let maxHeight = viewportHeight - buttonRect.bottom - 20;

      // 아래 공간이 부족하면 위에 표시
      if (maxHeight < dropdownHeight && buttonRect.top > dropdownHeight) {
        top = buttonRect.top - dropdownHeight - 4;
        maxHeight = buttonRect.top - 20;
      }

      setDropdownStyle({
        position: "fixed",
        top: `${top}px`,
        left: `${buttonRect.left}px`,
        width: `${buttonRect.width}px`,
        maxHeight: `${Math.min(dropdownHeight, maxHeight)}px`,
        zIndex: 9999,
      });
    }
  }, [isOpen, options.length]);

  // 외부 클릭 감지
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between text-left transition-all duration-200 ${className}`}
        style={style}
      >
        <span>{displayText}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ml-2 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            className="rounded-md shadow-lg border border-[#d0d7de] bg-white overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
            style={dropdownStyle}
          >
            <div className="py-1 max-h-full overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    option.value === value
                      ? "bg-[#ddf4ff] text-[#0969da] font-medium"
                      : "text-[#24292f] hover:bg-[#f6f8fa]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

