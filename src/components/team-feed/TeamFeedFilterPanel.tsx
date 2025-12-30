"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import type { GnbParams } from "@/lib/ui/gnbParams";
import type { WorkspaceMember } from "@/lib/data/members";
import { MultiSelectDropdown } from "@/components/common/MultiSelectDropdown";

interface TeamFeedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentGnbParams: GnbParams;
  workspaceMembers: WorkspaceMember[];
  projectOptions: string[];
  moduleOptions: string[];
  featureOptions: string[];
  onApplyFilters: (params: GnbParams) => void;
  onResetFilters: () => void;
}

/**
 * Team Feed 좌측 필터 패널 (GitHub 스타일)
 * - Author 필터 (Portal 기반 드롭다운)
 * - Date range 필터
 * - Collaborator toggle
 * - Project/Module/Feature 필터 (체크박스 기반 다중 선택)
 */
export function TeamFeedFilterPanel({
  isOpen,
  onClose,
  currentGnbParams,
  workspaceMembers,
  projectOptions,
  moduleOptions,
  featureOptions,
  onApplyFilters,
  onResetFilters,
}: TeamFeedFilterPanelProps) {
  const [selectedAuthor, setSelectedAuthor] = useState<string | undefined>(
    currentGnbParams.author
  );
  const [dateRangeStart, setDateRangeStart] = useState<string | undefined>(
    currentGnbParams.dateRangeStart
  );
  const [dateRangeEnd, setDateRangeEnd] = useState<string | undefined>(
    currentGnbParams.dateRangeEnd
  );
  const [hasCollaborators, setHasCollaborators] = useState<boolean>(
    currentGnbParams.hasCollaborators || false
  );
  const [selectedProjects, setSelectedProjects] = useState<string[]>(
    currentGnbParams.projects || []
  );
  const [selectedModules, setSelectedModules] = useState<string[]>(
    currentGnbParams.modules || []
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    currentGnbParams.features || []
  );

  // Author 드롭다운 상태
  const [isAuthorOpen, setIsAuthorOpen] = useState(false);
  const [authorSearch, setAuthorSearch] = useState("");
  const authorButtonRef = useRef<HTMLButtonElement>(null);
  const authorDropdownRef = useRef<HTMLDivElement>(null);
  const [authorDropdownStyle, setAuthorDropdownStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setSelectedAuthor(currentGnbParams.author);
    setDateRangeStart(currentGnbParams.dateRangeStart);
    setDateRangeEnd(currentGnbParams.dateRangeEnd);
    setHasCollaborators(currentGnbParams.hasCollaborators || false);
    setSelectedProjects(currentGnbParams.projects || []);
    setSelectedModules(currentGnbParams.modules || []);
    setSelectedFeatures(currentGnbParams.features || []);
  }, [currentGnbParams]);

  // Author 드롭다운 외부 클릭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        authorDropdownRef.current &&
        !authorDropdownRef.current.contains(e.target as Node) &&
        authorButtonRef.current &&
        !authorButtonRef.current.contains(e.target as Node)
      ) {
        setIsAuthorOpen(false);
        setAuthorSearch("");
      }
    };
    if (isAuthorOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isAuthorOpen]);

  // Author 드롭다운 위치 계산
  const calculateAuthorDropdownPosition = useCallback(() => {
    if (authorButtonRef.current) {
      const rect = authorButtonRef.current.getBoundingClientRect();
      const dropdownHeight = 280;
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const showAbove = spaceBelow < dropdownHeight && spaceAbove > spaceBelow;

      setAuthorDropdownStyle({
        position: "fixed",
        ...(showAbove
          ? { bottom: window.innerHeight - rect.top + 4 }
          : { top: rect.bottom + 4 }),
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, []);

  const openAuthorDropdown = useCallback(() => {
    calculateAuthorDropdownPosition();
    setIsAuthorOpen(true);
  }, [calculateAuthorDropdownPosition]);

  const closeAuthorDropdown = useCallback(() => {
    setIsAuthorOpen(false);
    setAuthorSearch("");
  }, []);

  // 스크롤/리사이즈 시 위치 재계산
  useEffect(() => {
    if (isAuthorOpen) {
      const handleScrollOrResize = () => calculateAuthorDropdownPosition();
      window.addEventListener("scroll", handleScrollOrResize, true);
      window.addEventListener("resize", handleScrollOrResize);
      return () => {
        window.removeEventListener("scroll", handleScrollOrResize, true);
        window.removeEventListener("resize", handleScrollOrResize);
      };
    }
  }, [isAuthorOpen, calculateAuthorDropdownPosition]);

  const filteredMembers = workspaceMembers.filter((member) =>
    (member.display_name || "").toLowerCase().includes(authorSearch.toLowerCase())
  );

  const handleAuthorSelect = (userId: string) => {
    setSelectedAuthor(userId === selectedAuthor ? undefined : userId);
    closeAuthorDropdown();
  };

  const handleApply = () => {
    onApplyFilters({
      ...currentGnbParams,
      author: selectedAuthor,
      dateRangeStart,
      dateRangeEnd,
      hasCollaborators: hasCollaborators || undefined,
      projects: selectedProjects.length > 0 ? selectedProjects : undefined,
      modules: selectedModules.length > 0 ? selectedModules : undefined,
      features: selectedFeatures.length > 0 ? selectedFeatures : undefined,
    });
  };

  const handleReset = () => {
    setSelectedAuthor(undefined);
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
    setHasCollaborators(false);
    setSelectedProjects([]);
    setSelectedModules([]);
    setSelectedFeatures([]);
    onResetFilters();
  };

  const activeFilterCount = [
    selectedAuthor,
    dateRangeStart,
    dateRangeEnd,
    hasCollaborators,
    selectedProjects.length > 0,
    selectedModules.length > 0,
    selectedFeatures.length > 0,
  ].filter(Boolean).length;

  const selectedMemberName = selectedAuthor
    ? workspaceMembers.find((m) => m.user_id === selectedAuthor)?.display_name
    : undefined;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Filter panel - Desktop: 좌측 고정, Mobile: 하단 Sheet */}
      <aside
        className={`
          fixed lg:static z-50 bg-white border-[#d0d7de] overflow-y-auto transition-transform
          lg:inset-y-0 lg:left-0 lg:w-64 lg:border-r lg:translate-x-0 lg:h-[calc(100vh-4rem)]
          inset-x-0 bottom-0 max-h-[70vh] lg:max-h-none rounded-t-2xl lg:rounded-none border-t lg:border-t-0 shadow-2xl lg:shadow-none
          ${isOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"}
        `}
      >
        <div className="p-4 space-y-4">
          {/* Mobile Sheet 드래그 핸들 */}
          <div className="lg:hidden flex justify-center -mt-2 mb-2">
            <div className="w-12 h-1 bg-[#d0d7de] rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#24292f]">Filters</h2>
            <button
              onClick={onClose}
              className="lg:hidden p-1 text-[#57606a] hover:text-[#24292f] transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Active filter count */}
          {activeFilterCount > 0 && (
            <div className="px-3 py-2 bg-[#ddf4ff] text-[#0969da] rounded-md text-sm">
              {activeFilterCount}개 필터 적용중
            </div>
          )}

          {/* Author filter (Portal 기반) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#24292f]">
              작성자
            </label>
            <button
              ref={authorButtonRef}
              type="button"
              onClick={() =>
                isAuthorOpen ? closeAuthorDropdown() : openAuthorDropdown()
              }
              className={`w-full text-left flex items-center justify-between border border-[#d0d7de] rounded-md px-3 py-2 text-sm bg-white transition-all duration-200 ${
                isAuthorOpen
                  ? "ring-2 ring-[#0969da] border-[#0969da]"
                  : "hover:border-[#8c959f]"
              }`}
            >
              <span
                className={
                  selectedMemberName ? "text-[#24292f]" : "text-[#57606a]"
                }
              >
                {selectedMemberName || "전체"}
              </span>
              <svg
                className={`w-4 h-4 transition-transform text-[#57606a] ${
                  isAuthorOpen ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Author 드롭다운 (Portal) */}
            {isAuthorOpen &&
              createPortal(
                <div
                  ref={authorDropdownRef}
                  className="rounded-md shadow-lg border border-[#d0d7de] bg-white overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
                  style={authorDropdownStyle}
                >
                  {/* 검색 입력 */}
                  <div className="p-2 border-b border-[#d0d7de]">
                    <input
                      type="text"
                      value={authorSearch}
                      onChange={(e) => setAuthorSearch(e.target.value)}
                      placeholder="검색..."
                      className="w-full px-3 py-1.5 text-xs border border-[#d0d7de] rounded-md focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
                      autoFocus
                    />
                  </div>

                  {/* 옵션 목록 */}
                  <div className="max-h-48 overflow-y-auto">
                    {/* 전체 옵션 */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAuthor(undefined);
                        closeAuthorDropdown();
                      }}
                      className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                        !selectedAuthor
                          ? "bg-[#ddf4ff] text-[#0969da] font-medium"
                          : "text-[#24292f] hover:bg-[#f6f8fa]"
                      }`}
                    >
                      {!selectedAuthor && (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                      <span className={!selectedAuthor ? "" : "ml-5.5"}>
                        전체
                      </span>
                    </button>

                    {filteredMembers.length > 0 ? (
                      filteredMembers.map((member) => {
                        const isSelected = selectedAuthor === member.user_id;
                        return (
                          <button
                            key={member.user_id}
                            type="button"
                            onClick={() => handleAuthorSelect(member.user_id)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center gap-2 ${
                              isSelected
                                ? "bg-[#ddf4ff] text-[#0969da] font-medium"
                                : "text-[#24292f] hover:bg-[#f6f8fa]"
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3.5 h-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                            <span className={isSelected ? "" : "ml-5.5"}>
                              {member.display_name}
                            </span>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-3 text-xs text-center text-[#57606a]">
                        검색 결과 없음
                      </div>
                    )}
                  </div>
                </div>,
                document.body
              )}
          </div>

          {/* Date range filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#24292f]">
              날짜 범위
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateRangeStart || ""}
                onChange={(e) => setDateRangeStart(e.target.value || undefined)}
                placeholder="시작일"
                className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
              />
              <input
                type="date"
                value={dateRangeEnd || ""}
                onChange={(e) => setDateRangeEnd(e.target.value || undefined)}
                placeholder="종료일"
                className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
              />
            </div>
          </div>

          {/* Collaborator toggle */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasCollaborators}
                onChange={(e) => setHasCollaborators(e.target.checked)}
                className="w-4 h-4 text-[#0969da] border-[#d0d7de] rounded focus:ring-2 focus:ring-[#0969da]"
              />
              <span className="text-sm text-[#24292f]">협업자가 있는 항목만</span>
            </label>
          </div>

          {/* Project filter */}
          {projectOptions.length > 0 && (
            <MultiSelectDropdown
              label="프로젝트"
              value={selectedProjects}
              options={projectOptions}
              onChange={setSelectedProjects}
              placeholder="전체"
            />
          )}

          {/* Module filter */}
          {moduleOptions.length > 0 && (
            <MultiSelectDropdown
              label="모듈"
              value={selectedModules}
              options={moduleOptions}
              onChange={setSelectedModules}
              placeholder="전체"
            />
          )}

          {/* Feature filter */}
          {featureOptions.length > 0 && (
            <MultiSelectDropdown
              label="기능"
              value={selectedFeatures}
              options={featureOptions}
              onChange={setSelectedFeatures}
              placeholder="전체"
            />
          )}

          {/* Buttons */}
          <div className="space-y-2 pt-4 border-t border-[#d0d7de]">
            <button
              onClick={handleApply}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0550ae] rounded-md transition-colors"
            >
              필터 적용
            </button>
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 text-sm font-medium text-[#24292f] bg-[#f6f8fa] hover:bg-[#eaeef2] border border-[#d0d7de] rounded-md transition-colors"
            >
              초기화
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
