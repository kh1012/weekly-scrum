"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { FlagIcon, DocumentIcon, XIcon } from "@/components/common/Icons";
import type { DraftFlag } from "../../types";
import { sortByName, sortByDate, type FlagSortType } from "../../utils/flagUtils";

interface FlagsPopoverProps {
  flags: DraftFlag[];
  onClose: () => void;
  onFlagClick: (flag: DraftFlag) => void;
  onOpenDoc: (flag: DraftFlag) => void;
  isEditing: boolean;
  anchorRect: DOMRect | null;
}

export function FlagsPopover({
  flags,
  onClose,
  onFlagClick,
  onOpenDoc,
  isEditing,
  anchorRect,
}: FlagsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortType, setSortType] = useState<FlagSortType>("name");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    setIsSearching(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(value);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery("");
    setDebouncedSearchQuery("");
    setIsSearching(false);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const sortedFlags = useMemo(() => {
    let filtered = flags.filter((f) => !f.deleted);

    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((f) => f.title.toLowerCase().includes(query));
    }

    return filtered.sort(sortType === "name" ? sortByName : sortByDate);
  }, [flags, debouncedSearchQuery, sortType]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!anchorRect) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] rounded-xl shadow-2xl overflow-hidden"
      style={{
        top: anchorRect.bottom + 8,
        left: Math.max(16, anchorRect.left - 100),
        width: Math.max(400, anchorRect.width + 200),
        maxWidth: "min(500px, calc(100vw - 32px))",
        background: "white",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow:
          "0 20px 60px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)",
        maxHeight: "min(400px, calc(100vh - 200px))",
      }}
    >
      <div
        className="px-4 py-3"
        style={{
          background: "linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)",
          borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FlagIcon className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">
              Flags ({sortedFlags.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
          >
            <XIcon className="w-3 h-3 text-red-500" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Flag 검색..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 text-sm rounded-lg border border-red-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-red-300 placeholder:text-red-300"
            />
            {(localSearchQuery || isSearching) && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isSearching ? (
                  <svg
                    className="animate-spin w-4 h-4 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
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
                ) : (
                  <button
                    onClick={handleClearSearch}
                    className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center hover:bg-red-300"
                  >
                    <XIcon className="w-2.5 h-2.5 text-red-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="flex rounded-lg overflow-hidden border border-red-200">
            <button
              onClick={() => setSortType("name")}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                sortType === "name"
                  ? "bg-red-500 text-white"
                  : "bg-white text-red-500 hover:bg-red-50"
              }`}
              title="이름 순 (Release → Sprint → 기타)"
            >
              이름
            </button>
            <button
              onClick={() => setSortType("date")}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                sortType === "date"
                  ? "bg-red-500 text-white"
                  : "bg-white text-red-500 hover:bg-red-50"
              }`}
              title="기간 순"
            >
              기간
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {sortedFlags.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            {isEditing
              ? "Flag가 없습니다. Timeline에서 더블클릭하여 추가하세요."
              : "Flag가 없습니다."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedFlags.map((flag) => {
              const isPointFlag = flag.startDate === flag.endDate;
              const flagColor = flag.color || "#ef4444";

              return (
                <div
                  key={flag.clientId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <button
                    onClick={() => onFlagClick(flag)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <div
                      className="w-3 h-10 rounded-full flex-shrink-0"
                      style={{ background: flagColor }}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {flag.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {isPointFlag ? (
                          <span>{flag.startDate}</span>
                        ) : (
                          <span>
                            {flag.startDate} → {flag.endDate}
                          </span>
                        )}
                      </div>
                    </div>

                    <span
                      className="px-2 py-1 text-[10px] font-bold rounded flex-shrink-0"
                      style={{
                        background: `${flagColor}20`,
                        color: flagColor,
                      }}
                    >
                      {isPointFlag ? "포인트" : "범위"}
                    </span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDoc(flag);
                    }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors flex-shrink-0 border border-gray-200"
                    title="계획 데이터 보기"
                  >
                    <DocumentIcon className="w-4 h-4 text-blue-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
