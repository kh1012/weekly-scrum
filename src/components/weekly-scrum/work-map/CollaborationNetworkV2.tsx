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
            {/* pre: 협업자 → 나 방향 (끝점에 화살표) */}
            <marker
              id="arrowhead-pre"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill={COLORS.pre.line} fillOpacity="0.8" />
            </marker>
            {/* post: 나 → 협업자 방향 (끝점에 화살표) */}
            <marker
              id="arrowhead-post"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill={COLORS.post.line} fillOpacity="0.8" />
            </marker>
            {/* 노드 그림자 */}
            <filter id="node-shadow-v2" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>

          {/* 엣지 */}
          {edges.map((edge, index) => {
            const fromPos = nodePositions[edge.from];
            const toPos = nodePositions[edge.to];
            if (!fromPos || !toPos) return null;

            const color = COLORS[edge.relation];
            const nodeRadius = 28;

            // pre: 협업자(to) → 나(from) 방향으로 화살표
            // post: 나(from) → 협업자(to) 방향으로 화살표
            const isPreRelation = edge.relation === "pre";
            const sourcePos = isPreRelation ? toPos : fromPos;
            const targetPos = isPreRelation ? fromPos : toPos;

            const dx = targetPos.x - sourcePos.x;
            const dy = targetPos.y - sourcePos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist === 0) return null;

            const startX = sourcePos.x + (dx / dist) * nodeRadius;
            const startY = sourcePos.y + (dy / dist) * nodeRadius;
            const endX = targetPos.x - (dx / dist) * (nodeRadius + 6);
            const endY = targetPos.y - (dy / dist) * (nodeRadius + 6);

            if (edge.relation === "pair") {
              // pair: 점선 양방향 연결 (화살표 없음)
              return (
                <line
                  key={index}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={color.line}
                  strokeWidth={2}
                  strokeDasharray="5,3"
                  opacity={0.7}
                />
              );
            } else {
              // pre/post: 화살표가 있는 실선
              return (
                <line
                  key={index}
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={color.line}
                  strokeWidth={2}
                  strokeLinecap="round"
                  markerEnd={`url(#arrowhead-${edge.relation})`}
                  opacity={0.7}
                />
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
                  filter="url(#node-shadow-v2)"
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

        {/* 툴팁 - 해당 사람의 전체 스냅샷 */}
        {tooltip.visible && tooltip.node && (() => {
          // 해당 사람의 모든 스냅샷 찾기
          const personSnapshots = items.filter((item) => item.name === tooltip.node!.name);
          
          return (
            <div
              className="absolute rounded-xl shadow-lg"
              style={{
                left: tooltip.side === "right" ? tooltip.x + 40 : undefined,
                right: tooltip.side === "left" ? dimensions.width - tooltip.x + 40 : undefined,
                top: 10,
                bottom: 10,
                width: "320px",
                background: "var(--notion-bg)",
                border: "1px solid var(--notion-border)",
                zIndex: 10,
                display: "flex",
                flexDirection: "column",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div
                className="flex items-center justify-between p-3 border-b flex-shrink-0"
                style={{ borderColor: "var(--notion-border)" }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ background: "#1e293b" }}
                  >
                    {tooltip.node.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm" style={{ color: "var(--notion-text)" }}>
                      {tooltip.node.name}
                    </div>
                    <div className="text-[10px]" style={{ color: "var(--notion-text-muted)" }}>
                      {personSnapshots.length}개 스냅샷
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setTooltip((prev) => ({ ...prev, visible: false }))}
                  className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 transition-colors"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  ✕
                </button>
              </div>

              {/* 스냅샷 목록 (스크롤 가능) */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {personSnapshots.map((snapshot, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg"
                    style={{
                      background: "var(--notion-bg-secondary)",
                      border: "1px solid var(--notion-border)",
                    }}
                  >
                    {/* 스냅샷 헤더 */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}
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
                        <div
                          className="text-[10px] font-medium mb-1"
                          style={{ color: "var(--notion-text-muted)" }}
                        >
                          Past Week
                        </div>
                        <ul className="space-y-0.5">
                          {snapshot.progress.slice(0, 3).map((task, i) => (
                            <li
                              key={i}
                              className="text-[11px] truncate"
                              style={{ color: "var(--notion-text-secondary)" }}
                              title={task}
                            >
                              • {task}
                            </li>
                          ))}
                          {snapshot.progress.length > 3 && (
                            <li
                              className="text-[10px]"
                              style={{ color: "var(--notion-text-muted)" }}
                            >
                              +{snapshot.progress.length - 3}개 더...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* This Week */}
                    {snapshot.next && snapshot.next.length > 0 && (
                      <div className="mb-2">
                        <div
                          className="text-[10px] font-medium mb-1"
                          style={{ color: "var(--notion-text-muted)" }}
                        >
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
                          {snapshot.next.length > 2 && (
                            <li
                              className="text-[10px]"
                              style={{ color: "var(--notion-text-muted)" }}
                            >
                              +{snapshot.next.length - 2}개 더...
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    {/* 협업자 */}
                    {snapshot.collaborators && snapshot.collaborators.length > 0 && (
                      <div>
                        <div
                          className="text-[10px] font-medium mb-1"
                          style={{ color: "var(--notion-text-muted)" }}
                        >
                          Collaborators
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {snapshot.collaborators.map((collab, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{
                                background: COLORS[collab.relation].bg,
                                color: COLORS[collab.relation].text,
                              }}
                            >
                              {collab.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 리스크 */}
                    {snapshot.risk && snapshot.risk.length > 0 && (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: "var(--notion-border)" }}>
                        <div
                          className="text-[10px] font-medium mb-1 flex items-center gap-1"
                          style={{ color: "#ef4444" }}
                        >
                          ⚠️ Risk
                          {snapshot.riskLevel !== null && snapshot.riskLevel !== undefined && (
                            <span className="px-1 rounded text-[9px]" style={{ background: "rgba(239, 68, 68, 0.1)" }}>
                              R{snapshot.riskLevel}
                            </span>
                          )}
                        </div>
                        <div
                          className="text-[10px]"
                          style={{ color: "var(--notion-text-secondary)" }}
                        >
                          {snapshot.risk[0]}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-0.5 rounded" style={{ background: COLORS.pair.line, opacity: 0.7 }} />
          <span style={{ color: "var(--notion-text-muted)" }}>Pair</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="14" y2="5" stroke={COLORS.pre.line} strokeWidth="2" />
            <path d="M12,2 L18,5 L12,8 Z" fill={COLORS.pre.line} />
          </svg>
          <span style={{ color: "var(--notion-text-muted)" }}>Pre (선행)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <svg width="20" height="10" viewBox="0 0 20 10">
            <line x1="0" y1="5" x2="14" y2="5" stroke={COLORS.post.line} strokeWidth="2" />
            <path d="M12,2 L18,5 L12,8 Z" fill={COLORS.post.line} />
          </svg>
          <span style={{ color: "var(--notion-text-muted)" }}>Post (후행)</span>
        </div>
      </div>
    </div>
  );
}

