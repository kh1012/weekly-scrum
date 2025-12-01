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
        className="appearance-none px-2 py-1.5 bg-white border border-[#d0d7de] rounded-md text-xs text-[#1f2328] text-center focus:outline-none focus:border-[#0969da] cursor-pointer"
      >
        <option value="">도메인</option>
        {domains.map((domain) => (
          <option key={domain} value={domain}>
            {domain}
          </option>
        ))}
      </select>
      <select
        value={filters.project}
        onChange={(e) => updateFilter("project", e.target.value)}
        className="appearance-none px-2 py-1.5 bg-white border border-[#d0d7de] rounded-md text-xs text-[#1f2328] text-center focus:outline-none focus:border-[#0969da] cursor-pointer"
      >
        <option value="">프로젝트</option>
        {projects.map((project) => (
          <option key={project} value={project}>
            {project}
          </option>
        ))}
      </select>
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="px-2 py-1.5 text-xs text-[#8c959f] hover:text-[#1f2328] transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}

