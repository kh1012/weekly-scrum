"use client";

import { useState, useTransition, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DateRangePicker } from "./DateRangePicker";
import { GanttFilters, defaultGanttFilters, type GanttFilterState } from "./GanttFilters";
import { PlansGanttView } from "./gantt";
import {
  UndoSnackbar,
  CommandPalette,
  CommandIcons,
  useKeyboardShortcuts,
  getModifierKey,
  CreatePlanPopover,
  type CommandItem,
} from "@/components/admin-plans";
import {
  CalendarIcon,
  ShieldIcon,
  EyeIcon,
  SaveIcon,
  GanttIcon,
} from "@/components/common/Icons";
import {
  updatePlanStatusAction,
  createDraftPlanAtCellAction,
  resizePlanAction,
  quickCreatePlanAction,
  createPlanAction,
  movePlanAction,
  updatePlanTitleAction,
  deletePlanAction,
  duplicatePlanAction,
  updatePlanStageAction,
} from "@/lib/actions/plans";
import type { PlansBoardProps, FilterState, GroupByOption } from "./types";
import type { PlanStatus } from "@/lib/data/plans";

/** 삭제 대기 상태 */
interface PendingDelete {
  planId: string;
  planTitle: string;
}

/**
 * 메인 Plans 보드 컴포넌트
 * - mode='readonly': 조회만 가능 (/plans)
 * - mode='admin': CRUD 가능 (/admin/plans)
 * - 키보드 단축키: Delete(삭제), Cmd+D(복제), Cmd+K(커맨드 팔레트)
 */
