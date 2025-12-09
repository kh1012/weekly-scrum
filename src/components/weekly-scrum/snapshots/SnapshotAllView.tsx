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
  isSelectMode?: boolean;
}

// 카드 그리드 스타일 (최소 320px, 최대 자동)
const cardGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  gap: "16px",
};

export function SnapshotAllView({ items, displayMode, compareState, onCompareToggle, isSelectMode = false }: SnapshotAllViewProps) {
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

  // Stagger 클래스 계산
  const getStaggerClass = (index: number) => {
    const staggerIndex = Math.min(index % 8, 8);
    return `stagger-${staggerIndex + 1}`;
  };

  return (
    <div className="space-y-8 view-transition-enter">
      {/* 진행 중인 항목 */}
      {inProgressItems.length > 0 && (
        <section className="animate-section-reveal">
          {displayMode === "card" ? (
            <div style={cardGridStyle}>
              {inProgressItems.map((item, index) => (
                <div
                  key={`progress-${item.name}-${item.project}-${item.topic}-${index}`}
                  className={`animate-card-reveal ${getStaggerClass(index)}`}
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
              {inProgressItems.map((item, index) => (
                <div
                  key={`progress-${item.name}-${item.project}-${item.topic}-${index}`}
                  className={`animate-list-item ${getStaggerClass(index)}`}
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
        </section>
      )}

      {/* 완료된 항목 */}
      {completedItems.length > 0 && (
        <section className="animate-section-reveal" style={{ animationDelay: "0.15s" }}>
          <div 
            className="flex items-center gap-2 mb-4 pt-6 pb-2" 
            style={{ borderTop: "1px solid var(--notion-border)" }}
          >
            <span 
              className="text-xs font-medium px-3 py-1 rounded-full"
              style={{ 
                color: "var(--notion-text-muted)",
                background: "var(--notion-bg-secondary)",
              }}
            >
              완료됨 · {completedItems.length}
            </span>
          </div>
          {displayMode === "card" ? (
            <div style={cardGridStyle}>
              {completedItems.map((item, index) => (
                <div
                  key={`completed-${item.name}-${item.project}-${item.topic}-${index}`}
                  className={`animate-card-reveal ${getStaggerClass(index)}`}
                  style={{ animationDelay: `${0.2 + (index % 8) * 0.05}s` }}
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
              {completedItems.map((item, index) => (
                <div
                  key={`completed-${item.name}-${item.project}-${item.topic}-${index}`}
                  className={`animate-list-item ${getStaggerClass(index)}`}
                  style={{ animationDelay: `${0.2 + (index % 8) * 0.03}s` }}
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
        </section>
      )}
    </div>
  );
}
