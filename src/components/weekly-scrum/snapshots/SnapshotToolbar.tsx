"use client";

import type { SnapshotViewMode, PersonGroup } from "./types";

export type DisplayMode = "card" | "list";

interface SnapshotToolbarProps {
  viewMode: SnapshotViewMode;
  onViewModeChange: (mode: SnapshotViewMode) => void;
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
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
  displayMode,
  onDisplayModeChange,
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
        {/* 뷰 모드 탭 - 그림자 삭제, 스타일 통일 */}
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--notion-bg-secondary)" }}>
          {viewModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => onViewModeChange(mode.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: viewMode === mode.key ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: viewMode === mode.key ? "#3b82f6" : "var(--notion-text-muted)",
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

        {/* 우측 영역 */}
        <div className="flex items-center gap-3 ml-auto">
          {/* 비교 기능 */}
          {compareCount > 0 && (
            <div className="flex items-center gap-2">
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
            </div>
          )}

          {/* 카드/리스트 토글 */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--notion-bg-secondary)" }}>
            <button
              onClick={() => onDisplayModeChange("card")}
              className="flex items-center justify-center w-7 h-7 rounded transition-all"
              style={{
                background: displayMode === "card" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: displayMode === "card" ? "#3b82f6" : "var(--notion-text-muted)",
              }}
              title="카드 보기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2" />
                <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2" />
              </svg>
            </button>
            <button
              onClick={() => onDisplayModeChange("list")}
              className="flex items-center justify-center w-7 h-7 rounded transition-all"
              style={{
                background: displayMode === "list" ? "rgba(59, 130, 246, 0.15)" : "transparent",
                color: displayMode === "list" ? "#3b82f6" : "var(--notion-text-muted)",
              }}
              title="리스트 보기"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
