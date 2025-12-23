/**
 * /admin/plans/gantt - Admin Gantt Editor
 * Feature 타입 Plan 편집용 (관리자/리더 전용)
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
  searchParams: Promise<{ onlyMine?: string }>;
}

export default async function AdminPlansGanttPage({ searchParams }: PageProps) {
  // searchParams에서 onlyMine 파라미터 확인
  const params = await searchParams;
  const onlyMine = params.onlyMine === "1" || params.onlyMine === "true";

  // 권한 확인과 데이터 조회를 병렬로 실행
  const [hasAccess, result, workspaceMembers, maxUpdatedAtResult] =
    await Promise.all([
      isAdminOrLeader(),
      fetchFeaturePlans({ workspaceId: DEFAULT_WORKSPACE_ID, onlyMine }),
      listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
      getPlansMaxUpdatedAt(DEFAULT_WORKSPACE_ID),
    ]);

  // 권한 없으면 리다이렉트
  if (!hasAccess) {
    redirect("/plans");
  }

  const initialPlans = result.success ? result.plans || [] : [];
  const maxUpdatedAt = maxUpdatedAtResult.success
    ? maxUpdatedAtResult.maxUpdatedAt
    : undefined;
  const updatedByName = maxUpdatedAtResult.success
    ? maxUpdatedAtResult.updatedByName
    : undefined;

  // 멤버 목록을 클라이언트용으로 변환
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
    };
  });

  return (
    <AdminPlansGanttClient
      workspaceId={DEFAULT_WORKSPACE_ID}
      initialPlans={initialPlans}
      members={members}
      initialOnlyMine={onlyMine}
      maxUpdatedAt={maxUpdatedAt}
      updatedByName={updatedByName}
    />
  );
}
