"use client";

import type { SnapshotViewMode, PersonGroup } from "./types";

interface SnapshotToolbarProps {
  viewMode: SnapshotViewMode;
  onViewModeChange: (mode: SnapshotViewMode) => void;
  personGroups: PersonGroup[];
  selectedPerson: string | null;
  onPersonChange: (person: string | null) => void;
  compareCount: number;
  onOpenCompare: () => void;
  onClearCompare: () => void;
}

export function SnapshotToolbar({
  viewMode,
  onViewModeChange,
  personGroups,
  selectedPerson,
  onPersonChange,
  compareCount,
  onOpenCompare,
  onClearCompare,
}: SnapshotToolbarProps) {
  const viewModes: Array<{ key: SnapshotViewMode; label: string; icon: string }> = [
    { key: "all", label: "전체 보기", icon: "📋" },
    { key: "person", label: "사람별 보기", icon: "👤" },
    { key: "continuity", label: "연속성 분석", icon: "🔗" },
  ];

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: "var(--notion-bg)",
        border: "1px solid var(--notion-border)",
      }}
    >
      <div className="flex flex-wrap items-center gap-4">
        {/* 뷰 모드 탭 */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--notion-bg-secondary)" }}>
          {viewModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onViewModeChange(mode.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: viewMode === mode.key ? "var(--notion-bg)" : "transparent",
                color: viewMode === mode.key ? "var(--notion-text)" : "var(--notion-text-muted)",
                boxShadow: viewMode === mode.key ? "var(--notion-shadow-sm)" : "none",
              }}
            >
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* 사람 선택 (person 모드일 때) */}
        {viewMode === "person" && (
          <select
            value={selectedPerson || ""}
            onChange={(e) => onPersonChange(e.target.value || null)}
            className="px-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <option value="">모든 담당자</option>
            {personGroups.map((group) => (
              <option key={group.name} value={group.name}>
                {group.name} ({group.items.length})
              </option>
            ))}
          </select>
        )}

        {/* 비교 기능 */}
        <div className="flex items-center gap-2 ml-auto">
          {compareCount > 0 && (
            <>
              <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
                {compareCount}개 선택됨
              </span>
              <button
                onClick={onClearCompare}
                className="px-2 py-1 rounded text-xs transition-colors"
                style={{
                  background: "var(--notion-bg-secondary)",
                  color: "var(--notion-text-muted)",
                }}
              >
                선택 취소
              </button>
              {compareCount >= 2 && (
                <button
                  onClick={onOpenCompare}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: "rgba(59, 130, 246, 0.15)",
                    color: "#3b82f6",
                  }}
                >
                  🔍 비교하기
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

