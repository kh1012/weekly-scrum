"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getCollaborationNodes, getCollaborationEdges } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CollaborationNetworkGraphProps {
  items: ScrumItem[];
}

interface NodePosition {
  id: string;
  name: string;
  domain: string;
  degree: number;
  pairCount: number;
  waitingOnInbound: number;
  x: number;
  y: number;
}

export function CollaborationNetworkGraph({ items }: CollaborationNetworkGraphProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const { rawNodes, edges } = useMemo(() => {
    const rawNodes = getCollaborationNodes(items);
    const edges = getCollaborationEdges(items);
    return { rawNodes, edges };
  }, [items]);

  // 도메인별 그룹핑 및 초기 배치
  useEffect(() => {
    if (rawNodes.length === 0) return;

    const width = 700;
    const height = 400;
    const padding = 60;

    // 도메인별로 그룹핑
    const domainGroups = new Map<string, typeof rawNodes>();
    rawNodes.forEach((node) => {
      const group = domainGroups.get(node.domain) || [];
      group.push(node);
      domainGroups.set(node.domain, group);
    });

    const domains = Array.from(domainGroups.keys()).sort();
    const domainCount = domains.length;

    // 도메인별 열 배치
    const positions: NodePosition[] = [];
    domains.forEach((domain, domainIndex) => {
      const nodes = domainGroups.get(domain) || [];
      const columnX = padding + ((width - padding * 2) / Math.max(domainCount - 1, 1)) * domainIndex;

      nodes.forEach((node, nodeIndex) => {
        const nodeCount = nodes.length;
        const startY = height / 2 - ((nodeCount - 1) * 70) / 2;
        const y = startY + nodeIndex * 70;

        positions.push({
          id: node.id,
          name: node.name,
          domain: node.domain,
          degree: node.degree,
          pairCount: node.pairCount,
          waitingOnInbound: node.waitingOnInbound,
          x: columnX,
          y: Math.max(padding, Math.min(height - padding, y)),
        });
      });
    });

    // Force simulation for better spacing
    const simulate = (nodes: NodePosition[], iterations: number): NodePosition[] => {
      const result = nodes.map((n) => ({ ...n }));

      for (let iter = 0; iter < iterations; iter++) {
        // Repulsion between nodes
        for (let i = 0; i < result.length; i++) {
          for (let j = i + 1; j < result.length; j++) {
            const dx = result[j].x - result[i].x;
            const dy = result[j].y - result[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = 80;

            if (dist < minDist) {
              const force = (minDist - dist) / dist * 0.5;
              result[i].x -= dx * force * 0.3;
              result[i].y -= dy * force;
              result[j].x += dx * force * 0.3;
              result[j].y += dy * force;
            }
          }
        }

        // Keep within bounds
        result.forEach((node) => {
          node.x = Math.max(padding, Math.min(width - padding, node.x));
          node.y = Math.max(padding, Math.min(height - padding, node.y));
        });
      }

      return result;
    };

    const simulated = simulate(positions, 50);
    setNodePositions(simulated);
  }, [rawNodes]);

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeName: string) => {
    e.preventDefault();
    const node = nodePositions.find((n) => n.name === nodeName);
    if (!node) return;

    const svgRect = (e.currentTarget as SVGElement).closest("svg")?.getBoundingClientRect();
    if (!svgRect) return;

    setDraggingNode(nodeName);
    setDragOffset({
      x: e.clientX - svgRect.left - node.x,
      y: e.clientY - svgRect.top - node.y,
    });
  }, [nodePositions]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNode) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - svgRect.left - dragOffset.x;
    const newY = e.clientY - svgRect.top - dragOffset.y;

    setNodePositions((prev) =>
      prev.map((node) =>
        node.name === draggingNode
          ? {
              ...node,
              x: Math.max(40, Math.min(660, newX)),
              y: Math.max(40, Math.min(360, newY)),
            }
          : node
      )
    );
  }, [draggingNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  };

  const getNodeRadius = (degree: number) => {
    const minRadius = 20;
    const maxRadius = 35;
    const maxDegree = Math.max(...nodePositions.map((n) => n.degree), 1);
    return minRadius + ((maxRadius - minRadius) * degree) / maxDegree;
  };

  const activeNode = selectedNode ?? hoveredNode;
  const activeConnections = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const connected = edges
      .filter((e) => e.source === activeNode || e.target === activeNode)
      .flatMap((e) => [e.source, e.target]);
    return new Set(connected);
  }, [activeNode, edges]);

  // 엣지 경로 계산 (곡선)
  const getEdgePath = (
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourceRadius: number,
    targetRadius: number
  ) => {
    const dx = targetX - sourceX;
    const dy = targetY - sourceY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return "";

    // 노드 테두리에서 시작/끝
    const startX = sourceX + (dx / dist) * sourceRadius;
    const startY = sourceY + (dy / dist) * sourceRadius;
    const endX = targetX - (dx / dist) * (targetRadius + 8);
    const endY = targetY - (dy / dist) * (targetRadius + 8);

    // 곡선 제어점 (수직 방향으로 오프셋)
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const perpX = -dy / dist;
    const perpY = dx / dist;
    const curveOffset = Math.min(dist * 0.15, 30);
    const ctrlX = midX + perpX * curveOffset;
    const ctrlY = midY + perpY * curveOffset;

    return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  };

  if (rawNodes.length === 0) {
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

  // 도메인 목록
  const domains = Array.from(new Set(nodePositions.map((n) => n.domain))).sort();

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🔗 협업 네트워크
        </h3>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="16" y2="4" stroke="#3b82f6" strokeWidth="2" />
            </svg>
            Pair
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <defs>
                <marker id="arrowRed" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                </marker>
              </defs>
              <line x1="0" y1="4" x2="14" y2="4" stroke="#ef4444" strokeWidth="2" markerEnd="url(#arrowRed)" />
            </svg>
            Waiting-on
          </span>
        </div>
      </div>

      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <svg
          width="100%"
          height="400"
          viewBox="0 0 700 400"
          style={{ cursor: draggingNode ? "grabbing" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <defs>
            {/* 화살표 마커 */}
            <marker
              id="arrowhead-pair"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill="#3b82f6" />
            </marker>
            <marker
              id="arrowhead-waiting"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill="#ef4444" />
            </marker>
            {/* 그림자 필터 */}
            <filter id="nodeShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 도메인 레이블 (상단) */}
          {domains.map((domain, idx) => {
            const domainNodes = nodePositions.filter((n) => n.domain === domain);
            if (domainNodes.length === 0) return null;
            const avgX = domainNodes.reduce((sum, n) => sum + n.x, 0) / domainNodes.length;

            return (
              <g key={`domain-label-${domain}`}>
                <text
                  x={avgX}
                  y={20}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill={getDomainColor(domain)}
                >
                  {domain}
                </text>
                <line
                  x1={avgX - 30}
                  y1={28}
                  x2={avgX + 30}
                  y2={28}
                  stroke={getDomainColor(domain)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  opacity={0.4}
                />
              </g>
            );
          })}

          {/* 엣지 (연결선) */}
          {edges.map((edge, idx) => {
            const sourceNode = nodePositions.find((n) => n.name === edge.source);
            const targetNode = nodePositions.find((n) => n.name === edge.target);
            if (!sourceNode || !targetNode) return null;

            const sourceRadius = getNodeRadius(sourceNode.degree);
            const targetRadius = getNodeRadius(targetNode.degree);
            const path = getEdgePath(
              sourceNode.x,
              sourceNode.y,
              targetNode.x,
              targetNode.y,
              sourceRadius,
              targetRadius
            );

            const isActive = !activeNode || activeConnections.has(edge.source);
            const opacity = activeNode ? (isActive ? 1 : 0.1) : 0.6;
            const strokeWidth = Math.min(edge.count + 1.5, 4);
            const isPair = edge.relation === "pair";
            const color = isPair ? "#3b82f6" : "#ef4444";

            return (
              <g key={`edge-${idx}`}>
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={strokeWidth}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                  markerEnd={isPair ? undefined : "url(#arrowhead-waiting)"}
                  style={{
                    transition: "stroke-opacity 0.2s ease",
                  }}
                />
                {/* 엣지 카운트 표시 */}
                {edge.count > 1 && opacity > 0.3 && (
                  <text
                    x={(sourceNode.x + targetNode.x) / 2}
                    y={(sourceNode.y + targetNode.y) / 2 - 8}
                    textAnchor="middle"
                    fontSize={9}
                    fontWeight={600}
                    fill={color}
                    opacity={opacity}
                  >
                    ×{edge.count}
                  </text>
                )}
              </g>
            );
          })}

          {/* 노드 */}
          {nodePositions.map((node) => {
            const isActive = !activeNode || activeConnections.has(node.name) || node.name === activeNode;
            const opacity = activeNode ? (isActive ? 1 : 0.25) : 1;
            const radius = getNodeRadius(node.degree);
            const color = getDomainColor(node.domain);
            const isSelected = node.name === activeNode;
            const isBottleneck = node.waitingOnInbound >= 2;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                style={{
                  cursor: "grab",
                  opacity,
                  transition: "opacity 0.2s ease",
                }}
                onMouseDown={(e) => handleMouseDown(e, node.name)}
                onMouseEnter={() => !draggingNode && setHoveredNode(node.name)}
                onMouseLeave={() => !draggingNode && setHoveredNode(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!draggingNode) {
                    setSelectedNode(selectedNode === node.name ? null : node.name);
                  }
                }}
              >
                {/* 병목 경고 표시 */}
                {isBottleneck && (
                  <circle
                    r={radius + 8}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    opacity={0.6}
                  />
                )}
                {/* 선택 하이라이트 */}
                {isSelected && (
                  <circle
                    r={radius + 5}
                    fill="none"
                    stroke={color}
                    strokeWidth={3}
                    opacity={0.5}
                  />
                )}
                {/* 노드 본체 */}
                <circle
                  r={radius}
                  fill={color}
                  stroke="white"
                  strokeWidth={2.5}
                  filter={isSelected ? "url(#nodeGlow)" : "url(#nodeShadow)"}
                />
                {/* 노드 내 이름 */}
                <text
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={radius > 25 ? 11 : 10}
                  fontWeight={600}
                  fill="white"
                  style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {node.name.length > 5 ? node.name.slice(0, 4) + "…" : node.name}
                </text>
                {/* Pair 카운트 뱃지 */}
                {node.pairCount > 0 && (
                  <g transform={`translate(${radius - 2}, ${-radius + 2})`}>
                    <circle r={8} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={8}
                      fontWeight={700}
                      fill="white"
                    >
                      {node.pairCount}
                    </text>
                  </g>
                )}
                {/* Waiting-on Inbound 뱃지 */}
                {node.waitingOnInbound > 0 && (
                  <g transform={`translate(${-radius + 2}, ${-radius + 2})`}>
                    <circle r={8} fill="#ef4444" stroke="white" strokeWidth={1.5} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={8}
                      fontWeight={700}
                      fill="white"
                    >
                      {node.waitingOnInbound}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* 정보 패널 */}
        {activeNode && (
          <div
            className="absolute top-3 right-3 p-3 rounded-lg text-xs"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid var(--notion-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div className="font-bold mb-2" style={{ color: "var(--notion-text)" }}>
              {activeNode}
            </div>
            <div className="space-y-1" style={{ color: "var(--notion-text-secondary)" }}>
              {(() => {
                const node = nodePositions.find((n) => n.name === activeNode);
                if (!node) return null;
                return (
                  <>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: getDomainColor(node.domain) }}
                      />
                      {node.domain}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">● Pair: {node.pairCount}건</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        style={{ color: node.waitingOnInbound >= 2 ? "#ef4444" : undefined }}
                      >
                        ● 대기 중: {node.waitingOnInbound}명
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>
            {selectedNode && (
              <button
                onClick={() => setSelectedNode(null)}
                className="mt-2 w-full text-xs py-1 rounded"
                style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-secondary)" }}
              >
                선택 해제
              </button>
            )}
          </div>
        )}

        {/* 안내 */}
        <div
          className="absolute bottom-2 left-2 text-[10px] px-2 py-1 rounded"
          style={{ background: "rgba(0,0,0,0.5)", color: "white" }}
        >
          노드 드래그로 위치 조정
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="flex flex-wrap gap-2">
          {domains.map((domain) => (
            <span
              key={domain}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
              style={{ background: "var(--notion-bg-secondary)" }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: getDomainColor(domain) }}
              />
              {domain}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            Pair 수
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            대기 중
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full border-2 border-dashed border-red-400" />
            병목
          </span>
        </div>
      </div>
    </div>
  );
}
