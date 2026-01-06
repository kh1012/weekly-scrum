export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { redirect } from "next/navigation";
import { getWorkspaceAlignmentData } from "@/lib/data/alignmentGanttData";
import { WorksAlignmentClient } from "./_components/WorksAlignmentClient";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    assignees?: string;
    enableAlignmentCheck?: string;
    viewMode?: string;
  }>;
}

/**
 * Works > Alignment Page
 * 
 * Workspace-wide alignment view
 * - Plans와 모든 사용자의 Snapshot Entries를 타임라인에 표시
 * - 개인 연결 화살표는 각 사용자별로만 표시
 * - 읽기 전용 뷰
 */
export default async function WorksAlignmentPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // searchParams에서 필터 파라미터 확인
  const params = await searchParams;
  const initialFilter = (params.filter === "plans" || params.filter === "snapshots") 
    ? params.filter 
    : "all";
  const initialAssignees = params.assignees ? params.assignees.split(",").filter(Boolean) : [];
  const initialEnableAlignmentCheck = params.enableAlignmentCheck === "true";
  const initialViewMode = params.viewMode === "summarized" ? "summarized" : "detailed";

  // Workspace-wide Alignment 데이터 조회
  const { items, members } = await getWorkspaceAlignmentData({
    workspaceId: DEFAULT_WORKSPACE_ID,
  });

  return (
    <WorksAlignmentClient
      workspaceId={DEFAULT_WORKSPACE_ID}
      items={items}
      members={members}
      initialFilter={initialFilter}
      initialAssignees={initialAssignees}
      initialEnableAlignmentCheck={initialEnableAlignmentCheck}
      initialViewMode={initialViewMode}
    />
  );
}

