"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getMemberSummary } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface MyCollaborationOrbitProps {
  items: ScrumItem[];
  memberName: string;
}

interface OrbitNode {
  name: string;
  relation: "pair" | "pre" | "both";
  pairCount: number;
  preCount: number;
  totalCount: number;
  domain: string;
  orbit: "inner" | "middle" | "outer";
  angle: number;
  x: number;
  y: number;
}

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;
const CENTER_X = CANVAS_WIDTH / 2;
const CENTER_Y = CANVAS_HEIGHT / 2;

export function MyCollaborationOrbit({ items, memberName }: MyCollaborationOrbitProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [nodePositions, setNodePositions] = useState<OrbitNode[]>([]);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const { initialNodes, myDomain } = useMemo(() => {
    const summary = getMemberSummary(items, memberName);
    
    // 멤버 도메인 매핑
    const memberDomains = new Map<string, string>();
    items.forEach((item) => {
      if (!memberDomains.has(item.name)) {
        memberDomains.set(item.name, item.domain);
      }
    });

    const myDomain = memberDomains.get(memberName) ?? "Unknown";

    // 협업자별 빈도와 관계 수집
    const collabMap = new Map<string, { name: string; pairCount: number; preCount: number; domain: string }>();

    // Pair 관계
    for (const item of items.filter((i) => i.name === memberName)) {
      const pairs = item.collaborators?.filter((c) => c.relation === "pair") ?? [];
      for (const p of pairs) {
        const existing = collabMap.get(p.name) ?? { 
          name: p.name, 
          pairCount: 0, 
          preCount: 0, 
          domain: memberDomains.get(p.name) ?? "Unknown" 
        };
        existing.pairCount++;
        collabMap.set(p.name, existing);
      }
    }

    // Pre 관계 (내가 기다리는)
    for (const item of items.filter((i) => i.name === memberName)) {
      const pres = item.collaborators?.filter((c) => c.relation === "pre") ?? [];
      for (const w of pres) {
        const existing = collabMap.get(w.name) ?? { 
          name: w.name, 
          pairCount: 0, 
          preCount: 0, 
          domain: memberDomains.get(w.name) ?? "Unknown" 
        };
        existing.preCount++;
        collabMap.set(w.name, existing);
      }
    }

    // Pre 관계 (나를 기다리는)
    for (const item of items) {
      if (item.name === memberName) continue;
      const waitingForMe = item.collaborators?.filter(
        (c) => c.name === memberName && c.relation === "pre"
      );
      if (waitingForMe && waitingForMe.length > 0) {
        const existing = collabMap.get(item.name) ?? { 
          name: item.name, 
          pairCount: 0, 
          preCount: 0, 
          domain: memberDomains.get(item.name) ?? "Unknown" 
        };
        existing.preCount += waitingForMe.length;
        collabMap.set(item.name, existing);
      }
    }

    // 궤도 할당
    const collaborators = Array.from(collabMap.values());
    const maxCount = Math.max(...collaborators.map((c) => c.pairCount + c.preCount), 1);

    // 궤도별로 그룹핑
    const innerNodes: typeof collaborators = [];
    const middleNodes: typeof collaborators = [];
    const outerNodes: typeof collaborators = [];

    collaborators.forEach((collab) => {
      const totalCount = collab.pairCount + collab.preCount;
      const intensity = totalCount / maxCount;

      if (collab.pairCount > 0 && intensity >= 0.5) {
        innerNodes.push(collab);
      } else if (collab.pairCount > 0) {
        middleNodes.push(collab);
      } else {
        outerNodes.push(collab);
      }
    });

    const getOrbitRadius = (orbit: "inner" | "middle" | "outer"): number => {
      switch (orbit) {
        case "inner": return 90;
        case "middle": return 150;
        case "outer": return 210;
      }
    };

    // 각 궤도 내에서 각도 분배
    const createOrbitNodes = (
      nodes: typeof collaborators,
      orbit: "inner" | "middle" | "outer",
      startAngle: number = -Math.PI / 2
    ): OrbitNode[] => {
      const orbitRadius = getOrbitRadius(orbit);
      return nodes.map((collab, idx) => {
        const angle = startAngle + (2 * Math.PI * idx) / Math.max(nodes.length, 1);
        const totalCount = collab.pairCount + collab.preCount;
        
        let relation: "pair" | "pre" | "both";
        if (collab.pairCount > 0 && collab.preCount > 0) {
          relation = "both";
        } else if (collab.pairCount > 0) {
          relation = "pair";
        } else {
          relation = "pre";
        }

        return {
          name: collab.name,
          relation,
          pairCount: collab.pairCount,
          preCount: collab.preCount,
          totalCount,
          domain: collab.domain,
          orbit,
          angle,
          x: CENTER_X + orbitRadius * Math.cos(angle),
          y: CENTER_Y + orbitRadius * Math.sin(angle),
        };
      });
    };

    const initialNodes: OrbitNode[] = [
      ...createOrbitNodes(innerNodes, "inner"),
      ...createOrbitNodes(middleNodes, "middle"),
      ...createOrbitNodes(outerNodes, "outer"),
    ];

    return { initialNodes, myDomain };
  }, [items, memberName]);

  // 초기 노드 위치 설정
  useEffect(() => {
    setNodePositions(initialNodes);
  }, [initialNodes]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  };

  const getNodeRadius = (count: number): number => {
    const maxCount = Math.max(...nodePositions.map((n) => n.totalCount), 1);
    return 22 + (count / maxCount) * 12;
  };

  // 드래그 핸들러
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeName: string) => {
    e.preventDefault();
    e.stopPropagation();
    const node = nodePositions.find((n) => n.name === nodeName);
    if (!node) return;

    const svgRect = (e.currentTarget as SVGElement).closest("svg")?.getBoundingClientRect();
    if (!svgRect) return;

    setDraggingNode(nodeName);
    const scaleX = CANVAS_WIDTH / svgRect.width;
    const scaleY = CANVAS_HEIGHT / svgRect.height;
    setDragOffset({
      x: (e.clientX - svgRect.left) * scaleX - node.x,
      y: (e.clientY - svgRect.top) * scaleY - node.y,
    });
  }, [nodePositions]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingNode) return;

    const svgRect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / svgRect.width;
    const scaleY = CANVAS_HEIGHT / svgRect.height;
    const newX = (e.clientX - svgRect.left) * scaleX - dragOffset.x;
    const newY = (e.clientY - svgRect.top) * scaleY - dragOffset.y;

    setNodePositions((prev) =>
      prev.map((node) =>
        node.name === draggingNode
          ? { ...node, x: newX, y: newY }
          : node
      )
    );
  }, [draggingNode, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setDraggingNode(null);
  }, []);

  // 휠 확대/축소
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(0.5, Math.min(2, prev + delta)));
  }, []);

  // 곡선 경로 계산
  const getCurvePath = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    fromRadius: number,
    toRadius: number
  ) => {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return "";

    const startX = fromX + (dx / dist) * fromRadius;
    const startY = fromY + (dy / dist) * fromRadius;
    const endX = toX - (dx / dist) * toRadius;
    const endY = toY - (dy / dist) * toRadius;

    // 곡선 제어점
    const perpX = -dy / dist;
    const perpY = dx / dist;
    const curveOffset = Math.min(dist * 0.12, 20);
    const ctrlX = (startX + endX) / 2 + perpX * curveOffset;
    const ctrlY = (startY + endY) / 2 + perpY * curveOffset;

    return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  };

  const activeNode = selectedNode ?? hoveredNode;

  // viewBox 계산 (줌 적용)
  const viewBoxWidth = CANVAS_WIDTH / zoom;
  const viewBoxHeight = CANVAS_HEIGHT / zoom;
  const viewBoxX = (CANVAS_WIDTH - viewBoxWidth) / 2;
  const viewBoxY = (CANVAS_HEIGHT - viewBoxHeight) / 2;

  if (nodePositions.length === 0) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          🌐 협업 궤도
        </h3>
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          협업 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
            🌐 협업 궤도
          </h3>
          <p className="text-[10px] sm:text-xs mt-0.5" style={{ color: "var(--notion-text-secondary)" }}>
            중심(나)과의 협업 빈도에 따른 거리 배치
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] sm:text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-blue-500 rounded" />
            Pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-red-500 rounded" />
            →Pre
          </span>
        </div>
      </div>

      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at center, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <svg
          width="100%"
          className="h-[300px] sm:h-[380px] md:h-[420px]"
          viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ cursor: draggingNode ? "grabbing" : "default" }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <defs>
            <filter id="orbitShadow2" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="orbitGlow2" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodOpacity="0.3" />
            </filter>
            <marker id="arrowPre2" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#ef4444" />
            </marker>
          </defs>

          {/* 궤도 링 */}
          <circle cx={CENTER_X} cy={CENTER_Y} r={90} fill="none" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="8 4" opacity={0.6} />
          <circle cx={CENTER_X} cy={CENTER_Y} r={150} fill="none" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="6 4" opacity={0.4} />
          <circle cx={CENTER_X} cy={CENTER_Y} r={210} fill="none" stroke="#cbd5e1" strokeWidth={1} strokeDasharray="4 4" opacity={0.3} />

          {/* 궤도 레이블 */}
          <text x={CENTER_X + 95} y={CENTER_Y - 5} fontSize={9} fill="#94a3b8" fontWeight={500}>빈번한 Pair</text>
          <text x={CENTER_X + 155} y={CENTER_Y - 5} fontSize={9} fill="#94a3b8" fontWeight={500}>일반 협업</text>
          <text x={CENTER_X + 215} y={CENTER_Y - 5} fontSize={9} fill="#94a3b8" fontWeight={500}>Pre</text>

          {/* 연결선 */}
          {nodePositions.map((node) => {
            const nodeRadius = getNodeRadius(node.totalCount);
            const isActive = activeNode === node.name;
            const hasActive = !!activeNode;
            const opacity = hasActive ? (isActive ? 1 : 0.12) : 0.5;

            if (node.pairCount > 0) {
              const path = getCurvePath(CENTER_X, CENTER_Y, node.x, node.y, 32, nodeRadius);
              return (
                <path
                  key={`pair-line-${node.name}`}
                  d={path}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={Math.min(node.pairCount + 1.5, 4)}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                />
              );
            }

            if (node.preCount > 0 && node.pairCount === 0) {
              const path = getCurvePath(CENTER_X, CENTER_Y, node.x, node.y, 32, nodeRadius + 6);
              return (
                <path
                  key={`pre-line-${node.name}`}
                  d={path}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={Math.min(node.preCount + 1, 3)}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                  markerEnd="url(#arrowPre2)"
                />
              );
            }

            return null;
          })}

          {/* 중앙 노드 (나) */}
          <g transform={`translate(${CENTER_X},${CENTER_Y})`}>
            <circle r={32} fill={getDomainColor(myDomain)} stroke="white" strokeWidth={3} filter="url(#orbitGlow2)" />
            <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={11} fontWeight={700} style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}>
              {memberName.length > 5 ? memberName.slice(0, 4) + "…" : memberName}
            </text>
            <text y={45} textAnchor="middle" fill="#64748b" fontSize={10} fontWeight={600}>(나)</text>
          </g>

          {/* 협업자 노드 */}
          {nodePositions.map((node) => {
            const nodeRadius = getNodeRadius(node.totalCount);
            const isActive = activeNode === node.name;
            const hasActive = !!activeNode;
            const opacity = hasActive ? (isActive ? 1 : 0.2) : 1;
            const isBottleneck = node.preCount >= 2;
            const isDragging = draggingNode === node.name;

            return (
              <g
                key={node.name}
                transform={`translate(${node.x},${node.y})`}
                style={{
                  cursor: isDragging ? "grabbing" : "grab",
                  opacity,
                  transition: isDragging ? "none" : "opacity 0.2s",
                }}
                onMouseDown={(e) => handleMouseDown(e, node.name)}
                onMouseEnter={() => !draggingNode && setHoveredNode(node.name)}
                onMouseLeave={() => !draggingNode && setHoveredNode(null)}
                onClick={(e) => {
                  if (!draggingNode) {
                    e.stopPropagation();
                    setSelectedNode(selectedNode === node.name ? null : node.name);
                  }
                }}
              >
                {/* 병목 표시 */}
                {isBottleneck && (
                  <circle r={nodeRadius + 6} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" opacity={0.7} />
                )}
                {/* 선택 하이라이트 */}
                {isActive && (
                  <circle r={nodeRadius + 4} fill="none" stroke={getDomainColor(node.domain)} strokeWidth={3} opacity={0.5} />
                )}
                {/* 노드 본체 */}
                <circle
                  r={nodeRadius}
                  fill={getDomainColor(node.domain)}
                  stroke="white"
                  strokeWidth={2.5}
                  filter={isActive ? "url(#orbitGlow2)" : "url(#orbitShadow2)"}
                />
                {/* 노드 내 이름 */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="white"
                  fontSize={nodeRadius > 28 ? 10 : 9}
                  fontWeight={600}
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)", pointerEvents: "none" }}
                >
                  {node.name.length > 4 ? node.name.slice(0, 3) + "…" : node.name}
                </text>
                {/* Pair 뱃지 */}
                {node.pairCount > 0 && (
                  <g transform={`translate(${nodeRadius - 3}, ${-nodeRadius + 3})`}>
                    <circle r={9} fill="#3b82f6" stroke="white" strokeWidth={1.5} />
                    <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={8} fontWeight={700}>
                      {node.pairCount}
                    </text>
                  </g>
                )}
                {/* Pre 뱃지 */}
                {node.preCount > 0 && (
                  <g transform={`translate(${-nodeRadius + 3}, ${-nodeRadius + 3})`}>
                    <circle r={9} fill="#ef4444" stroke="white" strokeWidth={1.5} />
                    <text textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={8} fontWeight={700}>
                      {node.preCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* 줌 컨트롤 */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1" style={{ zIndex: 10 }}>
          <button
            onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.2))}
            className="w-6 sm:w-7 h-6 sm:h-7 flex items-center justify-center rounded text-xs sm:text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text)" }}
          >
            −
          </button>
          <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded" style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text)" }}>
            {Math.round(zoom * 100)}%
          </div>
          <button
            onClick={() => setZoom((prev) => Math.min(2, prev + 0.2))}
            className="w-6 sm:w-7 h-6 sm:h-7 flex items-center justify-center rounded text-xs sm:text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text)" }}
          >
            +
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setNodePositions(initialNodes);
            }}
            className="ml-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs rounded"
            style={{ background: "rgba(255,255,255,0.9)", color: "var(--notion-text-secondary)" }}
          >
            리셋
          </button>
        </div>

        {/* 안내 */}
        <div className="absolute bottom-2 right-2 text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" style={{ background: "rgba(0,0,0,0.5)", color: "white" }}>
          드래그: 이동 / 휠: 확대
        </div>

        {/* 호버/선택 정보 패널 */}
        {activeNode && (
          <div
            className="absolute top-2 right-2 p-2 sm:p-3 rounded-lg text-[10px] sm:text-xs max-w-[120px] sm:max-w-[160px]"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid var(--notion-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              backdropFilter: "blur(4px)",
            }}
          >
            {(() => {
              const node = nodePositions.find((n) => n.name === activeNode);
              if (!node) return null;
              return (
                <>
                  <div className="font-bold mb-1.5 truncate" style={{ color: "var(--notion-text)" }}>
                    {node.name}
                  </div>
                  <div className="space-y-0.5" style={{ color: "var(--notion-text-secondary)" }}>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full" style={{ background: getDomainColor(node.domain) }} />
                      {node.domain}
                    </div>
                    {node.pairCount > 0 && (
                      <div className="text-blue-500">Pair: {node.pairCount}건</div>
                    )}
                    {node.preCount > 0 && (
                      <div style={{ color: node.preCount >= 2 ? "#ef4444" : undefined }}>
                        Pre: {node.preCount}건
                      </div>
                    )}
                  </div>
                  {selectedNode && (
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="mt-1.5 w-full text-[10px] py-0.5 rounded"
                      style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text-secondary)" }}
                    >
                      선택 해제
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-3 pt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            Pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            선행
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-red-400" />
            병목
          </span>
        </div>
        <div className="text-[9px] sm:text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          중심에 가까울수록 빈번한 협업
        </div>
      </div>
    </div>
  );
}
