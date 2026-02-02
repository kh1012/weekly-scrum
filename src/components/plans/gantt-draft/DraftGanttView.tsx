/**
 * Draft Gantt View - Airbnb Style
 * - 메인 컨테이너
 * - 좌측 Tree + 우측 Timeline
 * - 하단 FloatingDock (보조 액션)
 * - Toast 알림
 */

"use client";

import {
  useEffect,
  useCallback,
  useState,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDraftStore, createRowId } from "./store";
import { useLock } from "./useLock";
import { useGanttPersistence } from "./hooks/useGanttPersistence";
import { DraftTreePanel } from "./DraftTreePanel";
import { DraftTimeline } from "./DraftTimeline";
import { GanttHeader } from "./GanttHeader";
import { CommandPalette } from "./CommandPalette";
import { HelpModal } from "./HelpModal";
// FloatingDock은 GanttHeader로 통합됨
import {
  showToast,
  showLoadingToast,
  updateToastToSuccess,
  updateToastToError,
  ToastContainer,
} from "./Toast";
import { useSaveQueue } from "./hooks/useSaveQueue";
import type { DraftRow, DraftBar, PlanStatus } from "./types";
import type { WorkspaceMemberOption } from "./CreatePlanModal";
import { formatRelativeTime } from "@/lib/utils/date";
import { GanttSkeleton } from "./GanttSkeleton";
import {
  buildFlatTree,
  calculateNodePositions,
  ROW_HEIGHT,
} from "./laneLayout";
import {
  exportJSON,
  exportPNG,
  exportPNGWithCanvas,
  type ExportMetadata,
  type GanttCanvasData,
} from "@/lib/export";
import type { CanvasOptions } from "@/lib/export/types";
import type { AlignmentMismatch } from "@/lib/alignment/alignmentStatus";

interface InitialAssignee {
  userId: string;
  role: string;
  displayName?: string | null;
}

interface InitialPlan {
  id: string;
  clientUid: string;
  project: string;
  module: string;
  feature: string;
  title: string;
  stage: string;
  status: string;
  startDate: string;
  endDate: string;
  domain?: string;
  description?: string;
  links?: { url: string; label?: string }[];
  orderIndex?: number; // 트리 순서
  laneHint?: number; // 사용자 지정 레인
  assignees?: InitialAssignee[];
  /** Snapshot 전용 필드 */
  isSnapshot?: boolean;
  avgProgress?: number; // 평균 진행률 (0-100)
  metaKey?: string; // 메타 정보 키
  year?: number;
  week?: string;
  authorName?: string; // 작성자 이름
  authorId?: string | null; // 작성자 user_id (화살표 연결용)
  past_week?: {
    tasks?: Array<{ title: string; progress: number }>;
    progress?: string;
    next?: string;
    risk?: string;
    memo?: string;
  };
  this_week?: {
    tasks?: string[];
  };
  collaborators?: Array<{ name: string; relations?: string[] }>;
  risks?: string[];
  risk_level?: number;
  /** Alignment 상태 (Plan only) */
  alignmentStatus?: "green" | "orange" | "red" | null;
  alignmentActualCount?: number;
  alignmentExpectedCount?: number;
  alignmentDebugInfo?: {
    planMetaKey: string;
    planDateRange: string;
    matchingSnapshots: Array<{
      metaKey: string;
      startDate: string;
      authorId?: string;
    }>;
    filteredOutSnapshots: Array<{
      metaKey: string;
      startDate: string;
      authorId?: string;
      reason: string;
    }>;
  };
}

interface DraftGanttViewProps {
  workspaceId: string;
  initialPlans?: InitialPlan[];
  members?: WorkspaceMemberOption[];
  /** 읽기 전용 모드 (작업 시작/저장 불가) */
  readOnly?: boolean;
  /** 헤더 제목 */
  title?: string;
  /** 헤더 설명 */
  description?: string;
  /** 스테이지 필터 상태 */
  selectedStages?: Set<string>;
  /** 스테이지 필터 변경 핸들러 */
  onStagesChange?: (stages: Set<string>) => void;
  /** 담당자 필터 상태 (userId 집합) */
  selectedAssignees?: Set<string>;
  /** 담당자 필터 변경 핸들러 */
  onAssigneesChange?: (assignees: Set<string>) => void;
  /** 필터 로딩 중 상태 */
  isFilterLoading?: boolean;
  /** 뷰 모드 전환 중 상태 */
  isViewModeChanging?: boolean;
  /** Plans 최대 updated_at (마지막 업데이트 시각) */
  maxUpdatedAt?: string;
  /** 마지막 업데이트한 사용자 이름 */
  updatedByName?: string;
  /** Alignment 커버리지 검토 활성화 여부 */
  enableAlignmentCheck?: boolean;
  /** Alignment 커버리지 검토 활성화 변경 핸들러 */
  onEnableAlignmentCheckChange?: (enabled: boolean) => void;
  /** 뷰 모드 변경 핸들러 */
  onViewModeChange?: (mode: "detailed" | "summarized") => void;
  /** 데이터 새로고침 핸들러 */
  onRefreshData?: () => void;
  /** 데이터 새로고침 중 상태 */
  isRefreshing?: boolean;
  /** Alignment mismatches (검토 필요한 항목들) */
  mismatches?: AlignmentMismatch[];
  /** Mismatch 클릭 핸들러 */
  onFocusMismatch?: (mismatch: AlignmentMismatch) => void;
  /** Alignment 페이지 여부 */
  isAlignmentPage?: boolean;
}

