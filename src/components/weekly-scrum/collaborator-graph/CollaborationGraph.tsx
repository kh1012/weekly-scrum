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
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import * as d3 from "d3-force";
import type { GraphNode, GraphEdge } from "./buildCollabGraph";

// 커스텀 노드 컴포넌트 (좌우 중앙에 연결점)
function CustomNode({ data }: NodeProps) {
  const nameFontSize = data.nameFontSize || 13;
  const countFontSize = data.countFontSize || 11;
  
  return (
    <>
      {/* 왼쪽 연결점 (입력) */}
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: "#d0d7de",
          width: "8px",
          height: "8px",
          border: "2px solid #ffffff",
          left: "-4px",
        }}
      />
      {/* 오른쪽 연결점 (출력) */}
      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: "#d0d7de",
          width: "8px",
          height: "8px",
          border: "2px solid #ffffff",
          right: "-4px",
        }}
      />
      <div className="flex items-center justify-center gap-2 px-3">
        <div 
          className="font-normal text-[#24292f]"
          style={{ fontSize: `${nameFontSize}px` }}
        >
          {data.name}
        </div>
        <div 
          className="text-[#6e7781] font-normal"
          style={{ fontSize: `${countFontSize}px` }}
        >
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
  selectedNode?: GraphNode | null;
}

