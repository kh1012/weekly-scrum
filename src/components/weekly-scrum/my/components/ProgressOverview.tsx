import { getProgressColor } from "@/lib/colorDefines";

interface ProgressOverviewProps {
  avgPlan: number;
  avgProgress: number;
  avgAchievement: number;
}

export function ProgressOverview({ avgPlan, avgProgress, avgAchievement }: ProgressOverviewProps) {
  return (
    <div className="notion-card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
        📊 전체 진척 현황
      </h3>
      <div className="flex items-center gap-4 mb-2">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1">
            <span style={{ color: "var(--notion-text-secondary)" }}>
              계획 {avgPlan}% → 실제 {avgProgress}%
            </span>
            <span
              className="font-medium"
              style={{ color: avgAchievement >= 80 ? "var(--notion-green)" : "var(--notion-red)" }}
            >
              달성률 {avgAchievement}%
            </span>
          </div>
          <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--notion-bg-secondary)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${avgProgress}%`,
                backgroundColor: getProgressColor(avgProgress),
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

