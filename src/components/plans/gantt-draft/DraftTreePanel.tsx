/**
 * Draft Tree Panel (좌측)
 * - Project > Module > Feature 계층 표시
 * - laneCount에 따른 동적 높이 (Timeline과 동기화)
 * - 검색 + 필터
 */

"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useDraftStore } from "./store";
import {
  FolderIcon,
  CubeIcon,
  CodeIcon,
  SearchIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExpandAllIcon,
  CollapseAllIcon,
  FilterIcon,
  XIcon,
  TrashIcon,
  PlusIcon,
  CheckIcon,
} from "@/components/common/Icons";
import { AddRowModal } from "./AddRowModal";
import {
  buildFlatTree,
  calculateNodePositions,
  getNodeDateRange,
  ROW_HEIGHT,
  LANE_HEIGHT,
} from "./laneLayout";
import type { FlatTreeNode } from "./laneLayout";
import { FLAG_LANE_HEIGHT, packFlagsIntoLanes } from "./flagLayout";
import { FlagIcon, DocumentIcon } from "@/components/common/Icons";
import type { DraftFlag, HighlightDateRange } from "./types";
import { FlagDocPanel } from "./FlagDocPanel";

export const TREE_WIDTH = 280;
const HEADER_HEIGHT = 76; // 38px + 38px (검색 + 필터/버튼, p-2 패딩 포함)

// Flags 팝오버 컴포넌트
interface FlagsPopoverProps {
  flags: DraftFlag[];
  onClose: () => void;
  onFlagClick: (flag: DraftFlag) => void;
  onOpenDoc: (flag: DraftFlag) => void;
  isEditing: boolean;
  anchorRect: DOMRect | null;
}

type FlagSortType = "name" | "date";

/**
 * 특수 이름 정렬 우선순위
 * Release가 Sprint보다 앞서게
 */
function getFlagNamePriority(title: string): number {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.startsWith("release") || lowerTitle.startsWith("릴리즈"))
    return 0;
  if (lowerTitle.startsWith("sprint") || lowerTitle.startsWith("스프린트"))
    return 1;
  return 2;
}

/**
 * 이름 순 정렬 (Release > Sprint > 기타)
 */
function sortByName(a: DraftFlag, b: DraftFlag): number {
  const priorityA = getFlagNamePriority(a.title);
  const priorityB = getFlagNamePriority(b.title);

  if (priorityA !== priorityB) return priorityA - priorityB;

  // 같은 우선순위면 문자열 정렬
  return a.title.localeCompare(b.title, "ko");
}

/**
 * 기간 순 정렬
 */
function sortByDate(a: DraftFlag, b: DraftFlag): number {
  return a.startDate.localeCompare(b.startDate);
}

