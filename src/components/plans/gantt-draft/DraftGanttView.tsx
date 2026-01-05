/**
 * Draft Gantt View - Airbnb Style
 * - 메인 컨테이너
 * - 좌측 Tree + 우측 Timeline
 * - 하단 FloatingDock (보조 액션)
 * - Toast 알림
 */

"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDraftStore, createRowId } from "./store";
import { useLock } from "./useLock";
import { DraftTreePanel } from "./DraftTreePanel";
import { DraftTimeline } from "./DraftTimeline";
import { GanttHeader } from "./GanttHeader";
import { CommandPalette } from "./CommandPalette";
import { HelpModal } from "./HelpModal";
// FloatingDock은 GanttHeader로 통합됨
import { showToast, ToastContainer } from "./Toast";
import { SaveProgressModal, SaveStep, LogEntry } from "./SaveProgressModal";
import { commitFeaturePlans, commitFlags } from "./commitService";
import type { DraftRow, DraftBar, PlanStatus } from "./types";
import type { WorkspaceMemberOption } from "./CreatePlanModal";
import { formatRelativeTime } from "@/lib/utils/relativeTime";
import { GanttSkeleton } from "./GanttSkeleton";

interface InitialAssignee {
  userId: string;
  role: string;
  displayName?: string;
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
}

interface DraftGanttViewProps {
  workspaceId: string;
  initialPlans?: InitialPlan[];
  members?: WorkspaceMemberOption[];
  /** 읽기 전용 모드 (작업 시작/저장 불가) */
  readOnly?: boolean;
  /** 헤더 제목 */
  title?: string;
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
  /** Plans 최대 updated_at (마지막 업데이트 시각) */
  maxUpdatedAt?: string;
  /** 마지막 업데이트한 사용자 이름 */
  updatedByName?: string;
}

