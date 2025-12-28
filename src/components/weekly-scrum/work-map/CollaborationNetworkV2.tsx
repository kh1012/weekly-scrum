"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import type { ScrumItem, Relation } from "@/types/scrum";
import { DOMAIN_COLORS } from "@/lib/colorDefines";
import { ScrumCard } from "../cards/ScrumCard";

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

// relations 배열에서 첫 번째 relation 가져오기
function getPrimaryRelation(collab: { relation?: Relation; relations?: Relation[] }): Relation {
  return collab.relations?.[0] || collab.relation || "pair";
}

// relations에 특정 relation이 포함되어 있는지 확인
function hasRelation(collab: { relation?: Relation; relations?: Relation[] }, rel: Relation): boolean {
  const rels = collab.relations || (collab.relation ? [collab.relation] : []);
  return rels.includes(rel);
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
  // 노드 배치 영역을 화면 전체로 확장
  const padding = 50;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

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

        if (hasRelation(collab, "pair")) {
          authorNode.pairCount++;
        } else if (hasRelation(collab, "pre")) {
          // pre: 협업자가 나에게 선행 입력 제공 → 협업자의 preCount 증가
          collabNode.preCount++;
        }

        edges.push({
          from: authorKey,
          to: collabKey,
          relation: getPrimaryRelation(collab),
        });
      }
    }
  }

  // 노드 배열 생성
  const nodes = Array.from(nodesMap.values());

  // 도메인별 그룹핑하여 배치 (전체 영역을 활용하도록 조정)
  const domainGroups = new Map<string, NetworkNode[]>();
  nodes.forEach((node) => {
    const group = domainGroups.get(node.domain) || [];
    group.push(node);
    domainGroups.set(node.domain, group);
  });

  const domains = Array.from(domainGroups.keys()).sort();
  const domainCount = domains.length;
  // 수직 간격을 화면 높이에 맞게 동적으로 계산
  const maxNodesInDomain = Math.max(
    ...Array.from(domainGroups.values()).map((g) => g.length),
    1
  );
  const verticalSpacing = Math.min(
    120,
    usableHeight / Math.max(maxNodesInDomain, 2)
  );

  domains.forEach((domain, domainIndex) => {
    const domainNodes = domainGroups.get(domain) || [];
    // 가로 전체를 균등 분배
    const columnX =
      domainCount === 1
        ? width / 2
        : padding + (usableWidth / Math.max(domainCount - 1, 1)) * domainIndex;

    domainNodes.forEach((node, nodeIndex) => {
      const totalHeight = (domainNodes.length - 1) * verticalSpacing;
      const startY = height / 2 - totalHeight / 2;
      const y = startY + nodeIndex * verticalSpacing;

      node.x = columnX;
      node.y = Math.max(padding, Math.min(height - padding, y));
    });
  });

  // 노드 간 겹침 방지 (더 넓은 최소 거리 적용)
  const minNodeDist = Math.min(130, usableWidth / Math.max(nodes.length, 2));
  for (let iter = 0; iter < 50; iter++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minNodeDist && dist > 0) {
          const force = (minNodeDist - dist) / 2;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;

          nodes[i].x -= fx * 0.5;
          nodes[i].y -= fy * 0.5;
          nodes[j].x += fx * 0.5;
          nodes[j].y += fy * 0.5;
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
interface SnapshotPanel {
  nodeId: string;
  x: number;
  y: number;
  showOnlyFeature: boolean;
  expandedSnapshots: Set<number>; // 펼쳐진 스냅샷 인덱스
}

export function CollaborationNetworkV2({
  items,
  allItems,
  featureName,
}: CollaborationNetworkV2Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 500, height: 350 });
  const [nodePositions, setNodePositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // 관계 유형 필터 (null이면 전체 표시)
  const [activeRelation, setActiveRelation] = useState<Relation | null>(null);

  // 드래그 vs 클릭 구분을 위한 ref
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragged = useRef(false);

  // 여러 개의 스냅샷 패널 관리
  const [snapshotPanels, setSnapshotPanels] = useState<SnapshotPanel[]>([]);
  const [draggingPanel, setDraggingPanel] = useState<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // 중앙 모달 상태
  const [modalNode, setModalNode] = useState<{
    id: string;
    name: string;
    domain: string;
  } | null>(null);

  // Portal 렌더링을 위한 mounted 상태
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // 초기 네트워크 데이터 빌드
  const { nodes: initialNodes, edges } = useMemo(
    () => buildNetworkData(items, dimensions.width, dimensions.height),
    [items, dimensions.width, dimensions.height]
  );

  // 메타데이터 계산
  const metadata = useMemo(() => {
    const pairCount = edges.filter((e) => e.relation === "pair").length;
    const preCount = edges.filter((e) => e.relation === "pre").length;
    const postCount = edges.filter((e) => e.relation === "post").length;
    return {
      nodeCount: initialNodes.length,
      pairCount,
      preCount,
      postCount,
      totalEdges: edges.length,
    };
  }, [initialNodes, edges]);

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

  const getNodeRadius = useCallback(
    (node: NetworkNode) => {
      const degree = node.pairCount + node.preCount;
      const maxDegree = Math.max(
        ...initialNodes.map((n) => n.pairCount + n.preCount),
        1
      );
      return 26 + (degree / Math.max(maxDegree, 1)) * 12;
    },
    [initialNodes]
  );

  // SVG 좌표 변환
  const getSvgPoint = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
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
    },
    [dimensions, zoom]
  );

  // 노드 드래그
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();

      const node = initialNodes.find((n) => n.id === nodeId);
      if (!node) return;

      // 드래그 시작 위치 저장
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      wasDragged.current = false;

      setDraggedNode(nodeId);
    },
    [initialNodes]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!draggedNode) return;

      // 이동 거리 체크 (5px 이상 이동하면 드래그로 간주)
      if (dragStartPos.current) {
        const dx = e.clientX - dragStartPos.current.x;
        const dy = e.clientY - dragStartPos.current.y;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
          wasDragged.current = true;
        }
      }

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
    dragStartPos.current = null;
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

  // 엣지 경로 계산 (곡선) - curveOffset으로 관계별 곡선 분리
  // curveOffset: pre=1 (상단), pair=0 (중앙), post=-1 (하단)
  const getEdgePath = useCallback(
    (
      source: { x: number; y: number },
      target: { x: number; y: number },
      sourceRadius: number,
      targetRadius: number,
      curveOffset: number = 0
    ) => {
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) return "";

      // 수직 방향 벡터 (곡선 방향)
      const perpX = -dy / dist;
      const perpY = dx / dist;

      // 화살표 끝점 오프셋 (관계별로 다른 위치에 도착)
      const endOffset = curveOffset * 8;

      const startX =
        source.x + (dx / dist) * sourceRadius + perpX * (curveOffset * 5);
      const startY =
        source.y + (dy / dist) * sourceRadius + perpY * (curveOffset * 5);
      const endX =
        target.x - (dx / dist) * (targetRadius + 8) + perpX * endOffset;
      const endY =
        target.y - (dy / dist) * (targetRadius + 8) + perpY * endOffset;

      // 곡선 - 관계 유형에 따라 다른 방향으로 휘어짐
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      // 기본 곡률 + 관계별 오프셋 (pre: 위쪽, pair: 약간, post: 아래쪽)
      const baseCurve = Math.min(dist * 0.08, 20);
      const offsetCurve = curveOffset * Math.min(dist * 0.15, 35);
      const totalCurve = baseCurve + offsetCurve;

      const ctrlX = midX + perpX * totalCurve;
      const ctrlY = midY + perpY * totalCurve;

      return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
    },
    []
  );

  // viewBox 계산
  const { width, height } = dimensions;
  const vbWidth = width / zoom;
  const vbHeight = height / zoom;
  const vbX = (width - vbWidth) / 2;
  const vbY = (height - vbHeight) / 2;

  if (items.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-48 text-sm"
        style={{ color: "#57606a" }}
      >
        협업 데이터가 없습니다.
      </div>
    );
  }

  const domains = Array.from(new Set(initialNodes.map((n) => n.domain))).sort();

  // 관계 필터 토글
  const toggleRelationFilter = (relation: Relation) => {
    setActiveRelation((prev) => (prev === relation ? null : relation));
  };

  return (
    <div className="h-full flex flex-col">
      {/* 메타데이터 상단 바 */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-3 py-2 mb-2 rounded-lg"
        style={{ background: "#f6f8fa" }}
      >
        {/* 인원 수 */}
        <div
          className="flex items-center gap-1.5 text-xs"
          style={{ color: "#57606a" }}
        >
          <span>👥</span>
          <span className="font-medium">{metadata.nodeCount}명</span>
        </div>

        <div
          className="h-3 w-px"
          style={{ background: "#d0d7de" }}
        />

        {/* Pair 관계 */}
        <button
          onClick={() => toggleRelationFilter("pair")}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all"
          style={{
            background:
              activeRelation === "pair"
                ? "rgba(59, 130, 246, 0.25)"
                : "rgba(59, 130, 246, 0.08)",
            color: "#3b82f6",
            boxShadow: activeRelation === "pair" ? "0 0 0 2px #3b82f6" : "none",
          }}
          title="Pair 관계만 보기"
        >
          <span style={{ fontSize: "10px" }}>━━</span>
          <span className="font-medium">Pair</span>
          <span className="font-bold">{metadata.pairCount}</span>
        </button>

        {/* Pre 관계 */}
        <button
          onClick={() => toggleRelationFilter("pre")}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all"
          style={{
            background:
              activeRelation === "pre"
                ? "rgba(245, 158, 11, 0.25)"
                : "rgba(245, 158, 11, 0.08)",
            color: "#f59e0b",
            boxShadow: activeRelation === "pre" ? "0 0 0 2px #f59e0b" : "none",
          }}
          title="Pre 관계만 보기 (선행 입력)"
        >
          <span style={{ fontSize: "10px" }}>→</span>
          <span className="font-medium">Pre</span>
          <span className="font-bold">{metadata.preCount}</span>
        </button>

        {/* Post 관계 */}
        <button
          onClick={() => toggleRelationFilter("post")}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all"
          style={{
            background:
              activeRelation === "post"
                ? "rgba(34, 197, 94, 0.25)"
                : "rgba(34, 197, 94, 0.08)",
            color: "#22c55e",
            boxShadow: activeRelation === "post" ? "0 0 0 2px #22c55e" : "none",
          }}
          title="Post 관계만 보기 (후행 출력)"
        >
          <span style={{ fontSize: "10px" }}>→</span>
          <span className="font-medium">Post</span>
          <span className="font-bold">{metadata.postCount}</span>
        </button>

        {/* 필터 초기화 */}
        {activeRelation && (
          <button
            onClick={() => setActiveRelation(null)}
            className="ml-auto text-xs px-2 py-1 rounded transition-colors"
            style={{
              background: "white",
              color: "#57606a",
            }}
          >
            전체 보기
          </button>
        )}
      </div>

      {/* 그래프 영역 */}
      <div
        ref={containerRef}
        className="relative flex-1 rounded-lg overflow-hidden"
        style={{
          background: "white",
          border: "1px solid #d0d7de",
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
          onClick={(e) => {
            // SVG 배경 클릭 시 선택 해제
            if (e.target === e.currentTarget) {
              setSelectedNode(null);
            }
          }}
        >
          {/* 배경 클릭 영역 */}
          <rect
            x={vbX}
            y={vbY}
            width={vbWidth}
            height={vbHeight}
            fill="transparent"
            onClick={() => setSelectedNode(null)}
          />

          <defs>
            {/* pre 화살표 마커 (주황색) */}
            <marker
              id="arrow-pre-v2"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill="#f59e0b" fillOpacity="0.8" />
            </marker>
            <marker
              id="arrow-pre-v2-dim"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill="#f59e0b" fillOpacity="0.15" />
            </marker>
            {/* post 화살표 마커 (초록색) */}
            <marker
              id="arrow-post-v2"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill="#22c55e" fillOpacity="0.8" />
            </marker>
            <marker
              id="arrow-post-v2-dim"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="4"
              orient="auto"
            >
              <path d="M0,1 L6,4 L0,7 Z" fill="#22c55e" fillOpacity="0.15" />
            </marker>
            <filter
              id="node-shadow-v2"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow
                dx="0"
                dy="2"
                stdDeviation="3"
                floodOpacity="0.15"
              />
            </filter>
            <filter
              id="node-glow-v2"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* 엣지 */}
          {edges.map((edge, idx) => {
            const sourceNode = initialNodes.find((n) => n.id === edge.from);
            const targetNode = initialNodes.find((n) => n.id === edge.to);
            if (!sourceNode || !targetNode) return null;

            const sourcePos = nodePositions[edge.from] || {
              x: sourceNode.x,
              y: sourceNode.y,
            };
            const targetPos = nodePositions[edge.to] || {
              x: targetNode.x,
              y: targetNode.y,
            };
            const sourceRadius = getNodeRadius(sourceNode);
            const targetRadius = getNodeRadius(targetNode);

            const isPair = edge.relation === "pair";
            const isPre = edge.relation === "pre";
            const isPost = edge.relation === "post";

            // 노드 연결 여부
            const isNodeConnected = activeNode
              ? edge.from === activeNode || edge.to === activeNode
              : true;

            // 관계 필터 적용
            const isRelationActive =
              activeRelation === null || edge.relation === activeRelation;
            const isConnected = isNodeConnected && isRelationActive;

            // 색상 정의
            // pair: 파란색, pre: 주황색, post: 초록색
            const strokeColor = isPair
              ? "#3b82f6"
              : isPre
              ? "#f59e0b"
              : isPost
              ? "#22c55e"
              : "#64748b";

            // pre: 협업자(to) → 나(from) 방향으로 화살표 (협업자가 나에게 선행 입력 제공)
            // post: 나(from) → 협업자(to) 방향으로 화살표 (내가 협업자에게 결과물 전달)
            const actualSource = isPre ? targetPos : sourcePos;
            const actualTarget = isPre ? sourcePos : targetPos;
            const actualSourceRadius = isPre ? targetRadius : sourceRadius;
            const actualTargetRadius = isPre ? sourceRadius : targetRadius;

            // 관계 유형에 따른 곡선 오프셋 (pre: 상단, pair: 중앙, post: 하단)
            const curveOffset = isPre ? 1 : isPair ? 0 : -1;

            // 마커 결정
            let markerEnd = undefined;
            if (isPre) {
              markerEnd = isConnected
                ? "url(#arrow-pre-v2)"
                : "url(#arrow-pre-v2-dim)";
            } else if (isPost) {
              markerEnd = isConnected
                ? "url(#arrow-post-v2)"
                : "url(#arrow-post-v2-dim)";
            }

            return (
              <path
                key={`edge-${idx}`}
                d={getEdgePath(
                  actualSource,
                  actualTarget,
                  actualSourceRadius,
                  actualTargetRadius,
                  curveOffset
                )}
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

            // 관계 필터가 활성화된 경우, 해당 관계에 포함된 노드만 강조
            const isInActiveRelation =
              activeRelation === null ||
              edges.some(
                (e) =>
                  e.relation === activeRelation &&
                  (e.from === node.id || e.to === node.id)
              );

            const opacity = activeNode
              ? isActive || isConnected
                ? 1
                : 0.2
              : activeRelation
              ? isInActiveRelation
                ? 1
                : 0.25
              : 1;
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
                  // 드래그 후 마우스업 시 onClick이 발생하므로 드래그 여부 체크
                  if (wasDragged.current) {
                    return;
                  }

                  e.stopPropagation();
                  setSelectedNode(selectedNode === node.id ? null : node.id);

                  // 이미 열린 패널이 있으면 무시
                  if (snapshotPanels.some((p) => p.nodeId === node.id)) {
                    return;
                  }

                  // 클릭 위치의 우측하단에 패널 생성 (viewport 기준)
                  const viewportWidth = window.innerWidth;
                  const viewportHeight = window.innerHeight;

                  // viewport 기준으로 패널 위치 계산 (fixed 포지션 사용)
                  const clickX = e.clientX;
                  const clickY = e.clientY;

                  // 창의 좌상단이 마우스 클릭 위치에 오도록 설정
                  // 화면을 벗어나지 않도록 경계 처리
                  const panelWidth = 380;
                  const panelHeight = 500;
                  const x = Math.max(
                    0,
                    Math.min(clickX, viewportWidth - panelWidth)
                  );
                  const y = Math.max(
                    0,
                    Math.min(clickY, viewportHeight - panelHeight)
                  );

                  setSnapshotPanels((prev) => [
                    ...prev,
                    {
                      nodeId: node.id,
                      x,
                      y,
                      showOnlyFeature: true, // 기본: 현재 피쳐 관련 스냅샷만 표시
                      expandedSnapshots: new Set<number>(),
                    },
                  ]);
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
                  filter={
                    isActive ? "url(#node-glow-v2)" : "url(#node-shadow-v2)"
                  }
                />
                {/* 이름 */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={radius > 32 ? 11 : 10}
                  fontWeight={600}
                  style={{
                    pointerEvents: "none",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {node.name.length > 5
                    ? node.name.slice(0, 4) + "…"
                    : node.name}
                </text>
                {/* Pair 뱃지 */}
                {node.pairCount > 0 && (
                  <g transform={`translate(${radius - 2}, ${-radius + 2})`}>
                    <circle
                      r={10}
                      fill="#3b82f6"
                      stroke="white"
                      strokeWidth={2}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill="white"
                    >
                      {node.pairCount}
                    </text>
                  </g>
                )}
                {/* Pre 뱃지 */}
                {node.preCount > 0 && (
                  <g transform={`translate(${-radius + 2}, ${-radius + 2})`}>
                    <circle
                      r={10}
                      fill="#ef4444"
                      stroke="white"
                      strokeWidth={2}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize={9}
                      fontWeight={700}
                      fill="white"
                    >
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
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#24292f",
            }}
          >
            −
          </button>
          <div
            className="px-2 py-1 text-[10px] font-medium rounded"
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#24292f",
            }}
          >
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))}
            className="w-7 h-7 flex items-center justify-center rounded text-sm font-bold"
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#24292f",
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            className="ml-1 px-2 py-1 text-[10px] rounded"
            style={{
              background: "rgba(255,255,255,0.9)",
              color: "#57606a",
            }}
          >
            리셋
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div
        className="mt-3 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
        style={{ borderTop: "1px solid #d0d7de" }}
      >
        <div className="flex flex-wrap gap-1.5">
          {domains.map((domain) => (
            <span
              key={domain}
              className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
              style={{ background: "#f6f8fa" }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: getDomainColor(domain) }}
              />
              {domain}
            </span>
          ))}
        </div>
        <div
          className="flex items-center gap-3 text-[10px]"
          style={{ color: "#8c959f" }}
        >
          {/* Pair: 파란색 점선 */}
          <span className="flex items-center gap-1">
            <svg width="20" height="10" viewBox="0 0 20 10">
              <line
                x1="0"
                y1="5"
                x2="20"
                y2="5"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4,2"
              />
            </svg>
            <span>Pair</span>
          </span>
          {/* Pre: 주황색 화살표 */}
          <span className="flex items-center gap-1">
            <svg width="20" height="10" viewBox="0 0 20 10">
              <line
                x1="0"
                y1="5"
                x2="14"
                y2="5"
                stroke="#f59e0b"
                strokeWidth="2"
              />
              <path d="M12,2 L18,5 L12,8 Z" fill="#f59e0b" />
            </svg>
            <span>Pre (선행)</span>
          </span>
          {/* Post: 초록색 화살표 */}
          <span className="flex items-center gap-1">
            <svg width="20" height="10" viewBox="0 0 20 10">
              <line
                x1="0"
                y1="5"
                x2="14"
                y2="5"
                stroke="#22c55e"
                strokeWidth="2"
              />
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

      {/* Portal: 패널과 모달을 document.body에 렌더링하여 transform 영향 제거 */}
      {mounted &&
        createPortal(
          <>
            {/* 스냅샷 패널들 */}
            {snapshotPanels.map((panel) => {
              const node = initialNodes.find((n) => n.id === panel.nodeId);
              if (!node) return null;

              const sourceItems = allItems || items;
              const personSnapshots = panel.showOnlyFeature
                ? items.filter((item) => item.name === node.name)
                : sourceItems.filter((item) => item.name === node.name);

              const toggleSnapshotExpand = (idx: number) => {
                setSnapshotPanels((prev) =>
                  prev.map((p) => {
                    if (p.nodeId !== panel.nodeId) return p;
                    const newExpanded = new Set(p.expandedSnapshots);
                    if (newExpanded.has(idx)) {
                      newExpanded.delete(idx);
                    } else {
                      newExpanded.add(idx);
                    }
                    return { ...p, expandedSnapshots: newExpanded };
                  })
                );
              };

              return (
                <div
                  key={panel.nodeId}
                  className="fixed rounded-md flex flex-col select-none overflow-y-auto"
                  style={{
                    left: panel.x,
                    top: panel.y,
                    width: "400px",
                    maxHeight: "80vh",
                    background: "rgba(255,255,255,0.98)",
                    border: "1px solid #d0d7de",
                    boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
                    zIndex: 9000 + snapshotPanels.indexOf(panel),
                  }}
                  onMouseDown={() => {
                    setSnapshotPanels((prev) => {
                      const others = prev.filter(
                        (p) => p.nodeId !== panel.nodeId
                      );
                      return [...others, panel];
                    });
                  }}
                >
                  {/* 헤더 */}
                  <div
                    className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0 cursor-move"
                    style={{ borderColor: "#d0d7de" }}
                    onMouseDown={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      e.preventDefault();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startPanelX = panel.x;
                      const startPanelY = panel.y;

                      const handleMouseMove = (moveE: MouseEvent) => {
                        const dx = moveE.clientX - startX;
                        const dy = moveE.clientY - startY;
                        const vw = window.innerWidth;
                        const vh = window.innerHeight;
                        setSnapshotPanels((prev) =>
                          prev.map((p) =>
                            p.nodeId === panel.nodeId
                              ? {
                                  ...p,
                                  x: Math.max(
                                    0,
                                    Math.min(vw - 380, startPanelX + dx)
                                  ),
                                  y: Math.max(
                                    0,
                                    Math.min(vh - 100, startPanelY + dy)
                                  ),
                                }
                              : p
                          )
                        );
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener(
                          "mousemove",
                          handleMouseMove
                        );
                        document.removeEventListener("mouseup", handleMouseUp);
                      };

                      document.addEventListener("mousemove", handleMouseMove);
                      document.addEventListener("mouseup", handleMouseUp);
                    }}
                  >
                    <button
                      className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalNode({
                          id: node.id,
                          name: node.name,
                          domain: node.domain,
                        });
                        setSnapshotPanels([]);
                        setSelectedNode(null);
                      }}
                      title="클릭하여 전체 스냅샷 보기"
                    >
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ background: getDomainColor(node.domain) }}
                      >
                        {node.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <div
                          className="font-semibold text-sm flex items-center gap-1"
                          style={{ color: "#24292f" }}
                        >
                          {node.name}
                          <span style={{ color: "#57606a" }}>
                            ›
                          </span>
                        </div>
                        <div
                          className="text-xs"
                          style={{ color: "#57606a" }}
                        >
                          {personSnapshots.length}개 스냅샷
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSnapshotPanels((prev) =>
                          prev.filter((p) => p.nodeId !== panel.nodeId)
                        );
                        if (selectedNode === panel.nodeId)
                          setSelectedNode(null);
                      }}
                      className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-sm"
                      style={{ color: "#57606a" }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* 필터 토글 - 항상 표시 */}
                  <div
                    className="px-4 py-2 border-b flex-shrink-0"
                    style={{ borderColor: "#d0d7de" }}
                  >
                    <button
                      onClick={() => {
                        setSnapshotPanels((prev) =>
                          prev.map((p) =>
                            p.nodeId === panel.nodeId
                              ? { ...p, showOnlyFeature: !p.showOnlyFeature }
                              : p
                          )
                        );
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors"
                      style={{
                        background: panel.showOnlyFeature
                          ? "rgba(59, 130, 246, 0.1)"
                          : "#f6f8fa",
                        color: panel.showOnlyFeature
                          ? "#3b82f6"
                          : "#57606a",
                      }}
                    >
                      <span className="font-medium">
                        {panel.showOnlyFeature
                          ? `🎯 ${featureName || "현재 영역"}`
                          : "📋 전체 스냅샷"}
                      </span>
                      <span
                        className="px-2 py-0.5 rounded text-sm font-bold"
                        style={{ background: "white" }}
                      >
                        {panel.showOnlyFeature
                          ? items.filter((i) => i.name === node.name).length
                          : (allItems || items).filter(
                              (i) => i.name === node.name
                            ).length}
                      </span>
                    </button>
                  </div>

                  {/* 스냅샷 목록 */}
                  <div className="p-3 space-y-2.5">
                    {personSnapshots.length === 0 ? (
                      <div
                        className="text-center py-6 text-sm"
                        style={{ color: "#57606a" }}
                      >
                        스냅샷이 없습니다.
                      </div>
                    ) : (
                      personSnapshots.map((snapshot, idx) => {
                        const isExpanded = panel.expandedSnapshots.has(idx);
                        const progressColor =
                          snapshot.progressPercent >= 80
                            ? "#22c55e"
                            : snapshot.progressPercent >= 50
                            ? "#3b82f6"
                            : "#f59e0b";
                        return (
                          <div
                            key={idx}
                            className="rounded-lg overflow-hidden transition-all"
                            style={{
                              background: "white",
                              border: "1px solid #d0d7de",
                            }}
                          >
                            <button
                              onClick={() => toggleSnapshotExpand(idx)}
                              className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <span
                                  className="text-xs px-2 py-0.5 rounded flex-shrink-0"
                                  style={{
                                    background: `${getDomainColor(
                                      snapshot.domain
                                    )}20`,
                                    color: getDomainColor(snapshot.domain),
                                  }}
                                >
                                  {snapshot.domain}
                                </span>
                                <span
                                  className="text-sm font-medium truncate"
                                  style={{ color: "#24292f" }}
                                  title={snapshot.topic}
                                >
                                  {snapshot.topic}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                <span
                                  className="text-sm font-bold"
                                  style={{ color: progressColor }}
                                >
                                  {snapshot.progressPercent}%
                                </span>
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className={`transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                  style={{ color: "#57606a" }}
                                >
                                  <polyline points="6 9 12 15 18 9" />
                                </svg>
                              </div>
                            </button>
                            {isExpanded && (
                              <div
                                className="px-3 pb-3 pt-2 border-t"
                                style={{ borderColor: "#d0d7de" }}
                              >
                                <div
                                  className="text-xs mb-2"
                                  style={{ color: "#57606a" }}
                                >
                                  📁 {snapshot.project} /{" "}
                                  {snapshot.module || "—"}
                                </div>
                                <div className="mb-3">
                                  <div
                                    className="h-2 rounded-full overflow-hidden"
                                    style={{
                                      background: "#f6f8fa",
                                    }}
                                  >
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${snapshot.progressPercent}%`,
                                        background: progressColor,
                                      }}
                                    />
                                  </div>
                                </div>
                                {snapshot.progress &&
                                  snapshot.progress.length > 0 && (
                                    <div className="mb-3">
                                      <div
                                        className="text-xs font-medium mb-1.5"
                                        style={{
                                          color: "#57606a",
                                        }}
                                      >
                                        완료
                                      </div>
                                      <ul className="space-y-1">
                                        {snapshot.progress
                                          .slice(0, 3)
                                          .map((p, i) => (
                                            <li
                                              key={i}
                                              className="text-xs flex items-start gap-1.5"
                                              style={{
                                                color:
                                                  "#57606a",
                                              }}
                                            >
                                              <span className="text-green-500 flex-shrink-0">
                                                ✓
                                              </span>
                                              <span className="line-clamp-2">
                                                {p}
                                              </span>
                                            </li>
                                          ))}
                                      </ul>
                                    </div>
                                  )}
                                {snapshot.next && snapshot.next.length > 0 && (
                                  <div>
                                    <div
                                      className="text-xs font-medium mb-1.5"
                                      style={{
                                        color: "#57606a",
                                      }}
                                    >
                                      다음
                                    </div>
                                    <ul className="space-y-1">
                                      {snapshot.next.slice(0, 2).map((n, i) => (
                                        <li
                                          key={i}
                                          className="text-xs flex items-start gap-1.5"
                                          style={{
                                            color:
                                              "#57606a",
                                          }}
                                        >
                                          <span className="text-blue-500 flex-shrink-0">
                                            →
                                          </span>
                                          <span className="line-clamp-2">
                                            {n}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}

            {/* 중앙 모달 */}
            {modalNode && (
              <div
                className="fixed inset-0 flex items-center justify-center"
                style={{
                  background: "rgba(0, 0, 0, 0.3)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  zIndex: 9999,
                }}
                onClick={() => setModalNode(null)}
              >
                <div
                  className="relative w-full max-w-2xl max-h-[80vh] rounded-md flex flex-col animate-scale-in"
                  style={{
                    background: "white",
                    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.25)",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
                    style={{ borderColor: "#d0d7de" }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                        style={{ background: getDomainColor(modalNode.domain) }}
                      >
                        {modalNode.name.charAt(0)}
                      </div>
                      <div>
                        <div
                          className="font-bold text-lg"
                          style={{ color: "#24292f" }}
                        >
                          {modalNode.name}
                        </div>
                        <div
                          className="text-sm"
                          style={{ color: "#57606a" }}
                        >
                          {
                            (allItems || items).filter(
                              (i) => i.name === modalNode.name
                            ).length
                          }
                          개 스냅샷
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalNode(null)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-lg"
                      style={{ color: "#57606a" }}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {(allItems || items)
                        .filter((snapshot) => snapshot.name === modalNode.name)
                        .map((snapshot, idx) => (
                          <ScrumCard
                            key={`${snapshot.topic}-${idx}`}
                            item={snapshot}
                            isCompleted={snapshot.progressPercent >= 100}
                          />
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>,
          document.body
        )}
    </div>
  );
}
