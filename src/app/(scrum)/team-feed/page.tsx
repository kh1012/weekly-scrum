export const dynamic = "force-dynamic";

import { getTeamFeedData, getActivityChartData } from "@/lib/data/teamFeed";
import { FeedItem } from "@/components/team-feed/FeedItem";
import { TimelineSpine } from "@/components/team-feed/TimelineSpine";
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

  // 주차 목록 추출 (타임라인용)
  const weeksMap = new Map<string, { year: number; week: string }>();
  for (const item of feedItems) {
    const key = `${item.year}-${item.week}`;
    if (!weeksMap.has(key)) {
      weeksMap.set(key, { year: item.year, week: item.week });
    }
  }

  const weeks = Array.from(weeksMap.values()).map((w) => ({
    year: w.year,
    week: w.week,
    label: `${w.week}`,
  }));

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
      {/* 데스크톱 레이아웃 (≥1024px): GitHub 스타일 */}
      <div className="hidden lg:grid lg:grid-cols-[240px_1fr_360px] gap-6 h-full overflow-hidden px-6 py-6">
        {/* 왼쪽: 타임라인 스파인 */}
        <div className="overflow-y-auto">
          <div className="bg-white border border-[#d0d7de] rounded-md p-4">
            <h2 className="text-sm font-semibold text-[#24292f] mb-3">Weeks</h2>
            <TimelineSpine weeks={weeks} />
          </div>
        </div>

        {/* 중앙: 피드 - GitHub 스타일 */}
        <div className="overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#24292f] mb-1">Team Feed</h1>
            <p className="text-sm text-[#57606a]">
              팀원들의 최근 활동을 확인하세요
            </p>
          </div>

          {feedItems.map((item) => (
            <FeedItem
              key={`${item.personId}-${item.year}-${item.week}`}
              data={item}
            />
          ))}
        </div>

        {/* 오른쪽: 활동 차트 */}
        <div className="overflow-y-auto">
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>
      </div>

      {/* 태블릿 레이아웃 (768-1023px): 2컬럼 */}
      <div className="hidden md:grid lg:hidden md:grid-cols-[1fr_300px] gap-4 h-full overflow-hidden px-4 py-4">
        {/* 왼쪽: 피드 */}
        <div className="overflow-y-auto">
          <div className="mb-4">
            <h1 className="text-xl font-semibold text-[#24292f] mb-1">Team Feed</h1>
            <p className="text-sm text-[#57606a]">
              팀원들의 최근 활동을 확인하세요
            </p>
          </div>

          {feedItems.map((item) => (
            <FeedItem
              key={`${item.personId}-${item.year}-${item.week}`}
              data={item}
            />
          ))}
        </div>

        {/* 오른쪽: 활동 차트 */}
        <div className="overflow-y-auto">
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 (<768px): 1컬럼 */}
      <div className="md:hidden h-full overflow-y-auto px-4 py-4">
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
        {feedItems.map((item) => (
          <FeedItem
            key={`${item.personId}-${item.year}-${item.week}`}
            data={item}
          />
        ))}
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

