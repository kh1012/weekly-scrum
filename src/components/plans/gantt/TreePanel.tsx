"use client";

import { memo, useState, useMemo, useCallback } from "react";
import type { FlatRow, DraftPlan } from "./types";
import type { PlanType } from "@/lib/data/plans";
import { ROW_HEIGHT, TREE_WIDTH } from "./useGanttLayout";
import {
  SearchIcon,
  FolderIcon,
  CubeIcon,
  CodeIcon,
  RocketIcon,
  RefreshIcon,
  CalendarIcon,
  StarIcon,
  TrashIcon,
} from "@/components/common/Icons";

interface TreePanelProps {
  rows: FlatRow[];
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
  /** 임시 계획 목록 */
  draftPlans?: DraftPlan[];
  /** 임시 계획 삭제 핸들러 */
  onRemoveDraftPlan?: (tempId: string) => void;
  /** 임시 계획 순서 변경 핸들러 */
  onReorderDraftPlans?: (reorderedPlans: DraftPlan[]) => void;
  /** Admin 모드 여부 */
  isAdmin?: boolean;
}

/**
 * 좌측 트리 패널 컴포넌트
 */
export const TreePanel = memo(function TreePanel({
  rows,
  expandedIds,
  onToggle,
  draftPlans = [],
  onRemoveDraftPlan,
  onReorderDraftPlans,
  isAdmin = false,
}: TreePanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedDraftId, setDraggedDraftId] = useState<string | null>(null);
  const [dragOverDraftId, setDragOverDraftId] = useState<string | null>(null);

  // 검색 필터링
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.node.label.toLowerCase().includes(term) ||
      row.node.project?.toLowerCase().includes(term) ||
      row.node.module?.toLowerCase().includes(term) ||
      row.node.feature?.toLowerCase().includes(term)
    );
  }, [rows, searchTerm]);

  // 드래그 앤 드롭 핸들러
  const handleDragStart = useCallback((e: React.DragEvent, tempId: string) => {
    setDraggedDraftId(tempId);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, tempId: string) => {
    e.preventDefault();
    setDragOverDraftId(tempId);
  }, []);

  const handleDragEnd = useCallback(() => {
    if (draggedDraftId && dragOverDraftId && draggedDraftId !== dragOverDraftId && onReorderDraftPlans) {
      const fromIndex = draftPlans.findIndex(p => p.tempId === draggedDraftId);
      const toIndex = draftPlans.findIndex(p => p.tempId === dragOverDraftId);
      
      if (fromIndex !== -1 && toIndex !== -1) {
        const reordered = [...draftPlans];
        const [removed] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, removed);
        onReorderDraftPlans(reordered);
      }
    }
    setDraggedDraftId(null);
    setDragOverDraftId(null);
  }, [draggedDraftId, dragOverDraftId, draftPlans, onReorderDraftPlans]);

  return (
    <div
      className="flex-shrink-0 border-r overflow-hidden flex flex-col"
      style={{
        width: TREE_WIDTH,
        background: "var(--notion-bg)",
        borderColor: "var(--notion-border)",
      }}
    >
      {/* Header with Search */}
      <div
        className="flex-shrink-0 border-b"
        style={{
          background: "var(--notion-bg-secondary)",
          borderColor: "var(--notion-border)",
        }}
      >
        <div className="h-[52px] flex items-center px-4 font-medium text-sm">
          <FolderIcon size={14} style={{ color: "#8b5cf6" }} />
          <span className="ml-2" style={{ color: "var(--notion-text)" }}>
            프로젝트 / 모듈 / 기능
          </span>
        </div>
        
        {/* 검색 */}
        <div className="px-3 pb-3">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <SearchIcon size={14} style={{ color: "var(--notion-text-muted)" }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="검색..."
              className="flex-1 text-xs bg-transparent border-none outline-none"
              style={{ color: "var(--notion-text)" }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="text-xs hover:opacity-70"
                style={{ color: "var(--notion-text-muted)" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tree Rows */}
      <div className="flex-1 overflow-y-auto">
        {filteredRows.map((row) => (
          <TreeRow
            key={row.id}
            row={row}
            isExpanded={expandedIds.has(row.id)}
            onToggle={onToggle}
          />
        ))}

        {/* Draft Plans (임시 계획) */}
        {draftPlans.map((draft) => (
          <DraftPlanRow
            key={draft.tempId}
            draft={draft}
            isDragging={draggedDraftId === draft.tempId}
            isDragOver={dragOverDraftId === draft.tempId}
            onDragStart={(e) => handleDragStart(e, draft.tempId)}
            onDragOver={(e) => handleDragOver(e, draft.tempId)}
            onDragEnd={handleDragEnd}
            onRemove={onRemoveDraftPlan ? () => onRemoveDraftPlan(draft.tempId) : undefined}
          />
        ))}

        {/* 검색 결과 없음 */}
        {searchTerm && filteredRows.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-8 text-sm"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <SearchIcon size={24} className="mb-2 opacity-30" />
            <span>검색 결과 없음</span>
          </div>
        )}

        {/* 임시 계획 힌트 */}
        {isAdmin && draftPlans.length === 0 && !searchTerm && filteredRows.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-8 text-sm"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <span>⌘+K로 임시 계획을 생성하세요</span>
          </div>
        )}
      </div>
    </div>
  );
});

