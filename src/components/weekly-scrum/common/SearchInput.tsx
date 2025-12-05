"use client";

import { useState, useEffect, useRef } from "react";
import { useScrumContext } from "@/context/ScrumContext";

interface SearchInputProps {
  isMobile?: boolean;
}

export function SearchInput({ isMobile = false }: SearchInputProps) {
  const { filters, updateFilter } = useScrumContext();
  const [localValue, setLocalValue] = useState(filters.search);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 외부 필터가 변경되면 로컬 값도 동기화
  useEffect(() => {
    setLocalValue(filters.search);
  }, [filters.search]);

  const handleChange = (value: string) => {
    setLocalValue(value);

    // 이전 타이머 취소
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // 값이 있으면 로딩 상태 시작
    if (value) {
      setIsSearching(true);
    }

    // 디바운스 적용 (500ms)
    debounceTimerRef.current = setTimeout(() => {
      updateFilter("search", value);
      setIsSearching(false);
    }, 500);
  };

  const handleClear = () => {
    setLocalValue("");
    updateFilter("search", "");
    setIsSearching(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* 검색 아이콘 */}
      <svg
        className={`absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 ${
          isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
        }`}
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

      {/* 입력 필드 */}
      <input
        type="text"
        placeholder={isMobile ? "검색..." : "이름, 프로젝트, 토픽 검색..."}
        value={localValue}
        onChange={(e) => handleChange(e.target.value)}
        className={`w-full bg-white border border-slate-200 rounded-md
          text-slate-700 placeholder:text-slate-400
          focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
          hover:border-slate-300 transition-all
          ${
            isMobile ? "pl-8 pr-8 py-1.5 text-xs" : "pl-9 pr-10 py-1.5 text-sm"
          }`}
      />

      {/* 우측 영역: 로딩 스피너 또는 클리어 버튼 */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 ${
          isMobile ? "right-2" : "right-3"
        } flex items-center`}
      >
        {isSearching ? (
          // 로딩 스피너
          <svg
            className={`animate-spin text-blue-500 ${
              isMobile ? "w-3.5 h-3.5" : "w-4 h-4"
            }`}
            fill="none"
            viewBox="0 0 24 24"
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
        ) : localValue ? (
          // 클리어 버튼
          <button
            onClick={handleClear}
            className={`text-slate-400 hover:text-slate-600 transition-colors ${
              isMobile ? "p-0.5" : "p-0.5"
            }`}
          >
            <svg
              className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
