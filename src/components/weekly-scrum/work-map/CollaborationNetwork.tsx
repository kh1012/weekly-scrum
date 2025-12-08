"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { ScrumItem, Relation } from "@/types/scrum";

interface CollaborationNetworkProps {
  items: ScrumItem[];
  onNodeClick?: (item: ScrumItem) => void;
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

interface ViewState {
  scale: number;
  offsetX: number;
  offsetY: number;
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
 * 관계 타입별 색상
 */
function getRelationColor(relation: Relation): string {
  switch (relation) {
    case "pair":
      return "#3b82f6"; // blue
    case "pre":
      return "#f59e0b"; // amber
    case "post":
      return "#22c55e"; // green
    default:
      return "#6b7280"; // gray
  }
}

/**
 * 관계 타입별 라벨
 */
function getRelationLabel(relation: Relation): string {
  switch (relation) {
    case "pair":
      return "pair";
    case "pre":
      return "pre";
    case "post":
      return "post";
    default:
      return "";
  }
}

/**
 * 협업 네트워크 시각화 컴포넌트
 */
export function CollaborationNetwork({ items, onNodeClick }: CollaborationNetworkProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [viewState, setViewState] = useState<ViewState>({
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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

  // 마우스 좌표를 SVG 좌표로 변환
  const screenToSvg = useCallback(
    (clientX: number, clientY: number) => {
      const container = containerRef.current;
      if (!container) return { x: 0, y: 0 };

      const rect = container.getBoundingClientRect();
      return {
        x: (clientX - rect.left - viewState.offsetX) / viewState.scale,
        y: (clientY - rect.top - viewState.offsetY) / viewState.scale,
      };
    },
    [viewState]
  );

  // 노드 드래그 시작
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      setDraggedNode(nodeId);
    },
    []
  );

  // 캔버스 패닝 시작
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (draggedNode) return;
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewState.offsetX, y: e.clientY - viewState.offsetY });
    },
    [draggedNode, viewState.offsetX, viewState.offsetY]
  );

  // 마우스 이동
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggedNode) {
        const pos = screenToSvg(e.clientX, e.clientY);
        setNodePositions((prev) => ({
          ...prev,
          [draggedNode]: { x: pos.x, y: pos.y },
        }));
      } else if (isPanning) {
        setViewState((prev) => ({
          ...prev,
          offsetX: e.clientX - panStart.x,
          offsetY: e.clientY - panStart.y,
        }));
      }
    },
    [draggedNode, isPanning, panStart, screenToSvg]
  );

  // 마우스 업
  const handleMouseUp = useCallback(() => {
    setDraggedNode(null);
    setIsPanning(false);
  }, []);

  // 줌
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setViewState((prev) => ({
      ...prev,
      scale: Math.min(Math.max(prev.scale * delta, 0.5), 3),
    }));
  }, []);

  // 노드 클릭
  const handleNodeClick = useCallback(
    (node: NetworkNode) => {
      setSelectedNodeId(node.id);
      if (onNodeClick) {
        onNodeClick(node.item);
      }
    },
    [onNodeClick]
  );

  // 줌 리셋
  const resetView = useCallback(() => {
    setViewState({ scale: 1, offsetX: 0, offsetY: 0 });
  }, []);

  // 줌 인/아웃 버튼
  const zoomIn = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.min(prev.scale * 1.2, 3),
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setViewState((prev) => ({
      ...prev,
      scale: Math.max(prev.scale * 0.8, 0.5),
    }));
  }, []);

  if (items.length === 0) {
    return (
      <div
        className="text-center py-8 text-sm"
        style={{ color: "var(--notion-text-muted)" }}
      >
        협업 데이터가 없습니다.
      </div>
    );
  }

  const selectedNode = initialNodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="space-y-3">
      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium" style={{ color: "var(--notion-text)" }}>
            Collaboration Network
          </span>
          <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            (드래그: 노드 이동, 스크롤: 확대/축소, 빈 공간 드래그: 패닝)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded hover:bg-opacity-50 transition-colors"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text)" }}
            title="축소"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="text-xs px-2" style={{ color: "var(--notion-text-muted)" }}>
            {Math.round(viewState.scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded hover:bg-opacity-50 transition-colors"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text)" }}
            title="확대"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded hover:bg-opacity-50 transition-colors ml-1"
            style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text)" }}
            title="리셋"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
        </div>
      </div>

      {/* 네트워크 그래프 */}
      <div
        ref={containerRef}
        className="rounded-lg overflow-hidden cursor-grab active:cursor-grabbing"
        style={{
          background: "var(--notion-bg-secondary)",
          height: "300px",
          touchAction: "none",
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          width="100%"
          height="100%"
          style={{
            transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${viewState.scale})`,
            transformOrigin: "0 0",
          }}
        >
          {/* 엣지 */}
          {edges.map((edge, index) => {
            const from = nodePositions[edge.from];
            const to = nodePositions[edge.to];
            if (!from || !to) return null;

            const color = getRelationColor(edge.relation);
            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;

            return (
              <g key={index}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={color}
                  strokeWidth={2}
                  strokeDasharray={edge.relation === "pair" ? "none" : "6,4"}
                  opacity={0.7}
                />
                {/* 관계 라벨 */}
                <rect
                  x={midX - 18}
                  y={midY - 8}
                  width={36}
                  height={16}
                  rx={4}
                  fill={color}
                  opacity={0.9}
                />
                <text
                  x={midX}
                  y={midY + 4}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight="bold"
                  fill="white"
                >
                  {getRelationLabel(edge.relation)}
                </text>
              </g>
            );
          })}

          {/* 노드 */}
          {initialNodes.map((node) => {
            const pos = nodePositions[node.id] || { x: node.x, y: node.y };
            const isSelected = selectedNodeId === node.id;
            const isDragging = draggedNode === node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={() => handleNodeClick(node)}
                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                style={{
                  cursor: isDragging ? "grabbing" : "pointer",
                  transition: isDragging ? "none" : "transform 0.1s",
                }}
              >
                {/* 노드 배경 (선택 시 글로우) */}
                {isSelected && (
                  <circle
                    r={node.isCenter ? 38 : 32}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    opacity={0.5}
                  />
                )}
                {/* 노드 원 */}
                <circle
                  r={node.isCenter ? 32 : 26}
                  fill={isSelected ? "#3b82f6" : node.isCenter ? "#1e293b" : "#475569"}
                  stroke={node.isCenter ? "#3b82f6" : "#64748b"}
                  strokeWidth={node.isCenter ? 3 : 2}
                />
                {/* 노드 텍스트 */}
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={node.isCenter ? 12 : 11}
                  fontWeight="bold"
                  fill="white"
                >
                  {node.name.length > 4 ? node.name.substring(0, 4) : node.name}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5" style={{ background: getRelationColor("pair") }} />
          <span style={{ color: "var(--notion-text-muted)" }}>pair (실시간 협업)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-0.5"
            style={{
              background: `repeating-linear-gradient(90deg, ${getRelationColor("pre")} 0, ${getRelationColor("pre")} 4px, transparent 4px, transparent 8px)`,
            }}
          />
          <span style={{ color: "var(--notion-text-muted)" }}>pre (선행 협업)</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-0.5"
            style={{
              background: `repeating-linear-gradient(90deg, ${getRelationColor("post")} 0, ${getRelationColor("post")} 4px, transparent 4px, transparent 8px)`,
            }}
          />
          <span style={{ color: "var(--notion-text-muted)" }}>post (후행 협업)</span>
        </div>
      </div>

      {/* 선택된 노드 정보 */}
      {selectedNode && (
        <div
          className="p-4 rounded-lg"
          style={{
            background: "var(--notion-bg)",
            border: "2px solid #3b82f6",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-lg" style={{ color: "var(--notion-text)" }}>
              {selectedNode.name}
            </span>
            <span
              className="text-xs px-2 py-1 rounded"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                color: "#3b82f6",
              }}
            >
              {selectedNode.item.domain}
            </span>
          </div>
          <div className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
            {selectedNode.item.project} / {selectedNode.item.module || "—"} / {selectedNode.item.topic}
          </div>
        </div>
      )}
    </div>
  );
}
