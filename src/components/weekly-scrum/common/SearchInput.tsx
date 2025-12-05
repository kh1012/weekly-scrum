"use client";

import { useScrumContext } from "@/context/ScrumContext";

export function SearchInput() {
  const { filters, updateFilter } = useScrumContext();

  return (
    <div className="relative w-full lg:w-64">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
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
        placeholder="이름, 프로젝트, 토픽 검색..."
        value={filters.search}
        onChange={(e) => updateFilter("search", e.target.value)}
        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
      />
    </div>
  );
}
