"use client";

import { useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { PersonGroup, CompareState } from "./types";
import type { DisplayMode } from "./SnapshotToolbar";
import { ScrumCard } from "../cards/ScrumCard";
import { ScrumListItem } from "./ScrumListItem";
import { EmptyState } from "../common/EmptyState";

// 카드 그리드 스타일 (최소 320px, 최대 자동)
const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "16px",
};

// Stagger 클래스 계산
const getStaggerClass = (index: number) => {
  const staggerIndex = Math.min(index % 8, 8);
  return `stagger-${staggerIndex + 1}`;
};

interface SnapshotPersonViewProps {
  personGroups: PersonGroup[];
  displayMode: DisplayMode;
  compareState: CompareState;
  onCompareToggle: (item: ScrumItem) => void;
  isSelectMode?: boolean;
}

export function SnapshotPersonView({
  personGroups,
  displayMode,
  compareState,
  onCompareToggle,
  isSelectMode = false,
}: SnapshotPersonViewProps) {
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(
    new Set()
  );

  if (personGroups.length === 0) {
    return (
      <EmptyState
        message="스냅샷이 없습니다"
        submessage="필터 조건을 변경해보세요"
      />
    );
  }

  const togglePerson = (name: string) => {
    setExpandedPersons((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else {
        next.add(name);
      }
      return next;
    });
  };

  const isSelected = (item: ScrumItem) =>
    compareState.selectedItems.some(
      (i) =>
        i.name === item.name &&
        i.topic === item.topic &&
        i.project === item.project
    );

  return (
    <div className="space-y-4 view-transition-enter">
      {personGroups.map((group, groupIndex) => {
        const isExpanded = expandedPersons.has(group.name);
        const avgProgress = Math.round(
          group.items.reduce((sum, item) => sum + item.progressPercent, 0) /
            group.items.length
        );

        return (
          <div
            key={group.name}
            className={`interactive-card rounded-2xl overflow-hidden animate-card-reveal ${getStaggerClass(
              groupIndex
            )}`}
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
            }}
          >
            {/* 헤더 */}
            <button
              onClick={() => togglePerson(group.name)}
              className="w-full flex items-center justify-between px-5 py-4 transition-all duration-200 hover:bg-gray-50/80 text-left group"
            >
              <div className="flex items-center gap-4">
                {/* 아바타 */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold shadow-sm transition-transform duration-200 group-hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    color: "white",
                  }}
                >
                  {group.name.slice(0, 2)}
                </div>
                <div className="text-left">
                  <div
                    className="font-semibold text-base"
                    style={{ color: "var(--notion-text)" }}
                  >
                    {group.name}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    {group.items.length}개 스냅샷 · 평균 {avgProgress}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* 도메인 뱃지 */}
                <div className="flex gap-1.5">
                  {group.domains.slice(0, 3).map((domain) => (
                    <span
                      key={domain}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                      style={{
                        background: "var(--notion-bg-secondary)",
                        color: "var(--notion-text-muted)",
                      }}
                    >
                      {domain}
                    </span>
                  ))}
                  {group.domains.length > 3 && (
                    <span
                      className="px-2 py-1 rounded-lg text-[11px]"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      +{group.domains.length - 3}
                    </span>
                  )}
                </div>
                {/* 확장 아이콘 */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                  style={{
                    background: isExpanded
                      ? "rgba(59, 130, 246, 0.1)"
                      : "transparent",
                  }}
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{
                      color: isExpanded
                        ? "#3b82f6"
                        : "var(--notion-text-muted)",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </button>

            {/* 스냅샷 목록 */}
            {isExpanded && (
              <div
                className="px-5 py-5 animate-content-fade"
                style={{ borderTop: "1px solid var(--notion-border)" }}
              >
                {displayMode === "card" ? (
                  <div style={cardGridStyle}>
                    {group.items.map((item, index) => (
                      <div
                        key={`${group.name}-${item.project}-${item.topic}-${index}`}
                        className={`animate-card-reveal ${getStaggerClass(
                          index
                        )}`}
                      >
                        <ScrumCard
                          item={item}
                          isCompleted={false}
                          showCompareCheckbox={true}
                          isCompareSelected={isSelected(item)}
                          onCompareToggle={onCompareToggle}
                          isSelectMode={isSelectMode}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {group.items.map((item, index) => (
                      <div
                        key={`${group.name}-${item.project}-${item.topic}-${index}`}
                        className={`animate-list-item ${getStaggerClass(
                          index
                        )}`}
                      >
                        <ScrumListItem
                          item={item}
                          isCompleted={false}
                          showCompareCheckbox={true}
                          isCompareSelected={isSelected(item)}
                          onCompareToggle={onCompareToggle}
                          isSelectMode={isSelectMode}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