export interface DraftGanttViewRef {
  scrollToRow: (
    rowId: string,
    options?: { highlight?: boolean; smooth?: boolean },
  ) => void;
}

export const DraftGanttView = forwardRef<
  DraftGanttViewRef,
  DraftGanttViewProps
>(function DraftGanttView(
  {
    workspaceId,
    initialPlans = [],
    members = [],
    readOnly = false,
    title,
    description,
    selectedStages = new Set(),
    onStagesChange,
    selectedAssignees = new Set(),
    onAssigneesChange,
    isFilterLoading = false,
    isViewModeChanging = false,
    maxUpdatedAt,
    updatedByName,
    enableAlignmentCheck = false,
    onEnableAlignmentCheckChange,
    onViewModeChange,
    onRefreshData,
    isRefreshing = false,
    mismatches = [],
    onFocusMismatch,
    isAlignmentPage = false,
  },
  ref,
) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  // isCommitting은 useSaveQueue의 isSaving으로 대체됨
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  const [isInternalViewModeChanging, setIsInternalViewModeChanging] =
    useState(false);

  // ViewMode 변경 감지 및 스켈레톤 표시
  const viewMode = useDraftStore((s) => s.ui.viewMode);
  const prevViewModeRef = useRef(viewMode);

  // 뷰 모드 변경 시작 핸들러
  const handleViewModeChangeStart = useCallback(() => {
    setIsInternalViewModeChanging(true);
  }, []);

  // 뷰 모드 변경 완료 감지 및 로딩 상태 해제
  useEffect(() => {
    if (prevViewModeRef.current !== viewMode) {
      prevViewModeRef.current = viewMode;
      // 뷰 모드가 변경되면 약간의 딜레이 후 로딩 상태 해제
      const timer = setTimeout(() => {
        setIsInternalViewModeChanging(false);
      }, 300); // 300ms 동안 스켈레톤 표시

      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // 자동 저장 옵션 (기본값: 활성화)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveSuccess, setAutoSaveSuccess] = useState(false);

  const handleAutoSaveChange = useCallback((enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    if (enabled) {
      showToast(
        "success",
        "자동 저장 활성화",
        "90초 이상 비활성 시 자동으로 저장됩니다.",
      );
    } else {
      showToast("info", "자동 저장 비활성화", "수동으로만 저장됩니다.");
    }
  }, []);

  // 모바일 감지 (768px 이하)
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileTree, setShowMobileTree] = useState(false);

  // GNB/Header 숨기기 상태
  const [isHeaderHidden, setIsHeaderHidden] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Header 숨기기/보이기 핸들러
  const handleToggleHeader = useCallback(
    (e?: React.MouseEvent) => {
      // 이벤트 전파 방지 (편집 모드 종료 방지)
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      setIsHeaderHidden((prev) => !prev);
      // GNB도 함께 숨기기/보이기
      const gnb = document.querySelector(
        'header[class*="sticky top-0"]',
      ) as HTMLElement;
      if (gnb) {
        gnb.style.display = isHeaderHidden ? "" : "none";
      }
    },
    [isHeaderHidden],
  );

  // 저장 진행 상태는 useSaveQueue에서 Toast로 관리됨

  // 드래그 중인 기간 정보 (FloatingDock에 표시)
  const [dragDateInfo, setDragDateInfo] = useState<{
    startDate: string;
    endDate: string;
  } | null>(null);

  // 세로 스크롤 동기화 상태
  const [commonScrollTop, setCommonScrollTop] = useState(0);

  // 타임라인 스크롤바 높이 감지 (TreePanel 하단 정렬용)
  const timelineRef = useRef<HTMLDivElement>(null);
  const [timelineScrollbarHeight, setTimelineScrollbarHeight] = useState(0);

  // TreePanel ref (context menu 제어용)
  const treePanelRef = useRef<{ closeContextMenu: () => void }>(null);

  // Row 하이라이트 상태 (timeline focus용)
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  const hydrate = useDraftStore((s) => s.hydrate);
  const clearDirtyFlags = useDraftStore((s) => s.clearDirtyFlags);
  const getDirtyBars = useDraftStore((s) => s.getDirtyBars);
  const getDeletedBars = useDraftStore((s) => s.getDeletedBars);
  const discardAllChanges = useDraftStore((s) => s.discardAllChanges);
  const canUndo = useDraftStore((s) => s.canUndo());
  const canRedo = useDraftStore((s) => s.canRedo());
  const undo = useDraftStore((s) => s.undo);
  const redo = useDraftStore((s) => s.redo);
  const hasUnsavedChanges = useDraftStore((s) => s.hasUnsavedChanges());
  const bars = useDraftStore((s) => s.bars);
  const rows = useDraftStore((s) => s.rows);
  const flags = useDraftStore((s) => s.flags);
  const isEditing = useDraftStore((s) => s.ui.isEditing);
  const selectedFlagId = useDraftStore((s) => s.selectedFlagId);
  const selectFlag = useDraftStore((s) => s.selectFlag);
  const setFilters = useDraftStore((s) => s.setFilters);
  const expandToLevel = useDraftStore((s) => s.expandToLevel);
  const expandedNodes = useDraftStore((s) => s.ui.expandedNodes);
  const setExpandedNodes = useDraftStore((s) => s.setExpandedNodes);

  // Expose scrollToRow method via ref
  useImperativeHandle(
    ref,
    () => ({
      scrollToRow: (
        rowId: string,
        options?: { highlight?: boolean; smooth?: boolean },
      ) => {
        const targetRow = rows.find((r) => r.rowId === rowId);
        if (!targetRow) {
          return;
        }

        // Build tree and calculate positions (all nodes expanded for position calculation)
        const allExpanded = new Set(rows.map((r) => r.project));
        rows.forEach((r) => {
          if (r.module) allExpanded.add(`${r.project}::${r.module}`);
        });
        const flatTree = buildFlatTree(rows, bars, allExpanded);
        const nodePositions = calculateNodePositions(flatTree);

        // Find the target node position
        const targetNode = nodePositions.find(
          (pos) => pos.node.row?.rowId === rowId,
        );
        if (!targetNode) {
          return;
        }

        // Scroll to the target row (centered if possible)
        const viewportHeight = timelineRef.current?.clientHeight || 600;
        const targetScrollTop = Math.max(
          0,
          targetNode.top - viewportHeight / 2 + ROW_HEIGHT / 2,
        );

        setCommonScrollTop(targetScrollTop);

        // Apply highlight effect
        if (options?.highlight !== false) {
          setHighlightedRowId(rowId);
          // Clear highlight after animation
          setTimeout(() => {
            setHighlightedRowId(null);
          }, 2000);
        }
      },
    }),
    [rows, bars, timelineRef],
  );

  // 필터를 store에 동기화
  useEffect(() => {
    setFilters({
      stages: Array.from(selectedStages),
      assignees: Array.from(selectedAssignees),
    });
  }, [selectedStages, selectedAssignees, setFilters]);

  // Flags 관련
  const getDirtyFlags = useDraftStore((s) => s.getDirtyFlags);
  const getDeletedFlags = useDraftStore((s) => s.getDeletedFlags);
  const clearFlagDirtyFlags = useDraftStore((s) => s.clearFlagDirtyFlags);
  const hasFlagChanges = useDraftStore((s) => s.hasFlagChanges());
  const fetchFlags = useDraftStore((s) => s.fetchFlags);

  // 저장 큐 Hook (Toast 기반 저장 진행 표시)
  const { requestSave, isSaving } = useSaveQueue({
    workspaceId,
    rows,
    getDirtyBars,
    getDeletedBars,
    getDirtyFlags,
    getDeletedFlags,
    clearDirtyFlags,
    clearFlagDirtyFlags,
    fetchFlags,
  });

  const {
    startEditing,
    stopEditing,
    canEdit,
    extendLockIfNeeded,
    recordActivity,
    isMyLock,
    inactivitySeconds,
  } = useLock({
    workspaceId,
    onInactivityTimeout: () => {
      showToast(
        "warning",
        "비활성 타임아웃",
        "10분간 활동이 없어 편집 모드가 자동 종료되었습니다.",
      );
    },
  });

  // 날짜 범위 설정 (기본 3개월: 전월 1일 ~ 익월 말일)
  const [rangeMonths, setRangeMonths] = useState(3);

  // 범위 계산 함수
  const calculateRange = useCallback((months: number) => {
    const today = new Date();
    // 전월 1일부터 시작 (1개월 전 확보)
    const beforeMonths = Math.floor(months / 3); // 3개월이면 1개월 전, 6개월이면 2개월 전
    const afterMonths = months - beforeMonths - 1; // 나머지는 미래

    const start = new Date(
      today.getFullYear(),
      today.getMonth() - beforeMonths,
      1,
      0,
      0,
      0,
      0,
    );
    const end = new Date(
      today.getFullYear(),
      today.getMonth() + afterMonths + 1,
      0, // 말일
      0,
      0,
      0,
      0,
    );
    return { start, end };
  }, []);

  // 범위를 state로 관리 (리렌더링을 위해)
  const [rangeStart, setRangeStart] = useState<Date>(
    () => calculateRange(3).start,
  );
  const [rangeEnd, setRangeEnd] = useState<Date>(() => calculateRange(3).end);

  // onAction 핸들러: extendLockIfNeeded + closeTreeContextMenu
  const handleOnAction = useCallback(
    (action?: { type?: string }) => {
      extendLockIfNeeded();
      if (action?.type === "closeTreeContextMenu") {
        treePanelRef.current?.closeContextMenu();
      }
    },
    [extendLockIfNeeded],
  );

  // rangeMonths 변경 시 범위 업데이트 (0은 커스텀 모드이므로 무시)
  useEffect(() => {
    if (rangeMonths === 0) return; // 커스텀 모드에서는 calculateRange 호출하지 않음
    const { start, end } = calculateRange(rangeMonths);
    setRangeStart(start);
    setRangeEnd(end);
  }, [rangeMonths, calculateRange]);

  // 상태 지속성 (localStorage + URL 동기화)
  const { isInitialized: isPersistenceInitialized, hasExpandedInSource } = useGanttPersistence({
    workspaceId,
    expandedNodes,
    rangeMonths,
    rangeStart,
    rangeEnd,
    onExpandedNodesChange: setExpandedNodes,
    onRangeMonthsChange: setRangeMonths,
    onRangeStartChange: setRangeStart,
    onRangeEndChange: setRangeEnd,
    autoShorten: true,
    shortenThreshold: 2000,
  });

  // selectedFlagId 변경 시 URL 업데이트 (history API 사용 - 서버 재실행 방지)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams(searchParams.toString());
    const currentFlagId = params.get("flagId");
    
    // 이미 동일한 상태면 스킵 (무한 루프 방지)
    if (selectedFlagId === currentFlagId) return;
    if (!selectedFlagId && !currentFlagId) return;
    
    if (selectedFlagId) {
      params.set("flagId", selectedFlagId);
    } else {
      params.delete("flagId");
    }
    // window.history.replaceState 사용 - 서버 컴포넌트 재실행 방지
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  }, [selectedFlagId, searchParams]);

  // 초기 로드 시 URL에서 flagId 읽어오기
  const hasInitializedFlagRef = useRef(false);
  useEffect(() => {
    if (hasInitializedFlagRef.current) return;
    const urlFlagId = searchParams.get("flagId");
    if (urlFlagId && flags.length > 0) {
      const flagExists = flags.some(
        (f) => f.clientId === urlFlagId && !f.deleted,
      );
      if (flagExists && selectedFlagId !== urlFlagId) {
        selectFlag(urlFlagId);
        hasInitializedFlagRef.current = true;
      } else if (!flagExists && selectedFlagId === urlFlagId) {
        // URL에 있지만 실제 flag가 없는 경우 선택 해제
        selectFlag(null);
        hasInitializedFlagRef.current = true;
      } else if (!urlFlagId) {
        hasInitializedFlagRef.current = true;
      }
    } else if (!urlFlagId) {
      hasInitializedFlagRef.current = true;
    }
  }, [flags, selectedFlagId, searchParams, selectFlag]);

  // Figma OAuth 콜백 처리 (history API 사용 - 서버 재실행 방지)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const params = new URLSearchParams(searchParams.toString());

    if (params.get("figma_success")) {
      showToast(
        "success",
        "Figma 연동 완료",
        "이제 Gantt 차트를 Figma/FigJam에 업로드할 수 있습니다.",
      );
      // URL에서 파라미터 제거
      params.delete("figma_success");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }

    if (params.get("figma_error")) {
      const errorMap: Record<string, string> = {
        invalid_state: "보안 검증 실패",
        server_error: "서버 오류",
        access_denied: "연동 거부",
      };
      const error = params.get("figma_error")!;
      showToast("error", "Figma 연동 실패", errorMap[error] || error);
      // URL에서 파라미터 제거
      params.delete("figma_error");
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, "", newUrl);
    }
  }, [searchParams]);

  // 초기 데이터 로드
  useEffect(() => {
    if (initialPlans.length === 0) {
      return;
    }

    const rowMap = new Map<string, DraftRow>();
    const loadedBars: DraftBar[] = [];

    for (const plan of initialPlans) {
      const rowId = createRowId(plan.project, plan.module, plan.feature);

      if (!rowMap.has(rowId)) {
        // 서버에서 받은 orderIndex 사용 (없으면 현재 row 수 기준)
        rowMap.set(rowId, {
          rowId,
          project: plan.project,
          module: plan.module,
          feature: plan.feature,
          domain: plan.domain,
          orderIndex: plan.orderIndex ?? rowMap.size,
          expanded: true,
        });
      }

      loadedBars.push({
        clientUid: plan.clientUid,
        rowId,
        serverId: plan.id,
        title: plan.title,
        stage: plan.stage,
        status: plan.status as PlanStatus,
        startDate: plan.startDate,
        endDate: plan.endDate,
        assignees: (plan.assignees || []).map((a) => ({
          userId: a.userId,
          role: a.role as "planner" | "designer" | "fe" | "be" | "qa",
          displayName: a.displayName,
        })),
        description: plan.description,
        links: plan.links,
        preferredLane: plan.laneHint, // 서버에서 로드된 레인 힌트
        dirty: false,
        deleted: false,
        createdAtLocal: new Date().toISOString(),
        updatedAtLocal: new Date().toISOString(),
        // Snapshot 전용 필드
        isSnapshot: plan.isSnapshot,
        avgProgress: plan.avgProgress,
        metaKey: plan.metaKey,
        year: plan.year,
        week: plan.week,
        authorName: plan.authorName,
        authorId: plan.authorId,
        past_week: plan.past_week,
        this_week: plan.this_week,
        collaborators: plan.collaborators,
        risks: plan.risks,
        risk_level: plan.risk_level,
        // Alignment 필드
        alignmentStatus: plan.alignmentStatus,
        alignmentActualCount: plan.alignmentActualCount,
        alignmentExpectedCount: plan.alignmentExpectedCount,
        alignmentDebugInfo: plan.alignmentDebugInfo,
      });
    }

    // orderIndex 순서대로 정렬된 rows 생성
    const sortedRows = Array.from(rowMap.values()).sort(
      (a, b) => a.orderIndex - b.orderIndex,
    );

    hydrate(sortedRows, loadedBars);
  }, [initialPlans, hydrate]);

  // 초기 로드 시 트리를 '기능까지 보기' 상태로 펼치기
  // 단, URL/localStorage에 expanded가 있으면 해당 상태 우선 (덮어쓰지 않음)
  // useGanttPersistence가 초기화 완료된 후에 실행하여 타이밍 문제 방지
  const hasInitializedExpandRef = useRef(false);
  useEffect(() => {
    // useGanttPersistence 초기화가 완료될 때까지 대기
    if (!isPersistenceInitialized) return;
    // rows가 로드될 때까지 대기
    if (rows.length === 0) return;
    // 이미 초기화된 경우 스킵
    if (hasInitializedExpandRef.current) return;
    
    hasInitializedExpandRef.current = true;
    
    // URL/localStorage에 expanded가 있으면 초기 펼침 로직 건너뛰기
    if (!hasExpandedInSource) {
      expandToLevel(1);
    }
  }, [isPersistenceInitialized, rows.length, hasExpandedInSource, expandToLevel]);

  // 마지막 업데이트 시각 토스트 표시 (페이지 진입 시 한 번만)
  const hasShownToastRef = useRef(false);
  useEffect(() => {
    if (maxUpdatedAt && readOnly && !hasShownToastRef.current) {
      hasShownToastRef.current = true;
      const relativeTime = formatRelativeTime(maxUpdatedAt);
      const byText = updatedByName ? ` by ${updatedByName}` : "";
      showToast("info", "Plans updated", `${relativeTime}${byText}`);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // CommandPalette 콜백들을 useCallback으로 메모이제이션
  const handleStartEditing = useCallback(async () => {
    const success = await startEditing();
    if (success) {
      showToast(
        "success",
        "편집 모드 시작",
        "정상적으로 편집 환경을 점유하였습니다.\n다른 사용자에게는 사용자님의 이름이 노출됩니다.",
      );
    } else {
      const currentLockState = useDraftStore.getState().ui.lockState;
      if (currentLockState?.isLocked && !currentLockState?.isMyLock) {
        showToast(
          "warning",
          "편집할 수 없음",
          `현재 ${
            currentLockState.lockedByName || "다른 사용자"
          }님이 작업 중입니다.`,
        );
      } else {
        showToast(
          "error",
          "작업을 시작할 수 없습니다",
          "네트워크 상태를 확인하고 다시 시도해주세요.",
        );
      }
    }
    return success;
  }, [startEditing]);

  const handleStopEditing = useCallback(async () => {
    // 현재 변경사항 개수 계산
    const dirtyBars = getDirtyBars();
    const deletedBars = getDeletedBars();
    const dirtyFlags = getDirtyFlags();
    const deletedFlags = getDeletedFlags();
    const countToDiscard =
      dirtyBars.length +
      deletedBars.length +
      dirtyFlags.length +
      deletedFlags.length;

    // 변경사항 폐기
    discardAllChanges();
    await stopEditing();

    // 토스트 메시지 표시
    if (countToDiscard > 0) {
      showToast(
        "info",
        "작업 종료",
        `${countToDiscard}개의 변경사항이 모두 폐기되었습니다.`,
      );
    } else {
      showToast("success", "작업 종료", "작업이 정상적으로 종료되었습니다.");
    }

    // 페이지 새로고침 (서버 데이터 동기화)
    // router.refresh()는 비동기이고 즉시 실행되지 않을 수 있으므로
    // 강제로 페이지를 새로고침하여 최신 데이터를 확실히 불러옴
    window.location.reload();
  }, [
    getDirtyBars,
    getDeletedBars,
    getDirtyFlags,
    getDeletedFlags,
    discardAllChanges,
    stopEditing,
  ]);

  const handleOpenHelp = useCallback(() => {
    setShowHelp(true);
  }, []);

  const handleAddRow = useCallback(() => {
    setShowAddRowModal(true);
  }, []);

  const handleCustomRangeChange = useCallback((start: Date, end: Date) => {
    setRangeMonths(0);
    setRangeStart(start);
    setRangeEnd(end);
  }, []);

  const handleCloseCommandPalette = useCallback(() => {
    setShowCommandPalette(false);
  }, []);

  // 커밋 핸들러 - Toast 기반 저장 (useSaveQueue 사용)
  const handleCommit = useCallback(async () => {
    await requestSave();
  }, [requestSave]);

  // 자동 저장 트리거 (정확히 90초 비활성 시)
  const lastAutoSaveRef = useRef<number>(0);

  useEffect(() => {
    if (!autoSaveEnabled || !isMyLock) return;
    // 90초 미만일 때는 스킵
    if (inactivitySeconds === null || inactivitySeconds < 90) return;
    if (isSaving || isAutoSaving) return;

    // 마지막 자동 저장으로부터 최소 90초 경과 확인 (중복 방지)
    const now = Date.now();
    if (now - lastAutoSaveRef.current < 90000) return;

    lastAutoSaveRef.current = now;
    handleAutoSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    autoSaveEnabled,
    isMyLock,
    inactivitySeconds,
    isSaving,
    isAutoSaving,
  ]);

  // 조용한 자동 저장 (requestSave 사용)
  const handleAutoSave = useCallback(async () => {
    if (isSaving || isAutoSaving) return;

    const dirtyBars = getDirtyBars();
    const deletedBars = getDeletedBars();
    const allBars = [...dirtyBars, ...deletedBars];

    const dirtyFlags = getDirtyFlags();
    const deletedFlags = getDeletedFlags();
    const allFlags = [...dirtyFlags, ...deletedFlags];

    // 변경사항이 없으면 타이머만 리셋하고 종료
    if (allBars.length === 0 && allFlags.length === 0) {
      recordActivity();
      return;
    }

    setIsAutoSaving(true);

    try {
      // requestSave를 사용하여 저장 (Toast로 진행 표시)
      await requestSave();
      
      // 성공 플래그 설정 (체크 아이콘 표시용)
      setAutoSaveSuccess(true);
      // 1.5초 후 플래그 해제
      setTimeout(() => {
        setAutoSaveSuccess(false);
      }, 1500);
    } catch (err) {
      showToast("error", "자동 저장 오류", "수동으로 저장해주세요.");
    } finally {
      setIsAutoSaving(false);
      // 자동 저장 완료 후 타이머 즉시 리셋
      recordActivity();
    }
  }, [
    isSaving,
    isAutoSaving,
    getDirtyBars,
    getDeletedBars,
    getDirtyFlags,
    getDeletedFlags,
    requestSave,
    recordActivity,
  ]);

  // 변경사항 폐기 핸들러 (토스트는 onStopSuccess에서 처리)
  const handleDiscardChanges = useCallback(() => {
    discardAllChanges();
  }, [discardAllChanges]);

  // Export 핸들러
  const ganttContainerRef = useRef<HTMLDivElement>(null);

  const handleExportJSON = useCallback(async () => {
    try {
      const metadata: Partial<ExportMetadata> = {
        pageInfo: {
          title: title || "Plans Gantt",
          url: window.location.href,
        },
        filters: {
          stages: Array.from(selectedStages),
          assignees: Array.from(selectedAssignees),
          viewMode,
        },
      };

      // 현재 필터된 데이터 추출
      const exportData = {
        rows,
        bars: bars.filter((b) => !b.deleted),
        flags,
        members,
      };

      await exportJSON(exportData, metadata, {
        filename: `gantt-export-${Date.now()}`,
      });

      showToast("success", "JSON Export 완료", "파일이 다운로드되었습니다.");
    } catch (error) {
      showToast(
        "error",
        "Export 실패",
        error instanceof Error ? error.message : "알 수 없는 오류",
      );
    }
  }, [
    title,
    selectedStages,
    selectedAssignees,
    viewMode,
    rows,
    bars,
    flags,
    members,
  ]);

  const handleExportPNG = useCallback(
    async (
      quality: "low" | "normal" | "high" = "normal",
      options?: { returnBlob?: boolean },
    ): Promise<Blob | void> => {
      const qualityLabels = {
        low: "저품질",
        normal: "기본",
        high: "고품질",
      };

      // returnBlob 모드일 때는 토스트 없이 실행
      const toastId = options?.returnBlob
        ? null
        : showLoadingToast(
            `PNG 생성 중 (${qualityLabels[quality]})`,
            "잠시만 기다려주세요...",
          );

      try {
        // ganttContainerRef 사용 (Timeline만, Header 제외)
        if (!ganttContainerRef.current) {
          throw new Error("Export 컨테이너를 찾을 수 없습니다.");
        }

        const result = await exportPNG(ganttContainerRef.current, {
          filename: `gantt-screenshot-${Date.now()}`,
          quality,
          pngOptions: {
            backgroundColor: "#ffffff",
          },
          returnBlob: options?.returnBlob,
        });

        // returnBlob 모드일 때는 Blob 반환
        if (options?.returnBlob) {
          return result as Blob;
        }

        // 성공으로 업데이트
        if (toastId) {
          updateToastToSuccess(
            toastId,
            "PNG Export 완료",
            "이미지가 다운로드되었습니다.",
          );
        }
      } catch (error) {
        // returnBlob 모드일 때는 에러 throw
        if (options?.returnBlob) {
          throw error;
        }

        // 에러로 업데이트
        if (toastId) {
          updateToastToError(
            toastId,
            "Export 실패",
            error instanceof Error ? error.message : "알 수 없는 오류",
          );
        }
      }
    },
    [],
  );

  const handleExportDraw = useCallback(
    async (
      quality: "low" | "normal" | "high" = "normal",
      canvasOptions?: CanvasOptions,
      options?: { returnBlob?: boolean },
    ): Promise<Blob | void> => {
      const qualityLabels = {
        low: "저품질",
        normal: "기본",
        high: "고품질",
      };

      // returnBlob 모드일 때는 토스트 없이 실행
      const toastId = options?.returnBlob
        ? null
        : showLoadingToast(
            `PNG Draw 생성 중 (${qualityLabels[quality]})`,
            "Canvas로 정밀하게 렌더링 중...",
          );

      try {
        // ganttContainerRef 사용 (Timeline만, Header 제외)
        if (!ganttContainerRef.current) {
          throw new Error("Export 컨테이너를 찾을 수 없습니다.");
        }

        // JSON Export와 동일한 데이터 구조 생성
        const ganttData: GanttCanvasData = {
          rows,
          bars: bars.filter((b) => !b.deleted),
          flags,
          timeline: {
            rangeStart: rangeStart,
            rangeEnd: rangeEnd,
          },
          layout: {
            treePanelWidth: 300,
            rowHeight: ROW_HEIGHT,
            dayWidth: 24,
          },
        };

        const result = await exportPNGWithCanvas(
          ganttContainerRef.current,
          ganttData,
          {
            filename: `gantt-draw-${Date.now()}`,
            quality,
            pngOptions: {
              backgroundColor: "#ffffff",
            },
            canvasOptions,
            returnBlob: options?.returnBlob,
          },
        );

        // returnBlob 모드일 때는 Blob 반환
        if (options?.returnBlob) {
          return result as Blob;
        }

        // 성공으로 업데이트
        if (toastId) {
          updateToastToSuccess(
            toastId,
            "PNG Draw Export 완료",
            "이미지가 다운로드되었습니다.",
          );
        }
      } catch (error) {
        // returnBlob 모드일 때는 에러 throw
        if (options?.returnBlob) {
          throw error;
        }

        // 에러로 업데이트
        if (toastId) {
          updateToastToError(
            toastId,
            "Export 실패",
            error instanceof Error ? error.message : "알 수 없는 오류",
          );
        }
      }
    },
    [rows, bars, flags, rangeStart, rangeEnd],
  );

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (isEditing && hasUnsavedChanges) {
          handleCommit();
        }
        return;
      }

      // 작업 시작 (Cmd/Ctrl + Enter)
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isEditing) {
          handleStartEditing();
        }
        return;
      }

      // 작업 종료 (Cmd/Ctrl + Shift + Enter)
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "Enter") {
        e.preventDefault();
        if (isEditing) {
          handleStopEditing();
        }
        return;
      }

      // Undo/Redo
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          if (canRedo) redo();
        } else {
          e.preventDefault();
          if (canUndo) undo();
        }
        return;
      }

      // 복제 (Cmd/Ctrl + D)
      if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        const selectedBarId = useDraftStore.getState().ui.selectedBarId;
        if (isEditing && selectedBarId) {
          useDraftStore.getState().duplicateBar(selectedBarId);
        }
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isEditing,
    hasUnsavedChanges,
    handleCommit,
    handleStartEditing,
    handleStopEditing,
    canUndo,
    canRedo,
    undo,
    redo,
  ]);

  // 페이지 이탈 시 락 해제
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isEditing) {
        fetch("/api/release-lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
          keepalive: true,
        }).catch(() => {});
      }

      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "저장되지 않은 변경 사항이 있습니다.";
        return e.returnValue;
      }
    };

    const handlePageHide = () => {
      if (isEditing) {
        fetch("/api/release-lock", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [hasUnsavedChanges, isEditing, workspaceId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
        <div className="flex flex-col items-center gap-4">
          {/* 로고 스피너 */}
          <div className="relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.3)",
              }}
            >
              <span className="text-2xl font-bold text-white">G</span>
            </div>
            <div
              className="absolute -inset-2 rounded-3xl animate-spin"
              style={{
                border: "2px solid transparent",
                borderTopColor: "#3b82f6",
                borderRightColor: "#8b5cf6",
              }}
            />
          </div>
          <p className="text-sm text-gray-500 font-medium animate-pulse">
            계획 데이터를 불러오는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col bg-white ${
        isHeaderHidden ? "fixed inset-0 z-40" : "h-full"
      }`}
    >
      {/* 헤더 - Airbnb 스타일 (보조 액션 포함) */}
      {!isHeaderHidden && (
        <GanttHeader
          workspaceId={workspaceId}
          onCommit={handleCommit}
          isCommitting={isSaving}
          onDiscardChanges={handleDiscardChanges}
          // 읽기 전용 모드
          readOnly={readOnly}
          title={title}
          description={description}
          // 필터
          selectedStages={selectedStages}
          onStagesChange={onStagesChange}
          selectedAssignees={selectedAssignees}
          onAssigneesChange={onAssigneesChange}
          members={members}
          isFilterLoading={isFilterLoading}
          // 마지막 업데이트 시각
          maxUpdatedAt={maxUpdatedAt}
          updatedByName={updatedByName}
          // Alignment 커버리지 검토
          enableAlignmentCheck={enableAlignmentCheck}
          onEnableAlignmentCheckChange={onEnableAlignmentCheckChange}
          mismatches={mismatches}
          onFocusMismatch={onFocusMismatch}
          // 중앙 액션 props
          onUndo={undo}
          onRedo={redo}
          onOpenCommandPalette={() => setShowCommandPalette(true)}
          onOpenHelp={readOnly ? undefined : () => setShowHelp(true)}
          canUndo={canUndo}
          canRedo={canRedo}
          dragInfo={dragDateInfo}
          // 기간 범위 props
          rangeMonths={rangeMonths}
          onRangeMonthsChange={setRangeMonths}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onCustomRangeChange={(start, end) => {
            setRangeMonths(0); // 커스텀 범위 사용 시 기본 기간 선택 해제
            setRangeStart(start);
            setRangeEnd(end);
          }}
          onToggleHeader={handleToggleHeader}
          autoSaveEnabled={autoSaveEnabled}
          onAutoSaveChange={handleAutoSaveChange}
          isAutoSaving={isAutoSaving}
          autoSaveSuccess={autoSaveSuccess}
          inactivitySeconds={inactivitySeconds}
          // 뷰 모드 변경 콜백
          onViewModeChangeStart={handleViewModeChangeStart}
          onViewModeChange={onViewModeChange}
          // 데이터 새로고침
          onRefreshData={onRefreshData}
          isRefreshing={isRefreshing}
          // Export 핸들러
          onExportJSON={handleExportJSON}
          onExportPNG={handleExportPNG}
          onExportDraw={handleExportDraw}
          isAlignmentPage={isAlignmentPage}
          onLockError={(type, lockedByName) => {
            if (type === "locked_by_other") {
              showToast(
                "warning",
                "편집할 수 없음",
                `현재 ${
                  lockedByName || "다른 사용자"
                }님이 작업 중입니다. 헤더의 락 상태를 확인하거나, 잠시 후 다시 시도해주세요.`,
              );
            } else {
              showToast(
                "error",
                "작업을 시작할 수 없습니다",
                "네트워크 상태를 확인하고 새로고침 후 다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요.",
              );
            }
          }}
          onStartSuccess={() => {
            showToast(
              "success",
              "편집 모드 시작",
              "정상적으로 편집 환경을 점유하였습니다.\n다른 사용자에게는 사용자님의 이름이 노출됩니다.",
            );
          }}
          onStopSuccess={(discardedCount) => {
            if (discardedCount > 0) {
              showToast(
                "info",
                "작업 종료",
                `${discardedCount}개의 변경사항이 모두 폐기되었습니다.`,
              );
            } else {
              showToast(
                "success",
                "작업 종료",
                "작업이 정상적으로 종료되었습니다.",
              );
            }
          }}
        />
      )}

      {/* Floating 복원 버튼 (Header 숨김 시) */}
      {isHeaderHidden && (
        <button
          onClick={(e) => handleToggleHeader(e)}
          className="fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all hover:shadow-xl active:scale-95"
          style={{
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          }}
          title="헤더 보이기 (👁️)"
        >
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </button>
      )}

      {/* 메인 영역 - border 없이 꽉 차게 */}
      <div
        ref={ganttContainerRef}
        className="flex flex-1 overflow-hidden bg-white relative"
      >
        {/* 필터 로딩 & 뷰 모드 전환 스켈레톤 (테이블 영역만) */}
        {(isFilterLoading ||
          isViewModeChanging ||
          isInternalViewModeChanging) && (
          <GanttSkeleton
            type={viewMode === "summarized" ? "summarized" : "detailed"}
          />
        )}

        {/* 모바일: 트리 패널 토글 버튼 (readOnly일 때는 숨김) */}
        {isMobile && !readOnly && (
          <button
            onClick={() => setShowMobileTree(true)}
            className="fixed bottom-20 left-4 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-200 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              boxShadow: "0 4px 14px rgba(59, 130, 246, 0.4)",
            }}
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
          </button>
        )}

        {/* 모바일: 트리 패널 슬라이드 오버 */}
        {isMobile && showMobileTree && (
          <>
            {/* 배경 오버레이 */}
            <div
              className="fixed inset-0 bg-black/40 z-[60] transition-opacity"
              onClick={() => setShowMobileTree(false)}
            />
            {/* 슬라이드 패널 */}
            <div
              className="fixed inset-y-0 left-0 w-[85%] max-w-sm z-[70] bg-white shadow-2xl transform transition-transform duration-300"
              style={{
                boxShadow: "4px 0 24px rgba(0, 0, 0, 0.15)",
              }}
            >
              {/* 닫기 버튼 */}
              <button
                onClick={() => setShowMobileTree(false)}
                className="absolute top-3 right-3 p-2 rounded-lg hover:bg-gray-100 transition-colors z-10"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <DraftTreePanel
                isEditing={isEditing}
                filterOptions={{
                  projects: [...new Set(rows.map((r) => r.project))],
                  modules: [...new Set(rows.map((r) => r.module))],
                  features: [...new Set(rows.map((r) => r.feature))],
                  stages: [...new Set(bars.map((b) => b.stage))],
                }}
                showAddRowModal={showAddRowModal}
                onShowAddRowModal={setShowAddRowModal}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                workspaceId={workspaceId}
                timelineScrollbarHeight={timelineScrollbarHeight}
                highlightedRowId={highlightedRowId}
              />
            </div>
          </>
        )}

        {/* PC: 좌측 Tree (기존) */}
        {!isMobile && (
          <DraftTreePanel
            ref={treePanelRef}
            isEditing={isEditing}
            filterOptions={{
              projects: [...new Set(rows.map((r) => r.project))],
              modules: [...new Set(rows.map((r) => r.module))],
              features: [...new Set(rows.map((r) => r.feature))],
              stages: [...new Set(bars.map((b) => b.stage))],
            }}
            showAddRowModal={showAddRowModal}
            onShowAddRowModal={setShowAddRowModal}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            workspaceId={workspaceId}
            scrollTop={commonScrollTop}
            onScroll={setCommonScrollTop}
            timelineScrollbarHeight={timelineScrollbarHeight}
            highlightedRowId={highlightedRowId}
          />
        )}

        {/* 우측 Timeline */}
        <DraftTimeline
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          isEditing={isEditing}
          isAdmin={true}
          readOnly={readOnly}
          members={members}
          workspaceId={workspaceId}
          onDragDateChange={setDragDateInfo}
          highlightedRowId={highlightedRowId}
          onAction={handleOnAction}
          scrollTop={commonScrollTop}
          onScrollChange={setCommonScrollTop}
          onScrollbarHeightChange={setTimelineScrollbarHeight}
        />
      </div>

      {/* Command Palette */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={handleCloseCommandPalette}
        onStartEditing={handleStartEditing}
        onStopEditing={handleStopEditing}
        onCommit={handleCommit}
        onOpenHelp={handleOpenHelp}
        onAddRow={handleAddRow}
        isEditing={isEditing}
        canEdit={canEdit}
        readOnly={readOnly}
        rangeMonths={rangeMonths}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onRangeMonthsChange={setRangeMonths}
        onCustomRangeChange={handleCustomRangeChange}
      />

      {/* Help Modal */}
      <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

      {/* Toast Container (sonner) */}
      <ToastContainer />
    </div>
  );
});
