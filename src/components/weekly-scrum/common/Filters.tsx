"use client";

import { useScrumContext } from "@/context/ScrumContext";

interface FiltersProps {
  isMobile?: boolean;
}

export function Filters({ isMobile = false }: FiltersProps) {
  const { filters, domains, projects, modules, members, updateFilter, resetFilters } = useScrumContext();

  const hasActiveFilters = filters.domain || filters.project || filters.module || filters.member || filters.search;

  // 모듈이 있는 경우 4개, 없으면 3개 필터
  const filterCount = modules.length > 0 ? 4 : 3;

  if (isMobile) {
    return (
      <div className="flex items-center gap-1 w-full">
        <select
          value={filters.member}
          onChange={(e) => updateFilter("member", e.target.value)}
          className="notion-select text-xs py-1 truncate"
          style={{ flex: `1 1 calc(100% / ${filterCount})`, minWidth: 0, maxWidth: `calc(100% / ${filterCount})` }}
        >
          <option value="">담당자</option>
          {members.map((member) => (
            <option key={member} value={member}>{member}</option>
          ))}
        </select>
        <select
          value={filters.domain}
          onChange={(e) => updateFilter("domain", e.target.value)}
          className="notion-select text-xs py-1 truncate"
          style={{ flex: `1 1 calc(100% / ${filterCount})`, minWidth: 0, maxWidth: `calc(100% / ${filterCount})` }}
        >
          <option value="">도메인</option>
          {domains.map((domain) => (
            <option key={domain} value={domain}>{domain}</option>
          ))}
        </select>
        <select
          value={filters.project}
          onChange={(e) => updateFilter("project", e.target.value)}
          className="notion-select text-xs py-1 truncate"
          style={{ flex: `1 1 calc(100% / ${filterCount})`, minWidth: 0, maxWidth: `calc(100% / ${filterCount})` }}
        >
          <option value="">프로젝트</option>
          {projects.map((project) => (
            <option key={project} value={project}>{project}</option>
          ))}
        </select>
        {modules.length > 0 && (
          <select
            value={filters.module}
            onChange={(e) => updateFilter("module", e.target.value)}
            className="notion-select text-xs py-1 truncate"
            style={{ flex: `1 1 calc(100% / ${filterCount})`, minWidth: 0, maxWidth: `calc(100% / ${filterCount})` }}
          >
            <option value="">모듈</option>
            {modules.map((mod) => (
              <option key={mod} value={mod}>{mod}</option>
            ))}
          </select>
        )}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="notion-btn p-1 shrink-0"
            title="필터 초기화"
            style={{ color: 'var(--notion-text-secondary)' }}
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
        value={filters.member}
        onChange={(e) => updateFilter("member", e.target.value)}
        className="notion-select"
      >
        <option value="">전체 담당자</option>
        {members.map((member) => (
          <option key={member} value={member}>{member}</option>
        ))}
      </select>
      <select
        value={filters.domain}
        onChange={(e) => updateFilter("domain", e.target.value)}
        className="notion-select"
      >
        <option value="">전체 도메인</option>
        {domains.map((domain) => (
          <option key={domain} value={domain}>{domain}</option>
        ))}
      </select>
      <select
        value={filters.project}
        onChange={(e) => updateFilter("project", e.target.value)}
        className="notion-select"
      >
        <option value="">전체 프로젝트</option>
        {projects.map((project) => (
          <option key={project} value={project}>{project}</option>
        ))}
      </select>
      {modules.length > 0 && (
        <select
          value={filters.module}
          onChange={(e) => updateFilter("module", e.target.value)}
          className="notion-select"
        >
          <option value="">전체 모듈</option>
          {modules.map((mod) => (
            <option key={mod} value={mod}>{mod}</option>
          ))}
        </select>
      )}
      {hasActiveFilters && (
        <button
          onClick={resetFilters}
          className="notion-btn p-1"
          title="필터 초기화"
          style={{ color: 'var(--notion-text-secondary)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
