"use client";

import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { RiskLevelBadge } from "../common/RiskLevelBadge";
import { getDomainColor, getRiskLevelColor, RISK_LEVEL_COLORS } from "@/lib/colorDefines";

interface RiskItemsListProps {
  items: ScrumItem[];
}

export function RiskItemsList({ items }: RiskItemsListProps) {
  const hasHighRisk = items.some((i) => (i.riskLevel ?? 0) >= 3);

  return (
    <div
      className="notion-card p-4"
      style={{ borderColor: hasHighRisk ? 'var(--notion-red)' : 'var(--notion-border)' }}
    >
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--notion-text)' }}>
        <span>{hasHighRisk ? '🚨' : '⚠️'}</span>
        주의 필요 항목 ({items.length})
      </h3>
      <div className="space-y-2">
        {items.map((item, idx) => {
          const domainColor = getDomainColor(item.domain);
          const riskLevel = (item.riskLevel ?? 0) as RiskLevel;
          const riskColor = getRiskLevelColor(riskLevel);
          return (
            <div
              key={idx}
              className="flex items-start gap-3 p-3 rounded"
              style={{
                backgroundColor: riskColor.bg,
                border: `1px solid ${riskColor.border}`,
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <RiskLevelBadge level={riskLevel} />
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: domainColor.bg, color: domainColor.text }}
                  >
                    {item.domain}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>
                    {item.topic}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                    ({item.name})
                  </span>
                </div>
                {item.risk && item.risk.length > 0 && (
                  <div className="text-xs" style={{ color: riskColor.text }}>
                    {item.risk.length === 1 ? (
                      item.risk[0]
                    ) : (
                      <ul className="list-disc list-inside space-y-0.5">
                        {item.risk.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium shrink-0" style={{ color: riskColor.text }}>
                {item.progressPercent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
