"use client";

import { useCallback, useMemo } from "react";
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
  // React Flow 노드 변환
  const initialNodes: Node[] = useMemo(() => {
    if (graphNodes.length === 0) return [];

    // 최대 totalCollabs 값 찾기 (노드 크기 스케일링용)
    const maxCollabs = Math.max(...graphNodes.map((n) => n.totalCollabs), 1);

    return graphNodes.map((node, index) => {
      // 노드 크기 계산 (최소 60, 최대 150)
      const baseSize = 60;
      const maxSize = 150;
      const size =
        baseSize + ((node.totalCollabs / maxCollabs) * (maxSize - baseSize));

      // 원형 배치 (초기 위치)
      const angle = (index / graphNodes.length) * 2 * Math.PI;
      const radius = 250;
      const x = 400 + radius * Math.cos(angle);
      const y = 300 + radius * Math.sin(angle);

      return {
        id: node.id,
        type: "default",
        position: { x, y },
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
          width: size,
          height: size,
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
      };
    });
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
        type: "default",
        animated: false,
        style: {
          strokeWidth,
          stroke: "#8c959f",
        },
        label: `${edge.weight}회`,
        labelStyle: {
          fontSize: "10px",
          fill: "#57606a",
          fontWeight: "500",
        },
      };
    });
  }, [graphEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{
          padding: 0.2,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}

