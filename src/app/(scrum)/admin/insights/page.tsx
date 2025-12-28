import { getFlagPlanSummary, getResourceDistribution, getCollabEdges } from "@/lib/data/insights";
import { InsightsView } from "./_components/InsightsView";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

/**
 * Admin Insights 페이지
 * - DB 뷰를 사용한 Insights 표시
 */
export default async function AdminInsightsPage() {
  // 3개 뷰 데이터 병렬 조회
  const [flagSummaryResult, resourceDistResult, collabEdgesResult] = await Promise.all([
    getFlagPlanSummary(DEFAULT_WORKSPACE_ID),
    getResourceDistribution(DEFAULT_WORKSPACE_ID),
    getCollabEdges(DEFAULT_WORKSPACE_ID),
  ]);

  return (
    <InsightsView
      flagSummary={flagSummaryResult.data}
      resourceDist={resourceDistResult.data}
      collabEdges={collabEdgesResult.data}
      errors={{
        flagSummary: flagSummaryResult.error,
        resourceDist: resourceDistResult.error,
        collabEdges: collabEdgesResult.error,
      }}
    />
  );
}

