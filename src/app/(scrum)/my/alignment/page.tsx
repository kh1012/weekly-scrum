import { createClient } from "@/lib/supabase/server";
import { AlignmentView } from "@/components/weekly-scrum/alignment/AlignmentView";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { redirect } from "next/navigation";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

/**
 * Alignment Page
 * 
 * Personal Space > Alignment
 * Plans를 기준 축으로, Snapshots를 주차별 오버레이로 표시
 * 읽기 전용 비교 뷰
 */
export default async function AlignmentPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // 사용자 정보 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();
  
  const userName = profile?.display_name;

  return (
    <AlignmentView
      workspaceId={DEFAULT_WORKSPACE_ID}
      userId={user.id}
      userName={userName}
    />
  );
}

