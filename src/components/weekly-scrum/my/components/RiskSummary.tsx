import type { RiskLevel } from "@/types/scrum";
import { RISK_LEVEL_COLORS } from "@/lib/colorDefines";

interface RiskSummaryProps {
  riskCounts: Record<RiskLevel, number>;
}

export function RiskSummary({ riskCounts }: RiskSummaryProps) {
  return (
    <div className="notion-card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
        ⚠️ 리스크 현황
      </h3>
      <div className="grid grid-cols-4 gap-2">
        {([3, 2, 1, 0] as RiskLevel[]).map((level) => {
          const color = RISK_LEVEL_COLORS[level];
          const count = riskCounts[level];
          return (
            <div key={level} className="p-3 rounded text-center" style={{ background: color.bg }}>
              <div className="text-lg font-bold" style={{ color: color.text }}>
                {count}
              </div>
              <div className="text-xs" style={{ color: color.text }}>
                Lv.{level} {color.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

