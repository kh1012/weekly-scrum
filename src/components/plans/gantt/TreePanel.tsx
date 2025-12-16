"use client";

import { memo, useState, useMemo } from "react";
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
  PlusIcon,
  StarIcon,
} from "@/components/common/Icons";

interface TreePanelProps {
  rows: FlatRow[];
  expandedIds: Set<string>;
  onToggle: (nodeId: string) => void;
  /** 임시 계획 목록 */
  draftPlans?: DraftPlan[];
  /** 임시 계획 추가 핸들러 */
  onAddDraftPlan?: (type: PlanType, defaultValues?: Partial<DraftPlan>) => void;
  /** Admin 모드 여부 */
  isAdmin?: boolean;
}

const TYPE_OPTIONS: { value: PlanType; label: string; Icon: typeof CodeIcon }[] = [
  { value: "feature", label: "기능", Icon: CodeIcon },
  { value: "sprint", label: "스프린트", Icon: RefreshIcon },
  { value: "release", label: "릴리즈", Icon: RocketIcon },
];

/**
 * 좌측 트리 패널 컴포넌트
 */
export const TreePanel = memo(function TreePanel({
  rows,
  expandedIds,
  onToggle,
  draftPlans = [],
  onAddDraftPlan,
  isAdmin = false,
}: TreePanelProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isHoveringEmpty, setIsHoveringEmpty] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleAddPlan = (type: PlanType) => {
    if (onAddDraftPlan) {
      const defaultValues: Partial<DraftPlan> = {
        title: type === "feature" ? "새 기능" : type === "sprint" ? "새 스프린트" : "새 릴리즈",
      };
      
      if (type === "feature") {
        defaultValues.project = "";
        defaultValues.module = "";
        defaultValues.feature = "";
        defaultValues.stage = "컨셉 기획";
      }
      
      onAddDraftPlan(type, defaultValues);
    }
    setShowAddMenu(false);
  };

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
          <DraftPlanRow key={draft.tempId} draft={draft} />
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

        {/* 빈 영역 - 추가하기 */}
        {isAdmin && onAddDraftPlan && !searchTerm && (
          <div
            className="relative group"
            onMouseEnter={() => setIsHoveringEmpty(true)}
            onMouseLeave={() => {
              setIsHoveringEmpty(false);
              setShowAddMenu(false);
            }}
            style={{ minHeight: rows.length === 0 ? 200 : 60 }}
          >
            {/* 추가하기 버튼 */}
            <div
              className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
                isHoveringEmpty ? "opacity-100" : "opacity-0"
              }`}
            >
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                style={{
                  background: "var(--notion-bg-secondary)",
                  color: "var(--notion-text-muted)",
                  border: "1px dashed var(--notion-border)",
                }}
              >
                <PlusIcon size={16} />
                추가하기
              </button>
            </div>

            {/* 타입 선택 메뉴 */}
            {showAddMenu && (
              <div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 translate-y-4 z-50 rounded-xl shadow-xl border overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150"
                style={{
                  background: "var(--notion-bg)",
                  borderColor: "var(--notion-border)",
                  minWidth: 160,
                }}
              >
                {TYPE_OPTIONS.map((opt) => {
                  const { Icon } = opt;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAddPlan(opt.value)}
                      className="w-full px-4 py-3 text-left text-sm flex items-center gap-3 transition-colors hover:bg-black/5"
                      style={{ color: "var(--notion-text)" }}
                    >
                      <Icon size={14} />
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Draft Plan Row (임시 계획)
 */
const DraftPlanRow = memo(function DraftPlanRow({ draft }: { draft: DraftPlan }) {
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
      className="flex items-center gap-2 px-2 border-b transition-colors"
      style={{
        height: ROW_HEIGHT,
        paddingLeft: 8,
        borderColor: "var(--notion-border)",
        background: "rgba(247, 109, 87, 0.05)",
      }}
    >
      {/* 임시 표시 아이콘 */}
      <span
        className="w-5 h-5 flex items-center justify-center rounded-full"
        style={{ background: "rgba(247, 109, 87, 0.2)", color: "#F76D57" }}
      >
        <StarIcon size={10} filled />
      </span>

      {/* Icon */}
      <Icon size={14} style={{ color: "#F76D57" }} />

      {/* Label */}
      <span
        className="flex-1 truncate text-sm"
        style={{ color: "#F76D57", fontWeight: 500 }}
      >
        {draft.title}
      </span>

      {/* Type Badge */}
      <span
        className="text-[10px] px-1.5 py-0.5 rounded-full"
        style={{
          background: "rgba(247, 109, 87, 0.1)",
          color: "#F76D57",
        }}
      >
        {getTypeLabel()}
      </span>
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

