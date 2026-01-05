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
  // React Flow 노드 변환 (원형 배치 + 충돌 방지)
  const initialNodes: Node[] = useMemo(() => {
    if (graphNodes.length === 0) return [];

    // 최대 totalCollabs 값 찾기 (노드 크기 스케일링용)
    const maxCollabs = Math.max(...graphNodes.map((n) => n.totalCollabs), 1);

    // 노드 데이터 준비 (원형 초기 배치)
    const centerX = 480;
    const centerY = 482;
    const nodeData = graphNodes.map((node, index) => {
      const baseSize = 60;
      const maxSize = 150;
      const size =
        baseSize + ((node.totalCollabs / maxCollabs) * (maxSize - baseSize));

      // 원형 배치 (초기 위치)
      const angle = (index / graphNodes.length) * 2 * Math.PI;
      const radius = Math.max(300, graphNodes.length * 30); // 노드 수에 따라 반경 조정

      return {
        id: node.id,
        label: node.label,
        totalCollabs: node.totalCollabs,
        size,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });

    // 충돌 방지 시뮬레이션만 적용 (원형 배치 유지)
    const simulation = d3
      .forceSimulation(nodeData as any)
      .force(
        "collide",
        d3.forceCollide().radius((d: any) => d.size / 2 + 30).strength(0.8)
      )
      .force(
        "radial",
        d3
          .forceRadial(
            (d: any, i: number) => Math.max(300, graphNodes.length * 30),
            centerX,
            centerY
          )
          .strength(0.3) // 원형 유지 강도
      )
      .stop();

    // 시뮬레이션 실행 (더 많은 반복으로 안정적인 위치 확보)
    for (let i = 0; i < 200; i++) {
      simulation.tick();
    }

    // React Flow 노드로 변환
    return nodeData.map((node: any) => ({
      id: node.id,
      type: "default",
      position: { x: node.x || centerX, y: node.y || centerY },
      data: {
        label: (
          <div className="text-center">
            <div className="font-semibold text-sm">{node.label}</div>
            <div className="text-xs text-[#57606a] mt-1">
              {node.totalCollabs}회
            </div>
          </div>
        ),
      },
      style: {
        width: node.size,
        height: node.size,
        borderRadius: "50%",
        backgroundColor: "#ddf4ff",
        border: "2px solid #0969da",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "500",
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
        type: "smoothstep", // 부드러운 곡선 엣지
        animated: false,
        style: {
          strokeWidth,
          stroke: "#8c959f",
          opacity: 0.6,
        },
        label: `${edge.weight}회`,
        labelStyle: {
          fontSize: "10px",
          fill: "#57606a",
          fontWeight: "500",
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          padding: "2px 4px",
          borderRadius: "3px",
        },
        labelBgStyle: {
          fill: "rgba(255, 255, 255, 0.8)",
        },
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
          padding: 0.2,
          duration: 400,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

