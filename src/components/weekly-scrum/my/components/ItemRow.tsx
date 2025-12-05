import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { getDomainColor, RISK_LEVEL_COLORS, getProgressColor, getAchievementRate } from "@/lib/colorDefines";

interface ItemRowProps {
  item: ScrumItem;
}

export function ItemRow({ item }: ItemRowProps) {
  const domainColor = getDomainColor(item.domain);
  const riskLevel = (item.riskLevel ?? 0) as RiskLevel;
  const riskColor = RISK_LEVEL_COLORS[riskLevel];
  const achievementRate = getAchievementRate(item.progressPercent, item.planPercent ?? item.progressPercent);

  return (
    <div
      className="px-4 py-3 hover:bg-[#fafafa] transition-colors"
      style={{ borderBottom: "1px solid var(--notion-border)" }}
    >
      <div className="flex items-start gap-3">
        {/* 진행률 인디케이터 */}
        <div
          className="w-10 h-10 rounded flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: getProgressColor(item.progressPercent) }}
        >
          {item.progressPercent}%
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
              {item.topic}
            </span>
            {riskLevel > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: riskColor.bg, color: riskColor.text }}
              >
                Lv.{riskLevel}
              </span>
            )}
          </div>
          <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
            {item.project} · 계획 {item.planPercent ?? item.progressPercent}% → 달성률 {achievementRate}%
          </div>
          {item.progress && (
            <div className="text-xs mt-1" style={{ color: "var(--notion-text-muted)" }}>
              {item.progress}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