export function DraftGanttView({
  workspaceId,
  initialPlans = [],
  members = [],
  readOnly = false,
  title,
  selectedStages = new Set(),
  onStagesChange,
  selectedAssignees = new Set(),
  onAssigneesChange,
  isFilterLoading = false,
  maxUpdatedAt,
  updatedByName,
}: DraftGanttViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showAddRowModal, setShowAddRowModal] = useState(false);
  
  // 자동 저장 옵션 (localStorage에서 불러오기)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  
  useEffect(() => {
    try {
      const stored = localStorage.getItem('gantt-auto-save-enabled');
      if (stored === 'true') {
        setAutoSaveEnabled(true);
      }
    } catch {
      // localStorage 접근 실패 시 무시
    }
  }, []);
  
  const handleAutoSaveChange = useCallback((enabled: boolean) => {
    setAutoSaveEnabled(enabled);
    try {
      localStorage.setItem('gantt-auto-save-enabled', enabled ? 'true' : 'false');
      if (enabled) {
        showToast("success", "자동 저장 활성화", "90초 이상 비활성 시 자동으로 저장됩니다.");
      } else {
        showToast("info", "자동 저장 비활성화", "수동으로만 저장됩니다.");
      }
    } catch {
      // localStorage 접근 실패 시 무시
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
  const handleToggleHeader = useCallback((e?: React.MouseEvent) => {
    // 이벤트 전파 방지 (편집 모드 종료 방지)
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    setIsHeaderHidden((prev) => !prev);
    // GNB도 함께 숨기기/보이기
    const gnb = document.querySelector('header[class*="sticky top-0"]') as HTMLElement;
    if (gnb) {
      gnb.style.display = isHeaderHidden ? '' : 'none';
    }
  }, [isHeaderHidden]);

  // 저장 진행 상태 모달
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveSteps, setSaveSteps] = useState<SaveStep[]>([]);
  const [saveComplete, setSaveComplete] = useState(false);

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
        "10분간 활동이 없어 편집 모드가 자동 종료되었습니다."
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
      0
    );
    const end = new Date(
      today.getFullYear(),
      today.getMonth() + afterMonths + 1,
      0, // 말일
      0,
      0,
      0,
      0
    );
    return { start, end };
  }, []);

  // 범위를 state로 관리 (리렌더링을 위해)
  const [rangeStart, setRangeStart] = useState<Date>(
    () => calculateRange(3).start
  );
  const [rangeEnd, setRangeEnd] = useState<Date>(() => calculateRange(3).end);

  // rangeMonths 변경 시 범위 업데이트 (0은 커스텀 모드이므로 무시)
  useEffect(() => {
    if (rangeMonths === 0) return; // 커스텀 모드에서는 calculateRange 호출하지 않음
    const { start, end } = calculateRange(rangeMonths);
    setRangeStart(start);
    setRangeEnd(end);
  }, [rangeMonths, calculateRange]);

  // selectedFlagId 변경 시 URL 업데이트
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedFlagId) {
      params.set("flagId", selectedFlagId);
    } else {
      params.delete("flagId");
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [selectedFlagId, router, searchParams]);

  // 초기 로드 시 URL에서 flagId 읽어오기
  const hasInitializedFlagRef = useRef(false);
  useEffect(() => {
    if (hasInitializedFlagRef.current) return;
    const urlFlagId = searchParams.get("flagId");
    if (urlFlagId && flags.length > 0) {
      const flagExists = flags.some((f) => f.clientId === urlFlagId && !f.deleted);
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

  // 초기 데이터 로드
  useEffect(() => {
    if (initialPlans.length === 0) return;

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
        isSnapshot: (plan as any).isSnapshot,
        avgProgress: (plan as any).avgProgress,
        metaKey: (plan as any).metaKey,
        year: (plan as any).year,
        week: (plan as any).week,
        past_week: (plan as any).past_week,
        this_week: (plan as any).this_week,
        collaborators: (plan as any).collaborators,
        risks: (plan as any).risks,
        risk_level: (plan as any).risk_level,
      });
    }

    // orderIndex 순서대로 정렬된 rows 생성
    const sortedRows = Array.from(rowMap.values()).sort(
      (a, b) => a.orderIndex - b.orderIndex
    );

    hydrate(sortedRows, loadedBars);
  }, [initialPlans, hydrate]);

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
        "정상적으로 편집 환경을 점유하였습니다.\n다른 사용자에게는 사용자님의 이름이 노출됩니다."
      );
    } else {
      const currentLockState = useDraftStore.getState().ui.lockState;
      if (currentLockState?.isLocked && !currentLockState?.isMyLock) {
        showToast(
          "warning",
          "편집할 수 없음",
          `현재 ${
            currentLockState.lockedByName || "다른 사용자"
          }님이 작업 중입니다.`
        );
      } else {
        showToast(
          "error",
          "작업을 시작할 수 없습니다",
          "네트워크 상태를 확인하고 다시 시도해주세요."
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
        `${countToDiscard}개의 변경사항이 모두 폐기되었습니다.`
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

  // 커밋 핸들러 - 프로그래스 모달과 함께 Flags/Plans 순차 저장
  const handleCommit = useCallback(async () => {
    // 변경사항 확인
    const dirtyBars = getDirtyBars();
    const deletedBars = getDeletedBars();
    const allBars = [...dirtyBars, ...deletedBars];

    const dirtyFlags = getDirtyFlags();
    const deletedFlags = getDeletedFlags();
    const allFlags = [...dirtyFlags, ...deletedFlags];

    if (allBars.length === 0 && allFlags.length === 0) {
      showToast("info", "변경사항 없음", "저장할 변경사항이 없습니다.");
      return;
    }

    // 저장 단계 초기화
    const steps: SaveStep[] = [];

    if (allFlags.length > 0) {
      steps.push({
        id: "flags",
        label: `Flag 저장 (${allFlags.length}개)`,
        status: "pending",
      });
    }

    if (allBars.length > 0) {
      steps.push({
        id: "plans",
        label: `기능 계획 저장 (${allBars.length}개)`,
        status: "pending",
      });
    }

    setSaveSteps(steps);
    setSaveComplete(false);
    setShowSaveModal(true);
    setIsCommitting(true);

    try {
      // 1. Flags 저장
      if (allFlags.length > 0) {
        setSaveSteps((prev) =>
          prev.map((s) =>
            s.id === "flags" ? { ...s, status: "in_progress" as const } : s
          )
        );

        const flagResult = await commitFlags({
          workspaceId,
          flags: allFlags,
        });

        if (flagResult.success) {
          const flagCount =
            (flagResult.createdCount || 0) +
            (flagResult.updatedCount || 0) +
            (flagResult.deletedCount || 0);

          setSaveSteps((prev) =>
            prev.map((s) =>
              s.id === "flags"
                ? { ...s, status: "success" as const, count: flagCount }
                : s
            )
          );
          clearFlagDirtyFlags();

          // 서버에서 최신 Flag 데이터 다시 불러오기 (serverId 동기화)
          await fetchFlags(workspaceId);
        } else {
          setSaveSteps((prev) =>
            prev.map((s) =>
              s.id === "flags"
                ? { ...s, status: "error" as const, error: flagResult.error }
                : s
            )
          );
        }
      }

      // 2. Plans 저장
      if (allBars.length > 0) {
        // 저장할 항목들을 pending 상태로 미리 표시
        const pendingLogs: LogEntry[] = allBars.map((bar, idx) => ({
          id: `plan-${idx}`,
          type: "pending" as const,
          message: `${bar.deleted ? "삭제" : bar.serverId ? "수정" : "생성"}: ${
            bar.title
          }`,
          timestamp: new Date(),
        }));

        setSaveSteps((prev) =>
          prev.map((s) =>
            s.id === "plans"
              ? { ...s, status: "in_progress" as const, logs: pendingLogs }
              : s
          )
        );

        const payload = {
          workspaceId,
          plans: allBars.map((bar) => {
            const row = rows.find((r) => r.rowId === bar.rowId);
            return {
              clientUid: bar.clientUid,
              serverId: bar.serverId,
              domain: row?.domain,
              project: row?.project || "",
              module: row?.module || "",
              feature: row?.feature || "",
              title: bar.title,
              stage: bar.stage,
              status: bar.status,
              start_date: bar.startDate,
              end_date: bar.endDate,
              assignees: bar.assignees,
              description: bar.description,
              links: bar.links,
              deleted: bar.deleted || false,
              order_index: row?.orderIndex ?? 0, // 트리 순서 저장
              lane_hint: bar.preferredLane, // 레인 위치 저장
            };
          }),
        };

        const planResult = await commitFeaturePlans(payload);

        if (planResult.success) {
          const planCount =
            (planResult.upsertedCount || 0) + (planResult.deletedCount || 0);

          // savedItems를 로그로 변환 (순차적으로 업데이트)
          const successLogs: LogEntry[] = (planResult.savedItems || []).map(
            (item, idx) => ({
              id: `plan-${idx}`,
              type: "success" as const,
              message: `${
                item.action === "insert"
                  ? "생성"
                  : item.action === "update"
                  ? "수정"
                  : "삭제"
              }: ${item.title}`,
              timestamp: new Date(),
            })
          );

          // 순차적으로 로그를 success로 업데이트하는 애니메이션
          for (let i = 0; i < successLogs.length; i++) {
            await new Promise((resolve) => setTimeout(resolve, 30)); // 30ms 딜레이
            setSaveSteps((prev) =>
              prev.map((s) => {
                if (s.id !== "plans") return s;
                const updatedLogs = [...(s.logs || [])];
                if (updatedLogs[i]) {
                  updatedLogs[i] = successLogs[i];
                }
                return { ...s, logs: updatedLogs };
              })
            );
          }

          setSaveSteps((prev) =>
            prev.map((s) =>
              s.id === "plans"
                ? { ...s, status: "success" as const, count: planCount }
                : s
            )
          );
          clearDirtyFlags();
        } else {
          setSaveSteps((prev) =>
            prev.map((s) =>
              s.id === "plans"
                ? { ...s, status: "error" as const, error: planResult.error }
                : s
            )
          );
        }
      }
    } catch (err) {
      console.error("[handleCommit] Error:", err);
      // 현재 진행 중인 단계를 에러로 표시
      setSaveSteps((prev) =>
        prev.map((s) =>
          s.status === "in_progress"
            ? {
                ...s,
                status: "error" as const,
                error:
                  err instanceof Error ? err.message : "알 수 없는 오류 발생",
              }
            : s
        )
      );
    } finally {
      setIsCommitting(false);
      setSaveComplete(true);
    }
  }, [
    workspaceId,
    getDirtyBars,
    getDeletedBars,
    getDirtyFlags,
    getDeletedFlags,
    rows,
    clearDirtyFlags,
    clearFlagDirtyFlags,
    fetchFlags,
  ]);

  // 자동 저장 트리거 (90초 비활성 시)
  const lastAutoSaveRef = useRef<number>(0);
  
  useEffect(() => {
    if (!autoSaveEnabled || !isMyLock || !hasUnsavedChanges) return;
    if (inactivitySeconds === null || inactivitySeconds < 90) return;
    if (isCommitting || isAutoSaving) return;

    // 마지막 자동 저장으로부터 최소 90초 경과 확인 (중복 방지)
    const now = Date.now();
    if (now - lastAutoSaveRef.current < 90000) return;

    lastAutoSaveRef.current = now;
    handleAutoSave();
  }, [autoSaveEnabled, isMyLock, hasUnsavedChanges, inactivitySeconds, isCommitting, isAutoSaving]);

  // 조용한 자동 저장 (모달 없이)
  const handleAutoSave = useCallback(async () => {
    if (!hasUnsavedChanges || isCommitting || isAutoSaving) return;

    const dirtyBars = getDirtyBars();
    const deletedBars = getDeletedBars();
    const allBars = [...dirtyBars, ...deletedBars];

    const dirtyFlags = getDirtyFlags();
    const deletedFlags = getDeletedFlags();
    const allFlags = [...dirtyFlags, ...deletedFlags];

    if (allBars.length === 0 && allFlags.length === 0) return;

    setIsAutoSaving(true);

    try {
      let flagSuccess = true;
      let planSuccess = true;

      // 1. Flags 저장
      if (allFlags.length > 0) {
        const flagResult = await commitFlags({
          workspaceId,
          flags: allFlags,
        });

        if (flagResult.success) {
          clearFlagDirtyFlags();
          await fetchFlags(workspaceId);
        } else {
          flagSuccess = false;
        }
      }

      // 2. Plans 저장
      if (allBars.length > 0) {
        const payload = {
          workspaceId,
          plans: allBars.map((bar) => {
            const row = rows.find((r) => r.rowId === bar.rowId);
            return {
              clientUid: bar.clientUid,
              serverId: bar.serverId,
              domain: row?.domain,
              project: row?.project || "",
              module: row?.module || "",
              feature: row?.feature || "",
              title: bar.title,
              stage: bar.stage,
              status: bar.status,
              start_date: bar.startDate,
              end_date: bar.endDate,
              assignees: bar.assignees,
              description: bar.description,
              links: bar.links,
              deleted: bar.deleted || false,
              order_index: row?.orderIndex ?? 0,
              lane_hint: bar.preferredLane,
            };
          }),
        };

        const planResult = await commitFeaturePlans(payload);

        if (planResult.success) {
          clearDirtyFlags();
        } else {
          planSuccess = false;
        }
      }

      if (flagSuccess && planSuccess) {
        showToast("success", "자동 저장 완료", undefined);
        // 자동 저장 완료 후 타이머 리셋
        recordActivity();
      } else {
        showToast("error", "자동 저장 실패", "수동으로 저장해주세요.");
      }
    } catch (err) {
      console.error("[handleAutoSave] Error:", err);
      showToast("error", "자동 저장 오류", "수동으로 저장해주세요.");
    } finally {
      setIsAutoSaving(false);
    }
  }, [
    hasUnsavedChanges,
    isCommitting,
    isAutoSaving,
    getDirtyBars,
    getDeletedBars,
    getDirtyFlags,
    getDeletedFlags,
    workspaceId,
    rows,
    clearDirtyFlags,
    clearFlagDirtyFlags,
    fetchFlags,
    router,
    recordActivity,
  ]);

  // 변경사항 폐기 핸들러 (토스트는 onStopSuccess에서 처리)
  const handleDiscardChanges = useCallback(() => {
    discardAllChanges();
  }, [discardAllChanges]);

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
    <div className={`flex flex-col bg-white ${isHeaderHidden ? 'fixed inset-0 z-40' : 'h-full'}`}>
      {/* 헤더 - Airbnb 스타일 (보조 액션 포함) */}
      {!isHeaderHidden && (
      <GanttHeader
        workspaceId={workspaceId}
        onCommit={handleCommit}
        isCommitting={isCommitting}
        onDiscardChanges={handleDiscardChanges}
        // 읽기 전용 모드
        readOnly={readOnly}
        title={title}
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
        onLockError={(type, lockedByName) => {
          if (type === "locked_by_other") {
            showToast(
              "warning",
              "편집할 수 없음",
              `현재 ${
                lockedByName || "다른 사용자"
              }님이 작업 중입니다. 헤더의 락 상태를 확인하거나, 잠시 후 다시 시도해주세요.`
            );
          } else {
            showToast(
              "error",
              "작업을 시작할 수 없습니다",
              "네트워크 상태를 확인하고 새로고침 후 다시 시도해주세요. 문제가 지속되면 관리자에게 문의하세요."
            );
          }
        }}
        onStartSuccess={() => {
          showToast(
            "success",
            "편집 모드 시작",
            "정상적으로 편집 환경을 점유하였습니다.\n다른 사용자에게는 사용자님의 이름이 노출됩니다."
          );
        }}
        onStopSuccess={(discardedCount) => {
          if (discardedCount > 0) {
            showToast(
              "info",
              "작업 종료",
              `${discardedCount}개의 변경사항이 모두 폐기되었습니다.`
            );
          } else {
            showToast(
              "success",
              "작업 종료",
              "작업이 정상적으로 종료되었습니다."
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
      <div className="flex flex-1 overflow-hidden bg-white relative">
        {/* 필터 로딩 스켈레톤 (테이블 영역만) */}
        {isFilterLoading && <GanttSkeleton />}

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
              />
            </div>
          </>
        )}

        {/* PC: 좌측 Tree (기존) */}
        {!isMobile && (
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
            scrollTop={commonScrollTop}
            onScroll={setCommonScrollTop}
            timelineScrollbarHeight={timelineScrollbarHeight}
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
          onAction={extendLockIfNeeded}
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

      {/* Save Progress Modal */}
      <SaveProgressModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          // 저장 완료 후 페이지 새로고침 (서버 데이터 동기화)
          if (saveComplete) {
            router.refresh();
          }
        }}
        steps={saveSteps}
        isComplete={saveComplete}
      />
    </div>
  );
}
