"use client";

import { useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { PersonGroup, CompareState } from "./types";
import type { DisplayMode } from "./SnapshotToolbar";
import { ScrumCard } from "../cards/ScrumCard";
import { ScrumListItem } from "./ScrumListItem";
import { EmptyState } from "../common/EmptyState";

interface SnapshotPersonViewProps {
  personGroups: PersonGroup[];
  displayMode: DisplayMode;
  compareState: CompareState;
  onCompareToggle: (item: ScrumItem) => void;
}

export function SnapshotPersonView({
  personGroups,
  displayMode,
  compareState,
  onCompareToggle,
}: SnapshotPersonViewProps) {
  const [expandedPersons, setExpandedPersons] = useState<Set<string>>(new Set());

  if (personGroups.length === 0) {
    return <EmptyState message="스냅샷이 없습니다" submessage="필터 조건을 변경해보세요" />;
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
      (i) => i.name === item.name && i.topic === item.topic && i.project === item.project
    );

  return (
    <div className="space-y-4">
      {personGroups.map((group) => {
        const isExpanded = expandedPersons.has(group.name);
        const avgProgress = Math.round(
          group.items.reduce((sum, item) => sum + item.progressPercent, 0) / group.items.length
        );

        return (
          <div
            key={group.name}
            className="rounded-xl overflow-hidden"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
            }}
          >
            {/* 헤더 */}
            <button
              onClick={() => togglePerson(group.name)}
              className="w-full flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50/50 text-left"
            >
              <div className="flex items-center gap-3">
                {/* 아바타 */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                    color: "white",
                  }}
                >
                  {group.name.slice(0, 2)}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
                    {group.name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
                    {group.items.length}개 스냅샷 · 평균 {avgProgress}%
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* 도메인 뱃지 */}
                <div className="flex gap-1">
                  {group.domains.slice(0, 3).map((domain) => (
                    <span
                      key={domain}
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
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
                      className="px-2 py-0.5 rounded text-[10px]"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      +{group.domains.length - 3}
                    </span>
                  )}
                </div>
                {/* 확장 아이콘 */}
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* 스냅샷 목록 */}
            {isExpanded && (
              <div className="px-4 pb-4">
                {displayMode === "card" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {group.items.map((item, index) => (
                      <ScrumCard
                        key={`${group.name}-${item.project}-${item.topic}-${index}`}
                        item={item}
                        isCompleted={false}
                        showCompareCheckbox={true}
                        isCompareSelected={isSelected(item)}
                        onCompareToggle={onCompareToggle}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {group.items.map((item, index) => (
                      <ScrumListItem
                        key={`${group.name}-${item.project}-${item.topic}-${index}`}
                        item={item}
                        isCompleted={false}
                        showCompareCheckbox={true}
                        isCompareSelected={isSelected(item)}
                        onCompareToggle={onCompareToggle}
                      />
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
