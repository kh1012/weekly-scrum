"use client";

import type { ScrumItem } from "@/types/scrum";
import { getDomainColor, getAchievementRate, getAchievementStatus, ACHIEVEMENT_COLORS } from "@/lib/colorDefines";

interface ReasonItemsListProps {
  items: ScrumItem[];
}

export function ReasonItemsList({ items }: ReasonItemsListProps) {
  return (
    <div className="notion-card overflow-hidden">
      <div 
        className="px-4 py-3"
        style={{ 
          background: 'var(--notion-bg-secondary)',
          borderBottom: '1px solid var(--notion-border)'
        }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--notion-text)' }}>
            계획 대비 미비 사유
          </h3>
          <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>{items.length}건</span>
        </div>
      </div>
      <div>
        {items.map((item, index) => (
          <ReasonItem key={index} item={item} isLast={index === items.length - 1} />
        ))}
      </div>
    </div>
  );
}

function ReasonItem({ item, isLast }: { item: ScrumItem; isLast: boolean }) {
  const domainColor = getDomainColor(item.domain);
  const planPercent = item.planPercent ?? item.progressPercent;
  const achievementRate = getAchievementRate(item.progressPercent, planPercent);
  const achievementStatus = getAchievementStatus(achievementRate);
  const achievementColor = ACHIEVEMENT_COLORS[achievementStatus];

  return (
    <div 
      className="px-4 py-3 transition-colors"
      style={{ 
        borderBottom: isLast ? 'none' : '1px solid var(--notion-border)',
        background: 'var(--notion-bg)'
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-medium shrink-0"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>/</span>
            <span className="text-xs truncate" style={{ color: 'var(--notion-text-secondary)' }}>{item.project}</span>
            <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>/</span>
            <span className="text-xs font-medium truncate" style={{ color: 'var(--notion-text)' }}>{item.topic}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>{item.name}</span>
            <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>·</span>
            <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
              계획 {planPercent}% → 실제 {item.progressPercent}%
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ background: achievementColor.bg, color: achievementColor.text }}
            >
              {achievementRate}%
            </span>
          </div>
          <div
            className="text-sm pl-3 border-l-2"
            style={{ borderColor: 'var(--notion-orange)', color: 'var(--notion-text-secondary)' }}
          >
            {item.reason}
          </div>
        </div>
      </div>
    </div>
  );
}
