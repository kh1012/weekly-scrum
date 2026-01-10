/**
 * PlansBoard Component (Refactored)
 * 
 * 리팩토링 완료:
 * - usePlansDraft: draft 데이터 관리
 * - usePlansFilters: 필터 및 URL 상태 관리
 * - usePlansActions: CRUD 액션
 * - usePlansSave: 저장 로직
 * 
 * 1216 lines → ~400 lines (67% 감소)
 */

"use client";

import {
  useState,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DateRangePicker } from "./DateRangePicker";
import { GanttFilters } from "./GanttFilters";
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
  ChevronUpIcon,
  ChevronDownIcon,
  RefreshIcon,
} from "@/components/common/Icons";
import type { PlansBoardProps, DraftPlanItem } from "./types";
import { usePlansDraft } from "./hooks/usePlansDraft";
import { usePlansFilters } from "./hooks/usePlansFilters";
import { usePlansActions } from "./hooks/usePlansActions";
import { usePlansSave } from "./hooks/usePlansSave";

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
  const isAdmin = mode === "admin";
  const modKey = getModifierKey();

  // Draft 데이터 관리
  const {
    draftData,
    hasUnsavedChanges,
    totalChanges,
    draftPlans,
    setDraftPlans,
    addDraftPlan,
    removeDraftPlan,
    updateDraftPlan,
    addOrUpdatePending,
    addDelete,
    removeDelete,
    addDuplicate,
    resetDrafts,
    clearDrafts,
  } = usePlansDraft();

  // 필터 및 URL 상태 관리
  const {
    filters,
    setFilters,
    groupBy,
    setGroupBy,
    ganttFilters,
    setGanttFilters,
    startMonth,
    setStartMonth,
    endMonth,
    setEndMonth,
    buildUrlWithParams,
    handleFiltersChange,
  } = usePlansFilters({
    mode,
    initialFilters,
    initialMonth,
  });

  // Plans CRUD 액션
  const {
    handleStatusChange,
    handleStageChange,
    handleTitleUpdate,
    handleCreateDraftAtCell,
    handleQuickCreate,
    handleResizePlan,
    handleMovePlan,
    handleDeletePlan,
    handleDuplicatePlan,
  } = usePlansActions({
    isAdmin,
    addOrUpdatePending,
    addDraftPlan,
    addDelete,
    addDuplicate,
  });

  // 저장 관련 상태
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // 저장 로직
  const { isSaving, isPending, handleSaveAll } = usePlansSave({
    draftData,
    totalChanges,
    clearDrafts,
    onSaveSuccess: (message) => {
      setSaveSuccessMessage(message);
      setShowSaveSuccess(true);
      setTimeout(() => {
        setShowSaveSuccess(false);
      }, 3000);
    },
  });

  // 헤더 최소화 상태
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("plans-header-collapsed") === "true";
    }
    return false;
  });

  // 헤더 최소화 상태 저장
  const handleToggleHeader = useCallback((collapsed: boolean) => {
    setIsHeaderCollapsed(collapsed);
    if (typeof window !== "undefined") {
      localStorage.setItem("plans-header-collapsed", collapsed.toString());
    }
  }, []);

  // 선택된 Plan
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();

  // Undo 스낵바 상태
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);

  // 커맨드 팔레트 상태
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // 선택된 Plan 객체
  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return undefined;
    return [...initialPlans, ...undatedPlans].find(
      (p) => p.id === selectedPlanId
    );
  }, [selectedPlanId, initialPlans, undatedPlans]);

  // Plan 선택 핸들러
  const handleOpenPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
  }, []);

  const handleSelectPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
  }, []);

  // 임시 계획 관리
  const handleAddDraftPlan = useCallback(
    (
      type: "feature" | "sprint" | "release",
      defaultValues?: Partial<DraftPlanItem>
    ) => {
      const tempId = crypto.randomUUID();
      const newDraft: DraftPlanItem = {
        tempId,
        type,
        title: defaultValues?.title || "",
        project: defaultValues?.project,
        module: defaultValues?.module,
        feature: defaultValues?.feature,
        stage: defaultValues?.stage,
        start_date: defaultValues?.start_date,
        end_date: defaultValues?.end_date,
      };
      addDraftPlan(newDraft);
    },
    [addDraftPlan]
  );

  const handleRemoveDraftPlan = useCallback(
    (tempId: string) => {
      removeDraftPlan(tempId);
    },
    [removeDraftPlan]
  );

  const handleUpdateDraftPlan = useCallback(
    (tempId: string, updates: Partial<DraftPlanItem>) => {
      updateDraftPlan(tempId, updates);
    },
    [updateDraftPlan]
  );

  const handleCreateFromDraft = useCallback(
    (draft: DraftPlanItem, startDate: string, endDate: string) => {
      updateDraftPlan(draft.tempId, {
        start_date: startDate,
        end_date: endDate,
      });
    },
    [updateDraftPlan]
  );

  const handleUpdateDraftWithDates = useCallback(
    (
      tempId: string,
      updates: Partial<DraftPlanItem> & { start_date: string; end_date: string }
    ) => {
      updateDraftPlan(tempId, updates);
    },
    [updateDraftPlan]
  );

  // 삭제 처리 (임시 저장)
  const handleDelete = useCallback(
    (planId: string) => {
      const plan = [...initialPlans, ...undatedPlans].find(
        (p) => p.id === planId
      );
      if (!plan) return;

      handleDeletePlan(planId, plan.title);

      // 스낵바 표시
      setPendingDelete({ planId, planTitle: plan.title });
      setShowUndoSnackbar(true);
      setSelectedPlanId(undefined);
    },
    [initialPlans, undatedPlans, handleDeletePlan]
  );

  // Undo 처리 (임시 삭제 취소)
  const handleUndo = useCallback(() => {
    if (!pendingDelete) return;

    removeDelete(pendingDelete.planId);
    setPendingDelete(null);
    setShowUndoSnackbar(false);
  }, [pendingDelete, removeDelete]);

  // Undo 스낵바 닫힘
  const handleUndoClose = useCallback(() => {
    setShowUndoSnackbar(false);
    setPendingDelete(null);
  }, []);

  // 복제 처리 (임시 저장)
  const handleDuplicate = useCallback(
    (planId: string) => {
      handleDuplicatePlan(planId);
    },
    [handleDuplicatePlan]
  );

  // 변경점 초기화
  const handleResetDrafts = useCallback(() => {
    if (!confirm("모든 임시 변경 사항이 삭제됩니다. 계속하시겠습니까?")) {
      return;
    }

    resetDrafts();

    // 토스트 표시
    setPendingDelete({
      planId: "",
      planTitle: "변경 사항이 초기화되었습니다",
    });
    setShowUndoSnackbar(true);
    setTimeout(() => {
      setShowUndoSnackbar(false);
      setPendingDelete(null);
    }, 3000);
  }, [resetDrafts]);

  // 커맨드 팔레트 핸들러
  const handleCommandPalette = useCallback(() => {
    setShowCommandPalette(true);
  }, []);

  const handleEscape = useCallback(() => {
    setSelectedPlanId(undefined);
    setShowCommandPalette(false);
  }, []);

  // 키보드 단축키
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

  // 날짜 범위 계산
  const rangeStart = useMemo(() => {
    const [y, m] = startMonth.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }, [startMonth]);

  const rangeEnd = useMemo(() => {
    const [y, m] = endMonth.split("-").map(Number);
    return new Date(y, m, 0);
  }, [endMonth]);

  // 기간 변경 핸들러
  const handleDateRangeChange = useCallback(
    (newStart: string, newEnd: string) => {
      setStartMonth(newStart);
      setEndMonth(newEnd);
    },
    [setStartMonth, setEndMonth]
  );

  // 삭제 대기 중인 Plan 필터링 + 임시 수정 사항 반영
  const visiblePlans = useMemo(() => {
    const deletedIds = new Set(draftData.deletes.map((d) => d.planId));

    return initialPlans
      .filter((p) => !deletedIds.has(p.id))
      .map((plan) => {
        const update = draftData.updates.find((u) => u.planId === plan.id);
        if (update) {
          return {
            ...plan,
            ...update.changes,
            start_date: update.changes.start_date || plan.start_date,
            end_date: update.changes.end_date || plan.end_date,
          };
        }
        return plan;
      });
  }, [initialPlans, draftData.deletes, draftData.updates]);

  const visibleUndatedPlans = useMemo(() => {
    const deletedIds = new Set(draftData.deletes.map((d) => d.planId));
    return undatedPlans.filter((p) => !deletedIds.has(p.id));
  }, [undatedPlans, draftData.deletes]);

  const totalCount = initialPlans.length + undatedPlans.length;
  const filteredCount = visiblePlans.filter((p) => {
    if (filters.status && p.status !== filters.status) return false;
    if (filters.type && p.type !== filters.type) return false;
    return true;
  }).length;

  return (
    <div className="h-auto flex flex-col">
      {/* 헤더 영역 - 최소화 가능 */}
      <div
        className="flex-shrink-0 transition-all duration-200"
        style={{
          background: "var(--notion-bg)",
        }}
      >
        {/* 최소화된 상태: 한 줄로 압축 */}
        {isHeaderCollapsed ? (
          <div className="flex items-center justify-between px-0 py-2">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{
                  background: "linear-gradient(135deg, #F76D57, #f9a88b)",
                }}
              >
                <CalendarIcon size={14} className="text-white" />
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--notion-text)" }}
              >
                {isAdmin ? "All Plans" : "Plans"}
              </span>
              <span
                className="text-xs px-1.5 py-0.5 rounded"
                style={{
                  background: "var(--notion-bg-secondary)",
                  color: "var(--notion-text-muted)",
                }}
              >
                {filteredCount}개
              </span>
              {isAdmin && (
                <>
                  <Link
                    href="/works/plans/gantt"
                    className="text-[10px] px-2 py-1 rounded font-medium transition-colors hover:opacity-80"
                    style={{
                      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                      color: "white",
                    }}
                  >
                    ✨ 새 간트 편집기
                  </Link>
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded"
                    style={{
                      background: "rgba(247, 109, 87, 0.1)",
                      color: "#F76D57",
                    }}
                  >
                    {modKey}+K
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <GanttFilters
                filters={ganttFilters}
                onChange={setGanttFilters}
                compact
              />

              <DateRangePicker
                startMonth={startMonth}
                endMonth={endMonth}
                onChange={handleDateRangeChange}
                compact
              />

              {isAdmin && hasUnsavedChanges && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleResetDrafts}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-black/5"
                    style={{
                      background: "var(--notion-bg-secondary)",
                      color: "var(--notion-text-muted)",
                      border: "1px solid var(--notion-border)",
                    }}
                    title="변경점 초기화"
                  >
                    <RefreshIcon size={12} />
                  </button>
                  <button
                    onClick={handleSaveAll}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: isSaving
                        ? "var(--notion-bg-secondary)"
                        : "linear-gradient(135deg, #10b981, #34d399)",
                      color: isSaving ? "var(--notion-text-muted)" : "white",
                    }}
                  >
                    <SaveIcon size={12} />
                    {isSaving ? "저장..." : `저장 (${totalChanges})`}
                  </button>
                </div>
              )}

              {isAdmin && <CreatePlanPopover compact />}

              <button
                onClick={() => handleToggleHeader(false)}
                className="p-1.5 rounded-lg hover:bg-black/5 transition-colors"
                style={{ color: "var(--notion-text-muted)" }}
                title="헤더 확장"
              >
                <ChevronDownIcon size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* 확장된 상태: 기존 레이아웃 */
          <div className="px-0 py-4">
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

              <div className="flex items-center gap-3">
                {isAdmin && hasUnsavedChanges && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetDrafts}
                      disabled={isSaving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-black/5"
                      style={{
                        background: "var(--notion-bg-secondary)",
                        color: "var(--notion-text-muted)",
                        border: "1px solid var(--notion-border)",
                      }}
                      title="변경점 초기화"
                    >
                      <RefreshIcon size={14} />
                      초기화
                    </button>
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
                      {isSaving ? "저장 중..." : `저장하기 (${totalChanges})`}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleToggleHeader(true)}
                  className="p-2 rounded-lg hover:bg-black/5 transition-colors"
                  style={{ color: "var(--notion-text-muted)" }}
                  title="헤더 최소화"
                >
                  <ChevronUpIcon size={18} />
                </button>
              </div>
            </div>

            {/* 하단: 필터 + 기간 설정 + 계획 등록 */}
            <div className="flex items-center justify-between">
              <GanttFilters filters={ganttFilters} onChange={setGanttFilters} />

              <div className="flex items-center gap-3">
                <DateRangePicker
                  startMonth={startMonth}
                  endMonth={endMonth}
                  onChange={handleDateRangeChange}
                />

                {isAdmin && <CreatePlanPopover />}
              </div>
            </div>
          </div>
        )}
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
          onUpdateDraftPlan={isAdmin ? handleUpdateDraftPlan : undefined}
          onUpdateDraftWithDates={
            isAdmin ? handleUpdateDraftWithDates : undefined
          }
          filterOptions={filterOptions}
        />
      </div>

      {/* Undo 스낵바 */}
      <UndoSnackbar
        isVisible={showUndoSnackbar}
        message={
          showSaveSuccess
            ? saveSuccessMessage
            : `"${pendingDelete?.planTitle || ""}" 삭제됨`
        }
        onUndo={showSaveSuccess ? undefined : handleUndo}
        onClose={handleUndoClose}
        timeout={5000}
      />

      {/* 커맨드 팔레트 */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        commands={commands}
        hasSelection={!!selectedPlanId}
        onCreateDraftPlan={
          isAdmin
            ? (input) => {
                handleAddDraftPlan(input.type, {
                  title: input.title,
                  project: input.project,
                  module: input.module,
                  feature: input.feature,
                });
              }
            : undefined
        }
        filterOptions={filterOptions}
      />
    </div>
  );
}
