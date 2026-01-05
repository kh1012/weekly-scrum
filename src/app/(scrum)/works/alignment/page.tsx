export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { redirect } from "next/navigation";
import { WorksAlignmentClient } from "./_components/WorksAlignmentClient";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

/**
 * Works > Alignment Page
 * 
 * Workspace-wide alignment view
 * - Plans와 모든 사용자의 Snapshot Entries를 타임라인에 표시
 * - 개인 연결 화살표는 각 사용자별로만 표시
 * - 읽기 전용 뷰
 */
export default async function WorksAlignmentPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // Placeholder: 데이터는 클라이언트 컴포넌트에서 조회
  return (
    <WorksAlignmentClient
      workspaceId={DEFAULT_WORKSPACE_ID}
    />
  );
}

