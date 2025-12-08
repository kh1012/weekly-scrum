"use client";

import { useState, useMemo } from "react";
import type { ScrumItem, Collaborator, Relation } from "@/types/scrum";

interface CollaborationNetworkProps {
  items: ScrumItem[];
  onNodeClick?: (item: ScrumItem) => void;
}

interface NetworkNode {
  id: string;
  name: string;
  item: ScrumItem;
  isCenter: boolean;
}

interface NetworkEdge {
  from: string;
  to: string;
  relation: Relation;
}

/**
 * 협업 네트워크 데이터 빌드
 */
function buildNetworkData(items: ScrumItem[]): { nodes: NetworkNode[]; edges: NetworkEdge[] } {
  const nodesMap = new Map<string, NetworkNode>();
  const edges: NetworkEdge[] = [];

  for (const item of items) {
    // 작성자를 중심 노드로 추가
    const authorKey = `${item.name}-author`;
    if (!nodesMap.has(authorKey)) {
      nodesMap.set(authorKey, {
        id: authorKey,
        name: item.name,
        item,
        isCenter: true,
      });
    }

    // 협업자들 처리
    if (item.collaborators) {
      for (const collab of item.collaborators) {
        const collabKey = `${collab.name}-collab`;
        
        // 협업자가 items에 있는지 확인
        const collabItem = items.find((i) => i.name === collab.name);
        
        if (!nodesMap.has(collabKey)) {
          nodesMap.set(collabKey, {
            id: collabKey,
            name: collab.name,
            item: collabItem || item, // 협업자의 item이 없으면 현재 item 사용
            isCenter: !!collabItem,
          });
        }

        // 엣지 추가
        edges.push({
          from: authorKey,
          to: collabKey,
          relation: collab.relation,
        });
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    edges,
  };
}

/**
 * 관계 타입별 색상
 */
function getRelationColor(relation: Relation): string {
  switch (relation) {
    case "pair":
      return "var(--notion-accent)";
    case "pre":
      return "var(--notion-warning)";
    case "post":
      return "var(--notion-success)";
    default:
      return "var(--notion-text-muted)";
  }
}

/**
 * 노드 컴포넌트
 */
function NetworkNodeComponent({
  node,
  position,
  isSelected,
  onClick,
}: {
  node: NetworkNode;
  position: { x: number; y: number };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <g
      transform={`translate(${position.x}, ${position.y})`}
      onClick={onClick}
      style={{ cursor: "pointer" }}
    >
      {/* 노드 원 */}
      <circle
        r={node.isCenter ? 28 : 22}
        fill={isSelected ? "var(--notion-accent)" : "var(--notion-bg-secondary)"}
        stroke={node.isCenter ? "var(--notion-accent)" : "var(--notion-border)"}
        strokeWidth={node.isCenter ? 2 : 1}
      />
      {/* 노드 텍스트 */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={node.isCenter ? 11 : 10}
        fontWeight={node.isCenter ? "bold" : "normal"}
        fill={isSelected ? "white" : "var(--notion-text)"}
      >
        {node.name.length > 3 ? node.name.substring(0, 3) : node.name}
      </text>
    </g>
  );
}

/**
 * 협업 네트워크 시각화 컴포넌트
 */
export function CollaborationNetwork({ items, onNodeClick }: CollaborationNetworkProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => buildNetworkData(items), [items]);

  // 노드 위치 계산 (원형 배치)
  const nodePositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    const centerX = 150;
    const centerY = 120;
    const radius = 80;

    // 중심 노드들 먼저 배치
    const centerNodes = nodes.filter((n) => n.isCenter);
    const otherNodes = nodes.filter((n) => !n.isCenter);

    // 중심 노드 배치
    centerNodes.forEach((node, index) => {
      if (centerNodes.length === 1) {
        positions[node.id] = { x: centerX, y: centerY };
      } else {
        const angle = (2 * Math.PI * index) / centerNodes.length - Math.PI / 2;
        positions[node.id] = {
          x: centerX + (radius * 0.5) * Math.cos(angle),
          y: centerY + (radius * 0.5) * Math.sin(angle),
        };
      }
    });

    // 외부 노드 배치
    otherNodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / Math.max(otherNodes.length, 1) - Math.PI / 2;
      positions[node.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    return positions;
  }, [nodes]);

  const handleNodeClick = (node: NetworkNode) => {
    setSelectedNodeId(node.id);
    if (onNodeClick) {
      onNodeClick(node.item);
    }
  };

  // 선택된 노드 정보
  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  if (items.length === 0) {
    return (
      <div
        className="text-center py-4 text-sm"
        style={{ color: "var(--notion-text-muted)" }}
      >
        협업 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 네트워크 그래프 */}
      <div
        className="rounded-lg p-2 overflow-hidden"
        style={{ background: "var(--notion-bg-secondary)" }}
      >
        <svg viewBox="0 0 300 240" className="w-full max-h-60">
          {/* 엣지 */}
          {edges.map((edge, index) => {
            const from = nodePositions[edge.from];
            const to = nodePositions[edge.to];
            if (!from || !to) return null;

            return (
              <g key={index}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={getRelationColor(edge.relation)}
                  strokeWidth={1.5}
                  strokeDasharray={edge.relation === "pair" ? "none" : "4,4"}
                  opacity={0.6}
                />
                {/* 관계 라벨 */}
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 6}
                  textAnchor="middle"
                  fontSize={8}
                  fill={getRelationColor(edge.relation)}
                >
                  {edge.relation}
                </text>
              </g>
            );
          })}

          {/* 노드 */}
          {nodes.map((node) => (
            <NetworkNodeComponent
              key={node.id}
              node={node}
              position={nodePositions[node.id]}
              isSelected={selectedNodeId === node.id}
              onClick={() => handleNodeClick(node)}
            />
          ))}
        </svg>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 text-xs">
        <div className="flex items-center gap-1">
          <span
            className="w-3 h-0.5"
            style={{ background: getRelationColor("pair") }}
          />
          <span style={{ color: "var(--notion-text-muted)" }}>pair</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-3 h-0.5"
            style={{
              background: getRelationColor("pre"),
              borderTop: "2px dashed currentColor",
            }}
          />
          <span style={{ color: "var(--notion-text-muted)" }}>pre</span>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="w-3 h-0.5"
            style={{
              background: getRelationColor("post"),
              borderTop: "2px dashed currentColor",
            }}
          />
          <span style={{ color: "var(--notion-text-muted)" }}>post</span>
        </div>
      </div>

      {/* 선택된 노드 미니 정보 */}
      {selectedNode && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            background: "var(--notion-bg-active)",
            border: "1px solid var(--notion-accent)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium" style={{ color: "var(--notion-text)" }}>
              {selectedNode.name}
            </span>
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: "var(--notion-accent-light)",
                color: "var(--notion-accent)",
              }}
            >
              {selectedNode.item.domain}
            </span>
          </div>
          <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            {selectedNode.item.project} / {selectedNode.item.module || "—"} / {selectedNode.item.topic}
          </div>
        </div>
      )}
    </div>
  );
}

