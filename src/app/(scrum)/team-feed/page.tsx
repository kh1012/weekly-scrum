export const dynamic = "force-dynamic";

import { getTeamFeedData, getActivityChartData } from "@/lib/data/teamFeed";
import { TeamFeedClient } from "@/components/team-feed/TeamFeedClient";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

/**
 * Team Activity Feed 페이지
 * - 팀원들의 주간 활동을 스크롤로 확인
 * - 읽기 전용, 사람 중심 피드
 * - 우측에 타임라인 UI 추가
 */
export default async function TeamFeedPage() {
  const { feedItems, error: feedError } = await getTeamFeedData(
    DEFAULT_WORKSPACE_ID,
    8
  );
  const { activityData, error: activityError } = await getActivityChartData(
    DEFAULT_WORKSPACE_ID,
    14
  );


  if (feedError) {
    return (
      <div className="h-full flex items-center justify-center bg-white px-4">
        <div className="text-center p-6 bg-white border border-[#d0d7de] rounded-md max-w-md">
          <h2 className="text-base font-semibold text-[#24292f] mb-2">
            데이터를 불러올 수 없습니다
          </h2>
          <p className="text-sm text-[#57606a]">{feedError}</p>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center bg-white px-4">
        <div className="text-center p-6 bg-white border border-[#d0d7de] rounded-md max-w-md">
          <h2 className="text-base font-semibold text-[#24292f] mb-2">
            아직 작성된 스냅샷이 없습니다
          </h2>
          <p className="text-sm text-[#57606a]">
            팀원들이 스냅샷을 작성하면 여기에 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return <TeamFeedClient initialFeedItems={feedItems} activityData={activityData} />;
}

