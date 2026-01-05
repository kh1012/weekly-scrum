"use client";

import { useCallback, useMemo, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  ConnectionMode,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import * as d3 from "d3-force";
import type { GraphNode, GraphEdge } from "./buildCollabGraph";

interface CollaborationGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  onEdgeClick?: (edge: GraphEdge) => void;
}

export function CollaborationGraph({
  nodes: graphNodes,
  edges: graphEdges,
  onNodeClick,
  onEdgeClick,
}: CollaborationGraphProps) {
  // React Flow 노드 변환 (계층적 트리 레이아웃)
  const initialNodes: Node[] = useMemo(() => {
    if (graphNodes.length === 0) return [];

    // totalCollabs 기준으로 내림차순 정렬 (연결이 많은 사람이 위)
    const sortedNodes = [...graphNodes].sort(
      (a, b) => b.totalCollabs - a.totalCollabs
    );

    // 최대 totalCollabs 값 찾기 (노드 크기 스케일링용)
    const maxCollabs = Math.max(...graphNodes.map((n) => n.totalCollabs), 1);

    // 레벨별로 노드 그룹화 (totalCollabs 범위로)
    const levels: GraphNode[][] = [];
    const levelThreshold = maxCollabs / 5; // 5개 레벨로 분할

    sortedNodes.forEach((node) => {
      const level = Math.floor((maxCollabs - node.totalCollabs) / levelThreshold);
      const clampedLevel = Math.min(level, 4); // 최대 5레벨
      if (!levels[clampedLevel]) {
        levels[clampedLevel] = [];
      }
      levels[clampedLevel].push(node);
    });

    // 노드 배치
    const containerWidth = 1200;
    const containerHeight = 800;
    const verticalSpacing = 180;
    const topMargin = 100;

    const nodeData: any[] = [];

    levels.forEach((levelNodes, levelIndex) => {
      const y = topMargin + levelIndex * verticalSpacing;
      const horizontalSpacing = containerWidth / (levelNodes.length + 1);

      levelNodes.forEach((node, nodeIndex) => {
        const x = horizontalSpacing * (nodeIndex + 1);
        
        const baseSize = 80;
        const maxSize = 180;
        const size =
          baseSize + ((node.totalCollabs / maxCollabs) * (maxSize - baseSize));

        nodeData.push({
          id: node.id,
          label: node.label,
          totalCollabs: node.totalCollabs,
          size,
          x,
          y,
        });
      });
    });

    // React Flow 노드로 변환
    return nodeData.map((node: any) => ({
      id: node.id,
      type: "default",
      position: { x: node.x, y: node.y },
      data: {
        label: (
          <div className="text-center">
            <div className="font-medium text-xs">{node.label}</div>
            <div className="text-[11px] text-[#57606a] mt-0.5">
              {node.totalCollabs}회
            </div>
          </div>
        ),
      },
      style: {
        width: node.size,
        height: node.size,
        borderRadius: "8px", // 사각형 radius
        backgroundColor: "#ffffff",
        border: "1.5px solid #0969da",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "11px",
        fontWeight: "400",
        color: "#24292f",
        cursor: "pointer",
      },
    }));
  }, [graphNodes]);

  // React Flow 엣지 변환
  const initialEdges: Edge[] = useMemo(() => {
    if (graphEdges.length === 0) return [];

    // 최대 weight 값 찾기 (엣지 두께 스케일링용)
    const maxWeight = Math.max(...graphEdges.map((e) => e.weight), 1);

    return graphEdges.map((edge) => {
      // 엣지 두께 계산 (최소 1, 최대 8)
      const minWidth = 1;
      const maxWidth = 8;
      const strokeWidth =
        minWidth + ((edge.weight / maxWeight) * (maxWidth - minWidth));

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "default", // 베지어 곡선 엣지
        animated: false,
        style: {
          strokeWidth,
          stroke: "#0969da",
          opacity: 0.3,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#0969da",
          width: 20,
          height: 20,
        },
        label: `${edge.weight}회`,
        labelStyle: {
          fontSize: "9px",
          fill: "#57606a",
          fontWeight: "500",
        },
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 0.95,
        },
        labelBgPadding: [3, 3],
        labelBgBorderRadius: 3,
      };
    });
  }, [graphEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  // 노드 위치가 안정화된 후 엣지 표시 및 fitView 실행
  useEffect(() => {
    if (nodes.length === 0) return;

    // 노드 위치가 모두 설정되었는지 확인
    const allNodesPositioned = nodes.every(
      (node) => node.position.x !== undefined && node.position.y !== undefined
    );

    if (allNodesPositioned && !isLayoutReady) {
      // 약간의 지연 후 fitView 실행하여 엣지가 깔끔하게 렌더링되도록
      const timer = setTimeout(() => {
        setIsLayoutReady(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [nodes, isLayoutReady]);

  // 노드 클릭 핸들러
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const graphNode = graphNodes.find((n) => n.id === node.id);
      if (graphNode && onNodeClick) {
        onNodeClick(graphNode);
      }
    },
    [graphNodes, onNodeClick]
  );

  // 엣지 클릭 핸들러
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      const graphEdge = graphEdges.find((e) => e.id === edge.id);
      if (graphEdge && onEdgeClick) {
        onEdgeClick(graphEdge);
      }
    },
    [graphEdges, onEdgeClick]
  );

  // 레이아웃이 준비된 후에만 엣지 표시
  const visibleEdges = isLayoutReady ? edges : [];

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={visibleEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        connectionMode={ConnectionMode.Loose}
        fitView={isLayoutReady}
        fitViewOptions={{
          padding: 0.3,
          duration: 500,
          minZoom: 0.5,
          maxZoom: 1.5,
        }}
        minZoom={0.3}
        maxZoom={2.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background 
          variant={BackgroundVariant.Lines} 
          gap={20} 
          size={0.5}
          color="#e5e7eb"
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

