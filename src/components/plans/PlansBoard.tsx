"use client";

import {
  useState,
  useTransition,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DateRangePicker } from "./DateRangePicker";
import {
  GanttFilters,
  defaultGanttFilters,
  type GanttFilterState,
} from "./GanttFilters";
import { PlansGanttView } from "./gantt";
import { formatLocalDateStr } from "./gantt/useGanttLayout";
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
import {
  updatePlanStatusAction,
  resizePlanAction,
  createPlanAction,
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
  const [ganttFilters, setGanttFilters] =
    useState<GanttFilterState>(defaultGanttFilters);

  // 기간 설정 (기본: 현재 월 기준 3개월)
  const [startMonth, setStartMonth] = useState(() => {
    const [y, m] = initialMonth.split("-").map(Number);
    const start = new Date(y, m - 2, 1); // 1개월 전부터
    return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });
  const [endMonth, setEndMonth] = useState(() => {
    const [y, m] = initialMonth.split("-").map(Number);
    const end = new Date(y, m, 1); // 1개월 후까지
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  });

  // 로컬 스토리지 키
  const STORAGE_KEY = "plans-draft-data";

  // 저장 상태
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 헤더 최소화 상태
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("plans-header-collapsed") === "true";
    }
    return false;
  });

  // 헤더 최소화 상태 저장
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "plans-header-collapsed",
        isHeaderCollapsed.toString()
      );
    }
  }, [isHeaderCollapsed]);

  // 선택된 Plan (간트 뷰에서)
  const [selectedPlanId, setSelectedPlanId] = useState<string | undefined>();

  // 임시 계획 타입 (새로 생성할 Plan)
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

  // 기존 Plan 수정 임시 저장 타입
  type PendingUpdate = {
    planId: string;
    changes: {
      status?: PlanStatus;
      stage?: string;
      title?: string;
      start_date?: string;
      end_date?: string;
    };
  };

  // 삭제 대기 목록 타입
  type PendingDeleteItem = {
    planId: string;
    planTitle: string;
  };

  // 임시 저장 데이터 구조
  type DraftData = {
    creates: DraftPlanItem[]; // 새로 생성할 Plan
    updates: PendingUpdate[]; // 수정할 Plan
    deletes: PendingDeleteItem[]; // 삭제할 Plan
    duplicates: string[]; // 복제할 Plan ID
  };

  // 임시 계획 (로컬 스토리지 연동)
  const [draftData, setDraftData] = useState<DraftData>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // 기존 형식 호환 (배열 → 객체)
          if (Array.isArray(parsed)) {
            return {
              creates: parsed,
              updates: [],
              deletes: [],
              duplicates: [],
            };
          }
          return {
            creates: parsed.creates || [],
            updates: parsed.updates || [],
            deletes: parsed.deletes || [],
            duplicates: parsed.duplicates || [],
          };
        } catch {
          return { creates: [], updates: [], deletes: [], duplicates: [] };
        }
      }
    }
    return { creates: [], updates: [], deletes: [], duplicates: [] };
  });

  // 하위 호환을 위한 draftPlans alias
  const draftPlans = draftData.creates;
  const setDraftPlans = (fn: (prev: DraftPlanItem[]) => DraftPlanItem[]) => {
    setDraftData((prev) => ({
      ...prev,
      creates: typeof fn === "function" ? fn(prev.creates) : fn,
    }));
  };

  // draftData 변경 시 로컬 스토리지 저장 및 unsaved 상태 업데이트
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasChanges =
        draftData.creates.length > 0 ||
        draftData.updates.length > 0 ||
        draftData.deletes.length > 0 ||
        draftData.duplicates.length > 0;

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
        setHasUnsavedChanges(true);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setHasUnsavedChanges(false);
      }
    }
  }, [draftData, STORAGE_KEY]);

  // 변경 건수 계산
  const totalChanges =
    draftData.creates.length +
    draftData.updates.length +
    draftData.deletes.length +
    draftData.duplicates.length;

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

  // 상태 변경 (임시 저장)
  const handleStatusChange = useCallback(
    (planId: string, status: PlanStatus) => {
      setDraftData((prev) => {
        const existingIndex = prev.updates.findIndex(
          (u) => u.planId === planId
        );
        if (existingIndex >= 0) {
          const updates = [...prev.updates];
          updates[existingIndex] = {
            ...updates[existingIndex],
            changes: { ...updates[existingIndex].changes, status },
          };
          return { ...prev, updates };
        }
        return {
          ...prev,
          updates: [...prev.updates, { planId, changes: { status } }],
        };
      });
    },
    []
  );

  // Stage 변경 (임시 저장)
  const handleStageChange = useCallback((planId: string, stage: string) => {
    setDraftData((prev) => {
      const existingIndex = prev.updates.findIndex((u) => u.planId === planId);
      if (existingIndex >= 0) {
        const updates = [...prev.updates];
        updates[existingIndex] = {
          ...updates[existingIndex],
          changes: { ...updates[existingIndex].changes, stage },
        };
        return { ...prev, updates };
      }
      return {
        ...prev,
        updates: [...prev.updates, { planId, changes: { stage } }],
      };
    });
  }, []);

  // Draft Plan 생성 (셀 클릭) - 임시 저장
  const handleCreateDraftAtCell = useCallback(
    (context: {
      project: string;
      module: string;
      feature: string;
      date: Date;
    }) => {
      const dateStr = formatLocalDateStr(context.date);
      const newDraft: DraftPlanItem = {
        tempId: crypto.randomUUID(),
        type: "feature",
        title: "",
        project: context.project,
        module: context.module,
        feature: context.feature,
        stage: "컨셉 기획",
        start_date: dateStr,
        end_date: dateStr,
      };
      setDraftData((prev) => ({
        ...prev,
        creates: [...prev.creates, newDraft],
      }));
    },
    []
  );

  // 리사이즈 (임시 저장)
  const handleResizePlan = useCallback(
    (planId: string, startDate: string, endDate: string) => {
      setDraftData((prev) => {
        const existingIndex = prev.updates.findIndex(
          (u) => u.planId === planId
        );
        if (existingIndex >= 0) {
          const updates = [...prev.updates];
          updates[existingIndex] = {
            ...updates[existingIndex],
            changes: {
              ...updates[existingIndex].changes,
              start_date: startDate,
              end_date: endDate,
            },
          };
          return { ...prev, updates };
        }
        return {
          ...prev,
          updates: [
            ...prev.updates,
            { planId, changes: { start_date: startDate, end_date: endDate } },
          ],
        };
      });
    },
    []
  );

  // Quick Create (임시 저장)
  const handleQuickCreate = useCallback(
    (context: {
      project: string;
      module: string;
      feature: string;
      date: Date;
      title: string;
    }) => {
      const dateStr = formatLocalDateStr(context.date);
      const newDraft: DraftPlanItem = {
        tempId: crypto.randomUUID(),
        type: "feature",
        title: context.title,
        project: context.project,
        module: context.module,
        feature: context.feature,
        stage: "컨셉 기획",
        start_date: dateStr,
        end_date: dateStr,
      };
      setDraftData((prev) => ({
        ...prev,
        creates: [...prev.creates, newDraft],
      }));
    },
    []
  );

  // Move Plan (임시 저장)
  const handleMovePlan = useCallback(
    (planId: string, startDate: string, endDate: string) => {
      setDraftData((prev) => {
        const existingIndex = prev.updates.findIndex(
          (u) => u.planId === planId
        );
        if (existingIndex >= 0) {
          const updates = [...prev.updates];
          updates[existingIndex] = {
            ...updates[existingIndex],
            changes: {
              ...updates[existingIndex].changes,
              start_date: startDate,
              end_date: endDate,
            },
          };
          return { ...prev, updates };
        }
        return {
          ...prev,
          updates: [
            ...prev.updates,
            { planId, changes: { start_date: startDate, end_date: endDate } },
          ],
        };
      });
    },
    []
  );

  // Title Update (임시 저장)
  const handleTitleUpdate = useCallback((planId: string, newTitle: string) => {
    setDraftData((prev) => {
      const existingIndex = prev.updates.findIndex((u) => u.planId === planId);
      if (existingIndex >= 0) {
        const updates = [...prev.updates];
        updates[existingIndex] = {
          ...updates[existingIndex],
          changes: { ...updates[existingIndex].changes, title: newTitle },
        };
        return { ...prev, updates };
      }
      return {
        ...prev,
        updates: [...prev.updates, { planId, changes: { title: newTitle } }],
      };
    });
  }, []);

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
    (
      type: "feature" | "sprint" | "release",
      defaultValues?: Partial<(typeof draftPlans)[0]>
    ) => {
      const tempId = crypto.randomUUID();
      const newDraft = {
        tempId,
        type,
        title:
          defaultValues?.title ||
          (type === "feature"
            ? "새 기능"
            : type === "sprint"
            ? "새 스프린트"
            : "새 릴리즈"),
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

  // 임시 계획 수정
  const handleUpdateDraftPlan = useCallback(
    (tempId: string, updates: Partial<DraftPlanItem>) => {
      setDraftPlans((prev) =>
        prev.map((d) => (d.tempId === tempId ? { ...d, ...updates } : d))
      );
    },
    []
  );

  // 드래프트에 기간 설정 (임시 저장 - 서버 생성하지 않음)
  const handleCreateFromDraft = useCallback(
    (draft: DraftPlanItem, startDate: string, endDate: string) => {
      // 드래프트의 날짜만 업데이트 (저장 버튼 클릭 시 실제 생성)
      setDraftData((prev) => ({
        ...prev,
        creates: prev.creates.map((d) =>
          d.tempId === draft.tempId
            ? { ...d, start_date: startDate, end_date: endDate }
            : d
        ),
      }));
    },
    []
  );

  // 드래프트에 기간 + 추가 정보 설정 (팝오버에서 완료 시)
  const handleUpdateDraftWithDates = useCallback(
    (
      tempId: string,
      updates: Partial<DraftPlanItem> & { start_date: string; end_date: string }
    ) => {
      setDraftData((prev) => ({
        ...prev,
        creates: prev.creates.map((d) =>
          d.tempId === tempId ? { ...d, ...updates } : d
        ),
      }));
    },
    []
  );

  // ===== 저장하기 (모든 임시 변경 사항을 서버에 반영) =====
  const handleSaveAll = useCallback(async () => {
    if (totalChanges === 0) return;

    setIsSaving(true);

    try {
      let savedCount = 0;

      // 1. 삭제 처리
      for (const del of draftData.deletes) {
        const result = await deletePlanAction(del.planId);
        if (result.success) savedCount++;
      }

      // 2. 수정 처리
      for (const update of draftData.updates) {
        const { planId, changes } = update;

        // 상태 변경
        if (changes.status) {
          await updatePlanStatusAction(planId, changes.status);
        }
        // 스테이지 변경
        if (changes.stage) {
          await updatePlanStageAction(planId, changes.stage);
        }
        // 제목 변경
        if (changes.title) {
          await updatePlanTitleAction(planId, changes.title);
        }
        // 기간 변경 (리사이즈/이동)
        if (changes.start_date || changes.end_date) {
          await resizePlanAction({
            planId,
            start_date: changes.start_date!,
            end_date: changes.end_date!,
          });
        }
        savedCount++;
      }

      // 3. 복제 처리
      for (const planId of draftData.duplicates) {
        const result = await duplicatePlanAction(planId);
        if (result.success) savedCount++;
      }

      // 4. 새 계획 생성
      for (const draft of draftData.creates) {
        // 날짜가 설정된 것만 생성
        if (draft.start_date && draft.end_date) {
          const isFeature = draft.type === "feature";
          await createPlanAction({
            type: draft.type,
            title: draft.title,
            stage: isFeature ? draft.stage || "" : "",
            project: isFeature ? draft.project || "" : undefined,
            module: isFeature ? draft.module || "" : undefined,
            feature: isFeature ? draft.feature || "" : undefined,
            start_date: draft.start_date,
            end_date: draft.end_date,
          });
          savedCount++;
        }
      }

      // 임시 데이터 비우기
      setDraftData({ creates: [], updates: [], deletes: [], duplicates: [] });
      localStorage.removeItem(STORAGE_KEY);
      setHasUnsavedChanges(false);

      // 새로고침
      startTransition(() => {
        router.refresh();
      });

      // 토스트 표시 (UndoSnackbar 재활용)
      setPendingDelete({
        planId: "",
        planTitle: `${savedCount}개 변경 사항이 저장되었습니다`,
      });
      setShowUndoSnackbar(true);
      setTimeout(() => {
        setShowUndoSnackbar(false);
        setPendingDelete(null);
      }, 3000);
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert("저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }, [draftData, totalChanges, router, STORAGE_KEY]);

  // ===== 변경점 초기화 =====
  const handleResetDrafts = useCallback(() => {
    if (!confirm("모든 임시 변경 사항이 삭제됩니다. 계속하시겠습니까?")) {
      return;
    }

    setDraftData({ creates: [], updates: [], deletes: [], duplicates: [] });
    localStorage.removeItem(STORAGE_KEY);
    setHasUnsavedChanges(false);

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
  }, [STORAGE_KEY]);

  // ===== STEP C: Fast Delete (임시 저장) =====
  const handleDelete = useCallback(
    (planId: string) => {
      const plan = [...initialPlans, ...undatedPlans].find(
        (p) => p.id === planId
      );
      if (!plan) return;

      // 임시 삭제 목록에 추가
      setDraftData((prev) => ({
        ...prev,
        deletes: [...prev.deletes, { planId, planTitle: plan.title }],
      }));

      // 스낵바 표시
      setPendingDelete({ planId, planTitle: plan.title });
      setShowUndoSnackbar(true);
      setSelectedPlanId(undefined);
    },
    [initialPlans, undatedPlans]
  );

  // Undo 처리 (임시 삭제 취소)
  const handleUndo = useCallback(() => {
    if (!pendingDelete) return;

    // 임시 삭제 목록에서 제거
    setDraftData((prev) => ({
      ...prev,
      deletes: prev.deletes.filter((d) => d.planId !== pendingDelete.planId),
    }));

    setPendingDelete(null);
    setShowUndoSnackbar(false);
  }, [pendingDelete]);

  // Undo 스낵바 닫힘 (임시 저장이므로 실제 삭제 안 함)
  const handleUndoClose = useCallback(() => {
    setShowUndoSnackbar(false);
    setPendingDelete(null);
  }, []);

  // ===== STEP D: Duplicate (임시 저장) =====
  const handleDuplicate = useCallback((planId: string) => {
    // 임시 복제 목록에 추가
    setDraftData((prev) => ({
      ...prev,
      duplicates: [...prev.duplicates, planId],
    }));
  }, []);

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

  // 커맨드 팔레트 명령어 목록 (임시 계획 생성은 CommandPalette 내부에서 처리)
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
  const handleDateRangeChange = useCallback(
    (newStart: string, newEnd: string) => {
      setStartMonth(newStart);
      setEndMonth(newEnd);
    },
    []
  );

  // 삭제 대기 중인 Plan 필터링 + 임시 수정 사항 반영
  const visiblePlans = useMemo(() => {
    // 임시 삭제 목록의 ID들
    const deletedIds = new Set(draftData.deletes.map((d) => d.planId));

    // 삭제되지 않은 Plan들만 필터링하고, 임시 수정 사항 반영
    return initialPlans
      .filter((p) => !deletedIds.has(p.id))
      .map((plan) => {
        // 임시 수정 사항이 있으면 반영
        const update = draftData.updates.find((u) => u.planId === plan.id);
        if (update) {
          return {
            ...plan,
            ...update.changes,
            // 날짜는 별도 처리 (null이 아닌 경우만)
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
                    href="/plans/gantt"
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
              {/* 간트 필터 (압축) */}
              <GanttFilters
                filters={ganttFilters}
                onChange={setGanttFilters}
                compact
              />

              {/* 기간 설정 (압축) */}
              <DateRangePicker
                startMonth={startMonth}
                endMonth={endMonth}
                onChange={handleDateRangeChange}
                compact
              />

              {/* 저장/초기화 버튼 */}
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

              {/* 새 계획 버튼 */}
              {isAdmin && <CreatePlanPopover compact />}

              {/* 확장 버튼 */}
              <button
                onClick={() => setIsHeaderCollapsed(false)}
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
                {/* 저장/초기화 버튼 (임시 데이터 있을 때만) */}
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

                {/* 최소화 버튼 */}
                <button
                  onClick={() => setIsHeaderCollapsed(true)}
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
