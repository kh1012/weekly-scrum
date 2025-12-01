"use client";

import type { ScrumItem } from "@/types/scrum";
import { getDomainColor, getProgressColor, UI_COLORS } from "@/lib/colorDefines";

interface DomainStatsProps {
  stats: {
    domain: string;
    items: ScrumItem[];
    avgProgress: number;
  }[];
}

export function DomainStats({ stats }: DomainStatsProps) {
  return (
    <div
      className="bg-white rounded-md p-4"
      style={{ border: `1px solid ${UI_COLORS.border}` }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: UI_COLORS.textPrimary }}
      >
        도메인별 현황
      </h3>
      <div className="space-y-3">
        {stats.map(({ domain, items, avgProgress }) => {
          const color = getDomainColor(domain);
          return (
            <div key={domain}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {domain}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: UI_COLORS.textSecondary }}
                  >
                    {items.length}개
                  </span>
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: UI_COLORS.textPrimary }}
                >
                  {avgProgress}%
                </span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: UI_COLORS.borderLight }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${avgProgress}%`,
                    backgroundColor: getProgressColor(avgProgress),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

