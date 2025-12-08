"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ScrumItem, Relation } from "@/types/scrum";

interface CollaborationNetworkV2Props {
  items: ScrumItem[];
}

interface NetworkNode {
  id: string;
  name: string;
  item: ScrumItem;
  isCenter: boolean;
  x: number;
  y: number;
}

interface NetworkEdge {
  from: string;
  to: string;
  relation: Relation;
}

interface TooltipState {
  visible: boolean;
  node: NetworkNode | null;
  x: number;
  y: number;
  side: "left" | "right";
}

// 색상 정의
const COLORS = {
  pair: { line: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", text: "#3b82f6" },
  pre: { line: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", text: "#f59e0b" },
  post: { line: "#22c55e", bg: "rgba(34, 197, 94, 0.15)", text: "#22c55e" },
};

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

  for (const item of items) {
    const authorKey = `${item.name}-author`;
    if (!nodesMap.has(authorKey)) {
      nodesMap.set(authorKey, {
        id: authorKey,
        name: item.name,
        item,
        isCenter: true,
        x: centerX,
        y: centerY,
      });
    }

    if (item.collaborators) {
      for (const collab of item.collaborators) {
        const collabKey = `${collab.name}-collab`;
        const collabItem = items.find((i) => i.name === collab.name);

        if (!nodesMap.has(collabKey)) {
          nodesMap.set(collabKey, {
            id: collabKey,
            name: collab.name,
            item: collabItem || item,
            isCenter: !!collabItem,
            x: centerX,
            y: centerY,
          });
        }

        edges.push({
          from: authorKey,
          to: collabKey,
          relation: collab.relation,
        });
      }
    }
  }

  // 노드 위치 계산 (원형 배치)
  const nodes = Array.from(nodesMap.values());
  const centerNodes = nodes.filter((n) => n.isCenter);
  const otherNodes = nodes.filter((n) => !n.isCenter);

  // 중심 노드 배치
  centerNodes.forEach((node, index) => {
    if (centerNodes.length === 1) {
      node.x = centerX;
      node.y = centerY;
    } else {
      const angle = (2 * Math.PI * index) / centerNodes.length - Math.PI / 2;
      node.x = centerX + radius * 0.4 * Math.cos(angle);
      node.y = centerY + radius * 0.4 * Math.sin(angle);
    }
  });

  // 외부 노드 배치
  otherNodes.forEach((node, index) => {
    const angle = (2 * Math.PI * index) / Math.max(otherNodes.length, 1) - Math.PI / 2;
    node.x = centerX + radius * Math.cos(angle);
    node.y = centerY + radius * Math.sin(angle);
  });

  return { nodes, edges };
}

/**
 * 협업 네트워크 시각화 컴포넌트 V2
 */
export function CollaborationNetworkV2({ items }: CollaborationNetworkV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 350 });
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    node: null,
    x: 0,
    y: 0,
    side: "right",
  });

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

  // 노드 드래그
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setDraggedNode(nodeId);
      setTooltip((prev) => ({ ...prev, visible: false }));
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedNode || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setNodePositions((prev) => ({
        ...prev,
        [draggedNode]: { x, y },
      }));
    },
    [draggedNode]
  );

  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
  }, []);

  // 노드 클릭 시 툴팁 표시
  const handleNodeClick = useCallback(
    (e: React.MouseEvent, node: NetworkNode) => {
      if (draggedNode) return;

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const nodePos = nodePositions[node.id] || { x: node.x, y: node.y };

      // 노드가 화면 중앙보다 왼쪽에 있으면 오른쪽에, 오른쪽에 있으면 왼쪽에 툴팁 표시
      const side = nodePos.x < dimensions.width / 2 ? "right" : "left";

      setTooltip({
        visible: true,
        node,
        x: nodePos.x,
        y: nodePos.y,
        side,
      });
    },
    [draggedNode, nodePositions, dimensions.width]
  );

  // 외부 클릭 시 툴팁 닫기
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).tagName === "svg") {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-sm" style={{ color: "var(--notion-text-muted)" }}>
        협업 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 네트워크 그래프 */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden"
        style={{
          height: "350px",
          background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 50%, rgba(34, 197, 94, 0.05) 100%)",
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleContainerClick}
      >
        <svg width="100%" height="100%">
          {/* 화살표 마커 정의 */}
          <defs>
            <marker
              id="arrowhead-pre"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.pre.line} />
            </marker>
            <marker
              id="arrowhead-post"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill={COLORS.post.line} />
            </marker>
          </defs>

          {/* 엣지 */}
          {edges.map((edge, index) => {
            const from = nodePositions[edge.from];
            const to = nodePositions[edge.to];
            if (!from || !to) return null;

            const color = COLORS[edge.relation];

            // 노드 반지름을 고려한 선 끝점 계산
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const nodeRadius = 28;

            const startX = from.x + (dx / dist) * nodeRadius;
            const startY = from.y + (dy / dist) * nodeRadius;
            const endX = to.x - (dx / dist) * (nodeRadius + 10);
            const endY = to.y - (dy / dist) * (nodeRadius + 10);

            if (edge.relation === "pair") {
              // pair: 점선 양방향 연결
              return (
                <g key={index}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={color.line}
                    strokeWidth={2.5}
                    strokeDasharray="6,4"
                    opacity={0.8}
                  />
                </g>
              );
            } else {
              // pre/post: 화살표가 있는 실선
              return (
                <g key={index}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke={color.line}
                    strokeWidth={2.5}
                    markerEnd={`url(#arrowhead-${edge.relation})`}
                    opacity={0.8}
                  />
                </g>
              );
            }
          })}

          {/* 노드 */}
          {initialNodes.map((node) => {
            const pos = nodePositions[node.id] || { x: node.x, y: node.y };
            const isDragging = draggedNode === node.id;
            const isTooltipTarget = tooltip.visible && tooltip.node?.id === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => handleNodeClick(e, node)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{ cursor: isDragging ? "grabbing" : "pointer" }}
              >
                {/* 선택 글로우 */}
                {isTooltipTarget && (
                  <circle
                    r={36}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    opacity={0.5}
                  />
                )}
                {/* 노드 배경 */}
                <circle
                  r={28}
                  fill={node.isCenter ? "#1e293b" : "#475569"}
                  stroke={isTooltipTarget ? "#3b82f6" : node.isCenter ? "#3b82f6" : "#64748b"}
                  strokeWidth={node.isCenter ? 3 : 2}
                />
                {/* 노드 텍스트 */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={11}
                  fontWeight="bold"
                  fill="white"
                >
                  {node.name.length > 4 ? node.name.substring(0, 4) : node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 툴팁 */}
        {tooltip.visible && tooltip.node && (
          <div
            className="absolute p-4 rounded-xl shadow-lg max-w-xs"
            style={{
              left: tooltip.side === "right" ? tooltip.x + 40 : undefined,
              right: tooltip.side === "left" ? dimensions.width - tooltip.x + 40 : undefined,
              top: Math.max(10, Math.min(tooltip.y - 50, dimensions.height - 200)),
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
              zIndex: 10,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                {tooltip.node.name}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}
              >
                {tooltip.node.item.domain}
              </span>
            </div>

            {/* 경로 */}
            <div
              className="text-xs mb-3 pb-3 border-b"
              style={{ color: "var(--notion-text-muted)", borderColor: "var(--notion-border)" }}
            >
              {tooltip.node.item.project} / {tooltip.node.item.module || "—"} / {tooltip.node.item.topic}
            </div>

            {/* 진행률 */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span style={{ color: "var(--notion-text-muted)" }}>Progress</span>
                <span style={{ color: "var(--notion-text)" }}>{tooltip.node.item.progressPercent}%</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--notion-bg-secondary)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${tooltip.node.item.progressPercent}%`,
                    background:
                      tooltip.node.item.progressPercent >= 80
                        ? "#22c55e"
                        : tooltip.node.item.progressPercent >= 50
                        ? "#3b82f6"
                        : "#f59e0b",
                  }}
                />
              </div>
            </div>

            {/* 협업자 */}
            {tooltip.node.item.collaborators && tooltip.node.item.collaborators.length > 0 && (
              <div>
                <div className="text-xs mb-2" style={{ color: "var(--notion-text-muted)" }}>
                  Collaborators
                </div>
                <div className="flex flex-wrap gap-1">
                  {tooltip.node.item.collaborators.map((collab, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: COLORS[collab.relation].bg,
                        color: COLORS[collab.relation].text,
                      }}
                    >
                      {collab.name} ({collab.relation})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-8 h-0.5" style={{ background: COLORS.pair.line, borderStyle: "dashed" }} />
          </div>
          <span style={{ color: "var(--notion-text-muted)" }}>pair (실시간 협업)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-6 h-0.5" style={{ background: COLORS.pre.line }} />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `6px solid ${COLORS.pre.line}`,
                borderTop: "4px solid transparent",
                borderBottom: "4px solid transparent",
              }}
            />
          </div>
          <span style={{ color: "var(--notion-text-muted)" }}>pre (선행 협업)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <div className="w-6 h-0.5" style={{ background: COLORS.post.line }} />
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: `6px solid ${COLORS.post.line}`,
                borderTop: "4px solid transparent",
                borderBottom: "4px solid transparent",
              }}
            />
          </div>
          <span style={{ color: "var(--notion-text-muted)" }}>post (후행 협업)</span>
        </div>
      </div>
    </div>
  );
}

