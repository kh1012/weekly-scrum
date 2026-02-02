"use client";

import {
  useCallback,
  useTransition,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DraftGanttView } from "@/components/plans/gantt-draft";
import { useDraftStore } from "@/components/plans/gantt-draft/store";
import { useGanttQueryPersistence } from "@/components/plans/gantt-draft/hooks/useGanttQueryPersistence";
import {
  OnboardingTour,
  useOnboardingTour,
} from "@/components/plans/gantt-draft/OnboardingTour";
import type { WorkspaceMemberOption } from "@/components/plans/gantt-draft/CreatePlanModal";

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
  orderIndex?: number;
  assignees?: InitialAssignee[];
}

interface AdminPlansGanttClientProps {
  workspaceId: string;
  initialPlans: InitialPlan[];
  members: WorkspaceMemberOption[];
  initialStages: string[];
  initialAssignees: string[];
  initialViewMode: "detailed" | "summarized";
  maxUpdatedAt?: string;
  updatedByName?: string;
}

export function AdminPlansGanttClient({
  workspaceId,
  initialPlans,
  members,
  initialStages,
  initialAssignees,
  initialViewMode,
  maxUpdatedAt,
  updatedByName,
}: AdminPlansGanttClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // URL queryString을 로컬 스토리지에 저장/복원
  const { storedParams, isRestored } = useGanttQueryPersistence({
    storageKey: "admin-plans-gantt",
  });

  // 서버에서 받은 초기값이 비어있으면 로컬 스토리지 값 사용
  const effectiveStages = useMemo(() => {
    if (initialStages.length > 0) return initialStages;
    if (storedParams?.stages?.length) return storedParams.stages;
    return initialStages;
  }, [initialStages, storedParams?.stages]);

  const effectiveAssignees = useMemo(() => {
    if (initialAssignees.length > 0) return initialAssignees;
    if (storedParams?.assignees?.length) return storedParams.assignees;
    return initialAssignees;
  }, [initialAssignees, storedParams?.assignees]);

  const effectiveViewMode = useMemo(() => {
    if (initialViewMode !== "detailed") return initialViewMode;
    if (storedParams?.viewMode) return storedParams.viewMode;
    return initialViewMode;
  }, [initialViewMode, storedParams?.viewMode]);

  const selectedStages = useMemo(
    () => new Set(effectiveStages),
    [effectiveStages],
  );
  const selectedAssignees = useMemo(
    () => new Set(effectiveAssignees),
    [effectiveAssignees],
  );

  const setViewModeStore = useDraftStore((s) => s.setViewMode);

  // 초기 로드 시에만 URL의 viewMode를 store에 설정 (한 번만 실행)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      setViewModeStore(effectiveViewMode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStagesChange = useCallback(
    (stages: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (stages.size > 0) {
        params.set("stages", Array.from(stages).join(","));
      } else {
        params.delete("stages");
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  const handleAssigneesChange = useCallback(
    (assignees: Set<string>) => {
      const params = new URLSearchParams(searchParams.toString());
      if (assignees.size > 0) {
        params.set("assignees", Array.from(assignees).join(","));
      } else {
        params.delete("assignees");
      }
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    },
    [router, searchParams],
  );

  // viewMode 변경 핸들러 (store + URL 동시 업데이트)
  const handleViewModeChange = useCallback(
    (mode: "detailed" | "summarized") => {
      setViewModeStore(mode);
      const params = new URLSearchParams(searchParams.toString());
      if (mode === "summarized") {
        params.set("viewMode", "summarized");
      } else {
        params.delete("viewMode"); // detailed가 기본값이므로 제거
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [setViewModeStore, router, searchParams],
  );

  // 온보딩 투어
  const { shouldShow: shouldShowOnboarding, completeOnboarding } =
    useOnboardingTour("gantt-onboarding:admin-plans-gantt");

  return (
    <>
      <DraftGanttView
        workspaceId={workspaceId}
        initialPlans={initialPlans}
        members={members}
        selectedStages={selectedStages}
        onStagesChange={handleStagesChange}
        selectedAssignees={selectedAssignees}
        onAssigneesChange={handleAssigneesChange}
        isFilterLoading={isPending}
        maxUpdatedAt={maxUpdatedAt}
        updatedByName={updatedByName}
        onViewModeChange={handleViewModeChange}
      />

      {/* 온보딩 투어 */}
      {shouldShowOnboarding && (
        <OnboardingTour
          storageKey="gantt-onboarding:admin-plans-gantt"
          steps={[
            {
              id: "edit-button",
              targetSelector: '[data-onboarding="edit-button"]',
              title: "작업 시작/종료",
              description:
                "편집 모드를 시작하거나 종료할 수 있습니다. 단축키를 사용하면 더 빠르게 작업할 수 있습니다.",
              position: "bottom",
              shortcuts: [
                { keys: ["⌘", "Enter"], label: "작업 시작" },
                { keys: ["⌘", "⇧", "Enter"], label: "작업 종료" },
              ],
            },
            {
              id: "save-button",
              targetSelector: '[data-onboarding="save-button"]',
              title: "저장 & 토스트 알림",
              description:
                "저장 시 화면 하단에 토스트 메시지로 결과가 표시됩니다. 성공/실패 여부를 바로 확인할 수 있습니다.",
              position: "bottom",
              shortcuts: [{ keys: ["⌘", "S"], label: "저장" }],
            },
            {
              id: "tree-filter",
              targetSelector: '[data-onboarding="tree-filter"]',
              title: "트리 필터",
              description:
                "프로젝트, 모듈, 기능별로 필터링하고, FLAGS(기간)를 선택하면 해당 기간만 집중해서 볼 수 있습니다. 필터 설정은 URL에 저장되어 공유가 가능합니다!",
              position: "bottom",
            },
            {
              id: "tree-panel",
              targetSelector: '[data-onboarding="tree-panel"]',
              title: "트리 탐색",
              description:
                "키보드 방향키(↑↓)로 항목을 이동하고, ←→로 펼침/접힘을 조작할 수 있습니다. Enter로 해당 항목을 타임라인에서 하이라이트합니다.",
              position: "right",
              shortcuts: [
                { keys: ["↑", "↓"], label: "항목 이동" },
                { keys: ["←", "→"], label: "펼침/접힘" },
                { keys: ["Enter"], label: "하이라이트" },
              ],
            },
          ]}
          onComplete={completeOnboarding}
        />
      )}
    </>
  );
}
