"use client";

import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getDomainColor } from "@/lib/colorDefines";

interface ModuleDistributionProps {
  items: ScrumItem[];
}

interface ModuleStat {
  module: string;
  count: number;
  avgProgress: number;
  percentage: number;
}

export function ModuleDistribution({ items }: ModuleDistributionProps) {
  const moduleStats = useMemo(() => {
    const stats: Record<string, { count: number; totalProgress: number }> = {};
    const total = items.length;

    items.forEach((item) => {
      const moduleName = item.module || null;
      if (!moduleName) return; // 모듈 없는 항목은 제외

      if (!stats[moduleName]) {
        stats[moduleName] = { count: 0, totalProgress: 0 };
      }
      stats[moduleName].count++;
      stats[moduleName].totalProgress += item.progressPercent;
    });

    const result: ModuleStat[] = Object.entries(stats)
      .map(([module, data]) => ({
        module,
        count: data.count,
        avgProgress: Math.round(data.totalProgress / data.count),
        percentage: Math.round((data.count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    return result;
  }, [items]);

  // 모듈 정보가 없는 경우 표시하지 않음
  if (moduleStats.length === 0) {
    return null;
  }

  const maxCount = Math.max(...moduleStats.map((s) => s.count));

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
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="text-base font-semibold" style={{ color: "var(--notion-text)" }}>
          모듈별 작업 분포
        </h3>
      </div>

      <div className="space-y-3">
        {moduleStats.map((stat) => {
          const colors = getDomainColor(stat.module);
          const barWidth = (stat.count / maxCount) * 100;

          return (
            <div key={stat.module} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: colors.bg }}
                  />
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--notion-text)" }}
                  >
                    {stat.module}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs"
                    style={{ color: "var(--notion-text-secondary)" }}
                  >
                    {stat.count}건 ({stat.percentage}%)
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
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "var(--notion-bg-tertiary)" }}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: colors.text,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 요약 */}
      <div
        className="mt-4 pt-4 flex items-center justify-between text-xs"
        style={{
          borderTop: "1px solid var(--notion-border)",
          color: "var(--notion-text-tertiary)",
        }}
      >
        <span>총 {moduleStats.length}개 모듈에서 작업 중</span>
        <span>
          평균 진행률:{" "}
          <span style={{ color: "var(--notion-text-secondary)" }}>
            {Math.round(
              moduleStats.reduce((sum, s) => sum + s.avgProgress, 0) / moduleStats.length
            )}
            %
          </span>
        </span>
      </div>
    </div>
  );
}

