"use client";

import type { ScrumItem } from "@/types/scrum";
import type { CompareState } from "./types";
import { ScrumCard } from "../cards/ScrumCard";
import { EmptyState } from "../common/EmptyState";

interface SnapshotAllViewProps {
  items: ScrumItem[];
  compareState: CompareState;
  onCompareToggle: (item: ScrumItem) => void;
}

export function SnapshotAllView({ items, compareState, onCompareToggle }: SnapshotAllViewProps) {
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
      {/* 진행 중인 항목 */}
      {inProgressItems.length > 0 && (
        <section>
          <SectionHeader color="bg-blue-500" title="진행 중" count={inProgressItems.length} />
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
        </section>
      )}

      {/* 완료된 항목 */}
      {completedItems.length > 0 && (
        <section>
          <SectionHeader color="bg-green-500" title="완료" count={completedItems.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {completedItems.map((item, index) => (
              <ScrumCard
                key={`completed-${item.name}-${item.project}-${item.topic}-${index}`}
                item={item}
                isCompleted={true}
                showCompareCheckbox={true}
                isCompareSelected={isSelected(item)}
                onCompareToggle={onCompareToggle}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ color, title, count }: { color: string; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <h2 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
        {title}
      </h2>
      <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
        {count}개
      </span>
    </div>
  );
}

