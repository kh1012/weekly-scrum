"use client";

import type { ScrumItem } from "@/types/scrum";
import { getProgressColor, UI_COLORS } from "@/lib/colorDefines";

interface MemberStatsProps {
  stats: {
    name: string;
    items: ScrumItem[];
    avgProgress: number;
  }[];
}

export function MemberStats({ stats }: MemberStatsProps) {
  return (
    <div
      className="bg-white rounded-md p-4"
      style={{ border: `1px solid ${UI_COLORS.border}` }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: UI_COLORS.textPrimary }}
      >
        팀원별 워크로드
      </h3>
      <div className="space-y-3">
        {stats.map(({ name, items, avgProgress }) => {
          const completedCount = items.filter(
            (i) => i.progressPercent >= 100
          ).length;
          return (
            <div key={name} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{
                  backgroundColor: UI_COLORS.bgSecondary,
                  border: `1px solid ${UI_COLORS.border}`,
                  color: UI_COLORS.textSecondary,
                }}
              >
                {name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span
                    className="text-sm font-medium"
                    style={{ color: UI_COLORS.textPrimary }}
                  >
                    {name}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: UI_COLORS.textSecondary }}
                  >
                    {completedCount}/{items.length}개 완료 · 평균 {avgProgress}%
                  </span>
                </div>
                <div className="flex gap-1">
                  {items.map((item, idx) => (
                    <div
                      key={idx}
                      className="h-2 rounded-full flex-1"
                      style={{
                        backgroundColor: getProgressColor(item.progressPercent),
                      }}
                      title={`${item.topic}: ${item.progressPercent}%`}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

