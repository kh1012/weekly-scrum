"use client";

import { useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { DomainBadge, RiskLevelBadge } from "@/components/weekly-scrum/common";
import { getProgressColor } from "./MetricsIndicator";

interface SnapshotListProps {
  items: ScrumItem[];
  maxItems?: number;
}

/**
 * 스냅샷 리스트 아이템 (게시글 형태)
 */
function SnapshotListItem({ item, isExpanded, onToggle }: { 
  item: ScrumItem; 
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const progressColor = getProgressColor(item.progressPercent);

  return (
    <div
      className="border-b last:border-b-0 transition-all duration-200"
      style={{ borderColor: "var(--notion-border)" }}
    >
      {/* 접힌 상태: 주요 내용만 표시 */}
      <button
        onClick={onToggle}
        className="w-full text-left px-5 py-3.5 flex items-center gap-3 transition-all duration-200 group"
        style={{ background: "transparent" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(0, 0, 0, 0.015)";
          e.currentTarget.style.transform = "translateX(2px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        {/* 확장/축소 아이콘 */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`flex-shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
          style={{ color: "var(--notion-text-muted)" }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>

        {/* 진행률 */}
        <span
          className="text-sm font-bold flex-shrink-0 w-12 text-right"
          style={{ color: progressColor }}
        >
          {item.progressPercent}%
        </span>

        {/* 도메인 */}
        <div className="flex-shrink-0">
          <DomainBadge domain={item.domain} />
        </div>

        {/* 이름 */}
        <span 
          className="flex-1 text-sm font-medium truncate"
          style={{ color: "var(--notion-text)" }}
          title={item.name}
        >
          {item.name}
        </span>

        {/* 리스크 표시 */}
        {item.riskLevel !== null && item.riskLevel > 0 && (
          <div className="flex-shrink-0">
            <RiskLevelBadge level={item.riskLevel} />
          </div>
        )}

        {/* 완료 작업 요약 */}
        {item.progress.length > 0 && (
          <span
            className="hidden md:block text-xs truncate max-w-[200px]"
            style={{ color: "var(--notion-text-muted)" }}
            title={item.progress[0]}
          >
            ✓ {item.progress[0]}
          </span>
        )}

        {/* 협업자 수 */}
        {item.collaborators && item.collaborators.length > 0 && (
          <span
            className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-full"
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              color: "#3b82f6",
            }}
          >
            👥 {item.collaborators.length}
          </span>
        )}
      </button>

      {/* 확장된 상태: 전체 내용 */}
      {isExpanded && (
        <div
          className="px-5 pb-5 pt-3 ml-8 animate-content-fade"
        >
          {/* 경로 정보 */}
          <div className="mb-3 text-xs" style={{ color: "var(--notion-text-muted)" }}>
            📍 {item.project} {item.module ? `/ ${item.module}` : ""} / {item.topic}
          </div>

          {/* Progress 내용 */}
          {item.progress.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-text-muted)" }}>
                완료된 작업 ({item.progress.length})
              </div>
              <ul className="space-y-1.5">
                {item.progress.map((p, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                    style={{ color: "var(--notion-text-secondary)" }}
                  >
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    <span className="break-words">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Next */}
          {item.next.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-text-muted)" }}>
                다음 계획 ({item.next.length})
              </div>
              <ul className="space-y-1.5">
                {item.next.map((n, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                    style={{ color: "var(--notion-text-secondary)" }}
                  >
                    <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                    <span className="break-words">{n}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risk */}
          {item.risk && item.risk.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium mb-2" style={{ color: "#ef4444" }}>
                ⚠ 리스크 ({item.risk.length})
              </div>
              <ul className="space-y-1.5">
                {item.risk.map((r, i) => (
                  <li
                    key={i}
                    className="text-sm flex items-start gap-2"
                    style={{ color: "var(--notion-text-secondary)" }}
                  >
                    <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                    <span className="break-words">{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Collaborators */}
          {item.collaborators && item.collaborators.length > 0 && (
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-text-muted)" }}>
                협업자 ({item.collaborators.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {item.collaborators.map((collab, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background:
                        collab.relation === "pair"
                          ? "rgba(59, 130, 246, 0.15)"
                          : collab.relation === "pre"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(34, 197, 94, 0.15)",
                      color:
                        collab.relation === "pair"
                          ? "#3b82f6"
                          : collab.relation === "pre"
                          ? "#f59e0b"
                          : "#22c55e",
                    }}
                  >
                    {collab.relation === "pair" ? "🤝" : collab.relation === "pre" ? "⬅" : "➡"}{" "}
                    {collab.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SnapshotList({ items, maxItems = 15 }: SnapshotListProps) {
  const [showAll, setShowAll] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  if (items.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center text-sm py-8"
        style={{ color: "var(--notion-text-muted)" }}
      >
        스냅샷이 없습니다.
      </div>
    );
  }

  const displayItems = showAll ? items : items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  const toggleItem = (index: number) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // 모두 펼치기/접기
  const expandAll = () => {
    setExpandedItems(new Set(displayItems.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedItems(new Set());
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="text-xs font-medium" style={{ color: "var(--notion-text-muted)" }}>
          {items.length}개 스냅샷
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-gray-100"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            모두 펼치기
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-gray-100"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            모두 접기
          </button>
        </div>
      </div>

      {/* 리스트 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ 
          background: "var(--notion-bg)", 
          border: "1px solid var(--notion-border)",
        }}
      >
        {displayItems.map((item, index) => (
          <SnapshotListItem
            key={`${item.name}-${index}`}
            item={item}
            isExpanded={expandedItems.has(index)}
            onToggle={() => toggleItem(index)}
          />
        ))}
      </div>

      {/* 더보기/접기 버튼 */}
      {hasMore && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors hover:bg-gray-100"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-secondary)",
            }}
          >
            {showAll ? (
              <>접기 (최대 {maxItems}개 표시)</>
            ) : (
              <>더보기 (+{items.length - maxItems}개)</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
