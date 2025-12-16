"use client";

import { useState, useTransition, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MonthSelector } from "./MonthSelector";
import { PlanFilters } from "./PlanFilters";
import { PlansList } from "./PlansList";
import { PlansGanttView } from "./gantt";
import {
  UndoSnackbar,
  CommandPalette,
  CommandIcons,
  useKeyboardShortcuts,
  getModifierKey,
  type CommandItem,
} from "@/components/admin-plans";
import {
  updatePlanStatusAction,
  createDraftPlanAtCellAction,
  resizePlanAction,
  quickCreatePlanAction,
  movePlanAction,
  updatePlanTitleAction,
  deletePlanAction,
  duplicatePlanAction,
  updatePlanStageAction,
} from "@/lib/actions/plans";
import type { PlansBoardProps, FilterState, GroupByOption } from "./types";
import type { PlanStatus } from "@/lib/data/plans";

type ViewMode = "list" | "gantt";
type MonthRangeOption = 3 | 4 | 5 | 6;

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

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [viewMode, setViewMode] = useState<ViewMode>("gantt");
  const [monthRange, setMonthRange] = useState<MonthRangeOption>(3);

  // 선택된 Plan (간트 뷰에서)
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();

  // Undo 스낵바 상태
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [showUndoSnackbar, setShowUndoSnackbar] = useState(false);

  // 커맨드 팔레트 상태
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const isAdmin = mode === "admin";
  const modKey = getModifierKey();

  // 선택된 Plan 찾기
  const selectedPlan = useMemo(() => {
    if (!selectedPlanId) return null;
    return [...initialPlans, ...undatedPlans].find((p) => p.id === selectedPlanId);
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
      if (newFilters.domain) params.set("domain", newFilters.domain);
      if (newFilters.project) params.set("project", newFilters.project);
      if (newFilters.module) params.set("module", newFilters.module);
      if (newFilters.feature) params.set("feature", newFilters.feature);
      if (newFilters.assigneeUserId)
        params.set("assignee", newFilters.assigneeUserId);

      return `${basePath}?${params.toString()}`;
    },
    [mode]
  );

  // 월 변경
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    startTransition(() => {
      router.push(buildUrlWithParams(month, filters));
    });
  };

  // 필터 변경
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      startTransition(() => {
        router.push(buildUrlWithParams(selectedMonth, newFilters));
      });
    },
    [selectedMonth, buildUrlWithParams, router]
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
      domain: string;
      project: string;
      module: string;
      feature: string;
      date: Date;
    }) => {
      const result = await createDraftPlanAtCellAction({
        domain: context.domain,
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
      domain: string;
      project: string;
      module: string;
      feature: string;
      date: Date;
      title: string;
    }) => {
      const result = await quickCreatePlanAction({
        title: context.title,
        domain: context.domain,
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
  const handleOpenPlan = useCallback(
    (planId: string) => {
      setSelectedPlanId(planId);
      // 더블클릭 시에만 편집 페이지로 이동 (handleSelectPlan에서 처리)
    },
    []
  );

  // Plan 선택 (간트에서)
  const handleSelectPlan = useCallback((planId: string) => {
    setSelectedPlanId(planId);
  }, []);

  // ===== STEP C: Fast Delete + Undo =====
  const handleDelete = useCallback(
    (planId: string) => {
      const plan = [...initialPlans, ...undatedPlans].find((p) => p.id === planId);
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
    enabled: isAdmin && viewMode === "gantt",
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
          if (selectedPlanId) router.push(`/admin/plans/${selectedPlanId}/edit`);
        },
      },
    ],
    [modKey, selectedPlanId, handleDelete, handleDuplicate, handleStatusChange, handleStageChange, router]
  );

  // 날짜 범위 계산
  const getMultiMonthRange = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthsBefore = Math.floor((monthRange - 1) / 2);
    const monthsAfter = monthRange - 1 - monthsBefore;

    const rangeStart = new Date(year, month - 1 - monthsBefore, 1);
    const rangeEnd = new Date(year, month + monthsAfter, 0);
    return { rangeStart, rangeEnd };
  };

  const { rangeStart, rangeEnd } = getMultiMonthRange();

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
    <div className="space-y-6">
      {/* 모드 배너 */}
      {isAdmin ? (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background:
              "linear-gradient(135deg, rgba(247, 109, 87, 0.08), rgba(249, 235, 178, 0.05))",
            border: "1px solid rgba(247, 109, 87, 0.15)",
            color: "#c94a3a",
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span className="font-medium">관리자 전용</span>
          <span style={{ color: "var(--notion-text-muted)" }}>—</span>
          <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            {modKey}+K 커맨드 · Del 삭제 · {modKey}+D 복제
          </span>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "rgba(107, 114, 128, 0.06)",
            border: "1px solid rgba(107, 114, 128, 0.1)",
            color: "#6b7280",
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
          <span className="font-medium">읽기 전용</span>
          <span style={{ color: "var(--notion-text-muted)" }}>
            — 계획을 조회만 할 수 있습니다.
          </span>
        </div>
      )}

      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📆</span>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--notion-text)" }}
              >
                {isAdmin ? "All Plans" : "Plans"}
              </h1>
              {selectedPlan && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium animate-in fade-in-0 duration-150"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
                  }}
                >
                  선택: {selectedPlan.title}
                </span>
              )}
            </div>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--notion-text-muted)" }}
            >
              {isPending
                ? "로딩 중..."
                : `${filteredCount}개 / 전체 ${totalCount}개`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 뷰 모드 전환 */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <button
              onClick={() => setViewMode("gantt")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  viewMode === "gantt" ? "var(--notion-bg)" : "transparent",
                color:
                  viewMode === "gantt"
                    ? "var(--notion-text)"
                    : "var(--notion-text-muted)",
                boxShadow:
                  viewMode === "gantt" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 10h8m-8 4h10m-10 4h6"
                />
              </svg>
              간트
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background:
                  viewMode === "list" ? "var(--notion-bg)" : "transparent",
                color:
                  viewMode === "list"
                    ? "var(--notion-text)"
                    : "var(--notion-text-muted)",
                boxShadow:
                  viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              리스트
            </button>
          </div>

          {/* 월 선택 */}
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={handleMonthChange}
          />

          {/* 개월 수 선택 (간트 뷰에서만 표시) */}
          {viewMode === "gantt" && (
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{
                background: "var(--notion-bg-secondary)",
                border: "1px solid var(--notion-border)",
              }}
            >
              {([3, 4, 5, 6] as MonthRangeOption[]).map((num) => (
                <button
                  key={num}
                  onClick={() => setMonthRange(num)}
                  className="px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background:
                      monthRange === num ? "var(--notion-bg)" : "transparent",
                    color:
                      monthRange === num
                        ? "var(--notion-text)"
                        : "var(--notion-text-muted)",
                    boxShadow:
                      monthRange === num ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {num}개월
                </button>
              ))}
            </div>
          )}

          {/* 새 계획 버튼 (admin 모드만) */}
          {isAdmin && (
            <Link
              href="/admin/plans/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#F76D57]/20"
              style={{
                background: "linear-gradient(135deg, #F76D57, #f9a88b)",
                color: "white",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              계획 등록
            </Link>
          )}
        </div>
      </div>

      {/* 뷰 모드별 렌더링 */}
      {viewMode === "gantt" ? (
        <>
          {/* 간트 뷰 */}
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
          />

          {/* 일정 미지정 */}
          {visibleUndatedPlans.length > 0 && (
            <section
              className="p-4 rounded-xl border"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: "var(--notion-border)",
              }}
            >
              <h2
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--notion-text-muted)" }}
              >
                ⏳ 일정 미지정
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                  }}
                >
                  {visibleUndatedPlans.length}
                </span>
              </h2>
              <PlansList
                plans={visibleUndatedPlans}
                mode={mode}
                groupBy="none"
                filters={{}}
                onStatusChange={isAdmin ? handleStatusChange : undefined}
              />
            </section>
          )}
        </>
      ) : (
        <>
          {/* 리스트 뷰 */}
          <PlanFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            filterOptions={filterOptions}
            members={members}
          />

          <div className="space-y-8">
            <section>
              <h2
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--notion-text-muted)" }}
              >
                📅 {selectedMonth} 계획
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
                  }}
                >
                  {visiblePlans.length}
                </span>
              </h2>
              <PlansList
                plans={visiblePlans}
                mode={mode}
                groupBy={groupBy}
                filters={filters}
                onStatusChange={isAdmin ? handleStatusChange : undefined}
              />
            </section>

            {visibleUndatedPlans.length > 0 && (
              <section>
                <h2
                  className="text-sm font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  ⏳ 일정 미지정
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                    }}
                  >
                    {visibleUndatedPlans.length}
                  </span>
                </h2>
                <PlansList
                  plans={visibleUndatedPlans}
                  mode={mode}
                  groupBy={groupBy}
                  filters={filters}
                  onStatusChange={isAdmin ? handleStatusChange : undefined}
                />
              </section>
            )}
          </div>
        </>
      )}

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
      />
    </div>
  );
}
