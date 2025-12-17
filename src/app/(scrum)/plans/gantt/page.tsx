/**
 * /plans/gantt - Draft-first Gantt View
 * Feature 타입 Plan 편집용
 */

import { DraftGanttView } from "@/components/plans/gantt-draft";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { redirect } from "next/navigation";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

export default async function PlansGanttPage() {
  // 권한 확인
  const hasAccess = await isAdminOrLeader();
  
  if (!hasAccess) {
    redirect("/plans");
  }

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <DraftGanttView workspaceId={DEFAULT_WORKSPACE_ID} />
    </div>
  );
}

