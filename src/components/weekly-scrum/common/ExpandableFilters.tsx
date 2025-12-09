"use client";

import { useState, useRef, useEffect } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import type { FilterOptionState, MultiFilterState } from "@/types/scrum";

interface ExpandableFiltersProps {
  isMobile?: boolean;
}

interface FilterSectionProps {
  title: string;
  icon: string;
  options: FilterOptionState[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  onSelectAll: (values: string[]) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isMobile?: boolean;
}

/**
 * 개별 필터 섹션 컴포넌트
 */
function FilterSection({
  title,
  icon,
  options,
  selectedValues,
  onToggle,
  onClear,
  onSelectAll,
  isExpanded,
  onToggleExpand,
  isMobile = false,
}: FilterSectionProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onToggleExpand();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isExpanded, onToggleExpand]);

  const enabledOptions = options.filter((opt) => opt.enabled);
  const selectedCount = selectedValues.length;
  const hasSelection = selectedCount > 0;
  // 빈 배열 = 전체 선택 (필터 미적용)
  const isAllSelected = !hasSelection;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 필터 버튼 - 전체 선택이면 파란색 활성화 */}
      <button
        onClick={onToggleExpand}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
          isMobile ? "text-[11px] px-2 py-1" : ""
        }`}
        style={{
          background: isAllSelected
            ? "rgba(59, 130, 246, 0.12)"
            : hasSelection
            ? "rgba(245, 158, 11, 0.12)"
            : "var(--notion-bg-secondary)",
          color: isAllSelected
            ? "#3b82f6"
            : hasSelection
            ? "#f59e0b"
            : "var(--notion-text-muted)",
          border: isAllSelected
            ? "1px solid rgba(59, 130, 246, 0.25)"
            : hasSelection
            ? "1px solid rgba(245, 158, 11, 0.25)"
            : "1px solid transparent",
        }}
      >
        <span>{icon}</span>
        <span className="truncate max-w-[80px]">
          {isAllSelected ? `${title} (전체)` : `${title} (${selectedCount})`}
        </span>
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 드롭다운 패널 */}
      {isExpanded && (
        <div
          className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-hidden rounded-xl z-50 animate-fadeIn"
          style={{
            background: "var(--notion-bg)",
            boxShadow: "var(--notion-shadow-lg)",
            border: "1px solid var(--notion-border)",
          }}
        >
          {/* 헤더 */}
          <div
            className="flex items-center justify-between px-3 py-2 border-b"
            style={{ borderColor: "var(--notion-border)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "var(--notion-text)" }}>
              {title}
            </span>
            {/* 전체 선택 버튼 (일부 선택된 경우에만 표시) */}
            {hasSelection && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                className="px-2 py-0.5 text-[10px] rounded transition-colors"
                style={{
                  color: "#3b82f6",
                  background: "rgba(59, 130, 246, 0.1)",
                }}
              >
                전체 선택
              </button>
            )}
          </div>

          {/* 옵션 목록 */}
          <div className="max-h-60 overflow-y-auto p-2">
            {options.length === 0 ? (
              <div
                className="text-center py-4 text-xs"
                style={{ color: "var(--notion-text-muted)" }}
              >
                옵션 없음
              </div>
            ) : (
              <div className="space-y-0.5">
                {options.map((option) => {
                  // 빈 배열 = 전체 선택, 또는 해당 값이 선택됨
                  const isSelected = isAllSelected || selectedValues.includes(option.value);
                  const isDisabled = !option.enabled;

                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
                        isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-gray-50"
                      }`}
                      style={{
                        background: isSelected && !isDisabled ? "rgba(59, 130, 246, 0.08)" : undefined,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => {
                          if (isDisabled) return;
                          if (isAllSelected) {
                            // 전체 선택 상태에서 하나를 해제하면, 나머지를 모두 선택
                            const otherValues = enabledOptions
                              .filter((opt) => opt.value !== option.value)
                              .map((opt) => opt.value);
                            onSelectAll(otherValues);
                          } else {
                            onToggle(option.value);
                          }
                        }}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500 focus:ring-offset-0"
                      />
                      <span
                        className="flex-1 text-xs truncate"
                        style={{
                          color: isDisabled
                            ? "var(--notion-text-muted)"
                            : "var(--notion-text)",
                        }}
                      >
                        {option.value}
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{
                          background: isDisabled
                            ? "var(--notion-bg-secondary)"
                            : "rgba(59, 130, 246, 0.1)",
                          color: isDisabled
                            ? "var(--notion-text-muted)"
                            : "#3b82f6",
                        }}
                      >
                        {option.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 확장 가능한 필터 컴포넌트
 */
export function ExpandableFilters({ isMobile = false }: ExpandableFiltersProps) {
  const {
    multiFilters,
    memberOptions,
    domainOptions,
    projectOptions,
    moduleOptions,
    featureOptions,
    toggleMultiFilter,
    setMultiFilterAll,
    clearMultiFilter,
    resetMultiFilters,
    hasActiveMultiFilters,
  } = useScrumContext();

  // 확장된 필터 섹션 상태
  const [expandedSection, setExpandedSection] = useState<keyof Omit<MultiFilterState, "search"> | null>(null);

  const toggleSection = (section: keyof Omit<MultiFilterState, "search">) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  const filterSections: Array<{
    key: keyof Omit<MultiFilterState, "search">;
    title: string;
    icon: string;
    options: FilterOptionState[];
  }> = [
    { key: "members", title: "담당자", icon: "👤", options: memberOptions },
    { key: "domains", title: "도메인", icon: "🏷️", options: domainOptions },
    { key: "projects", title: "프로젝트", icon: "📁", options: projectOptions },
    { key: "modules", title: "모듈", icon: "📦", options: moduleOptions },
    { key: "features", title: "피쳐", icon: "✨", options: featureOptions },
  ];

  // 리셋 버튼 컴포넌트
  const ResetButton = ({ isMobileStyle = false }: { isMobileStyle?: boolean }) => (
    <button
      onClick={resetMultiFilters}
      className={`flex items-center justify-center rounded-lg transition-all hover:scale-105 ${
        isMobileStyle ? "w-7 h-7" : "w-8 h-8"
      }`}
      style={{
        background: hasActiveMultiFilters
          ? "rgba(239, 68, 68, 0.1)"
          : "var(--notion-bg-secondary)",
        color: hasActiveMultiFilters ? "#ef4444" : "var(--notion-text-muted)",
        border: hasActiveMultiFilters
          ? "1px solid rgba(239, 68, 68, 0.25)"
          : "1px solid transparent",
      }}
      title="모든 필터 해제"
    >
      <svg
        className={isMobileStyle ? "w-3.5 h-3.5" : "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
    </button>
  );

  if (isMobile) {
    return (
      <div className="flex items-center gap-1 w-full overflow-x-auto pb-1">
        {/* 리셋 버튼 (좌측) */}
        <ResetButton isMobileStyle />
        
        {filterSections.map((section) => (
          <FilterSection
            key={section.key}
            title={section.title}
            icon={section.icon}
            options={section.options}
            selectedValues={multiFilters[section.key]}
            onToggle={(value) => toggleMultiFilter(section.key, value)}
            onClear={() => clearMultiFilter(section.key)}
            onSelectAll={(values) => setMultiFilterAll(section.key, values)}
            isExpanded={expandedSection === section.key}
            onToggleExpand={() => toggleSection(section.key)}
            isMobile
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* 리셋 버튼 (좌측) */}
      <ResetButton />
      
      {filterSections.map((section) => (
        <FilterSection
          key={section.key}
          title={section.title}
          icon={section.icon}
          options={section.options}
          selectedValues={multiFilters[section.key]}
          onToggle={(value) => toggleMultiFilter(section.key, value)}
          onClear={() => clearMultiFilter(section.key)}
          onSelectAll={(values) => setMultiFilterAll(section.key, values)}
          isExpanded={expandedSection === section.key}
          onToggleExpand={() => toggleSection(section.key)}
        />
      ))}
    </div>
  );
}