interface DraftPlanRowProps {
  draft: DraftPlan;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onRemove?: () => void;
}

/**
 * Draft Plan Row (임시 계획)
 */
const DraftPlanRow = memo(function DraftPlanRow({
  draft,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
}: DraftPlanRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    if (draft.type === "release") return RocketIcon;
    if (draft.type === "sprint") return RefreshIcon;
    return CodeIcon;
  };

  const getTypeLabel = () => {
    if (draft.type === "release") return "릴리즈";
    if (draft.type === "sprint") return "스프린트";
    return "기능";
  };

  const Icon = getIcon();

  return (
    <div
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-2 px-2 border-b transition-all cursor-grab active:cursor-grabbing group"
      style={{
        height: ROW_HEIGHT,
        paddingLeft: 8,
        borderColor: isDragOver ? "#F76D57" : "var(--notion-border)",
        background: isDragging
          ? "rgba(247, 109, 87, 0.15)"
          : isDragOver
          ? "rgba(247, 109, 87, 0.1)"
          : "rgba(247, 109, 87, 0.05)",
        opacity: isDragging ? 0.5 : 1,
        borderTopWidth: isDragOver ? 2 : 0,
      }}
    >
      {/* 드래그 핸들 */}
      <span
        className="w-4 h-4 flex items-center justify-center opacity-40 group-hover:opacity-100"
        style={{ color: "#F76D57" }}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </span>

      {/* 임시 표시 아이콘 */}
      <span
        className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0"
        style={{ background: "rgba(247, 109, 87, 0.2)", color: "#F76D57" }}
      >
        <StarIcon size={10} filled />
      </span>

      {/* Icon */}
      <Icon size={14} style={{ color: "#F76D57" }} className="flex-shrink-0" />

      {/* Label */}
      <span
        className="flex-1 truncate text-sm"
        style={{ color: "#F76D57", fontWeight: 500 }}
      >
        {draft.title}
      </span>

      {/* Type Badge */}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: "rgba(247, 109, 87, 0.1)",
          color: "#F76D57",
        }}
      >
        {getTypeLabel()}
      </span>

      {/* 삭제 버튼 */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className={`w-5 h-5 flex items-center justify-center rounded transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{ color: "#F76D57" }}
          title="삭제"
        >
          <TrashIcon size={12} />
        </button>
      )}
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
    if (node.type === "events") return CalendarIcon;
    if (node.type === "project") return FolderIcon;
    if (node.type === "module") return CubeIcon;
    return CodeIcon;
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

  const Icon = getIcon();

  return (
    <div
      className="flex items-center gap-2 px-2 border-b transition-colors hover:bg-black/[0.02]"
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
          className="w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-black/5"
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
      <Icon size={14} style={{ color: getTypeColor() }} />

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

