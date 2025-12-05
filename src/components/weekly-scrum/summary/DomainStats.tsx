"use client";

import type { ScrumItem } from "@/types/scrum";
import { getDomainColor, getProgressColor } from "@/lib/colorDefines";

interface DomainStatsProps {
  stats: {
    domain: string;
    items: ScrumItem[];
    avgProgress: number;
  }[];
}

export function DomainStats({ stats }: DomainStatsProps) {
  return (
    <div className="notion-card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--notion-text)' }}>
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
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {domain}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                    {items.length}개
                  </span>
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--notion-text)' }}>
                  {avgProgress}%
                </span>
              </div>
              <div className="notion-progress">
                <div
                  className="notion-progress-bar"
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
