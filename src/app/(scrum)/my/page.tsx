import { createClient } from "@/lib/supabase/server";
import { DataOnlyDashboard } from "@/components/weekly-scrum/my/DataOnlyDashboard";
import { getPersonalDashboardMetrics } from "@/lib/dashboard/getPersonalDashboardMetrics";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { redirect } from "next/navigation";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

/**
 * Personal Space > Dashboard
 * 
 * 데이터 전용 개인 분석 뷰
 * - 숏컷 버튼 없음
 * - 개인 메트릭만 표시
 */
export default async function MyPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // 프로필 조회와 메트릭 조회를 병렬로 실행
  const [profileResult, metrics] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single(),
    getPersonalDashboardMetrics({
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: user.id,
    }),
  ]);
  
  const userName = profileResult.data?.display_name;

  return <DataOnlyDashboard userName={userName} metrics={metrics} />;
}
