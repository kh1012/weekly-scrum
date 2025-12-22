"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
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
  initialOnlyMine: boolean;
}

export function PlansGanttClient({
  workspaceId,
  initialPlans,
  members,
  initialOnlyMine,
}: PlansGanttClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleOnlyMineChange = useCallback(
    (value: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("onlyMine", "1");
      } else {
        params.delete("onlyMine");
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
      onlyMine={initialOnlyMine}
      onOnlyMineChange={handleOnlyMineChange}
      isFilterLoading={isPending}
    />
  );
}

