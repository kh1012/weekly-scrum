"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { useState, useEffect, useRef, useCallback } from "react";

interface SearchInputProps {
  isMobile?: boolean;
}

export function SearchInput({ isMobile = false }: SearchInputProps) {
  const { filters, updateFilter } = useScrumContext();
  const [localValue, setLocalValue] = useState(filters.search);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedUpdateFilter = useRef<NodeJS.Timeout | null>(null);

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
  }, [updateFilter]);

  return (
    <div className="relative w-full">
      {/* 검색 아이콘 */}
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ color: "var(--notion-text-muted)" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>

      <input
        type="text"
        placeholder={isMobile ? "검색..." : "검색..."}
        value={localValue}
        onChange={handleChange}
        className={`notion-input pl-8 ${
          isMobile ? "text-sm py-1.5" : "text-sm py-1.5"
        }`}
        style={{
          paddingRight: localValue || isSearching ? "32px" : "10px",
        }}
      />

      {/* 로딩/클리어 버튼 */}
      {(localValue || isSearching) && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <svg
              className="animate-spin w-3.5 h-3.5"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              style={{ color: "var(--notion-text-muted)" }}
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
              className="notion-btn p-0.5"
              style={{ color: "var(--notion-text-muted)" }}
            >
              <svg
                className="w-3.5 h-3.5"
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
          )}
        </div>
      )}
    </div>
  );
}
