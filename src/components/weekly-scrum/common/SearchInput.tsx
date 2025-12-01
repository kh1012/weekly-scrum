"use client";

import { useScrumContext } from "@/context/ScrumContext";

export function SearchInput() {
  const { filters, updateFilter } = useScrumContext();

  return (
    <div className="relative w-64">
      <svg
        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8c959f]"
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
        type="text"
        placeholder="검색..."
        value={filters.search}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="w-full pl-8 pr-3 py-1.5 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-sm text-[#1f2328] placeholder:text-[#8c959f] focus:outline-none focus:border-[#0969da] focus:bg-white transition-colors"
      />
    </div>
  );
}

