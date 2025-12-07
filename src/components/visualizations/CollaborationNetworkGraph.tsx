"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getCollaborationNodes, getCollaborationEdges } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CollaborationNetworkGraphProps {
  items: ScrumItem[];
}

interface NodeData {
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodeData[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  const { rawNodes, edges } = useMemo(() => {
    const rawNodes = getCollaborationNodes(items);
    const edges = getCollaborationEdges(items);
    return { rawNodes, edges };
  }, [items]);

  // 컨테이너 크기 감지
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: Math.max(rect.width, 300),
          height: Math.max(rect.height, 300),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // 초기 노드 배치 (도메인별 컬럼)
  useEffect(() => {
    if (rawNodes.length === 0) return;

    const { width, height } = dimensions;
    const padding = 80;
    const verticalSpacing = 90;

    // 도메인별 그룹핑
    const domainGroups = new Map<string, typeof rawNodes>();
    rawNodes.forEach((node) => {
      const group = domainGroups.get(node.domain) || [];
      group.push(node);
      domainGroups.set(node.domain, group);
    });

    const domains = Array.from(domainGroups.keys()).sort();
    const domainCount = domains.length;

    const newNodes: NodeData[] = [];
    domains.forEach((domain, domainIndex) => {
      const domainNodes = domainGroups.get(domain) || [];
      const columnX = domainCount === 1
        ? width / 2
        : padding + ((width - padding * 2) / (domainCount - 1)) * domainIndex;

      domainNodes.forEach((node, nodeIndex) => {
        const totalHeight = (domainNodes.length - 1) * verticalSpacing;
        const startY = height / 2 - totalHeight / 2;
        const y = startY + nodeIndex * verticalSpacing;

        newNodes.push({
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

    // 노드 간 겹침 방지
    for (let iter = 0; iter < 50; iter++) {
      let moved = false;
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const dx = newNodes[j].x - newNodes[i].x;
          const dy = newNodes[j].y - newNodes[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = 100;

          if (dist < minDist && dist > 0) {
            const force = (minDist - dist) / 2;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            newNodes[i].x -= fx * 0.3;
            newNodes[i].y -= fy;
            newNodes[j].x += fx * 0.3;
            newNodes[j].y += fy;
            moved = true;
          }
        }
      }

      // 경계 유지
      newNodes.forEach((node) => {
        node.x = Math.max(padding, Math.min(width - padding, node.x));
        node.y = Math.max(padding, Math.min(height - padding, node.y));
      });

      if (!moved) break;
    }

    setNodes(newNodes);
  }, [rawNodes, dimensions]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  };

  const getNodeRadius = useCallback((degree: number) => {
    const maxDegree = Math.max(...nodes.map((n) => n.degree), 1);
    return 26 + (degree / maxDegree) * 16;
  }, [nodes]);

  // SVG 좌표 변환
  const getSvgPoint = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const { width, height } = dimensions;

    // 줌 적용된 viewBox 계산
    const vbWidth = width / zoom;
    const vbHeight = height / zoom;
    const vbX = (width - vbWidth) / 2;
    const vbY = (height - vbHeight) / 2;

    const x = vbX + ((e.clientX - rect.left) / rect.width) * vbWidth;
    const y = vbY + ((e.clientY - rect.top) / rect.height) * vbHeight;

    return { x, y };
  }, [dimensions, zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGGElement>, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const svg = e.currentTarget.closest("svg");
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const { width, height } = dimensions;
    const vbWidth = width / zoom;
    const vbHeight = height / zoom;
    const vbX = (width - vbWidth) / 2;
    const vbY = (height - vbHeight) / 2;

    const svgX = vbX + ((e.clientX - rect.left) / rect.width) * vbWidth;
    const svgY = vbY + ((e.clientY - rect.top) / rect.height) * vbHeight;

    setDragging({
      id: nodeId,
      offsetX: svgX - node.x,
      offsetY: svgY - node.y,
    });
  }, [nodes, dimensions, zoom]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging) return;

    const point = getSvgPoint(e);
    const newX = point.x - dragging.offsetX;
    const newY = point.y - dragging.offsetY;

    const padding = 50;
    const { width, height } = dimensions;

    setNodes((prev) =>
      prev.map((node) =>
        node.id === dragging.id
          ? {
              ...node,
              x: Math.max(padding, Math.min(width - padding, newX)),
              y: Math.max(padding, Math.min(height - padding, newY)),
            }
          : node
      )
    );
  }, [dragging, getSvgPoint, dimensions]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.5, Math.min(2.5, prev + delta)));
  }, []);

  const activeNode = selectedNode ?? hoveredNode;
  const activeConnections = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const connected = edges
      .filter((e) => e.source === activeNode || e.target === activeNode)
      .flatMap((e) => [e.source, e.target]);
    return new Set(connected);
  }, [activeNode, edges]);

  // 엣지 경로 계산
  const getEdgePath = useCallback((source: NodeData, target: NodeData) => {
    const sourceRadius = getNodeRadius(source.degree);
    const targetRadius = getNodeRadius(target.degree);

    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) return "";

    const startX = source.x + (dx / dist) * sourceRadius;
    const startY = source.y + (dy / dist) * sourceRadius;
    const endX = target.x - (dx / dist) * (targetRadius + 8);
    const endY = target.y - (dy / dist) * (targetRadius + 8);

    // 곡선
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const perpX = -dy / dist;
    const perpY = dx / dist;
    const curve = Math.min(dist * 0.12, 25);
    const ctrlX = midX + perpX * curve;
    const ctrlY = midY + perpY * curve;

    return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  }, [getNodeRadius]);

  // viewBox 계산
  const { width, height } = dimensions;
  const vbWidth = width / zoom;
  const vbHeight = height / zoom;
  const vbX = (width - vbWidth) / 2;
  const vbY = (height - vbHeight) / 2;

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

  const domains = Array.from(new Set(nodes.map((n) => n.domain))).sort();

  return (
    <div className="notion-card p-3 sm:p-4">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
            🔗 협업 네트워크
          </h3>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "var(--notion-text-secondary)" }}>
            노드 드래그로 위치 조정 / 휠로 확대·축소
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] sm:text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-500 rounded" />
            Pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500 rounded" />
            →Waiting
          </span>
        </div>
      </div>

      {/* 그래프 영역 */}
      <div
        ref={containerRef}
        className="relative rounded-lg overflow-hidden h-[300px] sm:h-[380px] md:h-[450px] lg:h-[500px]"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: dragging ? "grabbing" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            {/* 연결된 엣지용 화살표 마커 */}
            <marker id="arrow-waiting" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#ef4444" fillOpacity="0.7" />
            </marker>
            {/* 연결되지 않은 엣지용 흐린 화살표 마커 */}
            <marker id="arrow-waiting-dim" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#ef4444" fillOpacity="0.1" />
            </marker>
            <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="node-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 엣지 */}
          {edges.map((edge, idx) => {
            const source = nodes.find((n) => n.name === edge.source);
            const target = nodes.find((n) => n.name === edge.target);
            if (!source || !target) return null;

            const isPair = edge.relation === "pair";
            const isConnected = activeNode
              ? edge.source === activeNode || edge.target === activeNode
              : true;

            return (
              <path
                key={`edge-${idx}`}
                d={getEdgePath(source, target)}
                fill="none"
                stroke={isPair ? "#3b82f6" : "#ef4444"}
                strokeWidth={isPair ? 2.5 : 2}
                strokeOpacity={isConnected ? 0.7 : 0.1}
                strokeLinecap="round"
                markerEnd={isPair ? undefined : isConnected ? "url(#arrow-waiting)" : "url(#arrow-waiting-dim)"}
                style={{ transition: "stroke-opacity 0.2s" }}
              />
            );
          })}

          {/* 노드 */}
          {nodes.map((node) => {
            const radius = getNodeRadius(node.degree);
            const isActive = activeNode === node.name;
            const isConnected = activeConnections.has(node.name);
            const opacity = activeNode ? (isActive || isConnected ? 1 : 0.2) : 1;
            const isBottleneck = node.waitingOnInbound >= 2;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                style={{
                  cursor: dragging?.id === node.id ? "grabbing" : "grab",
                  opacity,
                  transition: dragging?.id === node.id ? "none" : "opacity 0.2s",
                }}
                onMouseDown={(e) => handleMouseDown(e, node.id)}
                onMouseEnter={() => !dragging && setHoveredNode(node.name)}
                onMouseLeave={() => !dragging && setHoveredNode(null)}
                onClick={(e) => {
                  if (!dragging) {
                    e.stopPropagation();
                    setSelectedNode(selectedNode === node.name ? null : node.name);
                  }
                }}
              >
                {/* 병목 표시 */}
                {isBottleneck && (
                  <circle
                    r={radius + 7}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    strokeDasharray="5 3"
                    opacity={0.8}
                  />
                )}
                {/* 선택 하이라이트 */}
                {isActive && (
                  <circle
                    r={radius + 4}
                    fill="none"
                    stroke={getDomainColor(node.domain)}
                    strokeWidth={3}
                    opacity={0.6}
                  />
                )}
                {/* 노드 */}
                <circle
                  r={radius}
                  fill={getDomainColor(node.domain)}
                  stroke="white"
                  strokeWidth={3}
                  filter={isActive ? "url(#node-glow)" : "url(#node-shadow)"}
                />
                {/* 이름 */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={radius > 32 ? 11 : 10}
                  fontWeight={600}
                  style={{ pointerEvents: "none", textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
                >
                  {node.name.length > 5 ? node.name.slice(0, 4) + "…" : node.name}
                </text>
                {/* Pair 뱃지 */}
                {node.pairCount > 0 && (
                  <g transform={`translate(${radius - 2}, ${-radius + 2})`}>
                    <circle r={10} fill="#3b82f6" stroke="white" strokeWidth={2} />
                    <text textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill="white">
                      {node.pairCount}
                    </text>
                  </g>
                )}
                {/* Waiting 뱃지 */}
                {node.waitingOnInbound > 0 && (
                  <g transform={`translate(${-radius + 2}, ${-radius + 2})`}>
                    <circle r={10} fill="#ef4444" stroke="white" strokeWidth={2} />
                    <text textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill="white">
                      {node.waitingOnInbound}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text)" }}
          >
            −
          </button>
          <div
            className="px-2 py-1 text-[10px] sm:text-xs font-medium rounded"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text)" }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text)" }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="ml-1 px-2 py-1 text-[10px] sm:text-xs rounded"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text-secondary)" }}
          >
            리셋
          </button>
        </div>

        {/* 정보 패널 */}
        {activeNode && (
          <div
            className="absolute top-2 right-2 p-2 sm:p-3 rounded-lg text-[10px] sm:text-xs max-w-[140px] sm:max-w-[180px]"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid var(--notion-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            {(() => {
              const node = nodes.find((n) => n.name === activeNode);
              if (!node) return null;
              return (
                <>
                  <div className="font-bold mb-1.5 truncate" style={{ color: "var(--notion-text)" }}>
                    {node.name}
                  </div>
                  <div className="space-y-0.5" style={{ color: "var(--notion-text-secondary)" }}>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: getDomainColor(node.domain) }} />
                      {node.domain}
                    </div>
                    <div className="text-blue-500">Pair: {node.pairCount}건</div>
                    <div style={{ color: node.waitingOnInbound >= 2 ? "#ef4444" : undefined }}>
                      대기 중: {node.waitingOnInbound}명
                    </div>
                  </div>
                  {selectedNode && (
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="mt-2 w-full py-1 rounded text-[10px]"
                      style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-secondary)" }}
                    >
                      선택 해제
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-3 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {domains.map((domain) => (
            <span
              key={domain}
              className="flex items-center gap-1 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded"
              style={{ background: "var(--notion-bg-secondary)" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: getDomainColor(domain) }} />
              {domain}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            Pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            대기
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-red-400" />
            병목
          </span>
        </div>
      </div>
    </div>
  );
}
