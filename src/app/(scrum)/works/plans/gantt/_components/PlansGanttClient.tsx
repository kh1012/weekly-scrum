"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useMemo, useEffect, useState } from "react";
import { DraftGanttView } from "@/components/plans/gantt-draft";
import { useDraftStore } from "@/components/plans/gantt-draft/store";
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

interface PlansGanttClientProps {
  workspaceId: string;
  initialPlans: InitialPlan[];
  members: WorkspaceMemberOption[];
  initialStages: string[];
  initialAssignees: string[];
  initialViewMode: "detailed" | "summarized";
  initialEnableAlignmentCheck: boolean;
  maxUpdatedAt?: string;
  updatedByName?: string;
}

export function PlansGanttClient({
  workspaceId,
  initialPlans,
  members,
  initialStages,
  initialAssignees,
  initialViewMode,
  initialEnableAlignmentCheck,
  maxUpdatedAt,
  updatedByName,
}: PlansGanttClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedStages = useMemo(() => new Set(initialStages), [initialStages]);
  const selectedAssignees = useMemo(() => new Set(initialAssignees), [initialAssignees]);
  
  const setViewMode = useDraftStore((s) => s.setViewMode);
  const viewMode = useDraftStore((s) => s.ui.viewMode);
  const [enableAlignmentCheck, setEnableAlignmentCheck] = useState(initialEnableAlignmentCheck);

  // 초기 로드 시 URL의 viewMode를 store에 설정
  useEffect(() => {
    setViewMode(initialViewMode);
  }, [initialViewMode, setViewMode]);

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

  // viewMode 변경 감지 및 querystring 업데이트
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentViewMode = params.get("viewMode");
    
    if (viewMode !== initialViewMode) {
      if (viewMode === "summarized") {
        params.set("viewMode", "summarized");
      } else {
        params.delete("viewMode"); // detailed가 기본값이므로 제거
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    }
  }, [viewMode, initialViewMode, router, searchParams]);

  const handleEnableAlignmentCheckChange = useCallback(
    (enabled: boolean) => {
      setEnableAlignmentCheck(enabled);
      const params = new URLSearchParams(searchParams.toString());
      if (enabled) {
        params.set("enableAlignmentCheck", "true");
      } else {
        params.delete("enableAlignmentCheck");
      }
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  return (
    <DraftGanttView
      workspaceId={workspaceId}
      initialPlans={initialPlans}
      members={members}
      readOnly={true}
      title="계획"
      selectedStages={selectedStages}
      onStagesChange={handleStagesChange}
      selectedAssignees={selectedAssignees}
      onAssigneesChange={handleAssigneesChange}
      isFilterLoading={isPending}
      maxUpdatedAt={maxUpdatedAt}
      updatedByName={updatedByName}
      enableAlignmentCheck={enableAlignmentCheck}
      onEnableAlignmentCheckChange={handleEnableAlignmentCheckChange}
    />
  );
}

