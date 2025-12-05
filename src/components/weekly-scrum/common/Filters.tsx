"use client";

import { useScrumContext } from "@/context/ScrumContext";

export function Filters() {
  const { filters, domains, projects, updateFilter, resetFilters } = useScrumContext();

  const hasActiveFilters = filters.domain || filters.project || filters.search;

  return (
    <div className="flex items-center gap-2">
      <select
        value={filters.domain}
        onChange={(e) => updateFilter("domain", e.target.value)}
        className="appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer transition-all"
      >
        <option value="">전체 도메인</option>
        {domains.map((domain) => (
          <option key={domain} value={domain}>
            {domain}
          </option>
        ))}
      </select>
      <select
        value={filters.project}
        onChange={(e) => updateFilter("project", e.target.value)}
        className="appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 cursor-pointer transition-all"
      >
        <option value="">전체 프로젝트</option>
        {projects.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </select>
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          title="필터 초기화"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
