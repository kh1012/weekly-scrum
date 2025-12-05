"use client";

import { useScrumContext } from "@/context/ScrumContext";

interface FiltersProps {
  isMobile?: boolean;
}

export function Filters({ isMobile = false }: FiltersProps) {
  const { filters, domains, projects, updateFilter, resetFilters } = useScrumContext();

  const hasActiveFilters = filters.domain || filters.project || filters.search;

  const selectBaseClass = `
    appearance-none bg-white border border-slate-200 rounded-md
    text-slate-700 font-medium
    focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100
    cursor-pointer transition-all
    hover:border-slate-300 hover:bg-slate-50
  `;

  const selectSizeClass = isMobile 
    ? "px-2.5 py-1.5 text-xs pr-7" 
    : "px-3 py-1.5 text-sm pr-8";

  if (isMobile) {
    return (
      <div className="flex items-center gap-2 min-w-max">
        <select
          value={filters.domain}
          onChange={(e) => updateFilter("domain", e.target.value)}
          className={`${selectBaseClass} ${selectSizeClass}`}
        >
          <option value="">도메인</option>
          {domains.map((domain) => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
        <select
          value={filters.project}
          onChange={(e) => updateFilter("project", e.target.value)}
          className={`${selectBaseClass} ${selectSizeClass}`}
        >
          <option value="">프로젝트</option>
          {projects.map((project) => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all shrink-0"
            title="필터 초기화"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={filters.domain}
        onChange={(e) => updateFilter("domain", e.target.value)}
        className={`${selectBaseClass} ${selectSizeClass}`}
      >
        <option value="">전체 도메인</option>
        {domains.map((domain) => (
          <option key={domain} value={domain}>{domain}</option>
        ))}
      </select>
      <select
        value={filters.project}
        onChange={(e) => updateFilter("project", e.target.value)}
        className={`${selectBaseClass} ${selectSizeClass}`}
      >
        <option value="">전체 프로젝트</option>
        {projects.map((project) => (
          <option key={project} value={project}>{project}</option>
        ))}
      </select>
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-all"
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
