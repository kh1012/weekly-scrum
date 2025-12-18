import { DraftGanttView } from "@/components/plans/gantt-draft";
import { fetchFeaturePlans } from "@/components/plans/gantt-draft/commitService";
import { listWorkspaceMembers } from "@/lib/data/members";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

/**
 * Plans 목록 페이지 (Read-only Gantt View)
 * - 모든 로그인 사용자 접근 가능
 * - 조회만 가능, 생성/수정/삭제 불가
 * - All Plans와 동일한 UI, 읽기 전용 모드
 */
export default async function PlansPage() {
  // 초기 데이터 조회 (병렬)
  const [result, workspaceMembers] = await Promise.all([
    fetchFeaturePlans(DEFAULT_WORKSPACE_ID),
    listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
  ]);

  const initialPlans = result.success ? result.plans || [] : [];

  // 멤버 목록을 클라이언트용으로 변환
  const members = workspaceMembers.map((m) => ({
    userId: m.user_id,
    displayName: m.display_name || m.email || m.user_id,
    email: m.email || undefined,
  }));

  return (
    <DraftGanttView
      workspaceId={DEFAULT_WORKSPACE_ID}
      initialPlans={initialPlans}
      members={members}
      readOnly={true}
      title="계획"
    />
  );
}

