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
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            데이터를 불러올 수 없습니다
          </h2>
          <p className="text-gray-600">{feedError}</p>
        </div>
      </div>
    );
  }

  if (feedItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            아직 작성된 스냅샷이 없습니다
          </h2>
          <p className="text-gray-600">
            팀원들이 스냅샷을 작성하면 여기에 표시됩니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden">
      {/* 데스크톱 레이아웃 (≥1024px): 3컬럼 */}
      <div className="hidden lg:grid lg:grid-cols-[240px_1fr_360px] gap-8 h-full overflow-hidden px-8">
        {/* 왼쪽: 타임라인 스파인 */}
        <div className="overflow-y-auto">
          <TimelineSpine weeks={weeks} />
        </div>

        {/* 중앙: 피드 */}
        <div className="overflow-y-auto">
          <div className="max-w-3xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Feed</h1>
            <p className="text-gray-600 mb-12">
              팀원들의 최근 활동을 확인하세요
            </p>

            {feedItems.map((item) => (
              <FeedItem
                key={`${item.personId}-${item.year}-${item.week}`}
                data={item}
              />
            ))}
          </div>
        </div>

        {/* 오른쪽: 활동 차트 */}
        <div className="overflow-y-auto">
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>
      </div>

      {/* 태블릿 레이아웃 (768-1023px): 2컬럼 */}
      <div className="hidden md:grid lg:hidden md:grid-cols-[1fr_320px] gap-6 h-full overflow-hidden px-6">
        {/* 왼쪽: 피드 (sticky 주차 헤더) */}
        <div className="overflow-y-auto">
          <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Team Feed</h1>
            <p className="text-gray-600 mb-12">
              팀원들의 최근 활동을 확인하세요
            </p>

            {weeks.map((week) => {
              const weekItems = feedItems.filter(
                (item) => item.year === week.year && item.week === week.week
              );

              return (
                <div key={`${week.year}-${week.week}`} className="mb-12">
                  {/* Sticky Week Header */}
                  <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-3 mb-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {week.year} {week.label}
                    </h2>
                  </div>

                  {weekItems.map((item) => (
                    <FeedItem
                      key={`${item.personId}-${item.year}-${item.week}`}
                      data={item}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* 오른쪽: 활동 차트 */}
        <div className="overflow-y-auto">
          {activityData && activityData.length > 0 && (
            <ActivityChart data={activityData} />
          )}
        </div>
      </div>

      {/* 모바일 레이아웃 (<768px): 1컬럼 */}
      <div className="md:hidden h-full overflow-y-auto px-4">
        <div className="max-w-xl mx-auto py-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Feed</h1>

          {/* 활동 요약 (한 줄) */}
          {activityData && activityData.length > 0 && (
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
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
            </div>
          )}

          {/* 피드 (sticky 주차 헤더) */}
          {weeks.map((week) => {
            const weekItems = feedItems.filter(
              (item) => item.year === week.year && item.week === week.week
            );

            return (
              <div key={`${week.year}-${week.week}`} className="mb-8">
                {/* Sticky Week Header */}
                <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 py-3 mb-6 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900">
                    {week.year} {week.label}
                  </h2>
                </div>

                {weekItems.map((item) => (
                  <FeedItem
                    key={`${item.personId}-${item.year}-${item.week}`}
                    data={item}
                  />
                ))}
              </div>
            );
          })}
        </div>
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

