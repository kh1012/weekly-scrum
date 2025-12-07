"use client";

import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getCollaborationLoadHeatmap } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CollaborationLoadHeatmapProps {
  items: ScrumItem[];
}

export function CollaborationLoadHeatmap({ items }: CollaborationLoadHeatmapProps) {
  const heatmapData = useMemo(() => {
    return getCollaborationLoadHeatmap(items);
  }, [items]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "var(--notion-text-secondary)";
  };

  const getHeatColor = (value: number, maxValue: number): string => {
    if (maxValue === 0) return "var(--notion-bg-secondary)";
    const intensity = value / maxValue;
    if (intensity >= 0.8) return "var(--notion-red-bg)";
    if (intensity >= 0.5) return "var(--notion-orange-bg)";
    if (intensity >= 0.2) return "var(--notion-yellow-bg)";
    if (intensity > 0) return "var(--notion-green-bg)";
    return "var(--notion-bg-secondary)";
  };

  const getTextColor = (value: number, maxValue: number): string => {
    if (maxValue === 0) return "var(--notion-text-tertiary)";
    const intensity = value / maxValue;
    if (intensity >= 0.8) return "var(--notion-red)";
    if (intensity >= 0.5) return "var(--notion-orange)";
    if (intensity >= 0.2) return "var(--notion-yellow-dark, var(--notion-text))";
    if (intensity > 0) return "var(--notion-green)";
    return "var(--notion-text-tertiary)";
  };

  const maxValues = useMemo(() => {
    return {
      pair: Math.max(...heatmapData.map((d) => d.pairCount), 1),
      waitingOutbound: Math.max(...heatmapData.map((d) => d.waitingOnOutbound), 1),
      waitingInbound: Math.max(...heatmapData.map((d) => d.waitingOnInbound), 1),
      total: Math.max(...heatmapData.map((d) => d.totalLoad), 1),
    };
  }, [heatmapData]);

  if (heatmapData.length === 0 || heatmapData.every((d) => d.totalLoad === 0)) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          🔥 협업 부하 현황
        </h3>
        <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          협업 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🔥 협업 부하 현황
        </h3>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span>낮음</span>
          <div className="flex gap-0.5">
            <span className="w-3 h-3 rounded" style={{ background: "var(--notion-bg-secondary)" }} />
            <span className="w-3 h-3 rounded" style={{ background: "var(--notion-green-bg)" }} />
            <span className="w-3 h-3 rounded" style={{ background: "var(--notion-yellow-bg)" }} />
            <span className="w-3 h-3 rounded" style={{ background: "var(--notion-orange-bg)" }} />
            <span className="w-3 h-3 rounded" style={{ background: "var(--notion-red-bg)" }} />
          </div>
          <span>높음</span>
        </div>
      </div>

      {/* 히트맵 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="text-left py-2 px-2 font-medium" style={{ color: "var(--notion-text-secondary)" }}>
                멤버
              </th>
              <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--notion-blue)" }}>
                Pair
              </th>
              <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--notion-orange)" }}>
                대기 중 (출)
              </th>
              <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--notion-red)" }}>
                대기 중 (입)
              </th>
              <th className="text-center py-2 px-2 font-medium" style={{ color: "var(--notion-text)" }}>
                총계
              </th>
            </tr>
          </thead>
          <tbody>
            {heatmapData.map((row) => (
              <tr key={row.name}>
                <td className="py-1.5 px-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: getDomainColor(row.domain) }}
                    />
                    <span className="font-medium" style={{ color: "var(--notion-text)" }}>
                      {row.name}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
                      {row.domain}
                    </span>
                  </div>
                </td>
                <td className="py-1.5 px-2">
                  <div
                    className="text-center py-1 rounded font-medium"
                    style={{
                      background: getHeatColor(row.pairCount, maxValues.pair),
                      color: getTextColor(row.pairCount, maxValues.pair),
                    }}
                  >
                    {row.pairCount}
                  </div>
                </td>
                <td className="py-1.5 px-2">
                  <div
                    className="text-center py-1 rounded font-medium"
                    style={{
                      background: getHeatColor(row.waitingOnOutbound, maxValues.waitingOutbound),
                      color: getTextColor(row.waitingOnOutbound, maxValues.waitingOutbound),
                    }}
                  >
                    {row.waitingOnOutbound}
                  </div>
                </td>
                <td className="py-1.5 px-2">
                  <div
                    className="text-center py-1 rounded font-medium"
                    style={{
                      background: getHeatColor(row.waitingOnInbound, maxValues.waitingInbound),
                      color: getTextColor(row.waitingOnInbound, maxValues.waitingInbound),
                    }}
                  >
                    {row.waitingOnInbound}
                  </div>
                </td>
                <td className="py-1.5 px-2">
                  <div
                    className="text-center py-1 rounded font-semibold"
                    style={{
                      background: getHeatColor(row.totalLoad, maxValues.total),
                      color: getTextColor(row.totalLoad, maxValues.total),
                    }}
                  >
                    {row.totalLoad}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 설명 */}
      <div className="mt-3 pt-3 grid grid-cols-2 gap-2 text-xs" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div style={{ color: "var(--notion-text-secondary)" }}>
          <span style={{ color: "var(--notion-blue)" }}>Pair</span>: 함께 작업 중인 협업 수
        </div>
        <div style={{ color: "var(--notion-text-secondary)" }}>
          <span style={{ color: "var(--notion-orange)" }}>대기 중 (출)</span>: 다른 사람을 기다리는 수
        </div>
        <div style={{ color: "var(--notion-text-secondary)" }}>
          <span style={{ color: "var(--notion-red)" }}>대기 중 (입)</span>: 나를 기다리는 사람 수
        </div>
        <div style={{ color: "var(--notion-text-secondary)" }}>
          <span style={{ color: "var(--notion-text)" }}>총계</span>: 전체 협업 부하
        </div>
      </div>
    </div>
  );
}

