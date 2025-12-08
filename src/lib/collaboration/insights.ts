/**
 * 협업 인사이트 자동 생성
 */

import type { ScrumItem, WeeklyScrumData } from "@/types/scrum";
import { getMemberSummary, getPreInbound, getPreCount, getPairCountPerMember } from "./metrics";

export interface CollaborationInsight {
  type: "warning" | "info" | "success" | "neutral";
  icon: string;
  message: string;
  detail?: string;
}

/**
 * 개인 협업 인사이트 생성
 */
export function generatePersonalInsights(
  items: ScrumItem[],
  memberName: string,
  previousWeekData?: WeeklyScrumData
): CollaborationInsight[] {
  const insights: CollaborationInsight[] = [];
  const summary = getMemberSummary(items, memberName);
  const preInboundCounts = getPreInbound(items);
  const preCounts = getPreCount(items);
  const pairCounts = getPairCountPerMember(items);

  // 1. 병목 경고: 나를 기다리는 사람이 많을 때 (다른 사람이 나를 pre로 지정)
  if (summary.preInbound >= 2) {
    insights.push({
      type: "warning",
      icon: "🚧",
      message: `${summary.preInbound}명이 당신의 작업을 기다리고 있습니다`,
      detail: "병목 해소를 위해 해당 작업의 우선순위를 높여주세요.",
    });
  }

  // 2. 정상 상태: 나를 기다리는 사람이 적을 때
  if (summary.preInbound === 0 && summary.totalCollaborations > 0) {
    insights.push({
      type: "success",
      icon: "✅",
      message: "병목 없음: 아무도 당신을 기다리지 않습니다",
    });
  }

  // 3. 크로스 도메인 협업 비율
  if (summary.crossDomainScore >= 50) {
    insights.push({
      type: "success",
      icon: "🌐",
      message: `크로스 도메인 협업률이 높습니다 (${summary.crossDomainScore}%)`,
      detail: "다양한 팀과의 협업이 잘 이루어지고 있습니다.",
    });
  } else if (summary.crossDomainScore > 0 && summary.crossDomainScore < 20) {
    insights.push({
      type: "neutral",
      icon: "💡",
      message: `같은 도메인 내 협업 위주입니다 (${100 - summary.crossDomainScore}%)`,
      detail: "필요시 다른 도메인과의 협업을 고려해보세요.",
    });
  }

  // 4. 주요 협업자 안내
  if (summary.collaborators.length > 0) {
    const topCollaborator = summary.collaborators[0];
    insights.push({
      type: "info",
      icon: "👥",
      message: `${topCollaborator.name}님과 가장 많이 협업했습니다 (${topCollaborator.count}회)`,
    });
  }

  // 5. Pair 협업 활발도
  const avgPairCount = Array.from(pairCounts.values()).reduce((a, b) => a + b, 0) / Math.max(pairCounts.size, 1);
  if (summary.pairCount > avgPairCount * 1.5) {
    insights.push({
      type: "success",
      icon: "🤝",
      message: `Pair 협업이 평균보다 활발합니다 (${summary.pairCount}회 vs 평균 ${Math.round(avgPairCount)}회)`,
    });
  }

  // 6. 내가 기다리는 작업이 많을 때 (내가 pre로 지정한 사람이 많음)
  if (summary.preCount >= 3) {
    insights.push({
      type: "warning",
      icon: "⏳",
      message: `${summary.preCount}개 작업이 선행 협업자를 기다리고 있습니다`,
      detail: "대기 중인 작업의 진행 상황을 확인해보세요.",
    });
  }

  // 7. 이전 주 대비 변화 (이전 주 데이터가 있을 때)
  if (previousWeekData) {
    const prevSummary = getMemberSummary(previousWeekData.items, memberName);

    // 병목 증가
    const inboundDiff = summary.preInbound - prevSummary.preInbound;
    if (inboundDiff > 0) {
      insights.push({
        type: "warning",
        icon: "📈",
        message: `지난 주 대비 병목이 ${inboundDiff}건 증가했습니다`,
      });
    } else if (inboundDiff < 0) {
      insights.push({
        type: "success",
        icon: "📉",
        message: `지난 주 대비 병목이 ${Math.abs(inboundDiff)}건 감소했습니다`,
      });
    }

    // 협업량 변화
    const collabDiff = summary.totalCollaborations - prevSummary.totalCollaborations;
    if (collabDiff > 2) {
      insights.push({
        type: "info",
        icon: "📊",
        message: `협업량이 지난 주 대비 ${collabDiff}건 증가했습니다`,
      });
    }
  }

  // 8. 반복적인 pre 패턴 (같은 사람에게 여러 번 pre 관계)
  const preTargets = new Map<string, number>();
  for (const item of items.filter((i) => i.name === memberName)) {
    const pres = item.collaborators?.filter((c) => c.relation === "pre") ?? [];
    for (const w of pres) {
      preTargets.set(w.name, (preTargets.get(w.name) ?? 0) + 1);
    }
  }

  for (const [target, count] of preTargets) {
    if (count >= 2) {
      insights.push({
        type: "neutral",
        icon: "🔄",
        message: `${target}님에게 반복적으로 대기 중입니다 (${count}회)`,
        detail: "해당 협업 패턴을 점검해보세요.",
      });
    }
  }

  // 9. 협업 없음 경고
  if (summary.totalCollaborations === 0) {
    insights.push({
      type: "neutral",
      icon: "📝",
      message: "이번 주 기록된 협업이 없습니다",
      detail: "협업 관계가 있다면 스크럼에 기록해주세요.",
    });
  }

  return insights;
}

/**
 * 팀 전체 인사이트 생성
 */
export function generateTeamInsights(items: ScrumItem[]): CollaborationInsight[] {
  const insights: CollaborationInsight[] = [];
  const preInboundCounts = getPreInbound(items);
  const pairCounts = getPairCountPerMember(items);

  // 1. 가장 큰 병목
  let maxInbound = 0;
  let bottleneckMember = "";
  for (const [name, count] of preInboundCounts) {
    if (count > maxInbound) {
      maxInbound = count;
      bottleneckMember = name;
    }
  }

  if (maxInbound >= 3) {
    insights.push({
      type: "warning",
      icon: "🚨",
      message: `${bottleneckMember}님이 가장 큰 병목입니다 (${maxInbound}명 대기 중)`,
      detail: "해당 멤버의 작업 부하를 점검해주세요.",
    });
  }

  // 2. 가장 활발한 협업자
  let maxPair = 0;
  let activeMember = "";
  for (const [name, count] of pairCounts) {
    if (count > maxPair) {
      maxPair = count;
      activeMember = name;
    }
  }

  if (maxPair >= 3) {
    insights.push({
      type: "info",
      icon: "⭐",
      message: `${activeMember}님이 가장 활발하게 Pair 협업 중입니다 (${maxPair}건)`,
    });
  }

  // 3. 전체 pre 관계 비율
  const totalPre = Array.from(preInboundCounts.values()).reduce((a, b) => a + b, 0);
  const totalPairs = Array.from(pairCounts.values()).reduce((a, b) => a + b, 0);

  if (totalPre > totalPairs * 1.5) {
    insights.push({
      type: "warning",
      icon: "⚠️",
      message: "팀 전체적으로 대기 관계가 많습니다",
      detail: `Pre 협업 ${totalPre}건 vs Pair ${totalPairs}건`,
    });
  }

  return insights;
}
