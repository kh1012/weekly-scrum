"use client";

import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { CircularProgress } from "../common/CircularProgress";
import { RiskLevelBadge } from "../common/RiskLevelBadge";
import {
  getDomainColor,
  PROGRESS_COLORS,
  getRiskLevelColor,
  getAchievementRate,
  getAchievementStatus,
  ACHIEVEMENT_COLORS,
} from "@/lib/colorDefines";

interface ScrumCardProps {
  item: ScrumItem;
  isCompleted?: boolean;
}

export function ScrumCard({ item, isCompleted = false }: ScrumCardProps) {
  const domainColor = getDomainColor(item.domain);
  const riskLevel = (item.riskLevel ?? 0) as RiskLevel;
  const riskColor = getRiskLevelColor(riskLevel);
  const achievementRate = getAchievementRate(item.progressPercent, item.planPercent ?? item.progressPercent);
  const achievementStatus = getAchievementStatus(achievementRate);
  const achievementColor = ACHIEVEMENT_COLORS[achievementStatus];

  return (
    <div
      className={`notion-card p-3 transition-all duration-150 ${isCompleted ? "opacity-60" : ""}`}
      style={{ borderColor: riskLevel >= 2 ? riskColor.border : 'var(--notion-border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            <span style={{ color: 'var(--notion-text-muted)' }} className="text-xs">/</span>
            <span className="text-xs font-medium truncate" style={{ color: 'var(--notion-text-secondary)' }}>
              {item.project}
            </span>
            {item.module && (
              <>
                <span style={{ color: 'var(--notion-text-muted)' }} className="text-xs">/</span>
                <span className="text-xs font-medium truncate" style={{ color: 'var(--notion-text-tertiary)' }}>
                  {item.module}
                </span>
              </>
            )}
            {riskLevel > 0 && (
              <span className="ml-auto">
                <RiskLevelBadge level={riskLevel} size="sm" />
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--notion-text)' }}>
            {item.topic}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--notion-text-muted)' }}>
            {item.name}
          </p>
        </div>
        <CircularProgress percent={item.progressPercent} isCompleted={isCompleted} />
      </div>

      {/* Plan vs Progress */}
      {item.planPercent !== undefined && item.planPercent > 0 && (
        <div className="mb-2 p-2 rounded" style={{ background: 'var(--notion-bg-secondary)' }}>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span style={{ color: 'var(--notion-text-muted)' }}>계획 {item.planPercent}% → 실제 {item.progressPercent}%</span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ background: achievementColor.bg, color: achievementColor.text }}
            >
              {achievementRate}% 달성
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--notion-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(achievementRate, 100)}%`,
                background: achievementColor.text,
              }}
            />
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="space-y-1">
        {item.plan && <ContentBar label="Plan" color={PROGRESS_COLORS.high.text} content={item.plan} />}
        <ContentBar label="Progress" color={PROGRESS_COLORS.completed.text} content={item.progress} />
        {item.reason && item.reason.trim() !== "" && (
          <ContentBar label="Reason" color="var(--notion-orange)" content={item.reason} />
        )}
        <ContentBar label="Next" color="var(--notion-blue)" content={item.next} />
        {item.risk && item.risk.trim() !== "" && (
          <ContentBar label="Risk" color={riskColor.text} content={item.risk} />
        )}
      </div>

      {/* Collaborators */}
      {item.collaborators && item.collaborators.length > 0 && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--notion-border)' }}>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-medium" style={{ color: 'var(--notion-text-muted)' }}>협업:</span>
            {item.collaborators.map((collab, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: COLLAB_COLORS[collab.relation]?.bg || 'var(--notion-bg-tertiary)',
                  color: COLLAB_COLORS[collab.relation]?.text || 'var(--notion-text-secondary)',
                }}
              >
                {collab.name}
                <span className="opacity-70 ml-0.5">({COLLAB_LABELS[collab.relation]})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const COLLAB_COLORS: Record<string, { bg: string; text: string }> = {
  pair: { bg: 'var(--notion-blue-bg)', text: 'var(--notion-blue)' },
  'waiting-on': { bg: 'var(--notion-orange-bg)', text: 'var(--notion-orange)' },
  review: { bg: 'var(--notion-purple-bg)', text: 'var(--notion-purple)' },
  handoff: { bg: 'var(--notion-green-bg)', text: 'var(--notion-green)' },
};

const COLLAB_LABELS: Record<string, string> = {
  pair: '페어',
  'waiting-on': '대기',
  review: '리뷰',
  handoff: '인수',
};

function ContentBar({ label, color, content }: { label: string; color: string; content: string }) {
  return (
    <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: 'var(--notion-bg-secondary)' }}>
      <div className="w-0.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 px-2 py-1">
        <span className="text-[9px] font-medium mr-1.5" style={{ color }}>{label}</span>
        <span className="text-xs leading-relaxed" style={{ color: 'var(--notion-text)' }}>
          {content || "-"}
        </span>
      </div>
    </div>
  );
}
