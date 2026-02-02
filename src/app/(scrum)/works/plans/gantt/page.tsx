export const dynamic = "force-dynamic";

import {
  fetchFeaturePlans,
  getPlansMaxUpdatedAt,
} from "@/components/plans/gantt-draft/commitService";
import { listWorkspaceMembers } from "@/lib/data/members";
import { PlansGanttClient } from "./_components/PlansGanttClient";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PageProps {
  searchParams: Promise<{ 
    stages?: string; 
    assignees?: string;
    viewMode?: string;
  }>;
}

/**
 * Plans 목록 페이지 (Read-only Gantt View)
 * - 모든 로그인 사용자 접근 가능
 * - 조회만 가능, 생성/수정/삭제 불가
 * - All Plans와 동일한 UI, 읽기 전용 모드
 */
export default async function PlansPage({ searchParams }: PageProps) {
  // searchParams에서 필터 파라미터 확인
  const params = await searchParams;
  const initialStages = params.stages ? params.stages.split(",").filter(Boolean) : [];
  const initialAssignees = params.assignees ? params.assignees.split(",").filter(Boolean) : [];
  const initialViewMode = params.viewMode === "summarized" ? "summarized" : "detailed";

  // 초기 데이터 조회 (병렬)
  const [result, workspaceMembers, maxUpdatedAtResult] = await Promise.all([
    fetchFeaturePlans({ workspaceId: DEFAULT_WORKSPACE_ID }),
    listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
    getPlansMaxUpdatedAt(DEFAULT_WORKSPACE_ID),
  ]);

  const initialPlans = result.success ? result.plans || [] : [];
  const maxUpdatedAt = maxUpdatedAtResult.success
    ? maxUpdatedAtResult.maxUpdatedAt
    : undefined;
  const updatedByName = maxUpdatedAtResult.success
    ? maxUpdatedAtResult.updatedByName
    : undefined;

  // 멤버 목록을 클라이언트용으로 변환 (basicRole 포함)
  const members = workspaceMembers.map((m) => ({
    userId: m.user_id,
    displayName: m.display_name || m.email || m.user_id,
    email: m.email || undefined,
    basicRole: m.basic_role || undefined,
  }));

  // 컴포넌트 키는 고정값 사용 (Date.now() 제거 - 불필요한 리마운트 방지)
  // 로컬 스토리지 복원은 useGanttQueryPersistence 훅에서 처리
  const componentKey = "gantt-view";

  return (
    <PlansGanttClient
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
