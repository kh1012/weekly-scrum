"use client";

import { useState } from "react";
import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { CircularProgress } from "../common/CircularProgress";
import { EmptyState } from "../common/EmptyState";
import { RiskLevelBadge, RiskLevelDot } from "../common/RiskLevelBadge";
import {
  getDomainColor,
  getRiskLevelColor,
  getAchievementRate,
  getAchievementStatus,
  ACHIEVEMENT_COLORS,
  RISK_LEVEL_COLORS,
} from "@/lib/colorDefines";

interface ProjectGroupViewProps {
  items: ScrumItem[];
}

export function ProjectGroupView({ items }: ProjectGroupViewProps) {
  // 프로젝트별로 그룹화
  const groupedByProject = items.reduce<Record<string, ScrumItem[]>>((acc, item) => {
    if (!acc[item.project]) acc[item.project] = [];
    acc[item.project].push(item);
    return acc;
  }, {});

  // 프로젝트별 리스크 레벨 최대값으로 정렬 (높은 순), 그 다음 평균 진행률 (낮은 순)
  const projects = Object.keys(groupedByProject).sort((a, b) => {
    const maxRiskA = Math.max(...groupedByProject[a].map((i) => i.riskLevel ?? 0));
    const maxRiskB = Math.max(...groupedByProject[b].map((i) => i.riskLevel ?? 0));
    if (maxRiskB !== maxRiskA) return maxRiskB - maxRiskA;
    
    const avgA = groupedByProject[a].reduce((sum, i) => sum + i.progressPercent, 0) / groupedByProject[a].length;
    const avgB = groupedByProject[b].reduce((sum, i) => sum + i.progressPercent, 0) / groupedByProject[b].length;
    return avgA - avgB;
  });

  if (projects.length === 0) {
    return <EmptyState message="데이터가 없습니다" />;
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <ProjectTreeItem key={project} project={project} items={groupedByProject[project]} />
      ))}
    </div>
  );
}

interface ProjectTreeItemProps {
  project: string;
  items: ScrumItem[];
}

