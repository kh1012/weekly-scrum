"use client";

import type { CollaboratorStat } from "@/types/scrum";

interface CollaboratorStatsProps {
  stats: CollaboratorStat[];
  topPair: { name: string; count: number }[];
  topWaitingOn: { name: string; count: number }[];
}

const RELATION_LABELS: Record<string, { label: string; color: string }> = {
  pair: { label: "페어", color: "var(--notion-blue)" },
  "waiting-on": { label: "대기", color: "var(--notion-orange)" },
  review: { label: "리뷰", color: "var(--notion-purple)" },
  handoff: { label: "인수", color: "var(--notion-green)" },
};

export function CollaboratorStats({
  stats,
  topPair,
  topWaitingOn,
}: CollaboratorStatsProps) {
  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="notion-card">
      <div className="flex items-center gap-2 mb-3">
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--notion-text-secondary)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h3
          className="text-sm font-medium"
          style={{ color: "var(--notion-text-primary)" }}
        >
          협업 현황
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 협업 Top 5 */}
        <div>
          <h4
            className="text-xs font-medium mb-2"
            style={{ color: "var(--notion-text-secondary)" }}
          >
            협업 많은 멤버 Top 5
          </h4>
          <div className="space-y-1.5">
            {stats.slice(0, 5).map((stat, index) => (
              <div
                key={stat.name}
                className="flex items-center justify-between py-1 px-2 rounded"
                style={{ backgroundColor: "var(--notion-bg-secondary)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-medium w-4 text-center"
                    style={{ color: "var(--notion-text-tertiary)" }}
                  >
                    {index + 1}
                  </span>
                  <span
                    className="text-sm"
                    style={{ color: "var(--notion-text-primary)" }}
                  >
                    {stat.name}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Object.entries(stat.relations).map(([relation, count]) => {
                    if (count === 0) return null;
                    const config = RELATION_LABELS[relation];
                    return (
                      <span
                        key={relation}
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${config.color}20`,
                          color: config.color,
                        }}
                        title={config.label}
                      >
                        {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pair / Waiting-on 요약 */}
        <div className="space-y-3">
          {topPair.length > 0 && (
            <div>
              <h4
                className="text-xs font-medium mb-2"
                style={{ color: "var(--notion-blue)" }}
              >
                페어 협업 Top
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {topPair.map((item) => (
                  <span
                    key={item.name}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: "var(--notion-blue-bg)",
                      color: "var(--notion-blue)",
                    }}
                  >
                    {item.name} ({item.count})
                  </span>
                ))}
              </div>
            </div>
          )}

          {topWaitingOn.length > 0 && (
            <div>
              <h4
                className="text-xs font-medium mb-2"
                style={{ color: "var(--notion-orange)" }}
              >
                대기 중 Top
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {topWaitingOn.map((item) => (
                  <span
                    key={item.name}
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      backgroundColor: "var(--notion-orange-bg)",
                      color: "var(--notion-orange)",
                    }}
                  >
                    {item.name} ({item.count})
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

