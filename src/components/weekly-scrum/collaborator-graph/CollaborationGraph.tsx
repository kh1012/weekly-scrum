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
  Handle,
  Position,
  NodeProps,
} from "reactflow";
import "reactflow/dist/style.css";
import * as d3 from "d3-force";
import type { GraphNode, GraphEdge } from "./buildCollabGraph";

// 커스텀 노드 컴포넌트 (하단에만 연결점)
function CustomNode({ data }: NodeProps) {
  return (
    <>
      {/* 하단 연결점만 */}
      <Handle
        type="target"
        position={Position.Bottom}
        style={{
          background: "#d0d7de",
          width: "8px",
          height: "8px",
          border: "2px solid #ffffff",
          bottom: "-4px",
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: "#d0d7de",
          width: "8px",
          height: "8px",
          border: "2px solid #ffffff",
          bottom: "-4px",
        }}
      />
      <div className="flex items-center justify-center gap-2 px-3">
        <div className="font-normal text-[13px] text-[#24292f]">{data.name}</div>
        <div className="text-[11px] text-[#6e7781] font-normal">
          {data.totalCollabs}
        </div>
      </div>
    </>
  );
}

const nodeTypes = {
  custom: CustomNode,
};

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
  // React Flow 노드 변환 (FigJam 스타일 트리 레이아웃)
  const initialNodes: Node[] = useMemo(() => {
    if (graphNodes.length === 0) return [];

    // 엣지 연결 정보 분석하여 계층 구조 생성
    const nodeConnections = new Map<string, Set<string>>();
    graphEdges.forEach((edge) => {
      if (!nodeConnections.has(edge.source)) {
        nodeConnections.set(edge.source, new Set());
      }
      if (!nodeConnections.has(edge.target)) {
        nodeConnections.set(edge.target, new Set());
      }
      nodeConnections.get(edge.source)!.add(edge.target);
      nodeConnections.get(edge.target)!.add(edge.source);
    });

    // totalCollabs 기준으로 내림차순 정렬
    const sortedNodes = [...graphNodes].sort(
      (a, b) => b.totalCollabs - a.totalCollabs
    );

    // 최대 협업 횟수 찾기
    const maxCollabs = Math.max(...graphNodes.map((n) => n.totalCollabs), 1);

    // 계층별로 노드 배치 (연결이 많은 순서대로)
    const levels: GraphNode[][] = [];
    const visited = new Set<string>();
    
    // 가장 연결이 많은 노드부터 시작하여 BFS로 레벨 할당
    const queue: Array<{ node: GraphNode; level: number }> = [];
    if (sortedNodes.length > 0) {
      queue.push({ node: sortedNodes[0], level: 0 });
      visited.add(sortedNodes[0].id);
    }

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(node);

      // 연결된 노드를 다음 레벨에 추가
      const connections = nodeConnections.get(node.id) || new Set();
      const connectedNodes = sortedNodes.filter(
        (n) => connections.has(n.id) && !visited.has(n.id)
      );
      
      connectedNodes.forEach((connectedNode) => {
        visited.add(connectedNode.id);
        queue.push({ node: connectedNode, level: level + 1 });
      });
    }

    // 방문하지 않은 노드를 마지막 레벨에 추가
    sortedNodes.forEach((node) => {
      if (!visited.has(node.id)) {
        const lastLevel = levels.length > 0 ? levels.length : 0;
        if (!levels[lastLevel]) {
          levels[lastLevel] = [];
        }
        levels[lastLevel].push(node);
      }
    });

    // FigJam 스타일 노드 배치
    const NODE_WIDTH = 140; // 가로가 긴 직사각형
    const NODE_HEIGHT = 50;
    const HORIZONTAL_GAP = 100; // 노드 간 여유 있는 간격
    const VERTICAL_GAP = 120;
    const TOP_MARGIN = 80;
    const LEFT_MARGIN = 80;

    const nodeData: any[] = [];

    levels.forEach((levelNodes, levelIndex) => {
      const y = TOP_MARGIN + levelIndex * (NODE_HEIGHT + VERTICAL_GAP);
      const levelWidth = levelNodes.length * NODE_WIDTH + (levelNodes.length - 1) * HORIZONTAL_GAP;
      const startX = LEFT_MARGIN + (1400 - levelWidth) / 2; // 중앙 정렬

      levelNodes.forEach((node, nodeIndex) => {
        const x = startX + nodeIndex * (NODE_WIDTH + HORIZONTAL_GAP);
        
        nodeData.push({
          id: node.id,
          label: node.label,
          totalCollabs: node.totalCollabs,
          uniquePartners: node.uniquePartners,
          x,
          y,
        });
      });
    });

    // React Flow 노드로 변환 (FigJam 스타일, 커스텀 노드 사용)
    return nodeData.map((node: any) => ({
      id: node.id,
      type: "custom",
      position: { x: node.x, y: node.y },
      data: {
        name: node.label,
        totalCollabs: node.totalCollabs,
      },
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        border: "1px solid #d0d7de",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0",
        cursor: "pointer",
        transition: "all 0.2s ease",
      },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Bottom,
    }));
  }, [graphNodes, graphEdges]);

  // React Flow 엣지 변환 (FigJam 스타일)
  const initialEdges: Edge[] = useMemo(() => {
    if (graphEdges.length === 0) return [];

    return graphEdges.map((edge) => {
      // FigJam처럼 얇고 깔끔한 선
      const strokeWidth = edge.weight > 3 ? 2 : 1.5;

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "default", // 베지어 곡선 (부드러운 곡선)
        animated: false,
        style: {
          strokeWidth,
          stroke: "#8c959f",
          strokeLinecap: "round",
        },
        markerEnd: {
          type: MarkerType.Arrow,
          color: "#8c959f",
          width: 12,
          height: 12,
        },
        label: edge.weight > 1 ? `${edge.weight}` : undefined,
        labelStyle: {
          fontSize: "10px",
          fill: "#6e7781",
          fontWeight: "400",
        },
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 1,
        },
        labelBgPadding: [2, 4] as [number, number],
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
    <div className="w-full h-full bg-white">
      <ReactFlow
        nodes={nodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        connectionMode={ConnectionMode.Loose}
        fitView={isLayoutReady}
        fitViewOptions={{
          padding: 0.2,
          duration: 400,
          minZoom: 0.4,
          maxZoom: 1.2,
        }}
        minZoom={0.3}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        {/* 배경 없음 - 순수 흰색 */}
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

