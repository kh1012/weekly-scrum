"use client";

import { useState, useEffect } from "react";
import type { GnbParams } from "@/lib/ui/gnbParams";
import type { WorkspaceMember } from "@/lib/data/members";

interface TeamFeedFilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentGnbParams: GnbParams;
  workspaceMembers: WorkspaceMember[];
  onApplyFilters: (params: GnbParams) => void;
  onResetFilters: () => void;
}

/**
 * Team Feed 좌측 필터 패널 (GitHub 스타일)
 * - Author 필터
 * - Date range 필터
 * - Collaborator toggle
 */
export function TeamFeedFilterPanel({
  isOpen,
  onClose,
  currentGnbParams,
  workspaceMembers,
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

  useEffect(() => {
    setSelectedAuthor(currentGnbParams.author);
    setDateRangeStart(currentGnbParams.dateRangeStart);
    setDateRangeEnd(currentGnbParams.dateRangeEnd);
    setHasCollaborators(currentGnbParams.hasCollaborators || false);
  }, [currentGnbParams]);

  const handleApply = () => {
    onApplyFilters({
      ...currentGnbParams,
      author: selectedAuthor,
      dateRangeStart,
      dateRangeEnd,
      hasCollaborators: hasCollaborators || undefined,
    });
  };

  const handleReset = () => {
    setSelectedAuthor(undefined);
    setDateRangeStart(undefined);
    setDateRangeEnd(undefined);
    setHasCollaborators(false);
    onResetFilters();
  };

  const activeFilterCount = [
    selectedAuthor,
    dateRangeStart,
    dateRangeEnd,
    hasCollaborators,
  ].filter(Boolean).length;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Filter panel */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#d0d7de] overflow-y-auto transition-transform lg:translate-x-0 lg:h-full ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#24292f]">필터</h2>
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

          {/* Author filter */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#24292f]">
              작성자
            </label>
            <select
              value={selectedAuthor || ""}
              onChange={(e) => setSelectedAuthor(e.target.value || undefined)}
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm text-[#24292f] bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            >
              <option value="">전체</option>
              {workspaceMembers.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.display_name}
                </option>
              ))}
            </select>
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