function ProjectTreeItem({ project, items }: ProjectTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const avgProgress = Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length);
  const avgPlan = Math.round(items.reduce((sum, i) => sum + (i.planPercent ?? i.progressPercent), 0) / items.length);
  const achievementRate = getAchievementRate(avgProgress, avgPlan);
  const achievementStatus = getAchievementStatus(achievementRate);
  const achievementColor = ACHIEVEMENT_COLORS[achievementStatus];
  
  const completedCount = items.filter((i) => i.progressPercent >= 100).length;
  const domains = Array.from(new Set(items.map((i) => i.domain))).sort();
  
  // 리스크 레벨별 카운트
  const riskCounts = items.reduce<Record<number, number>>((acc, item) => {
    const level = item.riskLevel ?? 0;
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {});
  const maxRiskLevel = Math.max(...items.map((i) => i.riskLevel ?? 0)) as RiskLevel;
  const hasHighRisk = maxRiskLevel >= 2;

  return (
    <div 
      className="bg-white border rounded-md overflow-hidden"
      style={{ borderColor: hasHighRisk ? getRiskLevelColor(maxRiskLevel).border : "#d0d7de" }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left relative hover:brightness-[0.98] transition-all"
        style={{ background: `linear-gradient(to right, #f4f5f6 ${avgProgress}%, #fff ${avgProgress}%)` }}
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-[#656d76] transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[#1f2328]">{project}</h3>
              <span
                className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                style={{ background: achievementColor.bg, color: achievementColor.text }}
              >
                {achievementRate}% 달성
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {domains.map((domain) => {
                const color = getDomainColor(domain);
                return (
                  <span key={domain} className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: color.bg, color: color.text }}>
                    {domain}
                  </span>
                );
              })}
              <span className="text-xs text-[#656d76]">{items.length}개 항목 · {completedCount}개 완료</span>
              {/* 리스크 현황 */}
              <span className="flex items-center gap-1.5 text-xs">
                {[3, 2, 1].map((level) => {
                  const count = riskCounts[level] || 0;
                  if (count === 0) return null;
                  const color = RISK_LEVEL_COLORS[level as RiskLevel];
                  return (
                    <span key={level} className="flex items-center gap-0.5">
                      <RiskLevelDot level={level as RiskLevel} size="sm" />
                      <span style={{ color: color.text }}>{count}</span>
                    </span>
                  );
                })}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-[10px] text-[#656d76]">
            <div>계획 {avgPlan}%</div>
            <div>실제 {avgProgress}%</div>
          </div>
          <CircularProgress percent={avgProgress} size={44} strokeWidth={5} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-[#d0d7de] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {/* 리스크 높은 순으로 정렬 */}
            {items
              .sort((a, b) => (b.riskLevel ?? 0) - (a.riskLevel ?? 0))
              .map((item, index) => (
                <TopicCard key={`${item.topic}-${index}`} item={item} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TopicCard({ item }: { item: ScrumItem }) {
  const domainColor = getDomainColor(item.domain);
  const isCompleted = item.progressPercent >= 100;
  const riskLevel = (item.riskLevel ?? 0) as RiskLevel;
  const riskColor = getRiskLevelColor(riskLevel);
  const achievementRate = getAchievementRate(item.progressPercent, item.planPercent ?? item.progressPercent);
  const achievementStatus = getAchievementStatus(achievementRate);
  const achievementColor = ACHIEVEMENT_COLORS[achievementStatus];

  return (
    <div 
      className={`bg-[#f6f8fa] border rounded-md p-3 ${isCompleted ? "opacity-60" : ""}`}
      style={{ borderColor: riskLevel >= 2 ? riskColor.border : "#d0d7de" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0" style={{ background: domainColor.bg, color: domainColor.text }}>
              {item.domain}
            </span>
            {riskLevel > 0 && (
              <RiskLevelBadge level={riskLevel} size="sm" />
            )}
          </div>
          <h4 className="text-xs font-semibold text-[#1f2328] leading-tight">{item.topic}</h4>
          <p className="text-[10px] text-[#656d76] mt-0.5">{item.name}</p>
        </div>
        <CircularProgress percent={item.progressPercent} size={36} strokeWidth={4} isCompleted={isCompleted} />
      </div>

      {/* 달성률 바 */}
      {item.planPercent !== undefined && item.planPercent > 0 && (
        <div className="mb-2">
          <div className="flex items-center justify-between text-[9px] mb-0.5">
            <span className="text-[#656d76]">{item.planPercent}% → {item.progressPercent}%</span>
            <span style={{ color: achievementColor.text }}>{achievementRate}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden bg-[#d0d7de]">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(achievementRate, 100)}%`, background: achievementColor.text }}
            />
          </div>
        </div>
      )}

      <div className="space-y-1 text-[10px]">
        <InfoRow color="bg-[#0969da]" text={item.progress.join(" / ")} />
        {item.reason && item.reason.trim() !== "" && (
          <InfoRow color="bg-[#9a6700]" customColor="#9a6700" text={`[사유] ${item.reason}`} />
        )}
        {item.risk && item.risk.length > 0 && (
          <InfoRow color={`bg-[${riskColor.text}]`} customColor={riskColor.text} text={item.risk.join(" / ")} />
        )}
        <InfoRow color="bg-[#1a7f37]" text={item.next.join(" / ")} />
      </div>
    </div>
  );
}

function InfoRow({ color, text, customColor }: { color: string; text: string; customColor?: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <div 
        className={`w-1 h-1 rounded-full mt-1 shrink-0 ${customColor ? "" : color}`}
        style={customColor ? { background: customColor } : undefined}
      />
      <span className="text-[#1f2328] line-clamp-2">{text || "-"}</span>
    </div>
  );
}

