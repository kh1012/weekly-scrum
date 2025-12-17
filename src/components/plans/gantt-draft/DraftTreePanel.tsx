/**
 * Draft Tree Panel (좌측)
 * - Project > Module > Feature 계층 표시
 * - 검색 + 체크박스 필터
 * - Drag & Drop reorder
 */

"use client";

import { useMemo, useState, useCallback } from "react";
import { useDraftStore, selectFilteredRows } from "./store";
import {
  FolderIcon,
  CubeIcon,
  CodeIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  FilterIcon,
  XIcon,
} from "@/components/common/Icons";
import type { DraftRow } from "./types";

const TREE_WIDTH = 280;

interface TreeNode {
  type: "project" | "module" | "feature";
  label: string;
  id: string;
  children?: TreeNode[];
  row?: DraftRow;
}

/**
 * rows를 트리 구조로 변환
 */
function buildTree(rows: DraftRow[]): TreeNode[] {
  const projectMap = new Map<string, Map<string, DraftRow[]>>();

  for (const row of rows) {
    if (!projectMap.has(row.project)) {
      projectMap.set(row.project, new Map());
    }
    const moduleMap = projectMap.get(row.project)!;
    if (!moduleMap.has(row.module)) {
      moduleMap.set(row.module, []);
    }
    moduleMap.get(row.module)!.push(row);
  }

  const tree: TreeNode[] = [];

  for (const [project, moduleMap] of projectMap) {
    const moduleNodes: TreeNode[] = [];

    for (const [module, features] of moduleMap) {
      const featureNodes: TreeNode[] = features.map((row) => ({
        type: "feature" as const,
        label: row.feature,
        id: row.rowId,
        row,
      }));

      moduleNodes.push({
        type: "module" as const,
        label: module,
        id: `${project}::${module}`,
        children: featureNodes,
      });
    }

    tree.push({
      type: "project" as const,
      label: project,
      id: project,
      children: moduleNodes,
    });
  }

  return tree;
}

interface DraftTreePanelProps {
  isEditing: boolean;
  filterOptions?: {
    projects: string[];
    modules: string[];
    features: string[];
    stages: string[];
  };
}

