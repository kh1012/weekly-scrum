export const dynamic = "force-dynamic";

import { fetchFeaturePlans, getPlansMaxUpdatedAt } from "@/components/plans/gantt-draft/commitService";
import { listWorkspaceMembers } from "@/lib/data/members";
import { PlansGanttClient } from "./_components/PlansGanttClient";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PageProps {
  searchParams: Promise<{ onlyMine?: string }>;
}

/**
 * Plans 목록 페이지 (Read-only Gantt View)
 * - 모든 로그인 사용자 접근 가능
 * - 조회만 가능, 생성/수정/삭제 불가
 * - All Plans와 동일한 UI, 읽기 전용 모드
 */
export default async function PlansPage({ searchParams }: PageProps) {
  // searchParams에서 onlyMine 파라미터 확인
  const params = await searchParams;
  const onlyMine = params.onlyMine === "1" || params.onlyMine === "true";

  // 초기 데이터 조회 (병렬)
  const [result, workspaceMembers, maxUpdatedAtResult] = await Promise.all([
    fetchFeaturePlans({ workspaceId: DEFAULT_WORKSPACE_ID, onlyMine }),
    listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
    getPlansMaxUpdatedAt(DEFAULT_WORKSPACE_ID),
  ]);

  const initialPlans = result.success ? result.plans || [] : [];
  const maxUpdatedAt = maxUpdatedAtResult.success ? maxUpdatedAtResult.maxUpdatedAt : undefined;
  const updatedByName = maxUpdatedAtResult.success ? maxUpdatedAtResult.updatedByName : undefined;

  // 멤버 목록을 클라이언트용으로 변환
  const members = workspaceMembers.map((m) => ({
    userId: m.user_id,
    displayName: m.display_name || m.email || m.user_id,
    email: m.email || undefined,
  }));

  return (
    <PlansGanttClient
      workspaceId={DEFAULT_WORKSPACE_ID}
      initialPlans={initialPlans}
      members={members}
      initialOnlyMine={onlyMine}
      maxUpdatedAt={maxUpdatedAt}
      updatedByName={updatedByName}
    />
  );
}
