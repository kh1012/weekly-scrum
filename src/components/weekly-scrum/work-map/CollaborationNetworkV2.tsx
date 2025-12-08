"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ScrumItem, Relation } from "@/types/scrum";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CollaborationNetworkV2Props {
  items: ScrumItem[];
  allItems?: ScrumItem[];
  featureName?: string;
}

interface NetworkNode {
  id: string;
  name: string;
  domain: string;
  item: ScrumItem;
  isCenter: boolean;
  pairCount: number;
  preCount: number;
  x: number;
  y: number;
}

interface NetworkEdge {
  from: string;
  to: string;
  relation: Relation;
}

/**
 * 협업 네트워크 데이터 빌드
 */
function buildNetworkData(
  items: ScrumItem[],
  width: number,
  height: number
): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const nodesMap = new Map<string, NetworkNode>();
  const edges: NetworkEdge[] = [];

  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.35;
  const padding = 60;

  // 노드와 엣지 생성
  for (const item of items) {
    const authorKey = item.name;
    if (!nodesMap.has(authorKey)) {
      nodesMap.set(authorKey, {
        id: authorKey,
        name: item.name,
        domain: item.domain,
        item,
        isCenter: true,
        pairCount: 0,
        preCount: 0,
        x: centerX,
        y: centerY,
      });
    }

    if (item.collaborators) {
      for (const collab of item.collaborators) {
        const collabKey = collab.name;
        const collabItem = items.find((i) => i.name === collab.name);

        if (!nodesMap.has(collabKey)) {
          nodesMap.set(collabKey, {
            id: collabKey,
            name: collab.name,
            domain: collabItem?.domain || item.domain,
            item: collabItem || item,
            isCenter: !!collabItem,
            pairCount: 0,
            preCount: 0,
            x: centerX,
            y: centerY,
          });
        }

        // 뱃지 카운트 업데이트
        const authorNode = nodesMap.get(authorKey)!;
        const collabNode = nodesMap.get(collabKey)!;

        if (collab.relation === "pair") {
          authorNode.pairCount++;
        } else if (collab.relation === "pre") {
          // pre: 협업자가 나에게 선행 입력 제공 → 협업자의 preCount 증가
          collabNode.preCount++;
        }

        edges.push({
          from: authorKey,
          to: collabKey,
          relation: collab.relation,
        });
      }
    }
  }

  // 노드 배열 생성
  const nodes = Array.from(nodesMap.values());

  // 도메인별 그룹핑하여 배치
  const domainGroups = new Map<string, NetworkNode[]>();
  nodes.forEach((node) => {
    const group = domainGroups.get(node.domain) || [];
    group.push(node);
    domainGroups.set(node.domain, group);
  });

  const domains = Array.from(domainGroups.keys()).sort();
  const domainCount = domains.length;
  const verticalSpacing = 80;

  domains.forEach((domain, domainIndex) => {
    const domainNodes = domainGroups.get(domain) || [];
    const columnX = domainCount === 1
      ? width / 2
      : padding + ((width - padding * 2) / Math.max(domainCount - 1, 1)) * domainIndex;

    domainNodes.forEach((node, nodeIndex) => {
      const totalHeight = (domainNodes.length - 1) * verticalSpacing;
      const startY = height / 2 - totalHeight / 2;
      const y = startY + nodeIndex * verticalSpacing;

      node.x = columnX;
      node.y = Math.max(padding, Math.min(height - padding, y));
    });
  });

  // 노드 간 겹침 방지
  for (let iter = 0; iter < 30; iter++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = 90;

        if (dist < minDist && dist > 0) {
          const force = (minDist - dist) / 2;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          nodes[i].x -= fx * 0.3;
          nodes[i].y -= fy;
          nodes[j].x += fx * 0.3;
          nodes[j].y += fy;
          moved = true;
        }
      }
    }

    nodes.forEach((node) => {
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });

    if (!moved) break;
  }

  return { nodes, edges };
}

/**
 * 협업 네트워크 시각화 컴포넌트 V2 (팀협업 스타일)
 */
