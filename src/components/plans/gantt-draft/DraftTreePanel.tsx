/**
 * Draft Tree Panel (좌측)
 * - Project > Module > Feature 계층 표시
 * - laneCount에 따른 동적 높이 (Timeline과 동기화)
 * - 검색 + 필터
 */

"use client";

import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  useTransition,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createPortal } from "react-dom";
import { useDraftStore } from "./store";
import { TreePanelSkeleton } from "./GanttSkeleton";
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
  buildSummarizedTree,
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
import { filterBarsWithIndex, filterRowsWithIndex } from "./filterCache";
import { FlagsPopover } from "./components/tree/FlagsPopover";
import { isDateRangeOverlapping } from "./utils/flagUtils";
import { ConfirmModal } from "@/components/common/ConfirmModal";

export const TREE_WIDTH = 280;
const HEADER_HEIGHT = 76; // 38px + 38px (검색 + 필터/버튼, p-2 패딩 포함)

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
  /** 하이라이트할 Row ID (timeline focus용) */
  highlightedRowId?: string | null;
}

export const DraftTreePanel = forwardRef<
  { closeContextMenu: () => void },
  DraftTreePanelProps
>(function DraftTreePanel(
  {
    isEditing,
    filterOptions,
    rangeStart,
    rangeEnd,
    onScroll: externalOnScroll,
    scrollTop: externalScrollTop,
    showAddRowModal: externalShowAddRowModal,
    onShowAddRowModal,
    workspaceId,
    timelineScrollbarHeight = 0,
    highlightedRowId,
  },
  ref
) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // FlagDocPanel 상태
  const [showFlagDoc, setShowFlagDoc] = useState(false);
  const [selectedDocFlag, setSelectedDocFlag] = useState<DraftFlag | null>(
    null
  );
  const allRows = useDraftStore((s) => s.rows);
  const allBars = useDraftStore((s) => s.bars);
  const searchQuery = useDraftStore((s) => s.ui.searchQuery);
  const filters = useDraftStore((s) => s.ui.filters);
  const filterIndex = useDraftStore((s) => s.filterIndex);
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
        // URL 업데이트
        const params = new URLSearchParams(searchParams.toString());
        if (value.trim()) {
          params.set("search", value.trim());
        } else {
          params.delete("search");
        }
        router.replace(`?${params.toString()}`, { scroll: false });
        setIsTreeSearching(false);
      }, 300);
    },
    [setSearchQuery, router, searchParams]
  );

  const handleTreeSearchClear = useCallback(() => {
    setLocalSearchValue("");
    setSearchQuery("");
    setIsTreeSearching(false);
    // URL에서 search 파라미터 제거
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    router.replace(`?${params.toString()}`, { scroll: false });
    if (treeSearchDebounceRef.current) {
      clearTimeout(treeSearchDebounceRef.current);
    }
  }, [setSearchQuery, router, searchParams]);
  const setFilters = useDraftStore((s) => s.setFilters);
  const resetFiltersStore = useDraftStore((s) => s.resetFilters);

  // resetFilters 래퍼: URL도 함께 초기화
  const resetFilters = useCallback(() => {
    resetFiltersStore();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("projects");
    params.delete("modules");
    params.delete("features");
    params.delete("search");
    params.delete("flagIds");
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [resetFiltersStore, router, searchParams]);

  // URL queryString 업데이트 함수
  const updateURLFilters = useCallback(
    (newFilters: {
      projects: string[];
      modules: string[];
      features: string[];
    }) => {
      const params = new URLSearchParams(searchParams.toString());

      // projects 파라미터 업데이트
      if (newFilters.projects.length > 0) {
        params.set("projects", newFilters.projects.join(","));
      } else {
        params.delete("projects");
      }

      // modules 파라미터 업데이트
      if (newFilters.modules.length > 0) {
        params.set("modules", newFilters.modules.join(","));
      } else {
        params.delete("modules");
      }

      // features 파라미터 업데이트
      if (newFilters.features.length > 0) {
        params.set("features", newFilters.features.join(","));
      } else {
        params.delete("features");
      }

      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  // 초기 로드 시 URL에서 필터 및 검색어 읽어오기
  useEffect(() => {
    const urlProjects = searchParams.get("projects");
    const urlModules = searchParams.get("modules");
    const urlFeatures = searchParams.get("features");
    const urlFlagIds = searchParams.get("flagIds");
    const urlSearch = searchParams.get("search");

    const urlFilters = {
      projects: urlProjects ? urlProjects.split(",").filter(Boolean) : [],
      modules: urlModules ? urlModules.split(",").filter(Boolean) : [],
      features: urlFeatures ? urlFeatures.split(",").filter(Boolean) : [],
      flagIds: urlFlagIds ? urlFlagIds.split(",").filter(Boolean) : [],
    };

    // URL에 필터가 있고 현재 필터와 다르면 적용
    const hasURLFilters = urlProjects || urlModules || urlFeatures || urlFlagIds;
    if (hasURLFilters) {
      const currentFilters = filters;
      const isDifferent =
        JSON.stringify(currentFilters.projects.sort()) !==
          JSON.stringify(urlFilters.projects.sort()) ||
        JSON.stringify(currentFilters.modules.sort()) !==
          JSON.stringify(urlFilters.modules.sort()) ||
        JSON.stringify(currentFilters.features.sort()) !==
          JSON.stringify(urlFilters.features.sort()) ||
        JSON.stringify((currentFilters.flagIds || []).sort()) !==
          JSON.stringify(urlFilters.flagIds.sort());

      if (isDifferent) {
        setFilters(urlFilters);
      }
    }

    // URL에 검색어가 있고 현재 검색어와 다르면 적용
    if (urlSearch !== null && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setLocalSearchValue(urlSearch);
    }
  }, []); // 초기 마운트 시에만 실행
  const selectRow = useDraftStore((s) => s.selectRow);
  const selectedRowId = useDraftStore((s) => s.ui.selectedRowId);
  const deleteRow = useDraftStore((s) => s.deleteRow);
  const addRow = useDraftStore((s) => s.addRow);
  const expandedNodesArray = useDraftStore((s) => s.ui.expandedNodes);
  const viewMode = useDraftStore((s) => s.ui.viewMode);
  const toggleNodeStore = useDraftStore((s) => s.toggleNode);
  const expandAllNodes = useDraftStore((s) => s.expandAllNodes);
  const collapseAllNodes = useDraftStore((s) => s.collapseAllNodes);
  const expandToLevel = useDraftStore((s) => s.expandToLevel);
  const renameNode = useDraftStore((s) => s.renameNode);
  const reorderRows = useDraftStore((s) => s.reorderRows);

  // 외부에서 관리되지 않는 경우 로컬 상태 사용
  const [localShowAddRowModal, setLocalShowAddRowModal] = useState(false);

  // viewMode 변경 시 스켈레톤 표시 상태
  const [showSkeleton, setShowSkeleton] = useState(false);
  const prevViewModeRef = useRef(viewMode);

  // viewMode 변경 감지 및 스켈레톤 표시
  useEffect(() => {
    if (prevViewModeRef.current !== viewMode) {
      setShowSkeleton(true);
      // 트리 계산 후 스켈레톤 숨김 (약간의 딜레이)
      const timer = setTimeout(() => {
        setShowSkeleton(false);
      }, 200); // 200ms 후 스켈레톤 숨김
      prevViewModeRef.current = viewMode;
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Flags 관련 상태
  const flags = useDraftStore((s) => s.flags);
  const selectedFlagId = useDraftStore((s) => s.selectedFlagId);
  const selectFlag = useDraftStore((s) => s.selectFlag);
  const [showFlagsPopover, setShowFlagsPopover] = useState(false);
  const [flagsAnchorRect, setFlagsAnchorRect] = useState<DOMRect | null>(null);
  const flagsSectionRef = useRef<HTMLDivElement>(null);

  // 삭제 확인 모달 상태
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    rowId: string | null;
    featureName: string;
    planCount: number;
  }>({
    isOpen: false,
    rowId: null,
    featureName: "",
    planCount: 0,
  });

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

  // 선택된 노드 상태 (프로젝트/모듈/기능 모두 선택 가능)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

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
  const [filterSearchQuery, setFilterSearchQuery] = useState("");
  const [debouncedFilterSearchQuery, setDebouncedFilterSearchQuery] =
    useState("");
  const [isFilterSearching, setIsFilterSearching] = useState(false);
  const filterSearchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const expandMenuRef = useRef<HTMLDivElement>(null);
  const expandButtonRef = useRef<HTMLButtonElement>(null);

  // 필터 검색 debounce 처리
  const handleFilterSearchChange = useCallback((value: string) => {
    setFilterSearchQuery(value);
    setIsFilterSearching(true);

    if (filterSearchDebounceRef.current) {
      clearTimeout(filterSearchDebounceRef.current);
    }

    filterSearchDebounceRef.current = setTimeout(() => {
      setDebouncedFilterSearchQuery(value);
      setIsFilterSearching(false);
    }, 300);
  }, []);

  const handleFilterSearchClear = useCallback(() => {
    setFilterSearchQuery("");
    setDebouncedFilterSearchQuery("");
    setIsFilterSearching(false);
    if (filterSearchDebounceRef.current) {
      clearTimeout(filterSearchDebounceRef.current);
    }
  }, []);

  // cleanup
  useEffect(() => {
    return () => {
      if (filterSearchDebounceRef.current) {
        clearTimeout(filterSearchDebounceRef.current);
      }
    };
  }, []);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
    project: string;
    module: string;
    nodeType: "project" | "module" | "feature";
    label: string;
    hasChildren: boolean;
    isExpanded: boolean;
  } | null>(null);

  // Initial Modal Data State
  const [initialModalData, setInitialModalData] = useState<{
    project: string;
    module: string;
  } | null>(null);

  // Expose closeContextMenu method to parent via ref
  useImperativeHandle(ref, () => ({
    closeContextMenu: () => setContextMenu(null),
  }), []);

  // Close context menu on click outside
  // Close context menu on click outside or ESC
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };
    
    window.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent, node: FlatTreeNode) => {
    if (!isEditing) return;
    
    // Only allow context menu on nodes that provide project/module context
    let project = "";
    let module = "";

    if (node.type === "feature") {
      project = node.row?.project || "";
      module = node.row?.module || "";
    } else if (node.type === "module") {
        // node.id is "project::module"
        const parts = node.id.split("::");
        project = parts[0];
        module = parts[1];
    } else if (node.type === "project") {
        project = node.label;
        // No module context for project node
    }

    // At minimum, we need a project to show the context menu
    if (!project) return;
    
    e.preventDefault();
    e.stopPropagation();

    // Close other menus
    setShowFilters(false);
    setShowExpandMenu(false);

    // Feature도 bars가 있으면 접을 수 있음
    const hasChildren = node.type !== "feature" || (node.type === "feature" && (node.originalBarCount || 0) > 0);
    const isExpanded = expandedNodes.has(node.id);

    // 노드 선택
    setSelectedNodeId(node.id);
    if (node.row) {
      selectRow(node.row.rowId);
    }

    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId: node.id,
      project,
      module,
      nodeType: node.type,
      label: node.label,
      hasChildren,
      isExpanded,
    });
  };
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
        handleFilterSearchClear();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showFilters, handleFilterSearchClear]);

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

  // Range Flag 목록 (Point Flag 제외 - 기간 필터용)
  const rangeFlags = useMemo(() => {
    return flags.filter((f) => !f.deleted && f.startDate !== f.endDate);
  }, [flags]);

  // 범위 내 Range Flags (필터 팝오버에 표시될 Flag 목록)
  const visibleRangeFlags = useMemo(() => {
    if (!rangeStart || !rangeEnd) return rangeFlags;
    return rangeFlags.filter((f) =>
      isDateRangeOverlapping(f.startDate, f.endDate, rangeStart, rangeEnd)
    );
  }, [rangeFlags, rangeStart, rangeEnd]);

  // 활성 bars (삭제되지 않은 것들 + 필터 적용)
  // 인덱스가 있으면 고속 필터링, 없으면 기존 방식
  const activeBars = useMemo(() => {
    let bars: typeof allBars;

    if (filterIndex) {
      // 인덱스를 사용한 고속 필터링
      bars = filterBarsWithIndex(allBars, filterIndex, {
        stages: filters.stages || [],
        assignees: filters.assignees || [],
      });
    } else {
      // 폴백: 기존 방식
      bars = allBars.filter((b) => !b.deleted);

      // 스테이지 필터 적용
      if (filters.stages && filters.stages.length > 0) {
        bars = bars.filter((b) => filters.stages.includes(b.stage));
      }

      // 담당자 필터 적용
      if (filters.assignees && filters.assignees.length > 0) {
        bars = bars.filter((b) =>
          b.assignees.some((assignee) =>
            filters.assignees.includes(assignee.userId)
          )
        );
      }
    }

    // Flag 기간 필터 적용 (Range Flag만 대상)
    if (filters.flagIds && filters.flagIds.length > 0) {
      const selectedFlags = rangeFlags.filter((f) =>
        filters.flagIds.includes(f.clientId)
      );
      if (selectedFlags.length > 0) {
        bars = bars.filter((bar) =>
          selectedFlags.some((flag) =>
            isDateRangeOverlapping(
              bar.startDate,
              bar.endDate,
              new Date(flag.startDate),
              new Date(flag.endDate)
            )
          )
        );
      }
    }

    return bars;
  }, [allBars, filterIndex, filters.stages, filters.assignees, filters.flagIds, rangeFlags]);

  // activeBars를 Set으로 변환 (빠른 조회용)
  const activeBarsSet = useMemo(
    () => new Set(activeBars.map((b) => b.clientUid)),
    [activeBars]
  );

  // 필터링된 rows
  const filteredRows = useMemo(() => {
    if (filterIndex) {
      // 인덱스를 사용한 고속 필터링
      const barsInView = new Set(activeBars.map((b) => b.clientUid));
      return filterRowsWithIndex(
        allRows,
        barsInView,
        filterIndex,
        {
          projects: filters.projects || [],
          modules: filters.modules || [],
          features: filters.features || [],
        },
        searchQuery
      );
    }

    // 폴백: 기존 방식
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
  }, [allRows, activeBars, filterIndex, searchQuery, filters]);

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

  // 현재 펼침 레벨 계산 (프로젝트=0, 모듈=1, 기능=2, 전체=3)
  // expandedNodesArray가 비어있으면 프로젝트까지 보기 상태
  // 프로젝트 노드만 펼쳐져 있으면 모듈까지 보기
  // 모듈 노드도 펼쳐져 있으면 기능까지 보기
  // 모든 Feature 노드가 펼쳐져 있으면 전체 보기
  const currentExpandLevel = useMemo(() => {
    if (expandedNodesArray.length === 0) return 0; // 프로젝트까지 보기
    // 모듈 노드가 펼쳐져 있는지 확인 (::가 하나만 있는 경우)
    const hasModuleExpanded = expandedNodesArray.some(
      (id) => id.includes("::") && id.split("::").length === 2
    );
    if (!hasModuleExpanded) return 1; // 모듈까지 보기
    
    // Feature 노드가 펼쳐져 있는지 확인 (::가 두 개 있는 경우 또는 rowId)
    const hasFeatureExpanded = expandedNodesArray.some(
      (id) => id.includes("::") && id.split("::").length === 3
    );
    if (!hasFeatureExpanded) return 2; // 기능까지 보기
    
    // 모든 Feature가 펼쳐져 있는지 확인
    const allFeatures = allRows.map((r) => r.rowId);
    const expandedFeatures = expandedNodesArray.filter((id) =>
      allFeatures.includes(id)
    );
    // 모든 Feature가 펼쳐져 있으면 전체 보기
    if (expandedFeatures.length === allFeatures.length && allFeatures.length > 0) {
      return 3; // 전체 보기
    }
    
    return 2; // 기능까지 보기 (일부만 펼쳐진 경우)
  }, [expandedNodesArray, allRows]);

  // FlatTree와 nodePositions 계산 (Timeline과 동일)
  // 중요: lane 레이아웃은 전체 bars(allBars) 기준으로 계산하되, 표시는 activeBars만
  const flatNodes = useMemo(() => {
    // viewMode에 따라 다른 트리 빌드 함수 사용
    // activeBars는 이미 필터링된 bars (삭제되지 않은 것 + 스테이지/담당자 필터 적용)
    if (viewMode === "summarized") {
      return buildSummarizedTree(filteredRows, activeBars, expandedNodes);
    }
    return buildFlatTree(filteredRows, activeBars, expandedNodes);
  }, [filteredRows, activeBars, expandedNodes, viewMode]);

  // 필터 레벨에 따라 노드 필터링 (상위 레벨 숨김) + top 재계산
  const visibleNodePositions = useMemo(() => {
    const allPositions = calculateNodePositions(flatNodes, viewMode);

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
  }, [flatNodes, filterLevel, viewMode]);

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

  // 통합 필터 항목 목록 (프로젝트, 모듈, 기능)
  type FilterItemType = "project" | "module" | "feature";
  type FilterItem = {
    type: FilterItemType;
    name: string;
    isAvailable: boolean;
  };

  const filterItems = useMemo(() => {
    const items: FilterItem[] = [];

    // 프로젝트 항목
    allProjects.forEach((project) => {
      items.push({
        type: "project",
        name: project,
        isAvailable: true,
      });
    });

    // 모듈 항목
    allModules.forEach((module) => {
      items.push({
        type: "module",
        name: module,
        isAvailable: availableModules.includes(module),
      });
    });

    // 기능 항목
    allFeatures.forEach((feature) => {
      items.push({
        type: "feature",
        name: feature,
        isAvailable: availableFeatures.includes(feature),
      });
    });

    return items;
  }, [
    allProjects,
    allModules,
    allFeatures,
    availableModules,
    availableFeatures,
  ]);

  // 검색어로 필터링된 항목 목록 (debounced 값 사용)
  const filteredFilterItems = useMemo(() => {
    if (!debouncedFilterSearchQuery.trim()) {
      return filterItems;
    }

    const query = debouncedFilterSearchQuery.toLowerCase();
    return filterItems.filter((item) =>
      item.name.toLowerCase().includes(query)
    );
  }, [filterItems, debouncedFilterSearchQuery]);

  // 검색어로 필터링된 Flags 목록 (debounced 값 사용)
  const filteredRangeFlags = useMemo(() => {
    if (!debouncedFilterSearchQuery.trim()) {
      return visibleRangeFlags;
    }

    const query = debouncedFilterSearchQuery.toLowerCase();
    return visibleRangeFlags.filter((flag) =>
      flag.title.toLowerCase().includes(query)
    );
  }, [visibleRangeFlags, debouncedFilterSearchQuery]);

  const hasActiveFilters =
    searchQuery ||
    filters.projects.length > 0 ||
    filters.modules.length > 0 ||
    filters.features.length > 0 ||
    (filters.flagIds?.length ?? 0) > 0;

  const toggleNode = useCallback(
    (nodeId: string) => {
      // Summarized 모드에서는 토글 불가
      if (viewMode === "summarized") return;
      toggleNodeStore(nodeId);
    },
    [toggleNodeStore, viewMode]
  );

  const toggleProjectFilter = (project: string) => {
    const current = filters.projects;
    const next = current.includes(project)
      ? current.filter((p) => p !== project)
      : [...current, project];
    const newFilters = { ...filters, projects: next };
    setFilters(newFilters);
    updateURLFilters(newFilters);
    // 필터 적용 시 기능까지 펼치기
    expandToLevel(1);
  };

  const toggleModuleFilter = (module: string) => {
    const current = filters.modules;
    const next = current.includes(module)
      ? current.filter((m) => m !== module)
      : [...current, module];
    const newFilters = { ...filters, modules: next };
    setFilters(newFilters);
    updateURLFilters(newFilters);
    // 필터 적용 시 기능까지 펼치기
    expandToLevel(1);
  };

  const toggleFeatureFilter = (feature: string) => {
    const current = filters.features;
    const next = current.includes(feature)
      ? current.filter((f) => f !== feature)
      : [...current, feature];
    const newFilters = { ...filters, features: next };
    setFilters(newFilters);
    updateURLFilters(newFilters);
    // 필터 적용 시 기능까지 펼치기
    expandToLevel(1);
  };

  const toggleFlagFilter = (flagId: string) => {
    const current = filters.flagIds || [];
    const next = current.includes(flagId)
      ? current.filter((f) => f !== flagId)
      : [...current, flagId];
    const newFilters = { ...filters, flagIds: next };
    setFilters(newFilters);
    // URL 파라미터 업데이트 (선택사항)
    const params = new URLSearchParams(searchParams.toString());
    if (next.length > 0) {
      params.set("flagIds", next.join(","));
    } else {
      params.delete("flagIds");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
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
    if (scrollContainerRef.current && externalOnScroll) {
      externalOnScroll(scrollContainerRef.current.scrollTop);
    }
    // Close context menu on scroll
    if (contextMenu) {
      setContextMenu(null);
    }
  }, [externalOnScroll, contextMenu]);

  // 키보드 네비게이션 핸들러
  const handleTreeKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // 편집 중이면 키보드 네비게이션 비활성화
      if (editingNode) return;
      
      const currentIndex = selectedNodeId
        ? nodePositions.findIndex((p) => p.node.id === selectedNodeId)
        : -1;

      switch (e.key) {
        case "ArrowUp": {
          e.preventDefault();
          if (currentIndex > 0) {
            const prevNode = nodePositions[currentIndex - 1].node;
            setSelectedNodeId(prevNode.id);
            if (prevNode.row) {
              selectRow(prevNode.row.rowId);
            }
            // 스크롤 조정
            const prevTop = nodePositions[currentIndex - 1].top;
            if (scrollContainerRef.current) {
              const containerTop = scrollContainerRef.current.scrollTop;
              if (prevTop < containerTop) {
                scrollContainerRef.current.scrollTop = prevTop;
              }
            }
          } else if (currentIndex === -1 && nodePositions.length > 0) {
            // 선택된 노드가 없으면 첫 번째 노드 선택
            const firstNode = nodePositions[0].node;
            setSelectedNodeId(firstNode.id);
            if (firstNode.row) {
              selectRow(firstNode.row.rowId);
            }
          }
          break;
        }
        case "ArrowDown": {
          e.preventDefault();
          if (currentIndex < nodePositions.length - 1) {
            const nextIndex = currentIndex === -1 ? 0 : currentIndex + 1;
            const nextNode = nodePositions[nextIndex].node;
            setSelectedNodeId(nextNode.id);
            if (nextNode.row) {
              selectRow(nextNode.row.rowId);
            }
            // 스크롤 조정
            const nextPos = nodePositions[nextIndex];
            if (scrollContainerRef.current) {
              const containerBottom =
                scrollContainerRef.current.scrollTop +
                scrollContainerRef.current.clientHeight;
              const nodeBottom = nextPos.top + nextPos.height;
              if (nodeBottom > containerBottom) {
                scrollContainerRef.current.scrollTop =
                  nodeBottom - scrollContainerRef.current.clientHeight;
              }
            }
          }
          break;
        }
        case "ArrowLeft": {
          e.preventDefault();
          if (selectedNodeId && viewMode !== "summarized") {
            const currentNode = nodePositions.find(
              (p) => p.node.id === selectedNodeId
            )?.node;
            if (currentNode) {
              const hasChildren =
                currentNode.type !== "feature" ||
                (currentNode.type === "feature" &&
                  (currentNode.originalBarCount || 0) > 0);
              const isExpanded = expandedNodes.has(selectedNodeId);
              
              // 펼쳐져 있으면 접기
              if (hasChildren && isExpanded) {
                toggleNode(selectedNodeId);
              } else {
                // 접을 게 없으면 상위 노드로 선택 이동
                let parentNodeId: string | null = null;
                
                if (currentNode.type === "feature" && currentNode.row) {
                  // feature -> module
                  parentNodeId = `${currentNode.row.project}::${currentNode.row.module}`;
                } else if (currentNode.type === "module") {
                  // module -> project
                  const parts = selectedNodeId.split("::");
                  parentNodeId = parts[0];
                }
                // project는 최상위이므로 이동 없음
                
                if (parentNodeId) {
                  const parentPos = nodePositions.find(
                    (p) => p.node.id === parentNodeId
                  );
                  if (parentPos) {
                    setSelectedNodeId(parentNodeId);
                    if (parentPos.node.row) {
                      selectRow(parentPos.node.row.rowId);
                    }
                    // 스크롤 조정
                    if (scrollContainerRef.current) {
                      const containerTop = scrollContainerRef.current.scrollTop;
                      if (parentPos.top < containerTop) {
                        scrollContainerRef.current.scrollTop = parentPos.top;
                      }
                    }
                  }
                }
              }
            }
          }
          break;
        }
        case "ArrowRight": {
          e.preventDefault();
          if (selectedNodeId && viewMode !== "summarized") {
            const currentNode = nodePositions.find(
              (p) => p.node.id === selectedNodeId
            )?.node;
            if (currentNode) {
              const hasChildren =
                currentNode.type !== "feature" ||
                (currentNode.type === "feature" &&
                  (currentNode.originalBarCount || 0) > 0);
              const isExpanded = expandedNodes.has(selectedNodeId);
              // 접혀있으면 펼치기
              if (hasChildren && !isExpanded) {
                toggleNode(selectedNodeId);
              }
            }
          }
          break;
        }
      }
    },
    [
      selectedNodeId,
      nodePositions,
      editingNode,
      expandedNodes,
      viewMode,
      toggleNode,
      selectRow,
    ]
  );

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

    const newRow = addRow(project, module, feature);
    
    // If opened from context menu, insert after the right-clicked row
    if (initialModalData && contextMenu) {
      const rightClickedRowId = contextMenu.nodeId;
      // Find the row to insert after
      const targetRowIndex = allRows.findIndex(r => r.rowId === rightClickedRowId);
      
      if (targetRowIndex !== -1) {
        // Reorder: move new row to position after target
        const newOrder = allRows
          .filter(r => r.rowId !== newRow.rowId)
          .flatMap((r, idx) => 
            idx === targetRowIndex ? [r.rowId, newRow.rowId] : [r.rowId]
          );
        reorderRows(newOrder);
      }
    }
    
    setShowAddRowModal(false);
    setInitialModalData(null);
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

  // 오늘 날짜 (YYYY-MM-DD 형식)
  const todayStr = useMemo(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }, []);

  const renderNode = (pos: {
    node: FlatTreeNode;
    top: number;
    height: number;
  }) => {
    const { node, top, height } = pos;
    const isExpanded = expandedNodes.has(node.id);
    // Feature도 bars가 있으면 접을 수 있음 (원래 bars 개수로 확인)
    const hasChildren = node.type !== "feature" || (node.type === "feature" && (node.originalBarCount || 0) > 0);
    // 선택 상태 (모든 노드 타입에 대해 selectedNodeId 기준)
    const isSelected = selectedNodeId === node.id;

    // 접혀있을 때 오늘 날짜에 계획이 있는지 확인 (프로젝트/모듈/기능 모두)
    const hasTodayPlan = (() => {
      // 펼쳐져 있으면 체크 안함
      if (isExpanded) return false;

      if (node.type === "feature") {
        // feature는 자신의 bars에서 확인
        const featureBars = activeBars.filter((bar) => bar.rowId === node.row?.rowId);
        return featureBars.some(
          (bar) => bar.startDate <= todayStr && bar.endDate >= todayStr
        );
      }

      // 해당 프로젝트/모듈에 속한 bars 필터링
      const relevantBars = activeBars.filter((bar) => {
        const row = filteredRows.find((r) => r.rowId === bar.rowId);
        if (!row) return false;
        
        if (node.type === "project") {
          return row.project === node.label;
        } else if (node.type === "module") {
          // module id 형식: "project::module"
          const parts = node.id.split("::");
          return row.project === parts[0] && row.module === parts[1];
        }
        return false;
      });

      // 오늘 날짜가 bar의 기간에 포함되는지 확인
      return relevantBars.some(
        (bar) => bar.startDate <= todayStr && bar.endDate >= todayStr
      );
    })();

    // feature의 bar 개수 (범위 내 + 필터링된 bar만 카운트)
    const barCount = (() => {
      if (!node.bars) return 0;
      const visibleBars = node.bars.filter((bar) =>
        activeBarsSet.has(bar.clientUid)
      );
      if (!rangeStart || !rangeEnd) return visibleBars.length;
      return visibleBars.filter((bar) =>
        isDateRangeOverlapping(bar.startDate, bar.endDate, rangeStart, rangeEnd)
      ).length;
    })();

    const handleDelete = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!node.row) return;

      // 전체 bar 개수 (삭제 확인용)
      const totalBarCount = node.bars?.length || 0;
      
      // 삭제 확인 모달 표시
      setDeleteConfirm({
        isOpen: true,
        rowId: node.row.rowId,
        featureName: node.label,
        planCount: totalBarCount,
      });
    };

    // 좌클릭으로 노드 선택
    const handleNodeSelect = () => {
      setSelectedNodeId(node.id);
      // feature인 경우 기존 selectRow도 호출 (타임라인 연동)
      if (node.row) {
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

    // Timeline focus로 인한 하이라이트 확인
    const isFocused = node.row?.rowId === highlightedRowId;

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
    // 접힌 feature는 연한 회색 음영 처리
    const isFeatureCollapsed = node.type === "feature" && node.isExpanded === false;
    let bgStyle = "";
    if (isFeatureCollapsed) {
      bgStyle = "rgba(0, 0, 0, 0.03)";
    } else if (node.type === "project") {
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
        onContextMenu={(e) => handleContextMenu(e, node)}
        className={`absolute left-0 right-0 flex items-center gap-1 group transition-all duration-150 ${
          node.type === "project" || node.type === "module" || (node.type === "feature" && !isExpanded)
            ? "px-2"
            : "px-3"
        } ${isSelected ? "" : "hover:translate-x-0.5"} ${
          isDragging ? "opacity-50" : ""
        } ${isFocused ? "animate-pulse-subtle" : ""}`}
        style={{
          top,
          height,
          background: isFocused
            ? "linear-gradient(90deg, rgba(251, 146, 60, 0.2) 0%, rgba(251, 146, 60, 0.1) 100%)"
            : isSelected
            ? "linear-gradient(90deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%)"
            : bgStyle,
          borderTop: showDropBefore ? "2px solid #3b82f6" : undefined,
          cursor: "default",
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

        {/* 확장/접기 화살표 (Summarized 모드에서는 숨김) */}
        <div
          className={`flex items-center gap-1 flex-shrink-0 ${
            hasChildren && viewMode !== "summarized" ? "cursor-pointer" : ""
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren && viewMode !== "summarized") {
              toggleNode(node.id);
            }
          }}
        >
          {hasChildren && viewMode !== "summarized" ? (
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

        {/* 오늘 날짜 계획 인디케이터 (접혀있을 때만) */}
        {hasTodayPlan && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse"
            style={{
              background: node.type === "project"
                ? "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                : node.type === "module"
                ? "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)"
                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: node.type === "project"
                ? "0 0 4px rgba(245, 158, 11, 0.5)"
                : node.type === "module"
                ? "0 0 4px rgba(139, 92, 246, 0.5)"
                : "0 0 4px rgba(16, 185, 129, 0.5)",
            }}
            title="오늘 날짜에 진행 중인 계획이 있습니다"
          />
        )}

        {/* 우측 영역: 라벨 - 클릭으로 선택, 더블 클릭으로 편집 가능 */}
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onDoubleClick={handleDoubleClick}
          onClick={(e) => {
            e.stopPropagation();
            // 라벨 클릭 시 노드 선택
            handleNodeSelect();
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
              className={`block truncate transition-colors duration-150 ${
                node.type === "project" || node.type === "module" || (node.type === "feature" && !isExpanded)
                  ? "text-[11px]"
                  : "text-[13px]"
              } ${
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
              onKeyDown={(e) => {
                // 키 이벤트가 상위 요소로 버블링되지 않도록 차단
                e.stopPropagation();
              }}
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
              onClick={() => {
                if (!showFilters) {
                  handleFilterSearchClear();
                }
                setShowFilters(!showFilters);
              }}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 active:scale-95 ${
                showFilters || hasActiveFilters
                  ? "bg-blue-100 text-blue-600"
                  : "hover:bg-white text-gray-500"
              }`}
              title="트리 필터 옵션"
            >
              <FilterIcon className="w-3 h-3" />
              <span>트리 필터</span>
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

      {/* 필터 팝오버 - 통합 리스트 + 검색 */}
      {showFilters && (
        <div
          ref={filterRef}
          className="absolute left-2 right-2 z-50 rounded-xl shadow-xl flex flex-col overflow-hidden"
          style={{
            top: HEADER_HEIGHT + 4, // 필터 버튼 바로 아래 (4px 간격)
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow:
              "0 10px 40px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1)",
            maxHeight: "min(400px, calc(100vh - 200px))",
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 pt-3 pb-2 flex-shrink-0">
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

          {/* 검색 입력 */}
          <div className="px-3 pb-3 flex-shrink-0">
            <div
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-all duration-150 focus-within:ring-1 focus-within:ring-blue-200"
              style={{
                background: "#f9fafb",
                border: "1px solid rgba(0, 0, 0, 0.06)",
              }}
            >
              <SearchIcon className="w-3 h-3 text-gray-400" />
              <input
                type="text"
                value={filterSearchQuery}
                onChange={(e) => handleFilterSearchChange(e.target.value)}
                onKeyDown={(e) => {
                  // 키 이벤트가 상위 요소로 버블링되지 않도록 차단
                  e.stopPropagation();
                }}
                placeholder="프로젝트, 모듈, 기능 검색..."
                className="flex-1 text-[11px] bg-transparent border-none outline-none text-gray-700 placeholder:text-gray-400"
              />
              {(filterSearchQuery || isFilterSearching) && (
                <div className="flex items-center">
                  {isFilterSearching ? (
                    <svg
                      className="animate-spin w-3.5 h-3.5 text-blue-500"
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
                      onClick={handleFilterSearchClear}
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      <XIcon className="w-2 h-2 text-gray-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 스크롤 가능한 필터 영역 (Flag + 필터 항목) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
            {/* Flag 기간 필터 섹션 */}
            {filteredRangeFlags.length > 0 && (
              <div className="pb-2">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5 px-1">
                  Flags (기간)
                </div>
                <div className="space-y-0.5">
                  {filteredRangeFlags.map((flag) => {
                    const isChecked = filters.flagIds?.includes(flag.clientId) || false;
                    const flagColor = flag.color || "#ef4444";
                    // 날짜 포맷: M/D
                    const formatDate = (dateStr: string) => {
                      const d = new Date(dateStr);
                      return `${d.getMonth() + 1}/${d.getDate()}`;
                    };
                    const dateRange = `${formatDate(flag.startDate)}~${formatDate(flag.endDate)}`;

                    return (
                      <label
                        key={flag.clientId}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-red-50/50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFlagFilter(flag.clientId)}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                        />
                        <FlagIcon
                          className="w-3 h-3 flex-shrink-0"
                          style={{ color: flagColor }}
                        />
                        <span className="text-xs text-gray-700 flex-1 truncate">
                          {flag.title}
                        </span>
                        <span className="text-[10px] text-gray-400 flex-shrink-0">
                          {dateRange}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {/* 구분선 */}
                <div className="border-t border-gray-100 mt-2" />
              </div>
            )}

            {/* 필터 항목 리스트 */}
            {filteredFilterItems.length === 0 && filteredRangeFlags.length === 0 ? (
              <div className="text-xs text-gray-400 text-center py-4">
                {debouncedFilterSearchQuery
                  ? "검색 결과가 없습니다"
                  : "필터할 항목이 없습니다"}
              </div>
            ) : filteredFilterItems.length === 0 ? (
              null
            ) : (
              <div className="space-y-1">
                {filteredFilterItems.map((item) => {
                  const isChecked =
                    item.type === "project"
                      ? filters.projects.includes(item.name)
                      : item.type === "module"
                      ? filters.modules.includes(item.name)
                      : filters.features.includes(item.name);

                  const handleToggle = () => {
                    if (item.type === "project") {
                      toggleProjectFilter(item.name);
                    } else if (item.type === "module") {
                      toggleModuleFilter(item.name);
                    } else {
                      toggleFeatureFilter(item.name);
                    }
                  };

                  const getCheckboxColor = () => {
                    if (item.type === "project")
                      return "text-amber-600 focus:ring-amber-500";
                    if (item.type === "module")
                      return "text-violet-600 focus:ring-violet-500";
                    return "text-emerald-600 focus:ring-emerald-500";
                  };

                  const getIcon = () => {
                    if (item.type === "project") {
                      return (
                        <FolderIcon
                          className={`w-3 h-3 ${
                            item.isAvailable
                              ? "text-amber-500"
                              : "text-gray-400"
                          }`}
                        />
                      );
                    }
                    if (item.type === "module") {
                      return (
                        <CubeIcon
                          className={`w-3 h-3 ${
                            item.isAvailable
                              ? "text-violet-500"
                              : "text-gray-400"
                          }`}
                        />
                      );
                    }
                    return (
                      <CodeIcon
                        className={`w-3 h-3 ${
                          item.isAvailable
                            ? "text-emerald-500"
                            : "text-gray-400"
                        }`}
                      />
                    );
                  };

                  const getTypeLabel = () => {
                    if (item.type === "project") return "프로젝트";
                    if (item.type === "module") return "모듈";
                    return "기능";
                  };

                  return (
                    <label
                      key={`${item.type}-${item.name}`}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                        item.isAvailable
                          ? "cursor-pointer hover:bg-gray-50"
                          : "cursor-not-allowed opacity-40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={handleToggle}
                        disabled={!item.isAvailable}
                        className={`w-3.5 h-3.5 rounded border-gray-300 ${getCheckboxColor()} disabled:opacity-50`}
                      />
                      {getIcon()}
                      <span
                        className={`text-xs flex-1 ${
                          item.isAvailable ? "text-gray-700" : "text-gray-400"
                        }`}
                      >
                        {item.name}
                      </span>
                      <span className="text-[10px] text-gray-400 px-1.5 py-0.5 rounded bg-gray-100">
                        {getTypeLabel()}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 트리 영역 (스크롤) - Airbnb 스타일 */}
      <div
        ref={scrollContainerRef}
        tabIndex={0}
        className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide border border-t-[1px] border-gray-50/15 outline-none focus:ring-1 focus:ring-blue-200 focus:ring-inset"
        style={{
          background: "linear-gradient(180deg, #ffffff 0%, #fafbfc 100%)",
          scrollbarWidth: "none", // Firefox
          msOverflowStyle: "none", // IE/Edge
          paddingBottom:
            timelineScrollbarHeight > 0
              ? `${timelineScrollbarHeight}px`
              : undefined,
        }}
        onScroll={handleScroll}
        onKeyDown={handleTreeKeyDown}
      >
        {showSkeleton ? (
          <TreePanelSkeleton type={viewMode} />
        ) : (
          <>
            <div className="relative" style={{ height: totalHeight }}>
              {nodePositions.map((pos) => renderNode(pos))}
            </div>

            {/* 검색 결과 없음 - Airbnb 스타일 */}
            {searchQuery && nodePositions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{
                    background:
                      "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
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
                    background:
                      "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
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
          </>
        )}
      </div>

      {/* AddRowModal */}
      {showAddRowModal && (
        <AddRowModal
          isOpen={showAddRowModal}
          onClose={() => {
            setShowAddRowModal(false);
            setInitialModalData(null);
          }}
          onAdd={handleAddRow}
          existingProjects={allProjects}
          existingModules={allModules}
          initialProject={initialModalData?.project}
          initialModule={initialModalData?.module}
        />
      )}

      {/* Context Menu Portal */}
      {contextMenu && createPortal(
        <div
          className="fixed z-[10000] rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
            minWidth: 200,
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            boxShadow:
              "0 16px 32px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08)",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="py-2">
            {/* 새 기능 추가 */}
            <button
              onClick={() => {
                setInitialModalData({
                  project: contextMenu.project,
                  module: contextMenu.module,
                });
                setShowAddRowModal(true);
                setContextMenu(null);
              }}
              className="w-full px-4 py-2.5 text-left flex items-center gap-3 group transition-all duration-150"
              style={{
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(90deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 group-hover:bg-blue-100 transition-colors">
                <PlusIcon className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">{contextMenu.project}{contextMenu.module ? ` / ${contextMenu.module}` : ""}</div>
                <div className="text-sm font-medium text-gray-900">새 기능 추가</div>
              </div>
            </button>

            {/* 이름 변경 */}
            <button
              onClick={() => {
                // 편집 모드 시작 (기존 더블클릭 로직과 동일)
                const idParts = contextMenu.nodeId.split("::");
                setEditingNode({
                  id: contextMenu.nodeId,
                  type: contextMenu.nodeType,
                  label: contextMenu.label,
                  project: contextMenu.nodeType !== "project" ? contextMenu.project : undefined,
                  module: contextMenu.nodeType === "feature" ? contextMenu.module : undefined,
                });
                setContextMenu(null);
                // input에 포커스 및 텍스트 전체 선택
                setTimeout(() => {
                  editInputRef.current?.focus();
                  editInputRef.current?.select();
                }, 50);
              }}
              className="w-full px-4 py-2.5 text-left flex items-center gap-3 group transition-all duration-150"
              style={{
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(90deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 group-hover:bg-amber-100 transition-colors">
                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">{contextMenu.label}</div>
                <div className="text-sm font-medium text-gray-900">이름 변경</div>
              </div>
            </button>

            {/* 펼치기/접기 (hasChildren인 경우만) */}
            {contextMenu.hasChildren && viewMode !== "summarized" && (
              <button
                onClick={() => {
                  toggleNode(contextMenu.nodeId);
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2.5 text-left flex items-center gap-3 group transition-all duration-150"
                style={{
                  background: "transparent",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "linear-gradient(90deg, rgba(59, 130, 246, 0.06) 0%, rgba(59, 130, 246, 0.02) 100%)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-violet-50 group-hover:bg-violet-100 transition-colors">
                  {contextMenu.isExpanded ? (
                    <ChevronDownIcon className="w-4 h-4 text-violet-600" />
                  ) : (
                    <ChevronRightIcon className="w-4 h-4 text-violet-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500">하위 항목</div>
                  <div className="text-sm font-medium text-gray-900">
                    {contextMenu.isExpanded ? "접기" : "펼치기"}
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

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
            <button
              onClick={() => {
                expandAllNodes();
                setShowExpandMenu(false);
              }}
              className="w-full px-3 py-1.5 text-left text-xs hover:bg-gray-50 transition-colors flex items-center justify-between gap-2"
            >
              <span
                style={{
                  color: currentExpandLevel === 3 ? "#3b82f6" : "#374151",
                }}
              >
                전체 보기
              </span>
              {currentExpandLevel === 3 && (
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

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({
            isOpen: false,
            rowId: null,
            featureName: "",
            planCount: 0,
          })
        }
        onConfirm={() => {
          if (deleteConfirm.rowId) {
            deleteRow(deleteConfirm.rowId);
            setDeleteConfirm({
              isOpen: false,
              rowId: null,
              featureName: "",
              planCount: 0,
            });
          }
        }}
        title="기능 삭제"
        message={`"${deleteConfirm.featureName}" 기능과 관련된 ${deleteConfirm.planCount}개의 계획을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`}
        confirmText="삭제"
        cancelText="취소"
        variant="danger"
      />
    </div>
  );
});
