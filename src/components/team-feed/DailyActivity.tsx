"use client";

import type { FeedItemData } from "@/types/teamFeed";

interface DailyActivityProps {
  feedItems: FeedItemData[];
}

interface DailyGroup {
  date: string;
  dayLabel: string;
  contributors: Array<{
    personName: string;
    personId: string;
    entryCount: number;
  }>;
}

/**
 * 일자별 활동 표시 컴포넌트 - GitHub 스타일
 * - 최근 7일간의 일별 기여자 표시
 */
export function DailyActivity({ feedItems }: DailyActivityProps) {
  // 오늘부터 7일 전까지의 날짜 생성
  const getLast7Days = () => {
    const days: string[] = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const last7Days = getLast7Days();

  // 날짜별 그룹화
  const dailyGroups: DailyGroup[] = last7Days.map((date) => {
    const contributorMap = new Map<string, { personName: string; entryCount: number }>();

    feedItems.forEach((item) => {
      // updated_at 날짜가 해당 날짜인지 확인
      const itemDate = new Date(item.latestActivityDate).toISOString().split('T')[0];
      if (itemDate === date) {
        const existing = contributorMap.get(item.personId);
        if (existing) {
          existing.entryCount += item.entries.length;
        } else {
          contributorMap.set(item.personId, {
            personName: item.personName,
            entryCount: item.entries.length,
          });
        }
      }
    });

    const contributors = Array.from(contributorMap.entries()).map(([personId, data]) => ({
      personId,
      personName: data.personName,
      entryCount: data.entryCount,
    }));

    // 날짜 포맷팅
    const dateObj = new Date(date);
    const dayLabel = new Intl.DateTimeFormat("ko-KR", {
      month: "numeric",
      day: "numeric",
      weekday: "short",
    }).format(dateObj);

    return {
      date,
      dayLabel,
      contributors,
    };
  });

  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-[#24292f] mb-1">
          Recent Activity
        </h2>
        <p className="text-xs text-[#57606a]">
          Last 7 days
        </p>
      </div>

      {/* 일자별 활동 */}
      <div className="space-y-3">
        {dailyGroups.map((day) => (
          <div key={day.date} className="border-l-2 border-[#d0d7de] pl-3">
            <div className="mb-2">
              <p className="text-xs font-semibold text-[#24292f]">
                {day.dayLabel}
              </p>
            </div>

            {day.contributors.length > 0 ? (
              <div className="space-y-1.5">
                {day.contributors.map((contributor) => (
                  <div
                    key={contributor.personId}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#0969da] flex items-center justify-center text-white font-semibold text-[10px] flex-shrink-0">
                      {contributor.personName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[#57606a] truncate">
                      {contributor.personName}
                    </span>
                    <span className="text-[#8c959f] text-[10px]">
                      {contributor.entryCount} entries
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#8c959f]">No activity</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

