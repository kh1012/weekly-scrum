"use client";

import { useMemo, useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getBottleneckNodes } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface BottleneckMapProps {
  items: ScrumItem[];
}

export function BottleneckMap({ items }: BottleneckMapProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const bottleneckNodes = useMemo(() => {
    return getBottleneckNodes(items).filter(
      (node) => node.inboundCount > 0 || node.outboundCount > 0
    );
  }, [items]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "var(--notion-text-secondary)";
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 80) return "var(--notion-red)";
    if (intensity >= 50) return "var(--notion-orange)";
    if (intensity >= 20) return "var(--notion-yellow)";
    return "var(--notion-green)";
  };

  const selectedNodeData = bottleneckNodes.find((n) => n.name === selectedNode);

  if (bottleneckNodes.length === 0) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          🚧 병목 현황
        </h3>
        <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          대기 관계가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🚧 병목 현황 (Waiting-On)
        </h3>
        <div className="flex items-center gap-2 text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--notion-red)" }} />
            심각
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--notion-orange)" }} />
            주의
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--notion-green)" }} />
            정상
          </span>
        </div>
      </div>

      {/* 병목 막대 그래프 */}
      <div className="space-y-2">
        {bottleneckNodes.slice(0, 10).map((node) => {
          const isSelected = selectedNode === node.name;
          const barWidth = Math.max(node.intensity, 5);

          return (
            <div
              key={node.name}
              className="cursor-pointer rounded-lg p-2 transition-all"
              style={{
                background: isSelected ? "var(--notion-bg-secondary)" : "transparent",
                border: isSelected ? "1px solid var(--notion-border-dark)" : "1px solid transparent",
              }}
              onClick={() => setSelectedNode(isSelected ? null : node.name)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: getDomainColor(node.domain) }}
                  />
                  <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
                    {node.name}
                  </span>
                  <span className="text-xs" style={{ color: "var(--notion-text-tertiary)" }}>
                    {node.domain}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: "var(--notion-red)" }}>
                    ← {node.inboundCount}명 대기 중
                  </span>
                  <span style={{ color: "var(--notion-blue)" }}>
                    → {node.outboundCount}명 대기
                  </span>
                </div>
              </div>
              
              {/* 병목 강도 바 */}
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--notion-bg-secondary)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${barWidth}%`,
                    background: getIntensityColor(node.intensity),
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택된 노드 상세 정보 */}
      {selectedNodeData && (
        <div
          className="mt-4 p-3 rounded-lg"
          style={{
            background: "var(--notion-bg-secondary)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
              {selectedNodeData.name} 상세
            </span>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-xs"
              style={{ color: "var(--notion-text-secondary)" }}
            >
              닫기
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* 나를 기다리는 사람들 */}
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-red)" }}>
                이 사람을 기다리는 중 ({selectedNodeData.waiters.length}명)
              </div>
              {selectedNodeData.waiters.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedNodeData.waiters.map((waiter) => (
                    <span
                      key={waiter}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background: "var(--notion-red-bg)",
                        color: "var(--notion-red)",
                      }}
                    >
                      {waiter}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs" style={{ color: "var(--notion-text-tertiary)" }}>
                  없음
                </span>
              )}
            </div>

            {/* 내가 기다리는 사람들 */}
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-blue)" }}>
                이 사람이 기다리는 중 ({selectedNodeData.blocking.length}명)
              </div>
              {selectedNodeData.blocking.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {selectedNodeData.blocking.map((blocked) => (
                    <span
                      key={blocked}
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background: "var(--notion-blue-bg)",
                        color: "var(--notion-blue)",
                      }}
                    >
                      {blocked}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs" style={{ color: "var(--notion-text-tertiary)" }}>
                  없음
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 요약 */}
      <div className="mt-4 pt-3 text-xs" style={{ borderTop: "1px solid var(--notion-border)", color: "var(--notion-text-secondary)" }}>
        총 {bottleneckNodes.filter((n) => n.inboundCount > 0).length}명이 다른 팀원의 작업을 대기 중입니다.
        {bottleneckNodes.filter((n) => n.intensity >= 50).length > 0 && (
          <span style={{ color: "var(--notion-orange)" }}>
            {" "}주의가 필요한 병목: {bottleneckNodes.filter((n) => n.intensity >= 50).length}건
          </span>
        )}
      </div>
    </div>
  );
}

