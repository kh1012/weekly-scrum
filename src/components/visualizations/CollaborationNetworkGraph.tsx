"use client";

import { useMemo, useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getCollaborationNodes, getCollaborationEdges } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CollaborationNetworkGraphProps {
  items: ScrumItem[];
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  name: string;
  domain: string;
  degree: number;
  pairCount: number;
  waitingOnInbound: number;
}

export function CollaborationNetworkGraph({ items }: CollaborationNetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { nodes, edges, nodePositions } = useMemo(() => {
    const nodes = getCollaborationNodes(items);
    const edges = getCollaborationEdges(items);

    // 원형 레이아웃으로 노드 배치
    const width = 400;
    const height = 400;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 60;

    const nodePositions: NodePosition[] = nodes.map((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length - Math.PI / 2;
      return {
        id: node.id,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        name: node.name,
        domain: node.domain,
        degree: node.degree,
        pairCount: node.pairCount,
        waitingOnInbound: node.waitingOnInbound,
      };
    });

    return { nodes, edges, nodePositions };
  }, [items]);

  const getNodePosition = (name: string) => {
    return nodePositions.find((n) => n.name === name);
  };

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "var(--notion-text-secondary)";
  };

  const getNodeRadius = (degree: number) => {
    const minRadius = 16;
    const maxRadius = 32;
    const maxDegree = Math.max(...nodePositions.map((n) => n.degree), 1);
    return minRadius + ((maxRadius - minRadius) * degree) / maxDegree;
  };

  const activeNode = selectedNode ?? hoveredNode;
  const activeEdges = activeNode
    ? edges.filter((e) => e.source === activeNode || e.target === activeNode)
    : [];
  const activeConnections = new Set(
    activeEdges.flatMap((e) => [e.source, e.target])
  );

  if (nodes.length === 0) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          🔗 협업 네트워크
        </h3>
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          협업 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🔗 협업 네트워크
        </h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--notion-blue)" }} />
            pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 rounded" style={{ background: "var(--notion-red)" }} />
            waiting-on
          </span>
        </div>
      </div>

      <div className="relative" style={{ height: 400 }}>
        <svg width="100%" height="100%" viewBox="0 0 400 400">
          {/* 엣지 */}
          {edges.map((edge, idx) => {
            const source = getNodePosition(edge.source);
            const target = getNodePosition(edge.target);
            if (!source || !target) return null;

            const isActive = !activeNode || activeConnections.has(edge.source);
            const opacity = activeNode ? (isActive ? 1 : 0.1) : 0.6;
            const strokeWidth = Math.min(edge.count * 1.5 + 1, 4);
            const color = edge.relation === "pair" ? "var(--notion-blue)" : "var(--notion-red)";

            // 화살표 방향 계산 (waiting-on만)
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const angle = Math.atan2(dy, dx);
            const targetRadius = getNodeRadius(target.degree);
            const endX = target.x - Math.cos(angle) * targetRadius;
            const endY = target.y - Math.sin(angle) * targetRadius;

            return (
              <g key={idx}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={endX}
                  y2={endY}
                  stroke={color}
                  strokeWidth={strokeWidth}
                  opacity={opacity}
                  strokeLinecap="round"
                />
                {edge.relation === "waiting-on" && (
                  <polygon
                    points={`0,-4 8,0 0,4`}
                    fill={color}
                    opacity={opacity}
                    transform={`translate(${endX},${endY}) rotate(${(angle * 180) / Math.PI})`}
                  />
                )}
              </g>
            );
          })}

          {/* 노드 */}
          {nodePositions.map((node) => {
            const isActive = !activeNode || activeConnections.has(node.name) || node.name === activeNode;
            const opacity = activeNode ? (isActive ? 1 : 0.2) : 1;
            const radius = getNodeRadius(node.degree);
            const color = getDomainColor(node.domain);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                style={{ cursor: "pointer", opacity }}
                onMouseEnter={() => setHoveredNode(node.name)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode === node.name ? null : node.name)}
              >
                <circle
                  r={radius}
                  fill={color}
                  stroke={node.name === activeNode ? "var(--notion-text)" : "var(--notion-bg)"}
                  strokeWidth={node.name === activeNode ? 3 : 2}
                />
                <text
                  y={radius + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="var(--notion-text)"
                  fontWeight={node.name === activeNode ? 600 : 400}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 호버 정보 */}
        {activeNode && (
          <div
            className="absolute top-2 left-2 p-3 rounded-lg text-xs"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
              boxShadow: "var(--notion-shadow-sm)",
            }}
          >
            <div className="font-semibold mb-1" style={{ color: "var(--notion-text)" }}>
              {activeNode}
            </div>
            <div className="space-y-0.5" style={{ color: "var(--notion-text-secondary)" }}>
              {(() => {
                const node = nodePositions.find((n) => n.name === activeNode);
                if (!node) return null;
                return (
                  <>
                    <div>도메인: {node.domain}</div>
                    <div>pair: {node.pairCount}건</div>
                    <div>대기 중인 사람: {node.waitingOnInbound}명</div>
                    <div>총 연결: {node.degree}건</div>
                  </>
                );
              })()}
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-2 text-xs underline"
                style={{ color: "var(--notion-blue)" }}
              >
                선택 해제
              </button>
            )}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-3 pt-3 flex flex-wrap gap-2" style={{ borderTop: "1px solid var(--notion-border)" }}>
        {Array.from(new Set(nodePositions.map((n) => n.domain))).map((domain) => (
          <span
            key={domain}
            className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
            style={{ background: "var(--notion-bg-secondary)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: getDomainColor(domain) }}
            />
            {domain}
          </span>
        ))}
      </div>
    </div>
  );
}

