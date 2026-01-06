export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { redirect } from "next/navigation";
import { getAlignmentGanttData } from "@/lib/data/alignmentGanttData";
import { AlignmentGanttClient } from "./_components/AlignmentGanttClient";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    enableAlignmentCheck?: string;
    viewMode?: string;
  }>;
}

/**
 * Alignment Page
 * 
 * Personal Space > Alignment
 * Plans와 Snapshot Entries를 타임라인 기준으로 시계열 형태로 표시
 * - /plans/gantt와 동일한 간트 차트 UI
 * - 사용자 개인 관점의 Plans + Snapshot Entries
 * - 읽기 전용 비교 뷰
 */
export default async function AlignmentPage({ searchParams }: PageProps) {
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
  const initialEnableAlignmentCheck = params.enableAlignmentCheck === "true";
  const initialViewMode = params.viewMode === "summarized" ? "summarized" : "detailed";

  // 사용자 정보 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();
  
  const userName = profile?.display_name;

  // Alignment 간트 차트 데이터 조회
  const { items, members } = await getAlignmentGanttData({
    workspaceId: DEFAULT_WORKSPACE_ID,
    userId: user.id,
  });

  return (
    <AlignmentGanttClient
      workspaceId={DEFAULT_WORKSPACE_ID}
      items={items}
      members={members}
      userName={userName}
      initialFilter={initialFilter}
      initialEnableAlignmentCheck={initialEnableAlignmentCheck}
      initialViewMode={initialViewMode}
    />
  );
}

