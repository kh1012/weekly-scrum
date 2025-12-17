/**
 * /admin/plans/gantt - Admin Gantt Editor
 * Feature 타입 Plan 편집용 (관리자/리더 전용)
 */

export const dynamic = "force-dynamic";

import { DraftGanttView } from "@/components/plans/gantt-draft";
import { fetchFeaturePlans } from "@/components/plans/gantt-draft/commitService";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { listWorkspaceMembers } from "@/lib/data/members";
import { redirect } from "next/navigation";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

export default async function AdminPlansGanttPage() {
  // 권한 확인
  const hasAccess = await isAdminOrLeader();
  
  if (!hasAccess) {
    redirect("/plans");
  }

  // 초기 데이터 조회 (병렬)
  const [result, workspaceMembers] = await Promise.all([
    fetchFeaturePlans(DEFAULT_WORKSPACE_ID),
    listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
  ]);
  
  const initialPlans = result.success ? result.plans || [] : [];
  
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
    <DraftGanttView 
      workspaceId={DEFAULT_WORKSPACE_ID} 
      initialPlans={initialPlans}
      members={members}
    />
  );
}

