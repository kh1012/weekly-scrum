"use client";

import { useMemo } from "react";
import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { PROGRESS_COLORS, UI_COLORS, STATUS_COLORS, RISK_LEVEL_COLORS, getAchievementRate } from "@/lib/colorDefines";
import { calculateCollaboratorStats, getTopCollaboratorsByRelation, calculateModuleStats } from "@/lib/utils";
import { SummaryCard, ProgressDistributionBar, RiskDistributionBar, AchievementSummary } from "./SummaryCards";
import { DomainStats } from "./DomainStats";
import { MemberStats } from "./MemberStats";
import { RiskItemsList } from "./RiskItemsList";
import { ReasonItemsList } from "./ReasonItemsList";
import { ModuleStats } from "./ModuleStats";
import { CollaboratorStats } from "./CollaboratorStats";
import { CollaborationNetworkGraph } from "@/components/visualizations/CollaborationNetworkGraph";
import { BottleneckMap } from "@/components/visualizations/BottleneckMap";
import { CollaborationLoadHeatmap } from "@/components/visualizations/CollaborationLoadHeatmap";
import { CrossDomainMatrix } from "@/components/visualizations/CrossDomainMatrix";

interface SummaryViewProps {
  items: ScrumItem[];
}

export function SummaryView({ items }: SummaryViewProps) {
  const domainStats = useMemo(() => {
    const stats: Record<string, { items: ScrumItem[]; avgProgress: number }> = {};
    items.forEach((item) => {
      if (!stats[item.domain]) stats[item.domain] = { items: [], avgProgress: 0 };
      stats[item.domain].items.push(item);
    });
    Object.keys(stats).forEach((domain) => {
      const domainItems = stats[domain].items;
      stats[domain].avgProgress = Math.round(
        domainItems.reduce((sum, i) => sum + i.progressPercent, 0) / domainItems.length
      );
    });
    return Object.entries(stats)
      .map(([domain, data]) => ({ domain, ...data }))
      .sort((a, b) => b.avgProgress - a.avgProgress);
  }, [items]);

  const memberStats = useMemo(() => {
    const stats: Record<string, { items: ScrumItem[]; avgProgress: number }> = {};
    items.forEach((item) => {
      if (!stats[item.name]) stats[item.name] = { items: [], avgProgress: 0 };
      stats[item.name].items.push(item);
    });
    Object.keys(stats).forEach((name) => {
      const memberItems = stats[name].items;
      stats[name].avgProgress = Math.round(
        memberItems.reduce((sum, i) => sum + i.progressPercent, 0) / memberItems.length
      );
    });
    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [items]);

  const riskItems = useMemo(() => {
    return items
      .filter((i) => i.risk && i.risk !== "-" && i.risk.trim() !== "")
      .sort((a, b) => (b.riskLevel ?? 0) - (a.riskLevel ?? 0));
  }, [items]);

  // 사유가 있는 항목 (계획 대비 미비)
  const reasonItems = useMemo(() => {
    return items
      .filter((i) => i.reason && i.reason.trim() !== "")
      .sort((a, b) => {
        // 달성률이 낮은 순으로 정렬
        const aRate = a.planPercent ? a.progressPercent / a.planPercent : 1;
        const bRate = b.planPercent ? b.progressPercent / b.planPercent : 1;
        return aRate - bRate;
      });
  }, [items]);

  // 모듈 통계
  const moduleStats = useMemo(() => calculateModuleStats(items), [items]);

  // 협업자 통계
  const collaboratorStats = useMemo(() => calculateCollaboratorStats(items), [items]);
  const topPairCollaborators = useMemo(() => getTopCollaboratorsByRelation(items, "pair", 5), [items]);
  const topPreCollaborators = useMemo(() => getTopCollaboratorsByRelation(items, "pre", 5), [items]);

  const progressDistribution = useMemo(
    () => ({
      completed: items.filter((i) => i.progressPercent >= 100).length,
      high: items.filter((i) => i.progressPercent >= 70 && i.progressPercent < 100).length,
      medium: items.filter((i) => i.progressPercent >= 40 && i.progressPercent < 70).length,
      low: items.filter((i) => i.progressPercent < 40).length,
    }),
    [items]
  );

  // 리스크 레벨 분포
  const riskDistribution = useMemo(() => {
    const dist = { 0: 0, 1: 0, 2: 0, 3: 0 };
    items.forEach((i) => {
      const level = (i.riskLevel ?? 0) as RiskLevel;
      dist[level]++;
    });
    return dist;
  }, [items]);

  // 달성률 통계
  const achievementStats = useMemo(() => {
    const avgPlan = items.reduce((sum, i) => sum + (i.planPercent ?? i.progressPercent), 0) / items.length;
    const avgProgress = items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length;
    const avgAchievement = getAchievementRate(Math.round(avgProgress), Math.round(avgPlan));
    
    const exceeded = items.filter((i) => getAchievementRate(i.progressPercent, i.planPercent ?? i.progressPercent) >= 100).length;
    const normal = items.filter((i) => {
      const rate = getAchievementRate(i.progressPercent, i.planPercent ?? i.progressPercent);
      return rate >= 80 && rate < 100;
    }).length;
    const delayed = items.filter((i) => getAchievementRate(i.progressPercent, i.planPercent ?? i.progressPercent) < 80).length;

    return { avgPlan: Math.round(avgPlan), avgProgress: Math.round(avgProgress), avgAchievement, exceeded, normal, delayed };
  }, [items]);

  const total = items.length;
  const highRiskCount = riskDistribution[2] + riskDistribution[3];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <SummaryCard value={total} label="전체 항목" color={UI_COLORS.textPrimary} />
        <SummaryCard value={progressDistribution.completed} label="완료" color={PROGRESS_COLORS.completed.text} />
        <SummaryCard value={progressDistribution.high + progressDistribution.medium} label="진행 중" color={PROGRESS_COLORS.high.text} />
        <SummaryCard value={`${achievementStats.avgAchievement}%`} label="평균 달성률" color={achievementStats.avgAchievement >= 80 ? PROGRESS_COLORS.completed.text : PROGRESS_COLORS.low.text} />
        <SummaryCard value={highRiskCount} label="주의 필요" color={RISK_LEVEL_COLORS[3].text} highlight={highRiskCount > 0} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProgressDistributionBar distribution={progressDistribution} total={total} />
        <RiskDistributionBar distribution={riskDistribution} total={total} />
      </div>

      <AchievementSummary stats={achievementStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DomainStats stats={domainStats} />
        <MemberStats stats={memberStats} />
      </div>

      {/* 모듈 & 협업 통계 */}
      {(moduleStats.length > 1 || collaboratorStats.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ModuleStats stats={moduleStats} />
          <CollaboratorStats
            stats={collaboratorStats}
            topPair={topPairCollaborators}
            topPre={topPreCollaborators}
          />
        </div>
      )}

      {/* 협업 네트워크 그래프 & 병목 현황 */}
      {collaboratorStats.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CollaborationNetworkGraph items={items} />
            <BottleneckMap items={items} />
          </div>
          <CollaborationLoadHeatmap items={items} />
          <CrossDomainMatrix items={items} />
        </>
      )}

      {reasonItems.length > 0 && <ReasonItemsList items={reasonItems} />}

      {riskItems.length > 0 && <RiskItemsList items={riskItems} />}
    </div>
  );
}
