export const dynamic = "force-dynamic";

import { getTeamFeedData, getActivityChartData } from "@/lib/data/teamFeed";
import { InfiniteFeedList } from "@/components/team-feed/InfiniteFeedList";
import { ActivityChart } from "@/components/team-feed/ActivityChart";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

/**
 * Team Activity Feed 페이지
 * - 팀원들의 주간 활동을 스크롤로 확인
 * - 읽기 전용, 사람 중심 피드
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

  return (
    <div className="h-full overflow-hidden bg-white">
      {/* 데스크톱 레이아웃 (≥1024px): Flex 레이아웃 - 전체 너비 100% */}
      <div className="hidden lg:flex gap-4 h-full overflow-hidden px-4 py-4">
        {/* 왼쪽: Team Activity - 고정 너비 */}
        <div className="w-80 flex-shrink-0 overflow-y-auto">
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>

        {/* 중앙: 피드 - flex-1로 나머지 공간 채우기 */}
        <div className="flex-1 overflow-y-scroll min-w-0" style={{ scrollbarGutter: 'stable' }}>
          <div className="mb-4 flex items-baseline justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[#24292f] mb-1">Team Feed</h1>
              <p className="text-sm text-[#57606a]">
                팀원들의 최근 활동을 확인하세요
              </p>
            </div>
          </div>

          <InfiniteFeedList initialFeedItems={feedItems} />
        </div>
      </div>

      {/* 태블릿 레이아웃 (768-1023px): Flex 레이아웃 */}
      <div className="hidden md:flex lg:hidden gap-4 h-full overflow-hidden px-4 py-4">
        {/* 왼쪽: Team Activity - 고정 너비 */}
        <div className="w-72 flex-shrink-0 overflow-y-auto">
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>

        {/* 오른쪽: 피드 - flex-1로 나머지 공간 채우기 */}
        <div className="flex-1 overflow-y-scroll min-w-0" style={{ scrollbarGutter: 'stable' }}>
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#24292f] mb-1">Team Feed</h1>
            <p className="text-sm text-[#57606a]">
              팀원들의 최근 활동을 확인하세요
            </p>
          </div>

          <InfiniteFeedList initialFeedItems={feedItems} />
        </div>
      </div>

      {/* 모바일 레이아웃 (<768px): 1컬럼 */}
      <div className="md:hidden h-full overflow-y-scroll px-4 py-4" style={{ scrollbarGutter: 'stable' }}>
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-[#24292f] mb-1">Team Feed</h1>

          {/* 활동 요약 (한 줄) */}
          {activityData && activityData.length > 0 && (
            <p className="text-xs text-[#57606a] mt-1">
              Avg{" "}
              {(
                activityData.reduce((sum, d) => sum + d.count, 0) /
                activityData.length
              ).toFixed(1)}{" "}
              entries/day · Peak:{" "}
              {formatDate(
                activityData.reduce((prev, current) =>
                  current.count > prev.count ? current : prev
                ).date
              )}{" "}
              (
              {
                activityData.reduce((prev, current) =>
                  current.count > prev.count ? current : prev
                ).count
              }
              )
            </p>
          )}
        </div>

        {/* 피드 */}
        <InfiniteFeedList initialFeedItems={feedItems} />
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

