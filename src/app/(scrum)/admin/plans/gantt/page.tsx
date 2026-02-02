/**
 * /admin/plans/gantt - Admin Gantt Editor
 * Feature 타입 Plan 편집용 (관리자/매니저 전용)
 */

export const dynamic = "force-dynamic";

import {
  fetchFeaturePlans,
  getPlansMaxUpdatedAt,
} from "@/components/plans/gantt-draft/commitService";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { listWorkspaceMembers } from "@/lib/data/members";
import { redirect } from "next/navigation";
import { AdminPlansGanttClient } from "./_components/AdminPlansGanttClient";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PageProps {
  searchParams: Promise<{ 
    stages?: string; 
    assignees?: string;
    viewMode?: string;
  }>;
}

export default async function AdminPlansGanttPage({ searchParams }: PageProps) {
  // searchParams에서 필터 파라미터 확인
  const params = await searchParams;
  const initialStages = params.stages ? params.stages.split(",").filter(Boolean) : [];
  const initialAssignees = params.assignees ? params.assignees.split(",").filter(Boolean) : [];
  const initialViewMode = params.viewMode === "summarized" ? "summarized" : "detailed";

  // 권한 확인과 데이터 조회를 병렬로 실행
  const [hasAccess, result, workspaceMembers, maxUpdatedAtResult] =
    await Promise.all([
      isAdminOrLeader(),
      fetchFeaturePlans({ workspaceId: DEFAULT_WORKSPACE_ID }),
      listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
      getPlansMaxUpdatedAt(DEFAULT_WORKSPACE_ID),
    ]);

  // 권한 없으면 리다이렉트
  if (!hasAccess) {
    redirect("/works/plans");
  }

  const initialPlans = result.success ? result.plans || [] : [];
  const maxUpdatedAt = maxUpdatedAtResult.success
    ? maxUpdatedAtResult.maxUpdatedAt
    : undefined;
  const updatedByName = maxUpdatedAtResult.success
    ? maxUpdatedAtResult.updatedByName
    : undefined;

  // 멤버 목록을 클라이언트용으로 변환 (basicRole 포함)
  const members = workspaceMembers.map((m) => {
    // 표시 이름 결정: display_name > email 앞부분 > 짧은 user_id
    let displayName = m.display_name?.trim();
    if (!displayName && m.email) {
      // 이메일에서 @ 앞부분 추출
      displayName = m.email.split("@")[0];
    }
    if (!displayName) {
      // user_id 앞 8자리만 표시
      displayName = `사용자 ${m.user_id.slice(0, 8)}`;
    }

    return {
      userId: m.user_id,
      displayName,
      email: m.email || undefined,
      basicRole: m.basic_role || undefined,
    };
  });

  // 쿼리 파라미터가 없으면 강제 리마운트하여 로컬 스토리지에서 복원하도록 함
  const hasPersistedParams = params.stages || params.assignees || params.viewMode;
  const componentKey = hasPersistedParams ? "with-params" : `restore-${Date.now()}`;

  return (
    <AdminPlansGanttClient
      key={componentKey}
      workspaceId={DEFAULT_WORKSPACE_ID}
      initialPlans={initialPlans}
      members={members}
      initialStages={initialStages}
      initialAssignees={initialAssignees}
      initialViewMode={initialViewMode}
      maxUpdatedAt={maxUpdatedAt}
      updatedByName={updatedByName}
    />
  );
}
