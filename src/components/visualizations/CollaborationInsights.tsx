"use client";

import { useMemo } from "react";
import type { ScrumItem, WeeklyScrumData } from "@/types/scrum";
import { generatePersonalInsights, type CollaborationInsight } from "@/lib/collaboration";

interface CollaborationInsightsProps {
  items: ScrumItem[];
  memberName: string;
  previousWeekData?: WeeklyScrumData;
}

export function CollaborationInsights({
  items,
  memberName,
  previousWeekData,
}: CollaborationInsightsProps) {
  const insights = useMemo(
    () => generatePersonalInsights(items, memberName, previousWeekData),
    [items, memberName, previousWeekData]
  );

  const getInsightStyle = (type: CollaborationInsight["type"]) => {
    switch (type) {
      case "warning":
        return {
          bg: "var(--notion-orange-bg)",
          border: "var(--notion-orange)",
          text: "var(--notion-orange)",
        };
      case "success":
        return {
          bg: "var(--notion-green-bg)",
          border: "var(--notion-green)",
          text: "var(--notion-green)",
        };
      case "info":
        return {
          bg: "var(--notion-blue-bg)",
          border: "var(--notion-blue)",
          text: "var(--notion-blue)",
        };
      default:
        return {
          bg: "var(--notion-bg-secondary)",
          border: "var(--notion-border)",
          text: "var(--notion-text-secondary)",
        };
    }
  };

  if (insights.length === 0) {
    return null;
  }

  // 중요도 순 정렬: warning > info > success > neutral
  const sortedInsights = [...insights].sort((a, b) => {
    const order = { warning: 0, info: 1, success: 2, neutral: 3 };
    return order[a.type] - order[b.type];
  });

  return (
    <div className="notion-card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
        💡 협업 인사이트
      </h3>

      <div className="space-y-2">
        {sortedInsights.slice(0, 6).map((insight, idx) => {
          const style = getInsightStyle(insight.type);
          return (
            <div
              key={idx}
              className="p-3 rounded-lg"
              style={{
                background: style.bg,
                borderLeft: `3px solid ${style.border}`,
              }}
            >
              <div className="flex items-start gap-2">
                <span className="text-base">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
                    {insight.message}
                  </div>
                  {insight.detail && (
                    <div className="text-xs mt-0.5" style={{ color: "var(--notion-text-secondary)" }}>
                      {insight.detail}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {sortedInsights.length > 6 && (
        <div className="mt-2 text-xs text-center" style={{ color: "var(--notion-text-tertiary)" }}>
          +{sortedInsights.length - 6}개 더 보기
        </div>
      )}
    </div>
  );
}

