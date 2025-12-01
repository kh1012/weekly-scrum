"use client";

import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { RiskLevelBadge } from "../common/RiskLevelBadge";
import { getDomainColor, UI_COLORS, getRiskLevelColor, RISK_LEVEL_COLORS } from "@/lib/colorDefines";

interface RiskItemsListProps {
  items: ScrumItem[];
}

export function RiskItemsList({ items }: RiskItemsListProps) {
  // 리스크 레벨 3인 항목이 있으면 강조
  const hasHighRisk = items.some((i) => (i.riskLevel ?? 0) >= 3);

  return (
    <div
      className="bg-white rounded-md p-4"
      style={{ border: `1px solid ${hasHighRisk ? RISK_LEVEL_COLORS[3].border : UI_COLORS.border}` }}
    >
      <h3
        className="text-sm font-semibold mb-3 flex items-center gap-2"
        style={{ color: UI_COLORS.textPrimary }}
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          style={{ color: hasHighRisk ? RISK_LEVEL_COLORS[3].text : RISK_LEVEL_COLORS[2].text }}
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
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
              className="flex items-start gap-3 p-3 rounded-md"
              style={{
                backgroundColor: riskColor.bg,
                border: `1px solid ${riskColor.border}`,
              }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <RiskLevelBadge level={riskLevel} />
                  <span
                    className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                    style={{ background: domainColor.bg, color: domainColor.text }}
                  >
                    {item.domain}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{ color: UI_COLORS.textPrimary }}
                  >
                    {item.topic}
                  </span>
                  <span
                    className="text-xs"
                    style={{ color: UI_COLORS.textSecondary }}
                  >
                    ({item.name})
                  </span>
                </div>
                <p
                  className="text-xs"
                  style={{ color: riskColor.text }}
                >
                  {item.risk}
                </p>
              </div>
              <span
                className="text-xs font-medium shrink-0"
                style={{ color: riskColor.text }}
              >
                {item.progressPercent}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

