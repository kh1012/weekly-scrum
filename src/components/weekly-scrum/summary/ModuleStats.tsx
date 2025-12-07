"use client";

import { getDomainColor } from "@/lib/colorDefines";

interface ModuleStatsProps {
  stats: { module: string; count: number; avgProgress: number }[];
}

export function ModuleStats({ stats }: ModuleStatsProps) {
  if (stats.length === 0) {
    return null;
  }

  // "(모듈 없음)"만 있는 경우 표시하지 않음
  if (stats.length === 1 && stats[0].module === "(모듈 없음)") {
    return null;
  }

  return (
    <div className="notion-card p-4">
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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3
          className="text-sm font-medium"
          style={{ color: "var(--notion-text-primary)" }}
        >
          모듈별 현황
        </h3>
      </div>

      <div className="space-y-2">
        {stats
          .filter((s) => s.module !== "(모듈 없음)")
          .slice(0, 6)
          .map((stat) => {
            const colors = getDomainColor(stat.module);
            return (
              <div
                key={stat.module}
                className="flex items-center justify-between py-1.5 px-2 rounded"
                style={{ backgroundColor: "var(--notion-bg-secondary)" }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--notion-text-primary)" }}
                  >
                    {stat.module}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs"
                    style={{ color: "var(--notion-text-secondary)" }}
                  >
                    {stat.count}건
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color:
                        stat.avgProgress >= 80
                          ? "var(--notion-green)"
                          : stat.avgProgress >= 50
                          ? "var(--notion-yellow)"
                          : "var(--notion-red)",
                    }}
                  >
                    {stat.avgProgress}%
                  </span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

