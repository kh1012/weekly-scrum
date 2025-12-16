"use client";

import { memo } from "react";
import type { FlatRow } from "./types";
import { ROW_HEIGHT, TREE_WIDTH } from "./useGanttLayout";

interface TreePanelProps {
  rows: FlatRow[];
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
}

/**
 * 좌측 트리 패널 컴포넌트
 */
export const TreePanel = memo(function TreePanel({
  rows,
  expandedIds,
  onToggle,
}: TreePanelProps) {
  return (
    <div
      className="flex-shrink-0 border-r overflow-hidden"
      style={{
        width: TREE_WIDTH,
        background: "var(--notion-bg)",
        borderColor: "var(--notion-border)",
      }}
    >
      {/* Header */}
      <div
        className="h-[52px] flex items-center px-4 border-b font-medium text-sm"
        style={{
          background: "var(--notion-bg-secondary)",
          borderColor: "var(--notion-border)",
          color: "var(--notion-text)",
        }}
      >
        릴리즈 / 스프린트 / 기능
      </div>

      {/* Tree Rows */}
      <div className="overflow-y-auto" style={{ height: "calc(100% - 52px)" }}>
        {rows.map((row) => (
          <TreeRow
            key={row.id}
            row={row}
            isExpanded={expandedIds.has(row.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
});

interface TreeRowProps {
  row: FlatRow;
  isExpanded: boolean;
  onToggle: (nodeId: string) => void;
}

const TreeRow = memo(function TreeRow({
  row,
  isExpanded,
  onToggle,
}: TreeRowProps) {
  const { node, indent, isLeaf } = row;
  const hasChildren = node.children && node.children.length > 0;

  const getIcon = () => {
    if (node.type === "events") return "📅";
    if (node.type === "project") return "📁";
    if (node.type === "module") return "📦";
    return "📋";
  };

  const getTypeColor = () => {
    switch (node.type) {
      case "events":
        return "#ec4899";
      case "project":
        return "#8b5cf6";
      case "module":
        return "#3b82f6";
      default:
        return "var(--notion-text-secondary)";
    }
  };

  return (
    <div
      className="flex items-center gap-2 px-2 border-b transition-colors hover:bg-gray-50"
      style={{
        height: ROW_HEIGHT,
        paddingLeft: 8 + indent * 16,
        borderColor: "var(--notion-border)",
      }}
    >
      {/* Toggle Button */}
      {hasChildren ? (
        <button
          onClick={() => onToggle(node.id)}
          className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-gray-200"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <svg
            className="w-3 h-3 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      ) : (
        <span className="w-5" />
      )}

      {/* Icon */}
      <span className="text-sm">{getIcon()}</span>

      {/* Label */}
      <span
        className="flex-1 truncate text-sm"
        style={{
          color: isLeaf ? "var(--notion-text)" : getTypeColor(),
          fontWeight: isLeaf ? 400 : 500,
        }}
      >
        {node.label}
      </span>

      {/* Plan Count (for feature nodes) */}
      {node.plans && node.plans.length > 0 && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full"
          style={{
            background: "var(--notion-bg-secondary)",
            color: "var(--notion-text-muted)",
          }}
        >
          {node.plans.length}
        </span>
      )}
    </div>
  );
});

