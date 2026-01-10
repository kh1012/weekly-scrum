import { createClient } from "@/lib/supabase/server";
import { DataOnlyDashboardProgressive } from "@/components/weekly-scrum/my/DataOnlyDashboardProgressive";
import { getPersonalDashboardMetricsCore } from "@/lib/dashboard/getPersonalDashboardMetricsCore";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { redirect } from "next/navigation";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

/**
 * Personal Space > Dashboard
 * 
 * 데이터 전용 개인 분석 뷰 (증분 로딩 적용)
 * - 핵심 메트릭만 서버에서 로딩 (빠른 초기 렌더링)
 * - 차트 데이터는 클라이언트에서 추가 로딩
 */
export default async function MyPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }

  // 프로필 조회와 핵심 메트릭만 병렬로 실행
  const [profileResult, coreMetrics] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single(),
    getPersonalDashboardMetricsCore({
      workspaceId: DEFAULT_WORKSPACE_ID,
      userId: user.id,
    }),
  ]);
  
  const userName = profileResult.data?.display_name;

  return (
    <DataOnlyDashboardProgressive 
      userName={userName} 
      coreMetrics={coreMetrics}
      workspaceId={DEFAULT_WORKSPACE_ID}
    />
  );
}