export function CollaborationGraph({
  nodes: graphNodes,
  edges: graphEdges,
  onNodeClick,
  onEdgeClick,
  selectedNode,
}: CollaborationGraphProps) {
  // React Flow 노드 변환 (FigJam 스타일 트리 레이아웃)
  const initialNodes: Node[] = useMemo(() => {
    if (graphNodes.length === 0) return [];

    // 엣지 연결 정보 분석 (방향성 고려)
    const outgoingEdges = new Map<string, Set<string>>(); // source -> targets
    const incomingEdges = new Map<string, Set<string>>(); // target -> sources
    
    graphEdges.forEach((edge) => {
      // Outgoing edges
      if (!outgoingEdges.has(edge.source)) {
        outgoingEdges.set(edge.source, new Set());
      }
      outgoingEdges.get(edge.source)!.add(edge.target);
      
      // Incoming edges
      if (!incomingEdges.has(edge.target)) {
        incomingEdges.set(edge.target, new Set());
      }
      incomingEdges.get(edge.target)!.add(edge.source);
    });

    // 최대 협업 횟수 찾기
    const maxCollabs = Math.max(...graphNodes.map((n) => n.totalCollabs), 1);

    // 루트 노드 찾기 (incoming edge가 없는 노드들)
    const rootNodes = graphNodes.filter(
      (node) => !incomingEdges.has(node.id) || incomingEdges.get(node.id)!.size === 0
    );
    
    // 루트 노드가 없으면 가장 연결이 많은 노드를 루트로 사용
    if (rootNodes.length === 0) {
      const maxNode = [...graphNodes].sort((a, b) => b.totalCollabs - a.totalCollabs)[0];
      rootNodes.push(maxNode);
    }
    
    // 루트 노드들을 totalCollabs 기준으로 정렬
    rootNodes.sort((a, b) => b.totalCollabs - a.totalCollabs);

    // BFS로 레벨 할당 (루트부터 시작)
    const levels: GraphNode[][] = [];
    const visited = new Set<string>();
    const queue: Array<{ node: GraphNode; level: number }> = [];
    
    // 모든 루트 노드를 레벨 0에 추가
    rootNodes.forEach((node) => {
      queue.push({ node, level: 0 });
      visited.add(node.id);
    });

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(node);

      // outgoing edges를 따라 다음 레벨로
      const targets = outgoingEdges.get(node.id) || new Set();
      const connectedNodes = graphNodes.filter(
        (n) => targets.has(n.id) && !visited.has(n.id)
      );
      
      // 연결된 노드들을 totalCollabs 기준으로 정렬
      connectedNodes.sort((a, b) => b.totalCollabs - a.totalCollabs);
      
      connectedNodes.forEach((connectedNode) => {
        visited.add(connectedNode.id);
        queue.push({ node: connectedNode, level: level + 1 });
      });
    }

    // 방문하지 않은 고립된 노드들을 마지막에 추가
    const unvisitedNodes = graphNodes.filter((node) => !visited.has(node.id));
    if (unvisitedNodes.length > 0) {
      unvisitedNodes.sort((a, b) => b.totalCollabs - a.totalCollabs);
      const lastLevel = levels.length;
      levels[lastLevel] = unvisitedNodes;
    }

    // FigJam 스타일 노드 배치 (크기 동적 조정, 좌→우 흐름)
    const BASE_WIDTH = 100; // 기본 너비
    const BASE_HEIGHT = 40; // 기본 높이
    const MAX_WIDTH = 200; // 최대 너비
    const MAX_HEIGHT = 70; // 최대 높이
    const BASE_NAME_FONT = 11; // 기본 이름 폰트
    const MAX_NAME_FONT = 16; // 최대 이름 폰트
    const BASE_COUNT_FONT = 9; // 기본 횟수 폰트
    const MAX_COUNT_FONT = 13; // 최대 횟수 폰트
    
    const HORIZONTAL_GAP = 200; // 레벨 간 수평 간격
    const VERTICAL_GAP = 80; // 노드 간 수직 간격
    const TOP_MARGIN = 80;
    const LEFT_MARGIN = 80;

    const nodeData: any[] = [];

    levels.forEach((levelNodes, levelIndex) => {
      // 레벨 내 최대 노드 너비 계산
      const maxNodeWidth = Math.max(
        ...levelNodes.map((node) => {
          const scale = node.totalCollabs / maxCollabs;
          return BASE_WIDTH + scale * (MAX_WIDTH - BASE_WIDTH);
        })
      );
      
      // 레벨의 x 좌표 (좌에서 우로)
      const x = LEFT_MARGIN + levelIndex * (maxNodeWidth + HORIZONTAL_GAP);
      
      // 레벨 내 노드들의 총 높이 계산
      const levelHeight = levelNodes.reduce((sum, node) => {
        const scale = node.totalCollabs / maxCollabs;
        const nodeHeight = BASE_HEIGHT + scale * (MAX_HEIGHT - BASE_HEIGHT);
        return sum + nodeHeight;
      }, 0) + (levelNodes.length - 1) * VERTICAL_GAP;
      
      // 레벨 내 노드들을 수직 중앙 정렬
      const startY = TOP_MARGIN + (800 - levelHeight) / 2;
      
      let currentY = startY;
      levelNodes.forEach((node) => {
        const scale = node.totalCollabs / maxCollabs;
        const nodeWidth = BASE_WIDTH + scale * (MAX_WIDTH - BASE_WIDTH);
        const nodeHeight = BASE_HEIGHT + scale * (MAX_HEIGHT - BASE_HEIGHT);
        const nameFontSize = BASE_NAME_FONT + scale * (MAX_NAME_FONT - BASE_NAME_FONT);
        const countFontSize = BASE_COUNT_FONT + scale * (MAX_COUNT_FONT - BASE_COUNT_FONT);
        
        nodeData.push({
          id: node.id,
          label: node.label,
          totalCollabs: node.totalCollabs,
          uniquePartners: node.uniquePartners,
          x,
          y: currentY,
          width: nodeWidth,
          height: nodeHeight,
          nameFontSize,
          countFontSize,
        });
        
        currentY += nodeHeight + VERTICAL_GAP;
      });
    });

    // React Flow 노드로 변환 (FigJam 스타일, 크기 동적 조정)
    return nodeData.map((node: any) => ({
      id: node.id,
      type: "custom",
      position: { x: node.x, y: node.y },
      data: {
        name: node.label,
        totalCollabs: node.totalCollabs,
        nameFontSize: node.nameFontSize,
        countFontSize: node.countFontSize,
      },
      style: {
        width: node.width,
        height: node.height,
        borderRadius: "6px",
        backgroundColor: "#f6f8fa",
        border: "1px solid #d0d7de",
        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0",
        cursor: "pointer",
        transition: "all 0.2s ease",
      },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    }));
  }, [graphNodes, graphEdges]);

  // React Flow 엣지 변환 (관계별 색상 적용 + 그라데이션)
  const initialEdges: Edge[] = useMemo(() => {
    if (graphEdges.length === 0) return [];

    return graphEdges.map((edge) => {
      // 선 두께
      const strokeWidth = edge.weight > 3 ? 2 : 1.5;

      // 관계별 색상 결정 (work-map과 동일)
      // pair > pre > post 우선순위
      let gradientId = "gradient-default"; // 기본 회색
      let arrowColor = "#8c959f";
      
      if (edge.relations.includes("pair")) {
        gradientId = "gradient-pair";
        arrowColor = "#3b82f6"; // 파란색
      } else if (edge.relations.includes("pre")) {
        gradientId = "gradient-pre";
        arrowColor = "#f59e0b"; // 주황색
      } else if (edge.relations.includes("post")) {
        gradientId = "gradient-post";
        arrowColor = "#22c55e"; // 초록색
      }

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "default", // 기본 베지어 곡선
        animated: false,
        style: {
          strokeWidth,
          stroke: `url(#${gradientId})`,
          strokeLinecap: "round",
        },
        markerEnd: {
          type: MarkerType.Arrow,
          color: arrowColor,
          width: 12,
          height: 12,
        },
        // 라벨 제거 (깔끔한 디자인)
      };
    });
  }, [graphEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);

  // React Flow 초기화 시 fitView 실행 및 gradient 주입
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
    
    // ReactFlow의 SVG에 gradient 주입
    const reactFlowSvg = document.querySelector('.react-flow__renderer svg');
    if (reactFlowSvg) {
      let defs = reactFlowSvg.querySelector('defs');
      if (!defs) {
        defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        reactFlowSvg.insertBefore(defs, reactFlowSvg.firstChild);
      }
      
      // gradient가 이미 존재하는지 확인
      if (!defs.querySelector('#gradient-pair')) {
        const gradients = `
          <linearGradient id="gradient-pair" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#3b82f6" stop-opacity="1" />
            <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.3" />
          </linearGradient>
          <linearGradient id="gradient-pre" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#f59e0b" stop-opacity="1" />
            <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.3" />
          </linearGradient>
          <linearGradient id="gradient-post" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#22c55e" stop-opacity="1" />
            <stop offset="100%" stop-color="#22c55e" stop-opacity="0.3" />
          </linearGradient>
          <linearGradient id="gradient-default" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#8c959f" stop-opacity="1" />
            <stop offset="100%" stop-color="#8c959f" stop-opacity="0.3" />
          </linearGradient>
        `;
        defs.innerHTML = gradients;
      }
    }
    
    // 약간의 지연 후 fitView 실행 (DOM 렌더링 완료 대기)
    setTimeout(() => {
      instance.fitView({
        padding: 0.15,
        duration: 500,
        minZoom: 0.3,
        maxZoom: 1,
      });
    }, 150);
  }, []);

  // 노드/엣지 변경 시 fitView 재실행
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({
          padding: 0.15,
          duration: 500,
          minZoom: 0.3,
          maxZoom: 1,
        });
      }, 150);
    }
  }, [initialNodes, initialEdges, reactFlowInstance]);

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
    <div className="w-full h-full bg-white relative">
      {/* SVG 그라데이션 정의 (전역, ReactFlow 외부) */}
      <svg style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
        <defs>
          {/* pair 그라데이션 (파란색) */}
          <linearGradient id="gradient-pair" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.3" />
          </linearGradient>
          
          {/* pre 그라데이션 (주황색) */}
          <linearGradient id="gradient-pre" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.3" />
          </linearGradient>
          
          {/* post 그라데이션 (초록색) */}
          <linearGradient id="gradient-post" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
          </linearGradient>
          
          {/* default 그라데이션 (회색) */}
          <linearGradient id="gradient-default" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8c959f" stopOpacity="1" />
            <stop offset="100%" stopColor="#8c959f" stopOpacity="0.3" />
          </linearGradient>
        </defs>
      </svg>
      
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onInit={onInit}
        connectionMode={ConnectionMode.Loose}
        minZoom={0.2}
        maxZoom={2}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
      >
        <Controls showInteractive={false} />
      </ReactFlow>
      
      {/* 범례 */}
      <div className="absolute top-4 left-4 bg-white rounded-md border border-[#d0d7de] p-3 shadow-sm">
        <div className="text-[11px] font-semibold text-[#24292f] mb-2">협업 관계</div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-0.5 rounded" 
              style={{ 
                background: "linear-gradient(to right, #3b82f6 0%, rgba(59, 130, 246, 0.3) 100%)" 
              }} 
            />
            <span className="text-[10px] text-[#57606a]">pair (실시간 협업)</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-0.5 rounded" 
              style={{ 
                background: "linear-gradient(to right, #f59e0b 0%, rgba(245, 158, 11, 0.3) 100%)" 
              }} 
            />
            <span className="text-[10px] text-[#57606a]">pre (선행 협업)</span>
          </div>
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-0.5 rounded" 
              style={{ 
                background: "linear-gradient(to right, #22c55e 0%, rgba(34, 197, 94, 0.3) 100%)" 
              }} 
            />
            <span className="text-[10px] text-[#57606a]">post (후행 협업)</span>
          </div>
        </div>
      </div>
      
      {/* 선택된 노드 정보 (우측 하단) */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 w-64 bg-[#ddf4ff] rounded-md border border-[#0969da] p-3 shadow-lg">
          <div className="text-[11px] font-semibold text-[#24292f] mb-2">선택된 노드</div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#57606a]">이름</span>
              <span className="text-[11px] font-medium text-[#24292f]">{selectedNode.label}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#57606a]">총 협업</span>
              <span className="text-[11px] font-medium text-[#24292f]">{selectedNode.totalCollabs}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#57606a]">파트너</span>
              <span className="text-[11px] font-medium text-[#24292f]">{selectedNode.uniquePartners}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

