"use client";

import type { ScrumItem } from "@/types/scrum";
import type { CompareState } from "./types";
import type { DisplayMode } from "./SnapshotToolbar";
import { ScrumCard } from "../cards/ScrumCard";
import { ScrumListItem } from "./ScrumListItem";
import { EmptyState } from "../common/EmptyState";

interface SnapshotAllViewProps {
  items: ScrumItem[];
  displayMode: DisplayMode;
  compareState: CompareState;
  onCompareToggle: (item: ScrumItem) => void;
}

export function SnapshotAllView({ items, displayMode, compareState, onCompareToggle }: SnapshotAllViewProps) {
  if (items.length === 0) {
    return <EmptyState message="스냅샷이 없습니다" submessage="필터 조건을 변경해보세요" />;
  }

  const inProgressItems = items
    .filter((item) => item.progressPercent < 100)
    .sort((a, b) => b.progressPercent - a.progressPercent);

  const completedItems = items.filter((item) => item.progressPercent >= 100);

  const isSelected = (item: ScrumItem) =>
    compareState.selectedItems.some(
      (i) => i.name === item.name && i.topic === item.topic && i.project === item.project
    );

  return (
    <div className="space-y-6">
      {/* 진행 중인 항목 (헤더 없이 바로 표시) */}
      {inProgressItems.length > 0 && (
        <section>
          {displayMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {inProgressItems.map((item, index) => (
                <ScrumCard
                  key={`progress-${item.name}-${item.project}-${item.topic}-${index}`}
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
              {inProgressItems.map((item, index) => (
                <ScrumListItem
                  key={`progress-${item.name}-${item.project}-${item.topic}-${index}`}
                  item={item}
                  isCompleted={false}
                  showCompareCheckbox={true}
                  isCompareSelected={isSelected(item)}
                  onCompareToggle={onCompareToggle}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 완료된 항목 */}
      {completedItems.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3 pt-4" style={{ borderTop: "1px solid var(--notion-border)" }}>
            <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
              완료된 항목 ({completedItems.length})
            </span>
          </div>
          {displayMode === "card" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {completedItems.map((item, index) => (
                <ScrumCard
                  key={`completed-${item.name}-${item.project}-${item.topic}-${index}`}
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
              {completedItems.map((item, index) => (
                <ScrumListItem
                  key={`completed-${item.name}-${item.project}-${item.topic}-${index}`}
                  item={item}
                  isCompleted={false}
                  showCompareCheckbox={true}
                  isCompareSelected={isSelected(item)}
                  onCompareToggle={onCompareToggle}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