export function DraftTreePanel({ isEditing, filterOptions }: DraftTreePanelProps) {
  const rows = useDraftStore((s) => selectFilteredRows(s));
  const allRows = useDraftStore((s) => s.rows);
  const searchQuery = useDraftStore((s) => s.ui.searchQuery);
  const filters = useDraftStore((s) => s.ui.filters);
  const setSearchQuery = useDraftStore((s) => s.setSearchQuery);
  const setFilters = useDraftStore((s) => s.setFilters);
  const resetFilters = useDraftStore((s) => s.resetFilters);
  const selectRow = useDraftStore((s) => s.selectRow);
  const selectedRowId = useDraftStore((s) => s.ui.selectedRowId);

  const [showFilters, setShowFilters] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const tree = useMemo(() => buildTree(rows), [rows]);

  // 모든 프로젝트/모듈 목록 (필터용)
  const allProjects = useMemo(
    () => [...new Set(allRows.map((r) => r.project))].sort(),
    [allRows]
  );
  const allModules = useMemo(
    () => [...new Set(allRows.map((r) => r.module))].sort(),
    [allRows]
  );
  const allFeatures = useMemo(
    () => [...new Set(allRows.map((r) => r.feature))].sort(),
    [allRows]
  );

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleRowClick = useCallback(
    (rowId: string) => {
      selectRow(rowId);
    },
    [selectRow]
  );

  const toggleProjectFilter = (project: string) => {
    const current = filters.projects;
    const next = current.includes(project)
      ? current.filter((p) => p !== project)
      : [...current, project];
    setFilters({ projects: next });
  };

  const toggleModuleFilter = (module: string) => {
    const current = filters.modules;
    const next = current.includes(module)
      ? current.filter((m) => m !== module)
      : [...current, module];
    setFilters({ modules: next });
  };

  const hasActiveFilters =
    searchQuery ||
    filters.projects.length > 0 ||
    filters.modules.length > 0 ||
    filters.features.length > 0;

  const getNodeIcon = (type: "project" | "module" | "feature") => {
    switch (type) {
      case "project":
        return <FolderIcon className="w-4 h-4" style={{ color: "#f59e0b" }} />;
      case "module":
        return <CubeIcon className="w-4 h-4" style={{ color: "#8b5cf6" }} />;
      case "feature":
        return <CodeIcon className="w-4 h-4" style={{ color: "#10b981" }} />;
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = node.row?.rowId === selectedRowId;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors ${
            isSelected
              ? "bg-blue-100 dark:bg-blue-900/30"
              : "hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleNode(node.id);
            } else if (node.row) {
              handleRowClick(node.row.rowId);
            }
          }}
        >
          {/* 확장 아이콘 */}
          {hasChildren ? (
            isExpanded ? (
              <ChevronDownIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--notion-text-muted)" }} />
            ) : (
              <ChevronRightIcon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--notion-text-muted)" }} />
            )
          ) : (
            <span className="w-3.5" />
          )}

          {/* 타입 아이콘 */}
          {getNodeIcon(node.type)}

          {/* 라벨 */}
          <span
            className="text-sm truncate flex-1"
            style={{ color: "var(--notion-text)" }}
          >
            {node.label}
          </span>

          {/* 카운트 (project/module) */}
          {hasChildren && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "var(--notion-bg-tertiary)",
                color: "var(--notion-text-muted)",
              }}
            >
              {node.children!.length}
            </span>
          )}
        </div>

        {/* 자식 노드 */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex flex-col border-r flex-shrink-0"
      style={{
        width: TREE_WIDTH,
        background: "var(--notion-bg)",
        borderColor: "var(--notion-border)",
      }}
    >
      {/* 검색 + 필터 */}
      <div className="p-2 border-b" style={{ borderColor: "var(--notion-border)" }}>
        {/* 검색 입력 */}
        <div className="relative">
          <SearchIcon
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--notion-text-muted)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색..."
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-md border"
            style={{
              background: "var(--notion-bg-secondary)",
              borderColor: "var(--notion-border)",
              color: "var(--notion-text)",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              <XIcon className="w-3.5 h-3.5" style={{ color: "var(--notion-text-muted)" }} />
            </button>
          )}
        </div>

        {/* 필터 토글 */}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
              showFilters ? "bg-blue-100 dark:bg-blue-900/30" : ""
            }`}
            style={{ color: hasActiveFilters ? "#3b82f6" : "var(--notion-text-muted)" }}
          >
            <FilterIcon className="w-3.5 h-3.5" />
            필터
            {hasActiveFilters && (
              <span className="ml-1 px-1 py-0.5 text-xs rounded-full bg-blue-500 text-white">
                {filters.projects.length + filters.modules.length + filters.features.length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{ color: "var(--notion-text-muted)" }}
            >
              초기화
            </button>
          )}
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mt-2 p-2 rounded-md border" style={{ borderColor: "var(--notion-border)" }}>
            {/* 프로젝트 필터 */}
            <div className="mb-2">
              <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                프로젝트
              </div>
              <div className="flex flex-wrap gap-1">
                {allProjects.map((project) => (
                  <button
                    key={project}
                    onClick={() => toggleProjectFilter(project)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      filters.projects.includes(project)
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                    style={{
                      color: filters.projects.includes(project)
                        ? "white"
                        : "var(--notion-text)",
                    }}
                  >
                    {project}
                  </button>
                ))}
              </div>
            </div>

            {/* 모듈 필터 */}
            <div>
              <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                모듈
              </div>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                {allModules.map((module) => (
                  <button
                    key={module}
                    onClick={() => toggleModuleFilter(module)}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      filters.modules.includes(module)
                        ? "bg-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                    style={{
                      color: filters.modules.includes(module)
                        ? "white"
                        : "var(--notion-text)",
                    }}
                  >
                    {module}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 트리 영역 */}
      <div className="flex-1 overflow-y-auto">
        {tree.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <p className="text-sm text-center" style={{ color: "var(--notion-text-muted)" }}>
              {hasActiveFilters
                ? "필터 조건에 맞는 항목이 없습니다"
                : "계획이 없습니다"}
            </p>
          </div>
        ) : (
          <div className="py-1">
            {tree.map((node) => renderNode(node))}
          </div>
        )}
      </div>

      {/* 요약 */}
      <div
        className="px-3 py-2 border-t text-xs"
        style={{
          borderColor: "var(--notion-border)",
          color: "var(--notion-text-muted)",
        }}
      >
        {rows.length}개 기능 · {allRows.length}개 전체
      </div>
    </div>
  );
}

export { TREE_WIDTH };

