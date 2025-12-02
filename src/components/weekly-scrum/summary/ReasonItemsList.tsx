"use client";

import type { ScrumItem } from "@/types/scrum";
import { getDomainColor, getAchievementRate, getAchievementStatus, ACHIEVEMENT_COLORS } from "@/lib/colorDefines";

interface ReasonItemsListProps {
  items: ScrumItem[];
}

export function ReasonItemsList({ items }: ReasonItemsListProps) {
  return (
    <div className="bg-white border border-[#d0d7de] rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-[#d0d7de] bg-[#f6f8fa]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#9a6700]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="text-sm font-semibold text-[#1f2328]">
              계획 대비 미비 사유
            </h3>
          </div>
          <span className="text-xs text-[#656d76]">{items.length}건</span>
        </div>
      </div>
      <div className="divide-y divide-[#d0d7de]">
        {items.map((item, index) => (
          <ReasonItem key={index} item={item} />
        ))}
      </div>
    </div>
  );
}

function ReasonItem({ item }: { item: ScrumItem }) {
  const domainColor = getDomainColor(item.domain);
  const planPercent = item.planPercent ?? item.progressPercent;
  const achievementRate = getAchievementRate(item.progressPercent, planPercent);
  const achievementStatus = getAchievementStatus(achievementRate);
  const achievementColor = ACHIEVEMENT_COLORS[achievementStatus];

  return (
    <div className="px-4 py-3 hover:bg-[#f6f8fa] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            <span className="text-xs text-[#656d76]">/</span>
            <span className="text-xs text-[#656d76] truncate">{item.project}</span>
            <span className="text-xs text-[#656d76]">/</span>
            <span className="text-xs font-medium text-[#1f2328] truncate">{item.topic}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-[#656d76]">{item.name}</span>
            <span className="text-xs text-[#656d76]">·</span>
            <span className="text-xs text-[#656d76]">
              계획 {planPercent}% → 실제 {item.progressPercent}%
            </span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
              style={{ background: achievementColor.bg, color: achievementColor.text }}
            >
              {achievementRate}%
            </span>
          </div>
          <div
            className="text-sm pl-3 border-l-2"
            style={{ borderColor: "#9a6700", color: "#6f5c1a" }}
          >
            {item.reason}
          </div>
        </div>
      </div>
    </div>
  );
}

