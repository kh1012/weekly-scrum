"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition, useMemo } from "react";
import { DraftGanttView } from "@/components/plans/gantt-draft";
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
  maxUpdatedAt?: string;
  updatedByName?: string;
}

export function PlansGanttClient({
  workspaceId,
  initialPlans,
  members,
  initialStages,
  initialAssignees,
  maxUpdatedAt,
  updatedByName,
}: PlansGanttClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const selectedStages = useMemo(() => new Set(initialStages), [initialStages]);
  const selectedAssignees = useMemo(() => new Set(initialAssignees), [initialAssignees]);

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
    />
  );
}

