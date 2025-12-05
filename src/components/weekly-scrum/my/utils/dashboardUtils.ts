import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { getAchievementRate, getDomainColor } from "@/lib/colorDefines";

/**
 * 기간별 주차 수 계산
 */
export type TrendPeriod = "1month" | "6months" | "year";

export function getWeekCount(period: TrendPeriod): number {
  switch (period) {
    case "1month":
      return 4;
    case "6months":
      return 24;
    case "year":
      return 52;
    default:
      return 4;
  }
}

/**
 * range에서 마지막 날짜 추출 (예: "2025-12-01 ~ 2025-12-05" -> "12/05")
 */
export function getEndDateLabel(range: string): string {
  if (!range) return "";
  const parts = range.split("~");
  if (parts.length < 2) return "";
  const endDate = parts[1].trim();
  const dateParts = endDate.split("-");
  if (dateParts.length < 3) return "";
  const month = dateParts[1];
  const day = dateParts[2];
  return `${month}/${day}`;
}

/**
 * 멤버 통계 계산
 */
export interface MemberStats {
  total: number;
  completed: number;
  avgProgress: number;
  avgPlan: number;
  avgAchievement: number;
  atRisk: number;
  domains: { domain: string; count: number; avgProgress: number }[];
  projects: { project: string; count: number; avgProgress: number }[];
  riskCounts: Record<RiskLevel, number>;
  domainPieData: { name: string; value: number; color: string }[];
  projectBarData: { name: string; fullName: string; count: number; avgProgress: number }[];
}

export function calculateMemberStats(memberItems: ScrumItem[]): MemberStats | null {
  if (memberItems.length === 0) return null;

  const total = memberItems.length;
  const completed = memberItems.filter((i) => i.progressPercent >= 100).length;
  const avgProgress = Math.round(
    memberItems.reduce((sum, i) => sum + i.progressPercent, 0) / total
  );
  const avgPlan = Math.round(
    memberItems.reduce((sum, i) => sum + (i.planPercent ?? i.progressPercent), 0) / total
  );
  const avgAchievement = getAchievementRate(avgProgress, avgPlan);
  const atRisk = memberItems.filter((i) => (i.riskLevel ?? 0) >= 2).length;

  // 도메인별 분포
  const domainMap: Record<string, ScrumItem[]> = {};
  memberItems.forEach((item) => {
    if (!domainMap[item.domain]) domainMap[item.domain] = [];
    domainMap[item.domain].push(item);
  });

  // 프로젝트별 분포
  const projectMap: Record<string, ScrumItem[]> = {};
  memberItems.forEach((item) => {
    if (!projectMap[item.project]) projectMap[item.project] = [];
    projectMap[item.project].push(item);
  });

  // 리스크 레벨별
  const riskCounts: Record<RiskLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
  memberItems.forEach((item) => {
    const level = (item.riskLevel ?? 0) as RiskLevel;
    riskCounts[level]++;
  });

  // 도메인별 파이 차트 데이터
  const domainPieData = Object.entries(domainMap).map(([domain, items]) => ({
    name: domain,
    value: items.length,
    color: getDomainColor(domain).text,
  }));

  // 프로젝트별 바 차트 데이터
  const projectBarData = Object.entries(projectMap)
    .map(([project, items]) => ({
      name: project.length > 15 ? project.substring(0, 15) + "..." : project,
      fullName: project,
      count: items.length,
      avgProgress: Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    total,
    completed,
    avgProgress,
    avgPlan,
    avgAchievement,
    atRisk,
    domains: Object.entries(domainMap).map(([domain, items]) => ({
      domain,
      count: items.length,
      avgProgress: Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length),
    })),
    projects: Object.entries(projectMap).map(([project, items]) => ({
      project,
      count: items.length,
      avgProgress: Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length),
    })),
    riskCounts,
    domainPieData,
    projectBarData,
  };
}

