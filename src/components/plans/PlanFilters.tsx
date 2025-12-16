"use client";

import { useState } from "react";
import type { FilterState, GroupByOption } from "./types";
import type { PlanType, PlanStatus } from "@/lib/data/plans";
import type { WorkspaceMember } from "@/lib/data/members";

interface PlanFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  groupBy: GroupByOption;
  onGroupByChange: (groupBy: GroupByOption) => void;
  filterOptions: {
    projects: string[];
    modules: string[];
    features: string[];
    stages: string[];
  };
  members: WorkspaceMember[];
}

const STATUS_OPTIONS: { value: PlanStatus; label: string }[] = [
  { value: "진행중", label: "진행중" },
  { value: "완료", label: "완료" },
  { value: "보류", label: "보류" },
  { value: "취소", label: "취소" },
];

const TYPE_OPTIONS: { value: PlanType; label: string }[] = [
  { value: "feature", label: "기능" },
  { value: "sprint", label: "스프린트" },
  { value: "release", label: "릴리즈" },
];

const GROUP_OPTIONS: { value: GroupByOption; label: string }[] = [
  { value: "none", label: "그룹 없음" },
  { value: "project", label: "프로젝트별" },
  { value: "module", label: "모듈별" },
  { value: "assignee", label: "담당자별" },
  { value: "stage", label: "단계별" },
];

/**
 * Plan 필터 패널 컴포넌트
 */
export function PlanFilters({
  filters,
  onFiltersChange,
  groupBy,
  onGroupByChange,
  filterOptions,
  members,
}: PlanFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({});
  };

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    if (value === "" || value === undefined) {
      const { [key]: removed, ...rest } = filters;
      void removed; // suppress unused warning
      onFiltersChange(rest);
    } else {
      onFiltersChange({ ...filters, [key]: value });
    }
  };

  return (
    <div
      className="rounded-xl border"
      style={{
        background: "var(--notion-bg-elevated)",
        borderColor: "var(--notion-border)",
      }}
    >
      {/* 헤더 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/50"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--notion-text-muted)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
            필터 & 그룹
          </span>
          {activeFilterCount > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        <svg
          className="w-4 h-4 transition-transform"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{
            color: "var(--notion-text-muted)",
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 필터 패널 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: "var(--notion-border)" }}>
          {/* 그룹 & 필터 초기화 */}
          <div className="flex items-center justify-between pt-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium" style={{ color: "var(--notion-text-muted)" }}>
                그룹:
              </span>
              <select
                value={groupBy}
                onChange={(e) => onGroupByChange(e.target.value as GroupByOption)}
                className="text-sm px-3 py-1.5 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                {GROUP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "#ef4444" }}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                필터 초기화
              </button>
            )}
          </div>

          {/* 필터 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* 타입 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                타입
              </label>
              <select
                value={filters.type || ""}
                onChange={(e) => updateFilter("type", e.target.value as PlanType | undefined)}
                className="w-full text-sm px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                <option value="">전체</option>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 상태 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                상태
              </label>
              <select
                value={filters.status || ""}
                onChange={(e) => updateFilter("status", e.target.value as PlanStatus | undefined)}
                className="w-full text-sm px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                <option value="">전체</option>
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 프로젝트 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                프로젝트
              </label>
              <select
                value={filters.project || ""}
                onChange={(e) => updateFilter("project", e.target.value || undefined)}
                className="w-full text-sm px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                <option value="">전체</option>
                {filterOptions.projects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {/* 모듈 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                모듈
              </label>
              <select
                value={filters.module || ""}
                onChange={(e) => updateFilter("module", e.target.value || undefined)}
                className="w-full text-sm px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                <option value="">전체</option>
                {filterOptions.modules.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* 단계 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                단계
              </label>
              <select
                value={filters.stage || ""}
                onChange={(e) => updateFilter("stage", e.target.value || undefined)}
                className="w-full text-sm px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                <option value="">전체</option>
                {filterOptions.stages.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* 담당자 */}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                담당자
              </label>
              <select
                value={filters.assigneeUserId || ""}
                onChange={(e) => updateFilter("assigneeUserId", e.target.value || undefined)}
                className="w-full text-sm px-3 py-2 rounded-lg border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                }}
              >
                <option value="">전체</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.display_name || m.email || m.user_id}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