export function PlansBoard({
  mode,
  initialPlans,
  undatedPlans = [],
  filterOptions,
  members,
  initialMonth,
  initialFilters = {},
}: PlansBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [ganttFilters, setGanttFilters] = useState<GanttFilterState>(defaultGanttFilters);

  // 기간 설정 (기본: 현재 월 기준 3개월)
  const [startMonth, setStartMonth] = useState(() => {
    const [y, m] = initialMonth.split("-").map(Number);
    const start = new Date(y, m - 2, 1); // 1개월 전부터
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const [y, m] = initialMonth.split("-").map(Number);
    const end = new Date(y, m, 1); // 1개월 후까지
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}`;
  });

  // 로컬 스토리지 키
  const STORAGE_KEY = "plans-draft-data";

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 선택된 Plan (간트 뷰에서)
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();

  // 임시 계획 타입
  type DraftPlanItem = {
    tempId: string;
    type: "feature" | "sprint" | "release";
    title: string;
    project?: string;
    module?: string;
    feature?: string;
    stage?: string;
    start_date?: string;
    end_date?: string;
  };

  // 임시 계획 (로컬 스토리지 연동)
  const [draftPlans, setDraftPlans] = useState<DraftPlanItem[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return [];
        }
      }
    }
    return [];
  });

  // draftPlans 변경 시 로컬 스토리지 저장 및 unsaved 상태 업데이트
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (draftPlans.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftPlans));
        setHasUnsavedChanges(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setHasUnsavedChanges(false);
      }
    }
  }, [draftPlans, STORAGE_KEY]);

  // 페이지 이탈 시 경고
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Undo 스낵바 상태
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(
    null
  );
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);

  // 커맨드 팔레트 상태
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const isAdmin = mode === "admin";
  const modKey = getModifierKey();

  // 선택된 Plan 찾기
  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return null;
    return [...initialPlans, ...undatedPlans].find(
      (p) => p.id === selectedPlanId
    );
  }, [selectedPlanId, initialPlans, undatedPlans]);

  // URL 파라미터 빌드 함수
  const buildUrlWithParams = useCallback(
    (newMonth: string, newFilters: FilterState) => {
      const basePath = mode === "admin" ? "/admin/plans" : "/plans";
      const params = new URLSearchParams();

      params.set("month", newMonth);

      if (newFilters.type) params.set("type", newFilters.type);
      if (newFilters.status) params.set("status", newFilters.status);
      if (newFilters.stage) params.set("stage", newFilters.stage);
      if (newFilters.project) params.set("project", newFilters.project);
      if (newFilters.module) params.set("module", newFilters.module);
      if (newFilters.feature) params.set("feature", newFilters.feature);
      if (newFilters.assigneeUserId)
        params.set("assignee", newFilters.assigneeUserId);

      return `${basePath}?${params.toString()}`;
    },
    [mode]
  );

  // 필터 변경
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      startTransition(() => {
        router.push(buildUrlWithParams(startMonth, newFilters));
      });
    },
    [startMonth, buildUrlWithParams, router]
  );

  // 상태 변경
  const handleStatusChange = async (planId: string, status: PlanStatus) => {
    const result = await updatePlanStatusAction(planId, status);
    if (!result.success) {
      alert(result.error || "상태 변경에 실패했습니다.");
    }
    startTransition(() => router.refresh());
  };

  // Stage 변경
  const handleStageChange = async (planId: string, stage: string) => {
    const result = await updatePlanStageAction(planId, stage);
    if (!result.success) {
      alert(result.error || "스테이지 변경에 실패했습니다.");
    }
    startTransition(() => router.refresh());
  };

  // Draft Plan 생성 (셀 클릭)
  const handleCreateDraftAtCell = useCallback(
    async (context: {
      project: string;
      module: string;
      feature: string;
      date: Date;
    }) => {
      const result = await createDraftPlanAtCellAction({
        project: context.project,
        module: context.module,
        feature: context.feature,
        date: context.date.toISOString().split("T")[0],
      });

      if (!result.success) {
        alert(result.error || "생성에 실패했습니다.");
        return;
      }

      startTransition(() => router.refresh());
    },
    [router]
  );

  // 리사이즈
  const handleResizePlan = useCallback(
    async (planId: string, startDate: string, endDate: string) => {
      const result = await resizePlanAction({
        planId,
        start_date: startDate,
        end_date: endDate,
      });

      if (!result.success) {
        alert(result.error || "기간 변경에 실패했습니다.");
        return;
      }

      startTransition(() => router.refresh());
    },
    [router]
  );

  // Quick Create
  const handleQuickCreate = useCallback(
    async (context: {
      project: string;
      module: string;
      feature: string;
      date: Date;
      title: string;
    }) => {
      const result = await quickCreatePlanAction({
        title: context.title,
        project: context.project,
        module: context.module,
        feature: context.feature,
        date: context.date.toISOString().split("T")[0],
      });

      if (!result.success) {
        throw new Error(result.error || "생성에 실패했습니다.");
      }

      startTransition(() => router.refresh());
    },
    [router]
  );

  // Move Plan
  const handleMovePlan = useCallback(
    (planId: string, startDate: string, endDate: string) => {
      movePlanAction(planId, startDate, endDate).then((result) => {
        if (!result.success) {
          alert(result.error || "이동에 실패했습니다.");
        }
        startTransition(() => router.refresh());
      });
    },
    [router]
  );

  // Title Update
  const handleTitleUpdate = useCallback(
    async (planId: string, newTitle: string) => {
      const result = await updatePlanTitleAction(planId, newTitle);

      if (!result.success) {
        throw new Error(result.error || "제목 변경에 실패했습니다.");
      }

      startTransition(() => router.refresh());
    },
    [router]
  );

  // Plan 열기
  const handleOpenPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
    // 더블클릭 시에만 편집 페이지로 이동 (handleSelectPlan에서 처리)
  }, []);

  // Plan 선택 (간트에서)
  const handleSelectPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
  }, []);

  // ===== 임시 계획 (Draft Plan) 관리 =====
  const handleAddDraftPlan = useCallback(
    (type: "feature" | "sprint" | "release", defaultValues?: Partial<typeof draftPlans[0]>) => {
      const tempId = crypto.randomUUID();
      const newDraft = {
        tempId,
        type,
        title: defaultValues?.title || (type === "feature" ? "새 기능" : type === "sprint" ? "새 스프린트" : "새 릴리즈"),
        project: defaultValues?.project || "",
        module: defaultValues?.module || "",
        feature: defaultValues?.feature || "",
        stage: defaultValues?.stage || "컨셉 기획",
      };
      setDraftPlans((prev) => [...prev, newDraft]);
    },
    []
  );

  const handleRemoveDraftPlan = useCallback((tempId: string) => {
    setDraftPlans((prev) => prev.filter((d) => d.tempId !== tempId));
  }, []);

  const handleCreateFromDraft = useCallback(
    async (draft: DraftPlanItem, startDate: string, endDate: string) => {
      const isFeature = draft.type === "feature";
      
      await createPlanAction({
        type: draft.type,
        title: draft.title,
        stage: isFeature ? (draft.stage || "") : "",
        project: isFeature ? (draft.project || "") : undefined,
        module: isFeature ? (draft.module || "") : undefined,
        feature: isFeature ? (draft.feature || "") : undefined,
        start_date: startDate,
        end_date: endDate,
      });

      // 임시 계획 제거
      handleRemoveDraftPlan(draft.tempId);

      // 새로고침
      startTransition(() => {
        router.refresh();
      });
    },
    [router, handleRemoveDraftPlan]
  );

  // ===== 저장하기 (모든 임시 계획을 실제 생성) =====
  const handleSaveAll = useCallback(async () => {
    if (draftPlans.length === 0) return;
    
    setIsSaving(true);
    
    try {
      for (const draft of draftPlans) {
        const isFeature = draft.type === "feature";
        
        await createPlanAction({
          type: draft.type,
          title: draft.title,
          stage: isFeature ? (draft.stage || "") : "",
          project: isFeature ? (draft.project || "") : undefined,
          module: isFeature ? (draft.module || "") : undefined,
          feature: isFeature ? (draft.feature || "") : undefined,
          start_date: draft.start_date,
          end_date: draft.end_date,
        });
      }

      // 임시 데이터 비우기
      setDraftPlans([]);
      localStorage.removeItem(STORAGE_KEY);
      setHasUnsavedChanges(false);

      // 새로고침
      startTransition(() => {
        router.refresh();
      });

      // 토스트 표시 (UndoSnackbar 재활용)
      setPendingDelete({ planId: "", planTitle: `${draftPlans.length}개 계획이 저장되었습니다` });
      setShowUndoSnackbar(true);
      setTimeout(() => setShowUndoSnackbar(false), 3000);
    } catch (error) {
      console.error("Failed to save drafts:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [draftPlans, router, STORAGE_KEY]);

  // ===== STEP C: Fast Delete + Undo =====
  const handleDelete = useCallback(
    (planId: string) => {
      const plan = [...initialPlans, ...undatedPlans].find(
        (p) => p.id === planId
      );
      if (!plan) return;

      // Optimistic: UI에서 즉시 숨김 (실제 삭제는 Undo 타임아웃 후)
      setPendingDelete({ planId, planTitle: plan.title });
      setShowUndoSnackbar(true);
      setSelectedPlanId(undefined);
    },
    [initialPlans, undatedPlans]
  );

  // 실제 삭제 실행 (Undo 타임아웃 후)
  const executeDelete = useCallback(async () => {
    if (!pendingDelete) return;

    const result = await deletePlanAction(pendingDelete.planId);
    if (!result.success) {
      alert(result.error || "삭제에 실패했습니다.");
    }
    setPendingDelete(null);
    startTransition(() => router.refresh());
  }, [pendingDelete, router]);

  // Undo 처리
  const handleUndo = useCallback(() => {
    // 삭제 취소 - pending 상태만 클리어
    setPendingDelete(null);
    setShowUndoSnackbar(false);
  }, []);

  // Undo 스낵바 닫힘 (타임아웃 또는 수동)
  const handleUndoClose = useCallback(() => {
    setShowUndoSnackbar(false);
    // 실제 삭제 실행
    executeDelete();
  }, [executeDelete]);

  // ===== STEP D: Duplicate =====
  const handleDuplicate = useCallback(
    async (planId: string) => {
      const result = await duplicatePlanAction(planId);
      if (!result.success) {
        alert(result.error || "복제에 실패했습니다.");
        return;
      }
      startTransition(() => router.refresh());
    },
    [router]
  );

  // ===== STEP E: Command Palette =====
  const handleCommandPalette = useCallback(() => {
    setShowCommandPalette(true);
  }, []);

  const handleEscape = useCallback(() => {
    setSelectedPlanId(undefined);
    setShowCommandPalette(false);
  }, []);

  // 키보드 단축키 등록
  useKeyboardShortcuts({
    selectedPlanId,
    enabled: isAdmin,
    onDelete: handleDelete,
    onDuplicate: handleDuplicate,
    onCommandPalette: handleCommandPalette,
    onEscape: handleEscape,
  });

  // 커맨드 팔레트 명령어 목록
  const commands: CommandItem[] = useMemo(
    () => [
      {
        id: "new-plan",
        label: "새 계획 생성",
        description: "새 계획 등록 페이지로 이동",
        icon: CommandIcons.Plus,
        action: () => router.push("/admin/plans/new"),
      },
      {
        id: "delete",
        label: "선택된 계획 삭제",
        description: "Delete 또는 Backspace로도 삭제 가능",
        icon: CommandIcons.Trash,
        shortcut: "Del",
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleDelete(selectedPlanId);
        },
      },
      {
        id: "duplicate",
        label: "선택된 계획 복제",
        description: "1주일 뒤로 복사됩니다",
        icon: CommandIcons.Duplicate,
        shortcut: `${modKey}+D`,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleDuplicate(selectedPlanId);
        },
      },
      {
        id: "status-progress",
        label: "상태: 진행중",
        icon: CommandIcons.Status,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleStatusChange(selectedPlanId, "진행중");
        },
      },
      {
        id: "status-complete",
        label: "상태: 완료",
        icon: CommandIcons.Status,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleStatusChange(selectedPlanId, "완료");
        },
      },
      {
        id: "status-hold",
        label: "상태: 보류",
        icon: CommandIcons.Status,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleStatusChange(selectedPlanId, "보류");
        },
      },
      {
        id: "stage-concept",
        label: "스테이지: 컨셉 기획",
        icon: CommandIcons.Stage,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleStageChange(selectedPlanId, "컨셉 기획");
        },
      },
      {
        id: "stage-design",
        label: "스테이지: 설계",
        icon: CommandIcons.Stage,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleStageChange(selectedPlanId, "설계");
        },
      },
      {
        id: "stage-dev",
        label: "스테이지: 개발",
        icon: CommandIcons.Stage,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleStageChange(selectedPlanId, "개발");
        },
      },
      {
        id: "stage-test",
        label: "스테이지: 테스트",
        icon: CommandIcons.Stage,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId) handleStageChange(selectedPlanId, "테스트");
        },
      },
      {
        id: "edit",
        label: "선택된 계획 편집",
        description: "편집 페이지로 이동",
        icon: CommandIcons.User,
        requiresSelection: true,
        action: () => {
          if (selectedPlanId)
            router.push(`/admin/plans/${selectedPlanId}/edit`);
        },
      },
    ],
    [
      modKey,
      selectedPlanId,
      handleDelete,
      handleDuplicate,
      handleStatusChange,
      handleStageChange,
      router,
    ]
  );

  // 날짜 범위 계산 (DateRangePicker에서 선택한 기간)
  const rangeStart = useMemo(() => {
    const [y, m] = startMonth.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }, [startMonth]);

  const rangeEnd = useMemo(() => {
    const [y, m] = endMonth.split("-").map(Number);
    return new Date(y, m, 0); // 해당 월의 마지막 날
  }, [endMonth]);

  // 기간 변경 핸들러
  const handleDateRangeChange = useCallback((newStart: string, newEnd: string) => {
    setStartMonth(newStart);
    setEndMonth(newEnd);
  }, []);

  // 삭제 대기 중인 Plan 필터링
  const visiblePlans = useMemo(() => {
    if (!pendingDelete) return initialPlans;
    return initialPlans.filter((p) => p.id !== pendingDelete.planId);
  }, [initialPlans, pendingDelete]);

  const visibleUndatedPlans = useMemo(() => {
    if (!pendingDelete) return undatedPlans;
    return undatedPlans.filter((p) => p.id !== pendingDelete.planId);
  }, [undatedPlans, pendingDelete]);

  const totalCount = initialPlans.length + undatedPlans.length;
  const filteredCount = visiblePlans.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.type && p.type !== filters.type) return false;
    return true;
  }).length;

  return (
    <div className="h-[calc(100vh-3.5rem-1px)] flex flex-col">
      {/* 헤더 영역 */}
      <div
        className="flex-shrink-0 px-5 py-4 border-b"
        style={{
          background: "var(--notion-bg)",
          borderColor: "var(--notion-border)",
        }}
      >
        {/* 상단: 제목 + 모드 배너 + 저장 버튼 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #F76D57, #f9a88b)",
              }}
            >
              <CalendarIcon size={20} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-lg font-semibold"
                  style={{ color: "var(--notion-text)" }}
                >
                  {isAdmin ? "All Plans" : "Plans"}
                </h1>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "var(--notion-bg-secondary)",
                    color: "var(--notion-text-muted)",
                  }}
                >
                  {isPending ? "로딩 중..." : `${filteredCount}개`}
                </span>
              </div>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--notion-text-muted)" }}
              >
                {isAdmin ? (
                  <span className="flex items-center gap-1.5">
                    <ShieldIcon size={12} style={{ color: "#F76D57" }} />
                    관리자 모드 — {modKey}+K 커맨드
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <EyeIcon size={12} />
                    읽기 전용
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* 우측: 저장 버튼 (임시 데이터 있을 때만) */}
          {isAdmin && hasUnsavedChanges && (
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:shadow-lg"
              style={{
                background: isSaving
                  ? "var(--notion-bg-secondary)"
                  : "linear-gradient(135deg, #10b981, #34d399)",
                color: isSaving ? "var(--notion-text-muted)" : "white",
              }}
            >
              <SaveIcon size={16} />
              {isSaving ? "저장 중..." : `저장하기 (${draftPlans.length})`}
            </button>
          )}
        </div>

        {/* 하단: 필터 + 기간 설정 + 계획 등록 */}
        <div className="flex items-center justify-between">
          {/* 간트 필터 */}
          <GanttFilters filters={ganttFilters} onChange={setGanttFilters} />

          <div className="flex items-center gap-3">
            {/* 기간 설정 */}
            <DateRangePicker
              startMonth={startMonth}
              endMonth={endMonth}
              onChange={handleDateRangeChange}
            />

            {/* 새 계획 버튼 (admin 모드만) - 팝오버 */}
            {isAdmin && <CreatePlanPopover />}
          </div>
        </div>
      </div>

      {/* 간트 뷰 */}
      <div className="flex-1 overflow-hidden">
        <PlansGanttView
          mode={mode}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          plans={visiblePlans}
          onCreateDraftAtCell={isAdmin ? handleCreateDraftAtCell : undefined}
          onQuickCreate={isAdmin ? handleQuickCreate : undefined}
          onResizePlan={isAdmin ? handleResizePlan : undefined}
          onMovePlan={isAdmin ? handleMovePlan : undefined}
          onTitleUpdate={isAdmin ? handleTitleUpdate : undefined}
          onOpenPlan={isAdmin ? handleOpenPlan : undefined}
          selectedPlanId={selectedPlanId}
          onSelectPlan={handleSelectPlan}
          draftPlans={isAdmin ? draftPlans : undefined}
          onAddDraftPlan={isAdmin ? handleAddDraftPlan : undefined}
          onCreateFromDraft={isAdmin ? handleCreateFromDraft : undefined}
          onRemoveDraftPlan={isAdmin ? handleRemoveDraftPlan : undefined}
        />
      </div>

      {/* Undo 스낵바 */}
      <UndoSnackbar
        isVisible={showUndoSnackbar}
        message={`"${pendingDelete?.planTitle || ""}" 삭제됨`}
        onUndo={handleUndo}
        onClose={handleUndoClose}
        timeout={5000}
      />

      {/* 커맨드 팔레트 */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
        hasSelection={!!selectedPlanId}
        onCreateDraftPlan={isAdmin ? (input) => {
          handleAddDraftPlan(input.type, {
            title: input.title,
            project: input.project,
            module: input.module,
            feature: input.feature,
          });
        } : undefined}
        filterOptions={filterOptions}
      />
    </div>
  );
}
