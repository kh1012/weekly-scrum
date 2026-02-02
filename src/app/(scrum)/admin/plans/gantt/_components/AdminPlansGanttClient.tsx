"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useMemo, useEffect, useState } from "react";
import { DraftGanttView } from "@/components/plans/gantt-draft";
import { useDraftStore } from "@/components/plans/gantt-draft/store";
import { useGanttQueryPersistence } from "@/components/plans/gantt-draft/hooks/useGanttQueryPersistence";
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
    storageKey: "admin-plans-gantt" 
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

  const selectedStages = useMemo(() => new Set(effectiveStages), [effectiveStages]);
  const selectedAssignees = useMemo(() => new Set(effectiveAssignees), [effectiveAssignees]);
  
  const setViewModeStore = useDraftStore((s) => s.setViewMode);

  // 초기 로드 시 URL의 viewMode를 store에 설정
  useEffect(() => {
    setViewModeStore(effectiveViewMode);
  }, [effectiveViewMode, setViewModeStore]);

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
    [router, searchParams]
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
    [router, searchParams]
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
    [setViewModeStore, router, searchParams]
  );

  return (
    <DraftGanttView
      workspaceId={workspaceId}
      initialPlans={initialPlans}
      members={members}
      selectedStages={selectedStages}
      onStagesChange={handleStagesChange}
      selectedAssignees={selectedAssignees}
      onAssigneesChange={handleAssigneesChange}
      isFilterLoading={isPending || !isRestored}
      maxUpdatedAt={maxUpdatedAt}
      updatedByName={updatedByName}
      onViewModeChange={handleViewModeChange}
    />
  );
}

