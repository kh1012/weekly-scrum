"use client";

import type { WeeklyScrumData, Relation } from "@/types/scrum";

interface CollaborationIntensityProps {
  weeklyData: CollaborationWeekData[];
}

export interface CollaborationWeekData {
  weekKey: string;
  weekLabel: string;
  pair: number;
  pre: number;
  post: number;
  total: number;
}

const RELATION_CONFIG: Record<
  Relation,
  { label: string; color: string; bgColor: string }
> = {
  pair: {
    label: "페어",
    color: "var(--notion-blue)",
    bgColor: "var(--notion-blue-bg)",
  },
  pre: {
    label: "선행",
    color: "var(--notion-orange)",
    bgColor: "var(--notion-orange-bg)",
  },
  post: {
    label: "후행",
    color: "var(--notion-green)",
    bgColor: "var(--notion-green-bg)",
  },
};

export function CollaborationIntensity({ weeklyData }: CollaborationIntensityProps) {
  if (weeklyData.length === 0) {
    return null;
  }

  // 협업 데이터가 전혀 없는 경우
  const hasAnyCollaboration = weeklyData.some((w) => w.total > 0);
  if (!hasAnyCollaboration) {
    return null;
  }

  const maxTotal = Math.max(...weeklyData.map((w) => w.total), 1);

  // 전체 합계 계산
  const totals = weeklyData.reduce(
    (acc, w) => ({
      pair: acc.pair + w.pair,
      pre: acc.pre + w.pre,
      post: acc.post + w.post,
      total: acc.total + w.total,
    }),
    { pair: 0, pre: 0, post: 0, total: 0 }
  );

  return (
    <div className="notion-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--notion-text-secondary)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="text-base font-semibold" style={{ color: "var(--notion-text)" }}>
          협업 강도 요약
        </h3>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 mb-4">
        {(["pair", "pre", "post"] as Relation[]).map((relation) => {
          const config = RELATION_CONFIG[relation];
          const count =
            relation === "pre"
              ? totals.pre
              : relation === "pair"
              ? totals.pair
              : totals.post;

          if (count === 0) return null;

          return (
            <div key={relation} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded"
                style={{ backgroundColor: config.color }}
              />
              <span
                className="text-xs"
                style={{ color: "var(--notion-text-secondary)" }}
              >
                {config.label} ({count})
              </span>
            </div>
          );
        })}
      </div>

      {/* 주차별 바 차트 */}
      <div className="space-y-2">
        {weeklyData.map((week) => (
          <div key={week.weekKey} className="flex items-center gap-3">
            <span
              className="text-xs w-16 shrink-0"
              style={{ color: "var(--notion-text-tertiary)" }}
            >
              {week.weekLabel}
            </span>
            <div
              className="flex-1 h-5 rounded overflow-hidden flex"
              style={{ backgroundColor: "var(--notion-bg-tertiary)" }}
            >
              {week.total > 0 ? (
                <>
                  {week.pair > 0 && (
                    <div
                      className="h-full"
                      style={{
                        width: `${(week.pair / maxTotal) * 100}%`,
                        backgroundColor: RELATION_CONFIG.pair.color,
                      }}
                      title={`페어: ${week.pair}`}
                    />
                  )}
                  {week.pre > 0 && (
                    <div
                      className="h-full"
                      style={{
                        width: `${(week.pre / maxTotal) * 100}%`,
                        backgroundColor: RELATION_CONFIG.pre.color,
                      }}
                      title={`선행: ${week.pre}`}
                    />
                  )}
                  {week.post > 0 && (
                    <div
                      className="h-full"
                      style={{
                        width: `${(week.post / maxTotal) * 100}%`,
                        backgroundColor: RELATION_CONFIG.post.color,
                      }}
                      title={`후행: ${week.post}`}
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
                    -
                  </span>
                </div>
              )}
            </div>
            <span
              className="text-xs w-6 text-right"
              style={{ color: "var(--notion-text-secondary)" }}
            >
              {week.total}
            </span>
          </div>
        ))}
      </div>

      {/* 요약 */}
      <div
        className="mt-4 pt-4 text-xs"
        style={{
          borderTop: "1px solid var(--notion-border)",
          color: "var(--notion-text-tertiary)",
        }}
      >
        총 {totals.total}건의 협업 ({weeklyData.length}주 기준)
      </div>
    </div>
  );
}

/**
 * 주차별 협업 데이터 계산
 */
export function calculateCollaborationIntensity(
  allData: Record<string, WeeklyScrumData>,
  sortedWeekKeys: string[],
  memberName: string,
  weekCount: number = 4
): CollaborationWeekData[] {
  const recentWeeks = sortedWeekKeys.slice(-weekCount);

  return recentWeeks.map((weekKey) => {
    const weekData = allData[weekKey];
    if (!weekData) {
      return {
        weekKey,
        weekLabel: weekKey,
        pair: 0,
        pre: 0,
        post: 0,
        total: 0,
      };
    }

    const memberItems = weekData.items.filter((item) => item.name === memberName);
    const counts = { pair: 0, pre: 0, post: 0 };

    memberItems.forEach((item) => {
      if (!item.collaborators) return;

      item.collaborators.forEach((collab) => {
        switch (collab.relation) {
          case "pair":
            counts.pair++;
            break;
          case "pre":
            counts.pre++;
            break;
          case "post":
            counts.post++;
            break;
        }
      });
    });

    // 주차 라벨 생성
    const weekLabel = `${weekData.month}/${weekData.week.replace("W", "")}`;

    return {
      weekKey,
      weekLabel,
      ...counts,
      total: counts.pair + counts.pre + counts.post,
    };
  });
}
