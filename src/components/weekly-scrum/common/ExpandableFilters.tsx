"use client";

import { useState, useRef, useEffect } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import type { FilterOptionState, MultiFilterState } from "@/types/scrum";

interface ExpandableFiltersProps {
  isMobile?: boolean;
  /** 기본 필터 값 설정 (컴포넌트 마운트 시 자동 적용) */
  defaultFilters?: Partial<Omit<MultiFilterState, "search">>;
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [alignRight, setAlignRight] = useState(false);

  // 드롭다운 위치 계산
  useEffect(() => {
    if (!isExpanded || !buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = 256; // w-64 = 256px
    const viewportWidth = window.innerWidth;
    const rightEdge = buttonRect.left + dropdownWidth;
    
    // 우측 끝이 viewport를 벗어나면 우측 정렬
    setAlignRight(rightEdge > viewportWidth - 16); // 16px 여유
  }, [isExpanded]);

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
  // 빈 배열 = 필터 없음 (전체 표시), 값 있음 = 필터 적용 (선택된 것만 표시)
  const isFilterActive = hasSelection;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 필터 버튼 - GitHub 스타일 */}
      <button
        ref={buttonRef}
        onClick={onToggleExpand}
        className={`flex items-center gap-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
          isMobile ? "h-8 text-[11px] px-2" : "h-9"
        } ${
          isFilterActive
            ? "bg-[#ddf4ff] text-[#0969da] border border-[#0969da]/30"
            : "bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de] hover:bg-[#f3f4f6]"
        }`}
      >
        <span>{icon}</span>
        <span className="truncate max-w-[80px]">
          {isFilterActive ? `${title} (${selectedCount})` : title}
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

      {/* 드롭다운 패널 - GitHub 스타일 */}
      {isExpanded && (
        <div
          className={`absolute top-full mt-1 w-64 max-h-80 overflow-hidden rounded-md bg-white border border-[#d0d7de] z-50 animate-fadeIn ${
            alignRight ? "right-0" : "left-0"
          }`}
          style={{
            boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#f6f8fa] border-b border-[#d0d7de]">
            <span className="text-xs font-semibold text-[#24292f]">
              {title}
            </span>
            <div className="flex items-center gap-1">
              {/* 전체 선택 버튼 */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const allValues = enabledOptions.map((opt) => opt.value);
                  onSelectAll(allValues);
                }}
                className="px-2 py-0.5 text-[10px] rounded-md bg-[#ddf4ff] text-[#0969da] hover:bg-[#b6e3ff] transition-colors"
              >
                전체 선택
              </button>
              {/* 필터 해제 버튼 (필터 적용 시에만 표시) */}
              {hasSelection && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClear();
                  }}
                  className="px-2 py-0.5 text-[10px] rounded-md bg-[#ffebe9] text-[#cf222e] hover:bg-[#ffd8d5] transition-colors"
                >
                  해제
                </button>
              )}
            </div>
          </div>

          {/* 옵션 목록 */}
          <div className="max-h-60 overflow-y-auto p-2">
            {options.length === 0 ? (
              <div className="text-center py-4 text-xs text-[#57606a]">
                옵션 없음
              </div>
            ) : (
              <div className="space-y-0.5">
                {options.map((option) => {
                  const isSelected = selectedValues.includes(option.value);
                  const isDisabled = !option.enabled;

                  return (
                    <label
                      key={option.value}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${
                        isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-[#f6f8fa]"
                      } ${isSelected && !isDisabled ? "bg-[#ddf4ff]" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => {
                          if (isDisabled) return;
                          onToggle(option.value);
                        }}
                        className="w-3.5 h-3.5 rounded border-[#d0d7de] text-[#0969da] focus:ring-[#0969da] focus:ring-offset-0"
                      />
                      <span className={`flex-1 text-xs truncate ${isDisabled ? "text-[#8c959f]" : "text-[#24292f]"}`}>
                        {option.value}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                          isDisabled
                            ? "bg-[#f6f8fa] text-[#8c959f]"
                            : "bg-[#ddf4ff] text-[#0969da]"
                        }`}
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
 * 확장 가능한 필터 컴포넌트 - GitHub 스타일
 * 
 * @example
 * // 기본 사용
 * <ExpandableFilters />
 * 
 * @example
 * // 기본값 설정 (특정 담당자, 프로젝트가 자동 선택됨)
 * <ExpandableFilters 
 *   defaultFilters={{
 *     members: ["김철수"],
 *     projects: ["weekly-scrum"]
 *   }}
 * />
 */
export function ExpandableFilters({ isMobile = false, defaultFilters }: ExpandableFiltersProps) {
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

  const [hasAppliedDefaults, setHasAppliedDefaults] = useState(false);

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

  // 기본 필터 값 적용 (마운트 시 한 번만)
  useEffect(() => {
    if (!defaultFilters || hasAppliedDefaults) return;

    // 옵션이 모두 로드되었는지 확인
    const hasOptions = filterSections.every(section => section.options.length > 0);
    if (!hasOptions) return;

    // 기본값 적용
    Object.entries(defaultFilters).forEach(([key, values]) => {
      if (values && values.length > 0) {
        const filterKey = key as keyof Omit<MultiFilterState, "search">;
        setMultiFilterAll(filterKey, values);
      }
    });

    setHasAppliedDefaults(true);
  }, [defaultFilters, hasAppliedDefaults, filterSections, setMultiFilterAll]);

  // 리셋 버튼 컴포넌트 - GitHub 스타일
  const ResetButton = ({ isMobileStyle = false }: { isMobileStyle?: boolean }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        resetMultiFilters();
        setHasAppliedDefaults(false); // 리셋 시 기본값 재적용 가능하도록
      }}
      className={`flex items-center justify-center rounded-md transition-colors ${
        isMobileStyle ? "w-8 h-8" : "w-9 h-9"
      } ${
        hasActiveMultiFilters
          ? "bg-[#ffebe9] text-[#cf222e] border border-[#ff8182] hover:bg-[#ffd8d5]"
          : "bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de] hover:bg-[#f3f4f6]"
      }`}
      title="필터 초기화 (전체 표시)"
    >
      <svg
        className={isMobileStyle ? "w-4 h-4" : "w-4 h-4"}
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
      <div className="flex items-center gap-1 flex-wrap">
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
    <div className="flex items-center gap-2 pr-4">
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
