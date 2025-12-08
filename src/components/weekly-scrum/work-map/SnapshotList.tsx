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
 * 도넛 프로그래스 인디케이터
 */
function DonutProgress({ percent, size = 48 }: { percent: number; size?: number }) {
  const progressColor = getProgressColor(percent);
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        {/* 배경 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--notion-bg-secondary)"
          strokeWidth={strokeWidth}
        />
        {/* 진행률 원 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={progressColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.3s ease" }}
        />
      </svg>
      {/* 중앙 텍스트 */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ color: progressColor }}
      >
        <span className="text-xs font-bold">{percent}%</span>
      </div>
    </div>
  );
}

/**
 * 스냅샷 카드 컴포넌트
 */
function SnapshotCard({ item }: { item: ScrumItem }) {
  const progressColor = getProgressColor(item.progressPercent);

  return (
    <div
      className="p-4 rounded-xl shadow-sm h-full flex flex-col"
      style={{ 
        background: "var(--notion-bg)", 
        border: "1px solid var(--notion-border)",
      }}
    >
      {/* 헤더 - 이름/도메인 + 도넛 프로그래스 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0 mr-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span 
              className="font-medium truncate" 
              style={{ color: "var(--notion-text)" }}
              title={item.name}
            >
              {item.name}
            </span>
            <DomainBadge domain={item.domain} />
          </div>
          {item.riskLevel !== null && item.riskLevel > 0 && (
            <div className="mt-1">
              <RiskLevelBadge level={item.riskLevel} />
            </div>
          )}
        </div>
        {/* 도넛 프로그래스 */}
        <DonutProgress percent={item.progressPercent} size={48} />
      </div>

      {/* Progress 내용 */}
      <div className="mb-3 flex-1">
        <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
          완료된 작업
        </div>
        <ul className="space-y-1">
          {item.progress.slice(0, 2).map((p, i) => (
            <li
              key={i}
              className="text-sm flex items-start gap-2"
              style={{ color: "var(--notion-text-secondary)" }}
            >
              <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
              <span className="break-words line-clamp-1">{p}</span>
            </li>
          ))}
          {item.progress.length > 2 && (
            <li className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
              +{item.progress.length - 2} more
            </li>
          )}
        </ul>
      </div>

      {/* Next */}
      {item.next.length > 0 && (
        <div className="mb-3">
          <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
            다음 계획
          </div>
          <ul className="space-y-1">
            {item.next.slice(0, 1).map((n, i) => (
              <li
                key={i}
                className="text-sm flex items-start gap-2"
                style={{ color: "var(--notion-text-secondary)" }}
              >
                <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                <span className="break-words line-clamp-1">{n}</span>
              </li>
            ))}
            {item.next.length > 1 && (
              <li className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
                +{item.next.length - 1} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Risk - 아이콘만 표시 */}
      {item.risk && item.risk.length > 0 && (
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs" style={{ color: "#ef4444" }}>⚠</span>
          <span className="text-xs" style={{ color: "#ef4444" }}>
            {item.risk.length}개 리스크
          </span>
        </div>
      )}

      {/* Collaborators */}
      {item.collaborators && item.collaborators.length > 0 && (
        <div 
          className="flex flex-wrap gap-1 pt-2 border-t mt-auto" 
          style={{ borderColor: "var(--notion-border)" }}
        >
          {item.collaborators.slice(0, 3).map((collab, i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded-full"
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
              {collab.name}
            </span>
          ))}
          {item.collaborators.length > 3 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ 
                background: "var(--notion-bg-secondary)",
                color: "var(--notion-text-muted)" 
              }}
            >
              +{item.collaborators.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function SnapshotList({ items, maxItems = 9 }: SnapshotListProps) {
  const [showAll, setShowAll] = useState(false);
  
  if (items.length === 0) {
    return (
      <div
        className="h-full flex items-center justify-center text-sm"
        style={{ color: "var(--notion-text-muted)" }}
      >
        스냅샷이 없습니다.
      </div>
    );
  }

  const displayItems = showAll ? items : items.slice(0, maxItems);
  const hasMore = items.length > maxItems;

  return (
    <div>
      {/* 그리드 레이아웃 - 반응형 1~3 cols */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayItems.map((item, index) => (
          <SnapshotCard key={`${item.name}-${index}`} item={item} />
        ))}
      </div>

      {/* 더보기/접기 버튼 */}
      {hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
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

