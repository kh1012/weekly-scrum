"use client";

import { memo, useState, useMemo, useCallback, useRef, useEffect } from "react";
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

// 타입별 색상 (GanttFilters와 동기화)
const TYPE_COLORS = {
  release: "#ec4899",  // 핑크
  sprint: "#f59e0b",   // 주황
  feature: "#10b981",  // 초록
} as const;

interface TreePanelProps {
  rows: FlatRow[];
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
  /** 임시 계획 목록 */
  draftPlans?: DraftPlan[];
  /** 임시 계획 삭제 핸들러 */
  onRemoveDraftPlan?: (tempId: string) => void;
  /** 임시 계획 수정 핸들러 */
  onUpdateDraftPlan?: (tempId: string, updates: Partial<DraftPlan>) => void;
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
  onUpdateDraftPlan,
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
      {/* Header with Search - 52px height to match TimelineHeader */}
      <div
        className="flex-shrink-0 border-b h-[52px] flex items-center px-3"
        style={{
          background: "var(--notion-bg-secondary)",
          borderColor: "var(--notion-border)",
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1"
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
            placeholder="프로젝트 / 모듈 / 기능 검색..."
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
            onUpdate={onUpdateDraftPlan ? (updates) => onUpdateDraftPlan(draft.tempId, updates) : undefined}
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
  onUpdate?: (updates: Partial<DraftPlan>) => void;
}

/**
 * Draft Plan Row (임시 계획)
 * - 타입별 색상 적용
 * - 팝오버 편집 모드
 */
const DraftPlanRow = memo(function DraftPlanRow({
  draft,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
  onUpdate,
}: DraftPlanRowProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({
    title: draft.title,
    project: draft.project || "",
    module: draft.module || "",
    feature: draft.feature || "",
  });
  const rowRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 타입별 색상 가져오기
  const typeColor = TYPE_COLORS[draft.type];

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

  // 기능 타입일 경우 프로젝트/모듈/기능으로 표시
  const getDisplayLabel = () => {
    if (draft.type === "feature") {
      const parts = [draft.project, draft.module, draft.feature].filter(Boolean);
      return parts.length > 0 ? parts.join(" / ") : "기능 선택 필요";
    }
    return draft.title;
  };

  const handleSave = () => {
    if (onUpdate) {
      if (draft.type === "feature") {
        onUpdate({
          project: editValues.project,
          module: editValues.module,
          feature: editValues.feature,
        });
      } else {
        onUpdate({ title: editValues.title });
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValues({
        title: draft.title,
        project: draft.project || "",
        module: draft.module || "",
        feature: draft.feature || "",
      });
      setIsEditing(false);
    }
  };

  // 팝오버 외부 클릭 시 닫기
  useEffect(() => {
    if (!isEditing) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setEditValues({
          title: draft.title,
          project: draft.project || "",
          module: draft.module || "",
          feature: draft.feature || "",
        });
        setIsEditing(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isEditing, draft]);

  const Icon = getIcon();

  return (
    <div
      ref={rowRef}
      draggable={!!onDragStart && !isEditing}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => setIsEditing(true)}
      className="relative flex items-center gap-2 px-2 border-b transition-all cursor-grab active:cursor-grabbing group"
      style={{
        height: ROW_HEIGHT,
        paddingLeft: 8,
        borderColor: isDragOver ? typeColor : "var(--notion-border)",
        background: isDragging
          ? `${typeColor}20`
          : isDragOver
          ? `${typeColor}15`
          : `${typeColor}08`,
        opacity: isDragging ? 0.5 : 1,
        borderTopWidth: isDragOver ? 2 : 0,
      }}
    >
      {/* 드래그 핸들 */}
      <span
        className="w-4 h-4 flex items-center justify-center opacity-40 group-hover:opacity-100"
        style={{ color: typeColor }}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 11-4 0 2 2 0 014 0zM8 12a2 2 0 11-4 0 2 2 0 014 0zM8 18a2 2 0 11-4 0 2 2 0 014 0zM20 6a2 2 0 11-4 0 2 2 0 014 0zM20 12a2 2 0 11-4 0 2 2 0 014 0zM20 18a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </span>

      {/* 임시 표시 아이콘 */}
      <span
        className="w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0"
        style={{ background: `${typeColor}25`, color: typeColor }}
      >
        <StarIcon size={10} filled />
      </span>

      {/* Icon */}
      <Icon size={14} style={{ color: typeColor }} className="flex-shrink-0" />

      {/* Label */}
      <span
        className="flex-1 truncate text-sm cursor-pointer hover:underline"
        style={{
          color: draft.type === "feature" && !draft.project ? "var(--notion-text-muted)" : typeColor,
          fontWeight: 500,
          fontStyle: draft.type === "feature" && !draft.project ? "italic" : "normal",
        }}
        onClick={() => setIsEditing(true)}
        title="클릭하여 편집"
      >
        {getDisplayLabel()}
      </span>

      {/* Type Badge */}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
        style={{
          background: `${typeColor}15`,
          color: typeColor,
        }}
      >
        {getTypeLabel()}
      </span>

      {/* 수정 버튼 */}
      {onUpdate && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
          className={`w-5 h-5 flex items-center justify-center rounded transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
          style={{ color: typeColor }}
          title="수정"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      )}

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
          style={{ color: typeColor }}
          title="삭제"
        >
          <TrashIcon size={12} />
        </button>
      )}

      {/* 편집 팝오버 */}
      {isEditing && (
        <div
          ref={popoverRef}
          className="absolute left-full top-0 ml-2 z-50 rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-150"
          style={{
            background: "var(--notion-bg)",
            border: `1px solid ${typeColor}40`,
            minWidth: 240,
          }}
        >
          {/* 팝오버 헤더 */}
          <div
            className="flex items-center gap-2 px-3 py-2 border-b"
            style={{ borderColor: "var(--notion-border)" }}
          >
            <Icon size={14} style={{ color: typeColor }} />
            <span className="text-xs font-medium" style={{ color: typeColor }}>
              {getTypeLabel()} 편집
            </span>
          </div>

          {/* 팝오버 내용 */}
          <div className="p-3 space-y-2">
            {draft.type === "feature" ? (
              // 기능 타입: 프로젝트/모듈/기능 편집
              <>
                <input
                  type="text"
                  value={editValues.project}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, project: e.target.value }))
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="프로젝트"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none focus:ring-2"
                  style={{
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                    color: "var(--notion-text)",
                    ["--tw-ring-color" as string]: `${typeColor}40`,
                  }}
                  autoFocus
                />
                <input
                  type="text"
                  value={editValues.module}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, module: e.target.value }))
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="모듈"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none focus:ring-2"
                  style={{
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                    color: "var(--notion-text)",
                    ["--tw-ring-color" as string]: `${typeColor}40`,
                  }}
                />
                <input
                  type="text"
                  value={editValues.feature}
                  onChange={(e) =>
                    setEditValues((prev) => ({ ...prev, feature: e.target.value }))
                  }
                  onKeyDown={handleKeyDown}
                  placeholder="기능명"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border outline-none focus:ring-2"
                  style={{
                    background: "var(--notion-bg)",
                    borderColor: "var(--notion-border)",
                    color: "var(--notion-text)",
                    ["--tw-ring-color" as string]: `${typeColor}40`,
                  }}
                />
              </>
            ) : (
              // 릴리즈/스프린트: 제목 편집
              <input
                type="text"
                value={editValues.title}
                onChange={(e) =>
                  setEditValues((prev) => ({ ...prev, title: e.target.value }))
                }
                onKeyDown={handleKeyDown}
                placeholder="제목"
                className="w-full px-2.5 py-1.5 text-sm rounded-lg border outline-none focus:ring-2"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  color: "var(--notion-text)",
                  ["--tw-ring-color" as string]: `${typeColor}40`,
                }}
                autoFocus
              />
            )}
          </div>

          {/* 팝오버 버튼 */}
          <div
            className="flex justify-end gap-2 px-3 py-2 border-t"
            style={{ borderColor: "var(--notion-border)" }}
          >
            <button
              onClick={() => {
                setEditValues({
                  title: draft.title,
                  project: draft.project || "",
                  module: draft.module || "",
                  feature: draft.feature || "",
                });
                setIsEditing(false);
              }}
              className="px-3 py-1.5 text-xs rounded-lg transition-colors hover:bg-black/5"
              style={{ color: "var(--notion-text-muted)" }}
            >
              취소
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs rounded-lg text-white transition-all hover:opacity-90"
              style={{ background: typeColor }}
            >
              저장
            </button>
          </div>
        </div>
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

