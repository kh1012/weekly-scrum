"use client";

import { getDomainColor } from "@/lib/colorDefines";

interface DashboardFiltersProps {
  availableDomains: string[];
  availableProjects: string[];
  selectedDomains: Set<string>;
  selectedProjects: Set<string>;
  onToggleDomain: (domain: string) => void;
  onToggleProject: (project: string) => void;
  onToggleAllDomains: () => void;
  onToggleAllProjects: () => void;
  onResetFilters: () => void;
}

export function DashboardFilters({
  availableDomains,
  availableProjects,
  selectedDomains,
  selectedProjects,
  onToggleDomain,
  onToggleProject,
  onToggleAllDomains,
  onToggleAllProjects,
  onResetFilters,
}: DashboardFiltersProps) {
  const hasActiveFilters = selectedDomains.size > 0 || selectedProjects.size > 0;

  return (
    <div className="notion-card p-4">
      <div className="flex flex-col gap-4">
        {/* 도메인 필터 */}
        <FilterSection
          label="🏷️ 도메인"
          count={selectedDomains.size}
          total={availableDomains.length}
          isAllSelected={selectedDomains.size === availableDomains.length}
          onToggleAll={onToggleAllDomains}
        >
          <div className="flex flex-wrap gap-1.5">
            {availableDomains.map((domain) => {
              const isChecked = selectedDomains.has(domain);
              const color = getDomainColor(domain);
              return (
                <FilterButton
                  key={domain}
                  label={domain}
                  isChecked={isChecked}
                  bgColor={isChecked ? color.bg : "var(--notion-bg-secondary)"}
                  textColor={isChecked ? color.text : "var(--notion-text-secondary)"}
                  borderColor={isChecked ? color.text : "var(--notion-border)"}
                  checkboxBg={isChecked ? color.text : "var(--notion-bg)"}
                  checkboxBorder={isChecked ? color.text : "var(--notion-border-dark)"}
                  onClick={() => onToggleDomain(domain)}
                />
              );
            })}
          </div>
          {selectedDomains.size === 0 && (
            <p className="text-xs mt-1.5" style={{ color: "var(--notion-text-muted)" }}>
              도메인을 선택하지 않으면 전체가 표시됩니다
            </p>
          )}
        </FilterSection>

        {/* 프로젝트 필터 */}
        <div style={{ opacity: selectedDomains.size === 0 ? 0.5 : 1 }}>
          <FilterSection
            label="📁 프로젝트"
            count={selectedProjects.size}
            total={availableProjects.length}
            isAllSelected={selectedProjects.size === availableProjects.length}
            onToggleAll={selectedDomains.size > 0 ? onToggleAllProjects : undefined}
          >
            {selectedDomains.size === 0 ? (
              <ProjectPlaceholder />
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {availableProjects.map((project) => {
                    const isChecked = selectedProjects.has(project);
                    return (
                      <FilterButton
                        key={project}
                        label={project}
                        isChecked={isChecked}
                        bgColor={isChecked ? "var(--notion-blue-bg)" : "var(--notion-bg-secondary)"}
                        textColor={isChecked ? "var(--notion-blue)" : "var(--notion-text-secondary)"}
                        borderColor={isChecked ? "var(--notion-blue)" : "var(--notion-border)"}
                        checkboxBg={isChecked ? "var(--notion-blue)" : "var(--notion-bg)"}
                        checkboxBorder={isChecked ? "var(--notion-blue)" : "var(--notion-border-dark)"}
                        onClick={() => onToggleProject(project)}
                        truncate
                      />
                    );
                  })}
                </div>
                {selectedProjects.size === 0 && (
                  <p className="text-xs mt-1.5" style={{ color: "var(--notion-text-muted)" }}>
                    프로젝트를 선택하지 않으면 선택된 도메인의 전체 프로젝트가 표시됩니다
                  </p>
                )}
              </>
            )}
          </FilterSection>
        </div>
      </div>

      {/* 필터 상태 표시 */}
      {hasActiveFilters && (
        <div
          className="mt-3 pt-3 flex items-center gap-2 flex-wrap"
          style={{ borderTop: "1px solid var(--notion-border)" }}
        >
          <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            필터:
          </span>
          {selectedDomains.size > 0 && (
            <span className="notion-badge-blue text-xs">도메인 {selectedDomains.size}개</span>
          )}
          {selectedProjects.size > 0 && (
            <span className="notion-badge-green text-xs">프로젝트 {selectedProjects.size}개</span>
          )}
          <button
            onClick={onResetFilters}
            className="text-xs hover:underline"
            style={{ color: "var(--notion-red)" }}
          >
            초기화
          </button>
        </div>
      )}
    </div>
  );
}

// 필터 섹션 래퍼
interface FilterSectionProps {
  label: string;
  count: number;
  total: number;
  isAllSelected: boolean;
  onToggleAll?: () => void;
  children: React.ReactNode;
}

function FilterSection({ label, count, total, isAllSelected, onToggleAll, children }: FilterSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: "var(--notion-text-secondary)" }}>
          {label} {count > 0 && `(${count}/${total})`}
        </span>
        {onToggleAll && (
          <button onClick={onToggleAll} className="text-xs hover:underline" style={{ color: "var(--notion-blue)" }}>
            {isAllSelected ? "전체 해제" : count > 0 ? "전체 해제" : "전체 선택"}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

// 체크박스 버튼
interface FilterButtonProps {
  label: string;
  isChecked: boolean;
  bgColor: string;
  textColor: string;
  borderColor: string;
  checkboxBg: string;
  checkboxBorder: string;
  onClick: () => void;
  truncate?: boolean;
}

function FilterButton({
  label,
  isChecked,
  bgColor,
  textColor,
  borderColor,
  checkboxBg,
  checkboxBorder,
  onClick,
  truncate,
}: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all"
      style={{
        background: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
      }}
    >
      <span
        className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
        style={{
          borderColor: checkboxBorder,
          background: checkboxBg,
        }}
      >
        {isChecked && (
          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </span>
      {truncate ? (
        <span className="truncate max-w-[150px]" title={label}>
          {label}
        </span>
      ) : (
        label
      )}
    </button>
  );
}

// 프로젝트 플레이스홀더
function ProjectPlaceholder() {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
      style={{ background: "var(--notion-bg-secondary)", border: "1px dashed var(--notion-border)" }}
    >
      <svg
        className="w-4 h-4 shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ color: "var(--notion-text-muted)" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
        도메인을 먼저 선택하면 프로젝트 필터를 사용할 수 있습니다
      </span>
    </div>
  );
}