export function CollaborationNetworkV2({ items, allItems, featureName }: CollaborationNetworkV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 350 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showOnlyFeature, setShowOnlyFeature] = useState(false);
  const [snapshotPanelNode, setSnapshotPanelNode] = useState<string | null>(null);

  // 초기 네트워크 데이터 빌드
  const { nodes: initialNodes, edges } = useMemo(
    () => buildNetworkData(items, dimensions.width, dimensions.height),
    [items, dimensions.width, dimensions.height]
  );

  // 노드 위치 초기화
  useEffect(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    initialNodes.forEach((node) => {
      positions[node.id] = { x: node.x, y: node.y };
    });
    setNodePositions(positions);
  }, [initialNodes]);

  // 컨테이너 크기 감지
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width, height });
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  };

  const getNodeRadius = useCallback((node: NetworkNode) => {
    const degree = node.pairCount + node.preCount;
    const maxDegree = Math.max(...initialNodes.map((n) => n.pairCount + n.preCount), 1);
    return 26 + (degree / Math.max(maxDegree, 1)) * 12;
  }, [initialNodes]);

  // SVG 좌표 변환
  const getSvgPoint = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const { width, height } = dimensions;

    const vbWidth = width / zoom;
    const vbHeight = height / zoom;
    const vbX = (width - vbWidth) / 2;
    const vbY = (height - vbHeight) / 2;

    const x = vbX + ((e.clientX - rect.left) / rect.width) * vbWidth;
    const y = vbY + ((e.clientY - rect.top) / rect.height) * vbHeight;

    return { x, y };
  }, [dimensions, zoom]);

  // 노드 드래그
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const node = initialNodes.find((n) => n.id === nodeId);
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

      const pos = nodePositions[nodeId] || { x: node.x, y: node.y };

      setDraggedNode(nodeId);
    },
    [initialNodes, dimensions, zoom, nodePositions]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggedNode) return;

      const point = getSvgPoint(e);
      const padding = 50;
      const { width, height } = dimensions;

      setNodePositions((prev) => ({
        ...prev,
        [draggedNode]: {
          x: Math.max(padding, Math.min(width - padding, point.x)),
          y: Math.max(padding, Math.min(height - padding, point.y)),
        },
      }));
    },
    [draggedNode, getSvgPoint, dimensions]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.5, Math.min(2.5, prev + delta)));
  }, []);

  // 활성 노드와 연결된 노드들
  const activeNode = selectedNode ?? hoveredNode;
  const activeConnections = useMemo(() => {
    if (!activeNode) return new Set<string>();
    const connected = edges
      .filter((e) => e.from === activeNode || e.to === activeNode)
      .flatMap((e) => [e.from, e.to]);
    return new Set(connected);
  }, [activeNode, edges]);

  // 엣지 경로 계산 (곡선)
  const getEdgePath = useCallback((source: { x: number; y: number }, target: { x: number; y: number }, sourceRadius: number, targetRadius: number) => {
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
  }, []);

  // viewBox 계산
  const { width, height } = dimensions;
  const vbWidth = width / zoom;
  const vbHeight = height / zoom;
  const vbX = (width - vbWidth) / 2;
  const vbY = (height - vbHeight) / 2;

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
        협업 데이터가 없습니다.
      </div>
    );
  }

  const domains = Array.from(new Set(initialNodes.map((n) => n.domain))).sort();

  return (
    <div className="h-full flex flex-col">
      {/* 그래프 영역 */}
      <div
        ref={containerRef}
        className="relative flex-1 rounded-lg overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid var(--notion-border)",
          minHeight: "300px",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: draggedNode ? "grabbing" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            {/* pre 화살표 마커 (주황색) */}
            <marker id="arrow-pre-v2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#f59e0b" fillOpacity="0.8" />
            </marker>
            <marker id="arrow-pre-v2-dim" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#f59e0b" fillOpacity="0.15" />
            </marker>
            {/* post 화살표 마커 (초록색) */}
            <marker id="arrow-post-v2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#22c55e" fillOpacity="0.8" />
            </marker>
            <marker id="arrow-post-v2-dim" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#22c55e" fillOpacity="0.15" />
            </marker>
            <filter id="node-shadow-v2" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="node-glow-v2" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 엣지 */}
          {edges.map((edge, idx) => {
            const sourceNode = initialNodes.find((n) => n.id === edge.from);
            const targetNode = initialNodes.find((n) => n.id === edge.to);
            if (!sourceNode || !targetNode) return null;

            const sourcePos = nodePositions[edge.from] || { x: sourceNode.x, y: sourceNode.y };
            const targetPos = nodePositions[edge.to] || { x: targetNode.x, y: targetNode.y };
            const sourceRadius = getNodeRadius(sourceNode);
            const targetRadius = getNodeRadius(targetNode);

            const isPair = edge.relation === "pair";
            const isPre = edge.relation === "pre";
            const isPost = edge.relation === "post";
            const isConnected = activeNode
              ? edge.from === activeNode || edge.to === activeNode
              : true;

            // 색상 정의
            // pair: 파란색, pre: 주황색, post: 초록색
            const strokeColor = isPair ? "#3b82f6" : isPre ? "#f59e0b" : isPost ? "#22c55e" : "#64748b";

            // pre: 협업자(to) → 나(from) 방향으로 화살표 (협업자가 나에게 선행 입력 제공)
            // post: 나(from) → 협업자(to) 방향으로 화살표 (내가 협업자에게 결과물 전달)
            const actualSource = isPre ? targetPos : sourcePos;
            const actualTarget = isPre ? sourcePos : targetPos;
            const actualSourceRadius = isPre ? targetRadius : sourceRadius;
            const actualTargetRadius = isPre ? sourceRadius : targetRadius;

            // 마커 결정
            let markerEnd = undefined;
            if (isPre) {
              markerEnd = isConnected ? "url(#arrow-pre-v2)" : "url(#arrow-pre-v2-dim)";
            } else if (isPost) {
              markerEnd = isConnected ? "url(#arrow-post-v2)" : "url(#arrow-post-v2-dim)";
            }

            return (
              <path
                key={`edge-${idx}`}
                d={getEdgePath(actualSource, actualTarget, actualSourceRadius, actualTargetRadius)}
                fill="none"
                stroke={strokeColor}
                strokeWidth={isPair ? 2.5 : 2}
                strokeOpacity={isConnected ? 0.7 : 0.1}
                strokeLinecap="round"
                strokeDasharray={isPair ? "6,4" : undefined}
                markerEnd={markerEnd}
                style={{ transition: "stroke-opacity 0.2s" }}
              />
            );
          })}

          {/* 노드 */}
          {initialNodes.map((node) => {
            const pos = nodePositions[node.id] || { x: node.x, y: node.y };
            const radius = getNodeRadius(node);
            const isActive = activeNode === node.id;
            const isConnected = activeConnections.has(node.id);
            const opacity = activeNode ? (isActive || isConnected ? 1 : 0.2) : 1;
            const isBottleneck = node.preCount >= 2;
            const isDragging = draggedNode === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  opacity,
                  transition: isDragging ? "none" : "opacity 0.2s",
                }}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                onMouseEnter={() => !draggedNode && setHoveredNode(node.id)}
                onMouseLeave={() => !draggedNode && setHoveredNode(null)}
                onClick={(e) => {
                  if (!draggedNode) {
                    e.stopPropagation();
                    setSelectedNode(selectedNode === node.id ? null : node.id);
                    setSnapshotPanelNode(snapshotPanelNode === node.id ? null : node.id);
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
                  filter={isActive ? "url(#node-glow-v2)" : "url(#node-shadow-v2)"}
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
                {/* Pre 뱃지 */}
                {node.preCount > 0 && (
                  <g transform={`translate(${-radius + 2}, ${-radius + 2})`}>
                    <circle r={10} fill="#ef4444" stroke="white" strokeWidth={2} />
                    <text textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={700} fill="white">
                      {node.preCount}
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
            className="px-2 py-1 text-[10px] font-medium rounded"
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
            className="ml-1 px-2 py-1 text-[10px] rounded"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text-secondary)" }}
          >
            리셋
          </button>
        </div>

        {/* 스냅샷 패널 */}
        {snapshotPanelNode && (() => {
          const node = initialNodes.find((n) => n.id === snapshotPanelNode);
          if (!node) return null;

          // 전체 스냅샷 또는 feature 스냅샷
          const sourceItems = allItems || items;
          const personSnapshots = showOnlyFeature
            ? items.filter((item) => item.name === node.name)
            : sourceItems.filter((item) => item.name === node.name);

          return (
            <div
              className="absolute top-2 right-2 bottom-2 rounded-lg flex flex-col"
              style={{
                width: "320px",
                background: "rgba(255,255,255,0.98)",
                border: "1px solid var(--notion-border)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between p-3 border-b flex-shrink-0" style={{ borderColor: "var(--notion-border)" }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: getDomainColor(node.domain) }}
                  >
                    {node.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
                      {node.name}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--notion-text-muted)" }}>
                      {personSnapshots.length}개 스냅샷
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSnapshotPanelNode(null);
                    setSelectedNode(null);
                  }}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  ✕
                </button>
              </div>

              {/* 필터 토글 */}
              {featureName && allItems && (
                <div className="px-3 py-2 border-b flex-shrink-0" style={{ borderColor: "var(--notion-border)" }}>
                  <button
                    onClick={() => setShowOnlyFeature(!showOnlyFeature)}
                    className="w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs transition-colors"
                    style={{ 
                      background: showOnlyFeature ? "rgba(59, 130, 246, 0.1)" : "var(--notion-bg-secondary)",
                      color: showOnlyFeature ? "#3b82f6" : "var(--notion-text-secondary)",
                    }}
                  >
                    <span>{showOnlyFeature ? `🎯 ${featureName} 만 보기` : "📋 전체 스냅샷 보기"}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--notion-bg)" }}>
                      {showOnlyFeature ? items.filter((i) => i.name === node.name).length : personSnapshots.length}
                    </span>
                  </button>
                </div>
              )}

              {/* 스냅샷 목록 */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {personSnapshots.length === 0 ? (
                  <div className="text-center py-8 text-sm" style={{ color: "var(--notion-text-muted)" }}>
                    스냅샷이 없습니다.
                  </div>
                ) : (
                  personSnapshots.map((snapshot, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg"
                      style={{
                        background: "var(--notion-bg)",
                        border: "1px solid var(--notion-border)",
                      }}
                    >
                      {/* 스냅샷 헤더 */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: `${getDomainColor(snapshot.domain)}20`, color: getDomainColor(snapshot.domain) }}
                        >
                          {snapshot.domain}
                        </span>
                        <span
                          className="text-xs font-bold"
                          style={{
                            color:
                              snapshot.progressPercent >= 80
                                ? "#22c55e"
                                : snapshot.progressPercent >= 50
                                ? "#3b82f6"
                                : "#f59e0b",
                          }}
                        >
                          {snapshot.progressPercent}%
                        </span>
                      </div>

                      {/* 경로 */}
                      <div
                        className="text-xs font-medium mb-2 truncate"
                        style={{ color: "var(--notion-text)" }}
                        title={`${snapshot.project} / ${snapshot.module || "—"} / ${snapshot.topic}`}
                      >
                        {snapshot.project} / {snapshot.module || "—"} / {snapshot.topic}
                      </div>

                      {/* 진행률 바 */}
                      <div
                        className="h-1 rounded-full overflow-hidden mb-2"
                        style={{ background: "var(--notion-border)" }}
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${snapshot.progressPercent}%`,
                            background:
                              snapshot.progressPercent >= 80
                                ? "#22c55e"
                                : snapshot.progressPercent >= 50
                                ? "#3b82f6"
                                : "#f59e0b",
                          }}
                        />
                      </div>

                      {/* Past Week */}
                      {snapshot.progress && snapshot.progress.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[10px] font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                            Past Week
                          </div>
                          <ul className="space-y-0.5">
                            {snapshot.progress.slice(0, 2).map((task, i) => (
                              <li
                                key={i}
                                className="text-[11px] truncate"
                                style={{ color: "var(--notion-text-secondary)" }}
                                title={task}
                              >
                                • {task}
                              </li>
                            ))}
                            {snapshot.progress.length > 2 && (
                              <li className="text-[10px]" style={{ color: "var(--notion-text-muted)" }}>
                                +{snapshot.progress.length - 2}개 더...
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* This Week */}
                      {snapshot.next && snapshot.next.length > 0 && (
                        <div className="mb-2">
                          <div className="text-[10px] font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
                            This Week
                          </div>
                          <ul className="space-y-0.5">
                            {snapshot.next.slice(0, 2).map((task, i) => (
                              <li
                                key={i}
                                className="text-[11px] truncate"
                                style={{ color: "var(--notion-text-secondary)" }}
                                title={task}
                              >
                                • {task}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 리스크 */}
                      {snapshot.risk && snapshot.risk.length > 0 && (
                        <div className="pt-2 border-t" style={{ borderColor: "var(--notion-border)" }}>
                          <div className="text-[10px] font-medium mb-1 flex items-center gap-1" style={{ color: "#ef4444" }}>
                            ⚠️ Risk
                            {snapshot.riskLevel !== null && snapshot.riskLevel !== undefined && (
                              <span className="px-1 rounded text-[9px]" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                                R{snapshot.riskLevel}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px]" style={{ color: "var(--notion-text-secondary)" }}>
                            {snapshot.risk[0]}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 범례 */}
      <div className="mt-3 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="flex flex-wrap gap-1.5">
          {domains.map((domain) => (
            <span
              key={domain}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "var(--notion-bg-secondary)" }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: getDomainColor(domain) }} />
              {domain}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          {/* Pair: 파란색 점선 */}
          <span className="flex items-center gap-1">
            <svg width="20" height="10" viewBox="0 0 20 10">
              <line x1="0" y1="5" x2="20" y2="5" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4,2" />
            </svg>
            <span>Pair</span>
          </span>
          {/* Pre: 주황색 화살표 */}
          <span className="flex items-center gap-1">
            <svg width="20" height="10" viewBox="0 0 20 10">
              <line x1="0" y1="5" x2="14" y2="5" stroke="#f59e0b" strokeWidth="2" />
              <path d="M12,2 L18,5 L12,8 Z" fill="#f59e0b" />
            </svg>
            <span>Pre (선행)</span>
          </span>
          {/* Post: 초록색 화살표 */}
          <span className="flex items-center gap-1">
            <svg width="20" height="10" viewBox="0 0 20 10">
              <line x1="0" y1="5" x2="14" y2="5" stroke="#22c55e" strokeWidth="2" />
              <path d="M12,2 L18,5 L12,8 Z" fill="#22c55e" />
            </svg>
            <span>Post (후행)</span>
          </span>
          {/* 병목 */}
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-red-400" />
            <span>병목</span>
          </span>
        </div>
      </div>
    </div>
  );
}
