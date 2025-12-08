"use client";

import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import {
  getCollaborationNodes,
  getCollaborationEdges,
  getCollaborationLoadHeatmap,
  getBottleneckNodes,
  getMemberSummary,
  generateTeamInsights,
} from "@/lib/collaboration";
import { CollaborationNetworkGraph } from "@/components/visualizations/CollaborationNetworkGraph";
import { BottleneckMap } from "@/components/visualizations/BottleneckMap";
import { CollaborationLoadHeatmap } from "@/components/visualizations/CollaborationLoadHeatmap";
import { CrossDomainMatrix } from "@/components/visualizations/CrossDomainMatrix";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CollaborationViewProps {
  items: ScrumItem[];
}

export function CollaborationView({ items }: CollaborationViewProps) {
  // 팀 전체 통계
  const teamStats = useMemo(() => {
    const nodes = getCollaborationNodes(items);
    const edges = getCollaborationEdges(items);
    const heatmapData = getCollaborationLoadHeatmap(items);
    const bottleneckNodes = getBottleneckNodes(items);

    const totalPairs = edges.filter((e) => e.relation === "pair").reduce((sum, e) => sum + e.count, 0);
    const totalPre = edges.filter((e) => e.relation === "pre").reduce((sum, e) => sum + e.count, 0);
    const totalCollaborations = totalPairs + totalPre;

    const maxBottleneck = bottleneckNodes.length > 0 ? bottleneckNodes[0] : null;
    const avgLoad = heatmapData.length > 0
      ? Math.round(heatmapData.reduce((sum, d) => sum + d.totalLoad, 0) / heatmapData.length)
      : 0;

    // 가장 활발한 협업자
    const mostActiveCollaborator = nodes.length > 0
      ? nodes.reduce((max, node) => (node.pairCount > max.pairCount ? node : max), nodes[0])
      : null;

    return {
      totalMembers: nodes.length,
      totalPairs,
      totalPre,
      totalCollaborations,
      avgLoad,
      maxBottleneck,
      mostActiveCollaborator,
    };
  }, [items]);

  // 팀 인사이트
  const teamInsights = useMemo(() => generateTeamInsights(items), [items]);

  // 멤버별 협업 요약
  const memberSummaries = useMemo(() => {
    const members = Array.from(new Set(items.map((i) => i.name)));
    return members.map((name) => getMemberSummary(items, name)).sort((a, b) => b.totalCollaborations - a.totalCollaborations);
  }, [items]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "var(--notion-text-secondary)";
  };

  const getInsightStyle = (type: string) => {
    switch (type) {
      case "warning":
        return { bg: "var(--notion-orange-bg)", border: "var(--notion-orange)", text: "var(--notion-orange)" };
      case "success":
        return { bg: "var(--notion-green-bg)", border: "var(--notion-green)", text: "var(--notion-green)" };
      case "info":
        return { bg: "var(--notion-blue-bg)", border: "var(--notion-blue)", text: "var(--notion-blue)" };
      default:
        return { bg: "var(--notion-bg-secondary)", border: "var(--notion-border)", text: "var(--notion-text-secondary)" };
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: "var(--notion-text-secondary)" }}>
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div>
        <h1 className="text-lg sm:text-xl font-bold" style={{ color: "var(--notion-text)" }}>
          팀 협업 현황
        </h1>
        <p className="text-xs sm:text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          팀 전체의 협업 패턴과 병목 현황을 분석합니다
        </p>
      </div>

      {/* 팀 통계 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3">
        <StatCard value={teamStats.totalMembers} label="참여 인원" color="var(--notion-text)" />
        <StatCard value={teamStats.totalCollaborations} label="총 협업" color="var(--notion-blue)" />
        <StatCard value={teamStats.totalPairs} label="Pair 협업" color="var(--notion-blue)" />
        <StatCard value={teamStats.totalPre} label="Pre 협업" color="var(--notion-red)" />
        <StatCard value={teamStats.avgLoad} label="평균 부하" color="var(--notion-orange)" />
        <StatCard
          value={teamStats.maxBottleneck?.inboundCount ?? 0}
          label="최대 병목"
          color="var(--notion-red)"
          highlight={(teamStats.maxBottleneck?.inboundCount ?? 0) >= 3}
        />
      </div>

      {/* 팀 인사이트 */}
      {teamInsights.length > 0 && (
        <div className="notion-card p-3 sm:p-4">
          <h3 className="text-sm font-semibold mb-2 sm:mb-3" style={{ color: "var(--notion-text)" }}>
            💡 팀 인사이트
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {teamInsights.map((insight, idx) => {
              const style = getInsightStyle(insight.type);
              return (
                <div
                  key={idx}
                  className="p-2 sm:p-3 rounded-lg"
                  style={{ background: style.bg, borderLeft: `3px solid ${style.border}` }}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm sm:text-base">{insight.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium" style={{ color: "var(--notion-text)" }}>
                        {insight.message}
                      </div>
                      {insight.detail && (
                        <div className="text-[10px] sm:text-xs mt-0.5" style={{ color: "var(--notion-text-secondary)" }}>
                          {insight.detail}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 네트워크 그래프 (전체 너비) */}
      <CollaborationNetworkGraph items={items} />

      {/* 병목 맵 */}
      <BottleneckMap items={items} />

      {/* 협업 부하 히트맵 */}
      <CollaborationLoadHeatmap items={items} />

      {/* 도메인 간 협업 흐름 */}
      <CrossDomainMatrix items={items} />

      {/* 멤버별 협업 요약 - 모바일: 카드, 데스크탑: 테이블 */}
      <div className="notion-card p-3 sm:p-4">
        <h3 className="text-sm font-semibold mb-3 sm:mb-4" style={{ color: "var(--notion-text)" }}>
          👥 멤버별 협업 요약
        </h3>

        {/* 모바일: 카드 형태 */}
        <div className="sm:hidden space-y-2">
          {memberSummaries.map((member) => (
            <div
              key={member.name}
              className="p-3 rounded-lg"
              style={{ background: "var(--notion-bg-secondary)", border: "1px solid var(--notion-border)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: getDomainColor(member.domain) }}
                  />
                  <span className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
                    {member.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--notion-bg)", color: "var(--notion-text-tertiary)" }}>
                    {member.domain}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: "var(--notion-text)" }}>
                  {member.totalCollaborations}건
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1 text-center text-[10px]">
                <div className="p-1.5 rounded" style={{ background: "var(--notion-bg)" }}>
                  <div className="font-bold" style={{ color: "var(--notion-blue)" }}>{member.pairCount}</div>
                  <div style={{ color: "var(--notion-text-tertiary)" }}>Pair</div>
                </div>
                <div className="p-1.5 rounded" style={{ background: "var(--notion-bg)" }}>
                  <div className="font-bold" style={{ color: "var(--notion-orange)" }}>{member.preCount}</div>
                  <div style={{ color: "var(--notion-text-tertiary)" }}>출</div>
                </div>
                <div className="p-1.5 rounded" style={{ background: "var(--notion-bg)" }}>
                  <div className={`font-bold ${member.preInbound >= 2 ? "text-red-500" : ""}`} style={{ color: member.preInbound >= 2 ? undefined : "var(--notion-red)" }}>
                    {member.preInbound}
                  </div>
                  <div style={{ color: "var(--notion-text-tertiary)" }}>입</div>
                </div>
                <div className="p-1.5 rounded" style={{ background: "var(--notion-bg)" }}>
                  <div className="font-bold" style={{ color: "var(--notion-purple)" }}>{member.crossDomainScore}%</div>
                  <div style={{ color: "var(--notion-text-tertiary)" }}>X-D</div>
                </div>
                <div className="p-1.5 rounded" style={{ background: "var(--notion-bg)" }}>
                  <div className="font-bold" style={{ color: "var(--notion-green)" }}>{member.crossModuleScore}%</div>
                  <div style={{ color: "var(--notion-text-tertiary)" }}>X-M</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 데스크탑: 테이블 형태 */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--notion-border)" }}>
                <th className="text-left py-2 px-3 font-medium" style={{ color: "var(--notion-text-secondary)" }}>
                  멤버
                </th>
                <th className="text-center py-2 px-3 font-medium" style={{ color: "var(--notion-blue)" }}>
                  Pair
                </th>
                <th className="text-center py-2 px-3 font-medium" style={{ color: "var(--notion-orange)" }}>
                  대기(출)
                </th>
                <th className="text-center py-2 px-3 font-medium" style={{ color: "var(--notion-red)" }}>
                  대기(입)
                </th>
                <th className="text-center py-2 px-3 font-medium" style={{ color: "var(--notion-purple)" }}>
                  X-도메인
                </th>
                <th className="text-center py-2 px-3 font-medium" style={{ color: "var(--notion-green)" }}>
                  X-모듈
                </th>
                <th className="text-center py-2 px-3 font-medium" style={{ color: "var(--notion-text)" }}>
                  총계
                </th>
              </tr>
            </thead>
            <tbody>
              {memberSummaries.map((member) => (
                <tr key={member.name} style={{ borderBottom: "1px solid var(--notion-border)" }}>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: getDomainColor(member.domain) }}
                      />
                      <span className="font-medium" style={{ color: "var(--notion-text)" }}>
                        {member.name}
                      </span>
                      <span className="text-xs" style={{ color: "var(--notion-text-tertiary)" }}>
                        {member.domain}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-center" style={{ color: "var(--notion-blue)" }}>
                    {member.pairCount}
                  </td>
                  <td className="py-2 px-3 text-center" style={{ color: "var(--notion-orange)" }}>
                    {member.preCount}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={member.preInbound >= 2 ? "font-bold" : ""}
                      style={{ color: member.preInbound >= 2 ? "var(--notion-red)" : "var(--notion-text-secondary)" }}
                    >
                      {member.preInbound}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-center" style={{ color: "var(--notion-purple)" }}>
                    {member.crossDomainScore}%
                  </td>
                  <td className="py-2 px-3 text-center" style={{ color: "var(--notion-green)" }}>
                    {member.crossModuleScore}%
                  </td>
                  <td className="py-2 px-3 text-center font-semibold" style={{ color: "var(--notion-text)" }}>
                    {member.totalCollaborations}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 주요 협업 관계 */}
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--notion-text)" }}>
          🔗 주요 협업 관계
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 가장 활발한 Pair */}
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-blue)" }}>
              활발한 Pair 협업
            </div>
            <div className="space-y-1">
              {memberSummaries
                .filter((m) => m.pairCount > 0)
                .slice(0, 5)
                .map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ background: "var(--notion-bg-secondary)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: getDomainColor(member.domain) }}
                      />
                      <span className="text-sm" style={{ color: "var(--notion-text)" }}>
                        {member.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: "var(--notion-blue)" }}>
                      {member.pairCount}건
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* 병목 위험 */}
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-red)" }}>
              병목 위험 (대기 입 기준)
            </div>
            <div className="space-y-1">
              {memberSummaries
                .filter((m) => m.preInbound > 0)
                .sort((a, b) => b.preInbound - a.preInbound)
                .slice(0, 5)
                .map((member) => (
                  <div
                    key={member.name}
                    className="flex items-center justify-between p-2 rounded"
                    style={{ background: member.preInbound >= 2 ? "var(--notion-red-bg)" : "var(--notion-bg-secondary)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: getDomainColor(member.domain) }}
                      />
                      <span className="text-sm" style={{ color: "var(--notion-text)" }}>
                        {member.name}
                      </span>
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: member.preInbound >= 2 ? "var(--notion-red)" : "var(--notion-text-secondary)" }}
                    >
                      {member.preInbound}명 대기
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 통계 카드 컴포넌트
interface StatCardProps {
  value: number | string;
  label: string;
  color?: string;
  highlight?: boolean;
}

function StatCard({ value, label, color, highlight }: StatCardProps) {
  return (
    <div className={`notion-card p-4 ${highlight ? "ring-2 ring-offset-1 ring-red-400" : ""}`}>
      <div className="text-2xl font-bold" style={{ color: color || "var(--notion-text)" }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
        {label}
      </div>
    </div>
  );
}