function FlagsPopover({
  flags,
  onClose,
  onFlagClick,
  onOpenDoc,
  isEditing,
  anchorRect,
}: FlagsPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  // 필터 및 정렬 상태
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sortType, setSortType] = useState<FlagSortType>("name");
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 검색 debounce 처리
  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    setIsSearching(true);

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(value);
      setIsSearching(false);
    }, 300);
  }, []);

  const handleClearSearch = useCallback(() => {
    setLocalSearchQuery("");
    setDebouncedSearchQuery("");
    setIsSearching(false);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  // deleted 제외, 필터링 및 정렬
  const sortedFlags = useMemo(() => {
    let filtered = flags.filter((f) => !f.deleted);

    // 검색 필터
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((f) => f.title.toLowerCase().includes(query));
    }

    // 정렬
    return filtered.sort(sortType === "name" ? sortByName : sortByDate);
  }, [flags, debouncedSearchQuery, sortType]);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    // 약간의 딜레이 후 이벤트 등록 (클릭으로 열릴 때 바로 닫히는 것 방지)
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!anchorRect) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] rounded-xl shadow-2xl overflow-hidden"
      style={{
        top: anchorRect.bottom + 8,
        left: Math.max(16, anchorRect.left - 100), // 좌측으로 확장
        width: Math.max(400, anchorRect.width + 200), // 최소 400px
        maxWidth: "min(500px, calc(100vw - 32px))",
        background: "white",
        border: "1px solid rgba(0, 0, 0, 0.08)",
        boxShadow:
          "0 20px 60px rgba(0, 0, 0, 0.2), 0 4px 16px rgba(0, 0, 0, 0.1)",
        maxHeight: "min(400px, calc(100vh - 200px))",
      }}
    >
      {/* 헤더 */}
      <div
        className="px-4 py-3"
        style={{
          background: "linear-gradient(180deg, #fef2f2 0%, #fee2e2 100%)",
          borderBottom: "1px solid rgba(239, 68, 68, 0.2)",
        }}
      >
        {/* 상단: 타이틀 + 닫기 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <FlagIcon className="w-4 h-4 text-red-500" />
            <span className="text-sm font-semibold text-red-700">
              Flags ({sortedFlags.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100 transition-colors"
          >
            <XIcon className="w-3 h-3 text-red-500" />
          </button>
        </div>

        {/* 검색 + 정렬 */}
        <div className="flex items-center gap-2">
          {/* 검색 입력 */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Flag 검색..."
              value={localSearchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-1.5 pr-8 text-sm rounded-lg border border-red-200 bg-white/80 focus:outline-none focus:ring-2 focus:ring-red-300 placeholder:text-red-300"
            />
            {/* 로딩 스피너 또는 클리어 버튼 */}
            {(localSearchQuery || isSearching) && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {isSearching ? (
                  <svg
                    className="animate-spin w-4 h-4 text-red-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <button
                    onClick={handleClearSearch}
                    className="w-4 h-4 rounded-full bg-red-200 flex items-center justify-center hover:bg-red-300"
                  >
                    <XIcon className="w-2.5 h-2.5 text-red-600" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 정렬 버튼 */}
          <div className="flex rounded-lg overflow-hidden border border-red-200">
            <button
              onClick={() => setSortType("name")}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                sortType === "name"
                  ? "bg-red-500 text-white"
                  : "bg-white text-red-500 hover:bg-red-50"
              }`}
              title="이름 순 (Release → Sprint → 기타)"
            >
              이름
            </button>
            <button
              onClick={() => setSortType("date")}
              className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
                sortType === "date"
                  ? "bg-red-500 text-white"
                  : "bg-white text-red-500 hover:bg-red-50"
              }`}
              title="기간 순"
            >
              기간
            </button>
          </div>
        </div>
      </div>

      {/* Flag 목록 */}
      <div className="overflow-y-auto" style={{ maxHeight: 320 }}>
        {sortedFlags.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-gray-400">
            {isEditing
              ? "Flag가 없습니다. Timeline에서 더블클릭하여 추가하세요."
              : "Flag가 없습니다."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedFlags.map((flag) => {
              const isPointFlag = flag.startDate === flag.endDate;
              const flagColor = flag.color || "#ef4444";

              return (
                <div
                  key={flag.clientId}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* 타임라인 강조 버튼 */}
                  <button
                    onClick={() => onFlagClick(flag)}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    {/* 색상 표시 */}
                    <div
                      className="w-3 h-10 rounded-full flex-shrink-0"
                      style={{ background: flagColor }}
                    />

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {flag.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {isPointFlag ? (
                          <span>{flag.startDate}</span>
                        ) : (
                          <span>
                            {flag.startDate} → {flag.endDate}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 타입 뱃지 */}
                    <span
                      className="px-2 py-1 text-[10px] font-bold rounded flex-shrink-0"
                      style={{
                        background: `${flagColor}20`,
                        color: flagColor,
                      }}
                    >
                      {isPointFlag ? "포인트" : "범위"}
                    </span>
                  </button>

                  {/* 계획 보기 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDoc(flag);
                    }}
                    className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors flex-shrink-0 border border-gray-200"
                    title="계획 데이터 보기"
                  >
                    <DocumentIcon className="w-4 h-4 text-blue-500" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

interface DraftTreePanelProps {
  isEditing: boolean;
  filterOptions?: {
    projects: string[];
    modules: string[];
    features: string[];
    stages: string[];
  };
  /** 외부 스크롤 동기화용 (Timeline에서 전달) */
  scrollTop?: number;
  onScroll?: (scrollTop: number) => void;
  /** AddRowModal 표시 상태 (상위에서 관리) */
  showAddRowModal?: boolean;
  onShowAddRowModal?: (show: boolean) => void;
  /** 타임라인 표시 범위 (개수 필터링용) */
  rangeStart?: Date;
  rangeEnd?: Date;
  /** 워크스페이스 ID (FlagDocPanel용) */
  workspaceId?: string;
  /** 타임라인 가로 스크롤바 높이 (하단 정렬용) */
  timelineScrollbarHeight?: number;
  /** 외부 스크롤 컨테이너 사용 (true면 내부 세로 스크롤 비활성화) */
  useExternalScroll?: boolean;
}

/**
 * 두 날짜 범위가 겹치는지 확인
 */
function isDateRangeOverlapping(
  start1: string,
  end1: string,
  rangeStart: Date,
  rangeEnd: Date
): boolean {
  const s1 = new Date(start1);
  const e1 = new Date(end1);
  // 범위가 겹치려면: start1 <= rangeEnd AND end1 >= rangeStart
  return s1 <= rangeEnd && e1 >= rangeStart;
}

export function DraftTreePanel({
  isEditing,
  filterOptions,
  scrollTop: externalScrollTop,
  onScroll,
  showAddRowModal: externalShowAddRowModal,
  onShowAddRowModal,
  rangeStart,
  rangeEnd,
  workspaceId,
  timelineScrollbarHeight = 0,
  useExternalScroll = false,
}: DraftTreePanelProps) {
  // FlagDocPanel 상태
  const [showFlagDoc, setShowFlagDoc] = useState(false);
  const [selectedDocFlag, setSelectedDocFlag] = useState<DraftFlag | null>(
    null
  );
  const allRows = useDraftStore((s) => s.rows);
  const allBars = useDraftStore((s) => s.bars);
  const searchQuery = useDraftStore((s) => s.ui.searchQuery);
  const filters = useDraftStore((s) => s.ui.filters);
  const setSearchQuery = useDraftStore((s) => s.setSearchQuery);

  // 검색 debounce 상태
  const [localSearchValue, setLocalSearchValue] = useState(searchQuery);
  const [isTreeSearching, setIsTreeSearching] = useState(false);
  const treeSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 외부 searchQuery 변경 시 동기화
  useEffect(() => {
    setLocalSearchValue(searchQuery);
  }, [searchQuery]);

  // cleanup
  useEffect(() => {
    return () => {
      if (treeSearchDebounceRef.current) {
        clearTimeout(treeSearchDebounceRef.current);
      }
    };
  }, []);

  // debounce 검색 핸들러
  const handleTreeSearchChange = useCallback(
    (value: string) => {
      setLocalSearchValue(value);
      setIsTreeSearching(true);

      if (treeSearchDebounceRef.current) {
        clearTimeout(treeSearchDebounceRef.current);
      }

      treeSearchDebounceRef.current = setTimeout(() => {
        setSearchQuery(value);
        setIsTreeSearching(false);
      }, 300);
    },
    [setSearchQuery]
  );

  const handleTreeSearchClear = useCallback(() => {
    setLocalSearchValue("");
    setSearchQuery("");
    setIsTreeSearching(false);
    if (treeSearchDebounceRef.current) {
      clearTimeout(treeSearchDebounceRef.current);
    }
  }, [setSearchQuery]);
  const setFilters = useDraftStore((s) => s.setFilters);
  const resetFilters = useDraftStore((s) => s.resetFilters);
  const selectRow = useDraftStore((s) => s.selectRow);
  const selectedRowId = useDraftStore((s) => s.ui.selectedRowId);
  const deleteRow = useDraftStore((s) => s.deleteRow);
  const addRow = useDraftStore((s) => s.addRow);
  const expandedNodesArray = useDraftStore((s) => s.ui.expandedNodes);
  const toggleNodeStore = useDraftStore((s) => s.toggleNode);
  const expandAllNodes = useDraftStore((s) => s.expandAllNodes);
  const collapseAllNodes = useDraftStore((s) => s.collapseAllNodes);
  const expandToLevel = useDraftStore((s) => s.expandToLevel);
  const renameNode = useDraftStore((s) => s.renameNode);
  const reorderRows = useDraftStore((s) => s.reorderRows);

  // 외부에서 관리되지 않는 경우 로컬 상태 사용
  const [localShowAddRowModal, setLocalShowAddRowModal] = useState(false);

  // Flags 관련 상태
  const flags = useDraftStore((s) => s.flags);
  const selectedFlagId = useDraftStore((s) => s.selectedFlagId);
  const selectFlag = useDraftStore((s) => s.selectFlag);
  const [showFlagsPopover, setShowFlagsPopover] = useState(false);
  const [flagsAnchorRect, setFlagsAnchorRect] = useState<DOMRect | null>(null);
  const flagsSectionRef = useRef<HTMLDivElement>(null);

  // Flag Lane 높이 계산 (FlagLane과 동기화)
  const flagLaneHeight = useMemo(() => {
    if (!rangeStart || !rangeEnd) return FLAG_LANE_HEIGHT;
    const { laneCount } = packFlagsIntoLanes({
      flags,
      rangeStart,
      rangeEnd,
      dayWidth: 40, // 기본값 (실제 dayWidth와 동일해야 하지만 높이 계산에는 영향 없음)
    });
    return Math.max(1, laneCount) * FLAG_LANE_HEIGHT;
  }, [flags, rangeStart, rangeEnd]);

  // 기간 강조 관련
  const highlightDateRange = useDraftStore((s) => s.ui.highlightDateRange);
  const setHighlightDateRange = useDraftStore((s) => s.setHighlightDateRange);

  // 편집 상태
  const [editingNode, setEditingNode] = useState<{
    id: string;
    type: "project" | "module" | "feature";
    label: string;
    project?: string;
    module?: string;
  } | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // 드래그앤드롭 상태
  const [dragState, setDragState] = useState<{
    draggingNode: FlatTreeNode | null;
    dropTargetId: string | null;
    dropPosition: "before" | "after" | null;
  }>({ draggingNode: null, dropTargetId: null, dropPosition: null });
  const showAddRowModal = externalShowAddRowModal ?? localShowAddRowModal;
  const setShowAddRowModal = onShowAddRowModal ?? setLocalShowAddRowModal;

  const [showFilters, setShowFilters] = useState(false);
  const [showExpandMenu, setShowExpandMenu] = useState(false);
  const [expandMenuPosition, setExpandMenuPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const expandMenuRef = useRef<HTMLDivElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);

  // 필터 팝오버 외부 클릭 시 닫기
  useEffect(() => {
    if (!showFilters) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        filterRef.current &&
        !filterRef.current.contains(target) &&
        filterButtonRef.current &&
        !filterButtonRef.current.contains(target)
      ) {
        setShowFilters(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters]);

  // 펼치기 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    if (!showExpandMenu) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        expandMenuRef.current &&
        !expandMenuRef.current.contains(target) &&
        expandButtonRef.current &&
        !expandButtonRef.current.contains(target)
      ) {
        setShowExpandMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showExpandMenu]);

  // Set으로 변환 (빠른 조회용)
  const expandedNodes = useMemo(
    () => new Set(expandedNodesArray),
    [expandedNodesArray]
  );

  // 활성 bars (삭제되지 않은 것들)
  const activeBars = useMemo(
    () => allBars.filter((b) => !b.deleted),
    [allBars]
  );

  // 필터링된 rows
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // 로컬에서 생성된 row는 bars 없이도 표시
      if (!row.isLocal) {
        const hasBars = activeBars.some((b) => b.rowId === row.rowId);
        if (!hasBars) return false;
      }

      // 검색어 필터
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          row.project.toLowerCase().includes(q) ||
          row.module.toLowerCase().includes(q) ||
          row.feature.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 프로젝트 필터
      if (
        filters.projects.length > 0 &&
        !filters.projects.includes(row.project)
      ) {
        return false;
      }

      // 모듈 필터
      if (filters.modules.length > 0 && !filters.modules.includes(row.module)) {
        return false;
      }

      // 기능 필터
      if (
        filters.features.length > 0 &&
        !filters.features.includes(row.feature)
      ) {
        return false;
      }

      return true;
    });
  }, [allRows, activeBars, searchQuery, filters]);

  // 필터 레벨 결정 (가장 하위 레벨 기준)
  // 기능 필터가 있으면 2, 모듈 필터가 있으면 1, 프로젝트 필터가 있으면 0, 없으면 -1
  const filterLevel = useMemo(() => {
    if (filters.features.length > 0) return 2; // feature level
    if (filters.modules.length > 0) return 1; // module level
    if (filters.projects.length > 0) return 0; // project level
    return -1; // no filter
  }, [
    filters.features.length,
    filters.modules.length,
    filters.projects.length,
  ]);

  // 현재 펼침 레벨 계산 (프로젝트=0, 모듈=1, 기능=2)
  // expandedNodesArray가 비어있으면 프로젝트까지 보기 상태
  // 프로젝트 노드만 펼쳐져 있으면 모듈까지 보기
  // 모듈 노드도 펼쳐져 있으면 기능까지 보기
  const currentExpandLevel = useMemo(() => {
    if (expandedNodesArray.length === 0) return 0; // 프로젝트까지 보기
    // 모듈 노드가 펼쳐져 있는지 확인 (::가 하나만 있는 경우)
    const hasModuleExpanded = expandedNodesArray.some(
      (id) => id.includes("::") && id.split("::").length === 2
    );
    if (hasModuleExpanded) return 2; // 기능까지 보기
    return 1; // 모듈까지 보기
  }, [expandedNodesArray]);

  // FlatTree와 nodePositions 계산 (Timeline과 동일)
  const flatNodes = useMemo(
    () => buildFlatTree(filteredRows, activeBars, expandedNodes),
    [filteredRows, activeBars, expandedNodes]
  );

  // 필터 레벨에 따라 노드 필터링 (상위 레벨 숨김) + top 재계산
  const visibleNodePositions = useMemo(() => {
    const allPositions = calculateNodePositions(flatNodes);

    // 필터가 없으면 모든 노드 표시
    if (filterLevel === -1) return allPositions;

    // 필터 레벨 이상의 노드만 표시
    const filtered = allPositions.filter(({ node }) => {
      const nodeLevel =
        node.type === "project" ? 0 : node.type === "module" ? 1 : 2;
      return nodeLevel >= filterLevel;
    });

    // top 값 재계산
    let currentTop = 0;
    return filtered.map((pos) => {
      const newPos = { ...pos, top: currentTop };
      currentTop += pos.height;
      return newPos;
    });
  }, [flatNodes, filterLevel]);

  const nodePositions = visibleNodePositions;

  const totalHeight = useMemo(() => {
    if (nodePositions.length === 0) return 0;
    const last = nodePositions[nodePositions.length - 1];
    return last.top + last.height;
  }, [nodePositions]);

  // 모든 프로젝트/모듈/기능 목록 (필터용)
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

  // 선택된 프로젝트에 따라 사용 가능한 모듈 목록
  const availableModules = useMemo(() => {
    if (filters.projects.length === 0) {
      return allModules; // 프로젝트 선택 없으면 모든 모듈 사용 가능
    }
    return [
      ...new Set(
        allRows
          .filter((r) => filters.projects.includes(r.project))
          .map((r) => r.module)
      ),
    ].sort();
  }, [allRows, filters.projects, allModules]);

  // 선택된 모듈에 따라 사용 가능한 기능 목록
  const availableFeatures = useMemo(() => {
    if (filters.modules.length === 0 && filters.projects.length === 0) {
      return allFeatures; // 아무것도 선택 안됐으면 모든 기능 사용 가능
    }
    let filteredRows = allRows;
    if (filters.projects.length > 0) {
      filteredRows = filteredRows.filter((r) =>
        filters.projects.includes(r.project)
      );
    }
    if (filters.modules.length > 0) {
      filteredRows = filteredRows.filter((r) =>
        filters.modules.includes(r.module)
      );
    }
    return [...new Set(filteredRows.map((r) => r.feature))].sort();
  }, [allRows, filters.projects, filters.modules, allFeatures]);

  const hasActiveFilters =
    searchQuery ||
    filters.projects.length > 0 ||
    filters.modules.length > 0 ||
    filters.features.length > 0;

  const toggleNode = useCallback(
    (nodeId: string) => {
      toggleNodeStore(nodeId);
    },
    [toggleNodeStore]
  );

  const toggleProjectFilter = (project: string) => {
    const current = filters.projects;
    const next = current.includes(project)
      ? current.filter((p) => p !== project)
      : [...current, project];
    setFilters({ projects: next });
    // 필터 적용 시 기능까지 펼치기
    expandToLevel(1);
  };

  const toggleModuleFilter = (module: string) => {
    const current = filters.modules;
    const next = current.includes(module)
      ? current.filter((m) => m !== module)
      : [...current, module];
    setFilters({ modules: next });
    // 필터 적용 시 기능까지 펼치기
    expandToLevel(1);
  };

  const toggleFeatureFilter = (feature: string) => {
    const current = filters.features;
    const next = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    setFilters({ features: next });
    // 필터 적용 시 기능까지 펼치기
    expandToLevel(1);
  };

  const getNodeIcon = (type: "project" | "module" | "feature") => {
    switch (type) {
      case "project":
        return (
          <FolderIcon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "#f59e0b" }}
          />
        );
      case "module":
        return (
          <CubeIcon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "#8b5cf6" }}
          />
        );
      case "feature":
        return (
          <CodeIcon
            className="w-4 h-4 flex-shrink-0"
            style={{ color: "#10b981" }}
          />
        );
    }
  };

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current && onScroll) {
      onScroll(scrollContainerRef.current.scrollTop);
    }
  }, [onScroll]);

  // 외부 scrollTop 동기화
  useEffect(() => {
    if (scrollContainerRef.current && externalScrollTop !== undefined) {
      if (scrollContainerRef.current.scrollTop !== externalScrollTop) {
        scrollContainerRef.current.scrollTop = externalScrollTop;
      }
    }
  }, [externalScrollTop]);

  const handleAddRow = (project: string, module: string, feature: string) => {
    // 새로 추가하는 프로젝트가 현재 필터에 없으면 필터 초기화
    if (filters.projects.length > 0 && !filters.projects.includes(project)) {
      resetFilters();
    }

    addRow(project, module, feature);
    setShowAddRowModal(false);
  };

  // 드래그앤드롭 핸들러
  const handleDragStart = useCallback(
    (e: React.DragEvent, node: FlatTreeNode) => {
      if (!isEditing) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", node.id);
      setDragState({
        draggingNode: node,
        dropTargetId: null,
        dropPosition: null,
      });
    },
    [isEditing]
  );

  const handleDragOver = useCallback(
    (
      e: React.DragEvent,
      targetNode: FlatTreeNode,
      top: number,
      height: number
    ) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";

      if (!dragState.draggingNode) return;

      // 같은 타입의 노드끼리만 이동 가능
      if (dragState.draggingNode.type !== targetNode.type) {
        setDragState((prev) => ({
          ...prev,
          dropTargetId: null,
          dropPosition: null,
        }));
        return;
      }

      // 자기 자신에게는 드롭 불가
      if (dragState.draggingNode.id === targetNode.id) {
        setDragState((prev) => ({
          ...prev,
          dropTargetId: null,
          dropPosition: null,
        }));
        return;
      }

      // module은 같은 프로젝트 내에서만 이동 가능
      if (dragState.draggingNode.type === "module") {
        // 모듈 노드 ID에서 프로젝트 추출 (형식: project::module)
        const dragProject = dragState.draggingNode.id.split("::")[0];
        const targetProject = targetNode.id.split("::")[0];
        if (dragProject !== targetProject) {
          setDragState((prev) => ({
            ...prev,
            dropTargetId: null,
            dropPosition: null,
          }));
          return;
        }
      }

      // feature는 같은 모듈 내에서만 이동 가능
      if (dragState.draggingNode.type === "feature") {
        const dragRow = dragState.draggingNode.row;
        const targetRow = targetNode.row;
        if (
          dragRow?.project !== targetRow?.project ||
          dragRow?.module !== targetRow?.module
        ) {
          setDragState((prev) => ({
            ...prev,
            dropTargetId: null,
            dropPosition: null,
          }));
          return;
        }
      }

      // 마우스 위치에 따라 before/after 결정
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      const mouseY = e.clientY - rect.top;
      const position = mouseY < height / 2 ? "before" : "after";

      setDragState((prev) => ({
        ...prev,
        dropTargetId: targetNode.id,
        dropPosition: position,
      }));
    },
    [dragState.draggingNode]
  );

  const handleDragLeave = useCallback(() => {
    setDragState((prev) => ({
      ...prev,
      dropTargetId: null,
      dropPosition: null,
    }));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetNode: FlatTreeNode) => {
      e.preventDefault();

      const { draggingNode, dropPosition } = dragState;
      if (!draggingNode || !dropPosition) {
        setDragState({
          draggingNode: null,
          dropTargetId: null,
          dropPosition: null,
        });
        return;
      }

      // 같은 타입만 이동 가능
      if (draggingNode.type !== targetNode.type) {
        setDragState({
          draggingNode: null,
          dropTargetId: null,
          dropPosition: null,
        });
        return;
      }

      // 새로운 순서 계산
      const currentRows = [...allRows];

      if (draggingNode.type === "module") {
        // 모듈 이동: 해당 모듈에 속한 모든 rows를 그룹으로 이동
        const dragModuleParts = draggingNode.id.split("::");
        const dragProject = dragModuleParts[0];
        const dragModule = dragModuleParts[1];

        const targetModuleParts = targetNode.id.split("::");
        const targetModule = targetModuleParts[1];

        // 같은 프로젝트 내의 모듈들을 수집
        const projectRows = currentRows.filter(
          (r) => r.project === dragProject
        );
        const modules = [...new Set(projectRows.map((r) => r.module))];

        // 모듈 순서 변경
        const filteredModules = modules.filter((m) => m !== dragModule);
        const targetModuleIndex = filteredModules.indexOf(targetModule);

        if (targetModuleIndex === -1) {
          setDragState({
            draggingNode: null,
            dropTargetId: null,
            dropPosition: null,
          });
          return;
        }

        const insertIndex =
          dropPosition === "before" ? targetModuleIndex : targetModuleIndex + 1;
        filteredModules.splice(insertIndex, 0, dragModule);

        // 새 순서대로 rows 정렬
        const sortedRows = currentRows
          .map((row) => {
            if (row.project !== dragProject) return row;
            const moduleOrder = filteredModules.indexOf(row.module);
            return {
              ...row,
              orderIndex: moduleOrder * 1000 + (row.orderIndex % 1000),
            };
          })
          .sort((a, b) => a.orderIndex - b.orderIndex);

        const newOrder = sortedRows.map((r) => r.rowId);
        reorderRows(newOrder);
      } else {
        // feature 이동: 기존 로직
        const sameTypeRows = currentRows.filter((row) => {
          const dragRow = draggingNode.row;
          return (
            row.project === dragRow?.project && row.module === dragRow?.module
          );
        });

        const rowIds = sameTypeRows.map((r) => r.rowId);
        const dragRowId = draggingNode.row?.rowId || draggingNode.id;
        const targetRowId = targetNode.row?.rowId || targetNode.id;

        const filteredIds = rowIds.filter((id) => id !== dragRowId);
        const targetIndex = filteredIds.indexOf(targetRowId);

        if (targetIndex === -1) {
          setDragState({
            draggingNode: null,
            dropTargetId: null,
            dropPosition: null,
          });
          return;
        }

        const insertIndex =
          dropPosition === "before" ? targetIndex : targetIndex + 1;
        filteredIds.splice(insertIndex, 0, dragRowId);

        const newOrder = currentRows
          .map((row) => {
            const newIndex = filteredIds.indexOf(row.rowId);
            return newIndex !== -1 ? { ...row, orderIndex: newIndex } : row;
          })
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((r) => r.rowId);

        reorderRows(newOrder);
      }
      setDragState({
        draggingNode: null,
        dropTargetId: null,
        dropPosition: null,
      });
    },
    [dragState, allRows, reorderRows]
  );

  const handleDragEnd = useCallback(() => {
    setDragState({
      draggingNode: null,
      dropTargetId: null,
      dropPosition: null,
    });
  }, []);

  const renderNode = (pos: {
    node: FlatTreeNode;
    top: number;
    height: number;
  }) => {
    const { node, top, height } = pos;
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.type !== "feature";
    const isSelected = node.row?.rowId === selectedRowId;

    // feature의 bar 개수 (범위 내 bar만 카운트)
    const barCount = (() => {
      if (!node.bars) return 0;
      if (!rangeStart || !rangeEnd) return node.bars.length;
      return node.bars.filter((bar) =>
        isDateRangeOverlapping(bar.startDate, bar.endDate, rangeStart, rangeEnd)
      ).length;
    })();

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!node.row) return;

      // 전체 bar 개수 (삭제 확인용)
      const totalBarCount = node.bars?.length || 0;
      const confirmed = confirm(
        `"${node.label}" 기능과 관련된 ${totalBarCount}개의 계획을 삭제하시겠습니까?`
      );
      if (confirmed) {
        deleteRow(node.row.rowId);
      }
    };

    const handleClick = () => {
      if (hasChildren) {
        toggleNode(node.id);
      } else if (node.row) {
        selectRow(node.row.rowId);
      }
    };

    // 강조 버튼 클릭 핸들러
    const handleHighlightClick = (e: React.MouseEvent) => {
      e.stopPropagation();

      // 현재 강조 중인 노드를 다시 클릭하면 해제
      if (highlightDateRange?.nodeId === node.id) {
        setHighlightDateRange(null);
        return;
      }

      // 노드의 기간 범위를 강조 표시
      const dateRange = getNodeDateRange(node, filteredRows, activeBars);
      if (dateRange) {
        setHighlightDateRange({
          startDate: dateRange.minStart,
          endDate: dateRange.maxEnd,
          type: "node",
          color:
            node.type === "project"
              ? "#f59e0b"
              : node.type === "module"
              ? "#8b5cf6"
              : "#10b981",
          nodeId: node.id,
        });
      }
    };

    // 현재 노드가 강조 중인지 확인
    const isHighlighted = highlightDateRange?.nodeId === node.id;

    const handleDoubleClick = (e: React.MouseEvent) => {
      if (!isEditing) return;
      e.stopPropagation();

      // nodeId 파싱 (project::module::feature 형식)
      const idParts = node.id.split("::");

      // 편집 모드 시작
      setEditingNode({
        id: node.id,
        type: node.type,
        label: node.label,
        project:
          node.type !== "project" ? node.row?.project || idParts[0] : undefined,
        module:
          node.type === "feature" ? node.row?.module || idParts[1] : undefined,
      });

      // input에 포커스 및 텍스트 전체 선택
      setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      }, 50);
    };

    const handleEditSubmit = () => {
      if (!editingNode) return;

      const newLabel = editingNode.label.trim();
      if (!newLabel || newLabel === node.label) {
        setEditingNode(null);
        return;
      }

      renameNode(
        editingNode.type,
        node.label,
        newLabel,
        editingNode.project,
        editingNode.module
      );
      setEditingNode(null);
    };

    const handleEditKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleEditSubmit();
      } else if (e.key === "Escape") {
        setEditingNode(null);
      }
    };

    const isEditingThis = editingNode?.id === node.id;

    // Airbnb 스타일 배경색 (project/module/feature 구분)
    let bgStyle = "";
    if (node.type === "project") {
      bgStyle =
        "linear-gradient(90deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.03) 100%)";
    } else if (node.type === "module") {
      bgStyle =
        "linear-gradient(90deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.02) 100%)";
    }

    // 드롭 인디케이터 표시 여부
    const isDropTarget = dragState.dropTargetId === node.id;
    const showDropBefore = isDropTarget && dragState.dropPosition === "before";
    const showDropAfter = isDropTarget && dragState.dropPosition === "after";
    const isDragging = dragState.draggingNode?.id === node.id;

    return (
      <div
        key={node.id}
        draggable={
          isEditing && (node.type === "feature" || node.type === "module")
        }
        onDragStart={(e) => handleDragStart(e, node)}
        onDragOver={(e) => handleDragOver(e, node, top, height)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, node)}
        onDragEnd={handleDragEnd}
        className={`absolute left-0 right-0 flex items-center gap-1 group transition-all duration-150 px-3 ${
          isSelected ? "" : "hover:translate-x-0.5"
        } ${isDragging ? "opacity-50" : ""}`}
        style={{
          top,
          height,
          background: isSelected
            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)"
            : bgStyle,
          borderTop: showDropBefore ? "2px solid #3b82f6" : undefined,
          cursor:
            isEditing && (node.type === "feature" || node.type === "module")
              ? "grab"
              : undefined,
        }}
      >
        {/* 하단 border - 별도 div로 처리하여 타임라인과 높이 일치 */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            borderBottom: showDropAfter
              ? "2px solid #3b82f6"
              : "1px solid rgba(0, 0, 0, 0.04)",
          }}
        />
        {/* 강조 버튼 - 고정 위치, 클릭 시 타임라인에 기간 강조 */}
        <button
          onClick={handleHighlightClick}
          className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
            isHighlighted ? "scale-105" : "hover:scale-105"
          }`}
          style={{
            background: isHighlighted
              ? node.type === "project"
                ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                : node.type === "module"
                ? "linear-gradient(135deg, #a78bfa 0%, #8b5cf6 100%)"
                : "linear-gradient(135deg, #34d399 0%, #10b981 100%)"
              : "rgba(0, 0, 0, 0.06)",
            boxShadow: isHighlighted
              ? `0 0 0 2px ${
                  node.type === "project"
                    ? "#f59e0b40"
                    : node.type === "module"
                    ? "#8b5cf640"
                    : "#10b98140"
                }`
              : "none",
          }}
          title={isHighlighted ? "강조 해제" : "타임라인에 기간 강조"}
        >
          {node.type === "project" && (
            <FolderIcon
              className={`w-3 h-3 ${
                isHighlighted ? "text-white" : "text-gray-400"
              }`}
            />
          )}
          {node.type === "module" && (
            <CubeIcon
              className={`w-3 h-3 ${
                isHighlighted ? "text-white" : "text-gray-400"
              }`}
            />
          )}
          {node.type === "feature" && (
            <CodeIcon
              className={`w-3 h-3 ${
                isHighlighted ? "text-white" : "text-gray-400"
              }`}
            />
          )}
        </button>

        {/* 들여쓰기 공간 */}
        {node.depth > 0 && (
          <div style={{ width: node.depth * 14 }} className="flex-shrink-0" />
        )}

        {/* 확장/접기 화살표 */}
        <div
          className={`flex items-center gap-1 flex-shrink-0 ${
            hasChildren ? "cursor-pointer" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) {
              handleClick();
            }
          }}
        >
          {hasChildren ? (
            <div className="w-4 h-4 flex items-center justify-center transition-all duration-150">
              {isExpanded ? (
                <ChevronDownIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <ChevronRightIcon className="w-3 h-3 text-gray-500" />
              )}
            </div>
          ) : (
            <span className="w-4 flex-shrink-0" />
          )}
        </div>

        {/* 우측 영역: 라벨 - 더블 클릭으로 편집 가능 */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onDoubleClick={handleDoubleClick}
          onClick={(e) => {
            e.stopPropagation();
            // 라벨 클릭 시 feature면 선택
            if (node.type === "feature" && node.row) {
              selectRow(node.row.rowId);
            }
          }}
        >
          {isEditingThis ? (
            <input
              ref={editInputRef}
              type="text"
              value={editingNode?.label || ""}
              onChange={(e) =>
                setEditingNode((prev) =>
                  prev ? { ...prev, label: e.target.value } : null
                )
              }
              onBlur={handleEditSubmit}
              onKeyDown={handleEditKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-[13px] px-2 py-0.5 rounded-md bg-white border border-blue-400 outline-none focus:ring-2 focus:ring-blue-200"
              style={{ minWidth: 0 }}
            />
          ) : (
            <span
              className={`block text-[13px] truncate transition-colors duration-150 ${
                isSelected
                  ? "text-blue-700 font-semibold"
                  : node.type === "project"
                  ? "text-gray-800 font-semibold"
                  : node.type === "module"
                  ? "text-gray-700 font-medium"
                  : "text-gray-600"
              } ${
                isEditing
                  ? "hover:underline hover:decoration-dotted cursor-text"
                  : ""
              }`}
              title={isEditing ? "더블 클릭하여 수정" : undefined}
            >
              {node.label}
            </span>
          )}
        </div>

        {/* feature의 경우 bar 개수 표시 - Airbnb 스타일 뱃지 */}
        {node.type === "feature" && barCount > 0 && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #34d399 0%, #10b981 100%)",
              color: "white",
            }}
          >
            {barCount}
          </span>
        )}

        {/* 삭제 버튼 (feature 노드, 편집 모드일 때만) - Airbnb 스타일 */}
        {node.type === "feature" && isEditing && (
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-150 hover:bg-red-100 active:scale-95 flex-shrink-0"
            title="기능 삭제"
          >
            <TrashIcon className="w-3.5 h-3.5 text-red-500" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      className="flex-shrink-0 overflow-hidden flex flex-col relative"
      style={{
        width: TREE_WIDTH,
        background: "linear-gradient(180deg, #fafbfc 0%, #ffffff 100%)",
        borderRight: "1px solid rgba(0, 0, 0, 0.06)",
      }}
    >
      {/* 헤더 영역 - 2행 (76px) */}
      <div
        className="flex-shrink-0 relative flex flex-col"
        style={{
          height: HEADER_HEIGHT,
          background: "linear-gradient(180deg, #f8f9fa 0%, #f3f4f6 100%)",
        }}
      >
        {/* 하단 border - 별도 div로 처리 */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
        />
        {/* 1행: 검색창 (38px) */}
        <div className="flex items-center px-3 relative" style={{ height: 38 }}>
          {/* 하단 border - 별도 div로 처리 */}
          <div
            className="absolute left-0 right-0 bottom-0"
            style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
          />
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md flex-1 transition-all duration-150 focus-within:ring-1 focus-within:ring-blue-200"
            style={{
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            <SearchIcon className="w-3 h-3 text-gray-400" />
            <input
              type="text"
              value={localSearchValue}
              onChange={(e) => handleTreeSearchChange(e.target.value)}
              placeholder="검색..."
              className="flex-1 text-[11px] bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400"
            />
            {/* 로딩 스피너 또는 클리어 버튼 */}
            {(localSearchValue || isTreeSearching) && (
              <div className="flex items-center">
                {isTreeSearching ? (
                  <svg
                    className="animate-spin w-3 h-3 text-blue-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <button
                    onClick={handleTreeSearchClear}
                    className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  >
                    <XIcon className="w-2 h-2 text-gray-400" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2행: 필터, 펼치기/접기, 추가 (38px) */}
        <div
          className="flex items-center justify-between px-3"
          style={{ height: 38 }}
        >
          {/* 좌측: 필터 */}
          <div className="relative">
            <button
              ref={filterButtonRef}
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-white text-gray-500"
              }`}
              title="필터 옵션"
            >
              <FilterIcon className="w-3 h-3" />
              <span>필터</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </button>
          </div>

          {/* 우측: 펼치기/접기 + 추가 */}
          <div className="flex items-center gap-0.5">
            {/* 펼치기/접기 드롭다운 */}
            <div className="relative">
              <button
                ref={expandButtonRef}
                onClick={() => {
                  if (!showExpandMenu && expandButtonRef.current) {
                    const rect =
                      expandButtonRef.current.getBoundingClientRect();
                    setExpandMenuPosition({
                      top: rect.top,
                      left: rect.right + 4,
                    });
                  }
                  setShowExpandMenu(!showExpandMenu);
                }}
                className={`p-1.5 rounded-md transition-all duration-150 hover:bg-white active:scale-95 ${
                  showExpandMenu ? "bg-white text-blue-600" : "text-gray-500"
                }`}
                title="펼치기/접기"
              >
                {expandedNodesArray.length > 0 ? (
                  <CollapseAllIcon className="w-3.5 h-3.5" />
                ) : (
                  <ExpandAllIcon className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 새 기능 추가 버튼 (편집 모드일 때만) */}
            {isEditing && (
              <button
                onClick={() => setShowAddRowModal(true)}
                className="p-1.5 rounded-md transition-all duration-150 hover:bg-blue-50 active:scale-95"
                title="새 기능 추가"
              >
                <PlusIcon className="w-3.5 h-3.5 text-blue-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Flags 섹션 - Timeline FlagLane과 동기화 */}
      <div
        ref={flagsSectionRef}
        className="flex-shrink-0 flex items-center justify-between cursor-pointer hover:bg-red-50/50 transition-colors relative px-3"
        style={{
          height: flagLaneHeight,
          background:
            "linear-gradient(90deg, rgba(254, 242, 242, 0.5) 0%, rgba(254, 226, 226, 0.3) 100%)",
        }}
        onClick={() => {
          if (showFlagsPopover) {
            setShowFlagsPopover(false);
            setFlagsAnchorRect(null);
          } else {
            if (flagsSectionRef.current) {
              setFlagsAnchorRect(
                flagsSectionRef.current.getBoundingClientRect()
              );
            }
            setShowFlagsPopover(true);
          }
        }}
      >
        {/* 상단 border - 별도 div로 처리 */}
        <div
          className="absolute left-0 right-0 top-0"
          style={{ borderTop: "1px solid rgba(0, 0, 0, 0.06)" }}
        />
        <div className="flex items-center gap-1">
          {/* 강조 버튼 역할의 아이콘 (노드와 동일한 수직선상) */}
          <div
            className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
            style={{
              background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            }}
          >
            <FlagIcon className="w-3 h-3 text-white" />
          </div>
          {/* 화살표 자리 (노드와 정렬 맞추기) */}
          <span className="w-4 flex-shrink-0" />
          <span className="text-xs font-medium text-red-700">Flags</span>
        </div>
        {(() => {
          // 범위 내 플래그만 필터링
          const visibleFlags = flags.filter((f) => {
            if (f.deleted) return false;
            if (!rangeStart || !rangeEnd) return true;
            return isDateRangeOverlapping(
              f.startDate,
              f.endDate,
              rangeStart,
              rangeEnd
            );
          });
          return visibleFlags.length > 0 ? (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold rounded-full"
              style={{
                background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                color: "white",
              }}
            >
              {visibleFlags.length}
            </span>
          ) : null;
        })()}
        {/* 하단 border - 별도 div로 처리하여 타임라인과 높이 일치 */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.06)" }}
        />
      </div>

      {/* Flags 팝오버 */}
      {showFlagsPopover && (
        <FlagsPopover
          flags={flags.filter((f) => {
            if (f.deleted) return false;
            if (!rangeStart || !rangeEnd) return true;
            return isDateRangeOverlapping(
              f.startDate,
              f.endDate,
              rangeStart,
              rangeEnd
            );
          })}
          onClose={() => {
            setShowFlagsPopover(false);
            setFlagsAnchorRect(null);
          }}
          onFlagClick={(flag) => {
            selectFlag(flag.clientId);
            setShowFlagsPopover(false);
            setFlagsAnchorRect(null);
            // Flag 기간 강조 표시
            setHighlightDateRange({
              startDate: flag.startDate,
              endDate: flag.endDate,
              type: "flag",
              color: flag.color || "#ef4444",
              nodeId: flag.clientId,
            });
            // Timeline에서 해당 flag 위치로 스크롤하는 이벤트 발생
            window.dispatchEvent(
              new CustomEvent("gantt:scroll-to-flag", {
                detail: {
                  flagId: flag.clientId,
                  startDate: flag.startDate,
                  endDate: flag.endDate,
                },
              })
            );
          }}
          onOpenDoc={(flag) => {
            setSelectedDocFlag(flag);
            setShowFlagDoc(true);
            setShowFlagsPopover(false);
            setFlagsAnchorRect(null);
          }}
          anchorRect={flagsAnchorRect}
          isEditing={isEditing}
        />
      )}

      {/* 필터 팝오버 - 체크박스 형태 */}
      {showFilters && (
        <div
          ref={filterRef}
          className="absolute left-2 right-2 z-50 p-3 rounded-xl shadow-xl"
          style={{
            top: HEADER_HEIGHT + flagLaneHeight, // Flags 섹션 높이 포함
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-gray-700">필터</span>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-[10px] text-blue-600 hover:text-blue-700 font-medium"
              >
                전체 해제
              </button>
            )}
          </div>

          {/* 프로젝트 필터 */}
          {allProjects.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                프로젝트
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {allProjects.map((project) => (
                  <label
                    key={project}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.projects.includes(project)}
                      onChange={() => toggleProjectFilter(project)}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <FolderIcon className="w-3 h-3 text-amber-500" />
                    <span className="text-xs text-gray-700">{project}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 모듈 필터 */}
          {allModules.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                모듈
                {filters.projects.length > 0 && (
                  <span className="ml-1 text-gray-300 font-normal">
                    ({availableModules.length}개 사용 가능)
                  </span>
                )}
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {allModules.map((module) => {
                  const isAvailable = availableModules.includes(module);
                  return (
                    <label
                      key={module}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                        isAvailable
                          ? "cursor-pointer hover:bg-gray-50"
                          : "cursor-not-allowed opacity-40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.modules.includes(module)}
                        onChange={() =>
                          isAvailable && toggleModuleFilter(module)
                        }
                        disabled={!isAvailable}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:opacity-50"
                      />
                      <CubeIcon
                        className={`w-3 h-3 ${
                          isAvailable ? "text-violet-500" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isAvailable ? "text-gray-700" : "text-gray-400"
                        }`}
                      >
                        {module}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 기능 필터 */}
          {allFeatures.length > 0 && (
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                기능
                {(filters.projects.length > 0 ||
                  filters.modules.length > 0) && (
                  <span className="ml-1 text-gray-300 font-normal">
                    ({availableFeatures.length}개 사용 가능)
                  </span>
                )}
              </div>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {allFeatures.map((feature) => {
                  const isAvailable = availableFeatures.includes(feature);
                  return (
                    <label
                      key={feature}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                        isAvailable
                          ? "cursor-pointer hover:bg-gray-50"
                          : "cursor-not-allowed opacity-40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={filters.features.includes(feature)}
                        onChange={() =>
                          isAvailable && toggleFeatureFilter(feature)
                        }
                        disabled={!isAvailable}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
                      />
                      <CodeIcon
                        className={`w-3 h-3 ${
                          isAvailable ? "text-emerald-500" : "text-gray-400"
                        }`}
                      />
                      <span
                        className={`text-xs ${
                          isAvailable ? "text-gray-700" : "text-gray-400"
                        }`}
                      >
                        {feature}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 빈 상태 */}
          {allProjects.length === 0 &&
            allModules.length === 0 &&
            allFeatures.length === 0 && (
              <div className="text-xs text-gray-400 text-center py-4">
                필터할 항목이 없습니다
              </div>
            )}
        </div>
      )}

      {/* 트리 영역 (스크롤) - Airbnb 스타일 */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-x-hidden scrollbar-hide border border-t-[1px] border-gray-50/15 ${
          useExternalScroll ? "overflow-y-visible" : "overflow-y-auto"
        }`}
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
          paddingBottom:
            timelineScrollbarHeight > 0
              ? `${timelineScrollbarHeight}px`
              : undefined,
        }}
        onScroll={useExternalScroll ? undefined : handleScroll}
      >
        <div className="relative" style={{ height: totalHeight }}>
          {nodePositions.map((pos) => renderNode(pos))}
        </div>

        {/* 검색 결과 없음 - Airbnb 스타일 */}
        {searchQuery && nodePositions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
              }}
            >
              <SearchIcon className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-sm font-medium text-gray-500">
              검색 결과 없음
            </span>
            <span className="text-xs text-gray-400 mt-1">
              다른 검색어를 시도해보세요
            </span>
          </div>
        )}

        {/* 빈 상태 - Airbnb 스타일 */}
        {!searchQuery && nodePositions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
              style={{
                background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
              }}
            >
              <FolderIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-600">
              기능이 없습니다
            </span>
            <span className="text-xs text-gray-400 mt-1 text-center">
              {isEditing
                ? "상단의 + 버튼으로 새 기능을 추가하세요"
                : "작업 시작 후 기능을 추가할 수 있습니다"}
            </span>
          </div>
        )}
      </div>

      {/* AddRowModal */}
      <AddRowModal
        isOpen={showAddRowModal}
        onClose={() => setShowAddRowModal(false)}
        onAdd={handleAddRow}
        existingProjects={allProjects}
        existingModules={allModules}
      />

      {/* 펼치기 드롭다운 메뉴 (Portal) */}
      {showExpandMenu &&
        expandMenuPosition &&
        createPortal(
          <div
            ref={expandMenuRef}
            className="fixed z-[9999] py-1 rounded-lg shadow-lg min-w-[140px]"
            style={{
              top: expandMenuPosition.top,
              left: expandMenuPosition.left,
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            <button
              onClick={() => {
                collapseAllNodes();
                setShowExpandMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
            >
              <span
                style={{
                  color: currentExpandLevel === 0 ? "#3b82f6" : "#374151",
                }}
              >
                프로젝트까지 보기
              </span>
              {currentExpandLevel === 0 && (
                <CheckIcon className="w-3 h-3 text-blue-500" />
              )}
            </button>
            <button
              onClick={() => {
                expandToLevel(0);
                setShowExpandMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
            >
              <span
                style={{
                  color: currentExpandLevel === 1 ? "#3b82f6" : "#374151",
                }}
              >
                모듈까지 보기
              </span>
              {currentExpandLevel === 1 && (
                <CheckIcon className="w-3 h-3 text-blue-500" />
              )}
            </button>
            <button
              onClick={() => {
                expandToLevel(1);
                setShowExpandMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
            >
              <span
                style={{
                  color: currentExpandLevel === 2 ? "#3b82f6" : "#374151",
                }}
              >
                기능까지 보기
              </span>
              {currentExpandLevel === 2 && (
                <CheckIcon className="w-3 h-3 text-blue-500" />
              )}
            </button>
          </div>,
          document.body
        )}

      {/* Flag Doc Panel */}
      <FlagDocPanel
        isOpen={showFlagDoc}
        onClose={() => {
          setShowFlagDoc(false);
          setSelectedDocFlag(null);
        }}
        flag={selectedDocFlag}
        workspaceId={workspaceId || ""}
      />
    </div>
  );
}
