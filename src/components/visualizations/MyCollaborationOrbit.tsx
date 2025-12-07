"use client";

import { useMemo, useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getMemberSummary } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface MyCollaborationOrbitProps {
  items: ScrumItem[];
  memberName: string;
}

interface OrbitNode {
  name: string;
  relation: "pair" | "waiting-on" | "both";
  pairCount: number;
  waitingOnCount: number;
  totalCount: number;
  domain: string;
  orbit: "inner" | "middle" | "outer";
  angle: number;
}

export function MyCollaborationOrbit({ items, memberName }: MyCollaborationOrbitProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const { orbitNodes, summary, myDomain } = useMemo(() => {
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
    const collabMap = new Map<string, { name: string; pairCount: number; waitingOnCount: number; domain: string }>();

    // Pair 관계
    for (const item of items.filter((i) => i.name === memberName)) {
      const pairs = item.collaborators?.filter((c) => c.relation === "pair") ?? [];
      for (const p of pairs) {
        const existing = collabMap.get(p.name) ?? { 
          name: p.name, 
          pairCount: 0, 
          waitingOnCount: 0, 
          domain: memberDomains.get(p.name) ?? "Unknown" 
        };
        existing.pairCount++;
        collabMap.set(p.name, existing);
      }
    }

    // Waiting-on 관계 (내가 기다리는)
    for (const item of items.filter((i) => i.name === memberName)) {
      const waitings = item.collaborators?.filter((c) => c.relation === "waiting-on") ?? [];
      for (const w of waitings) {
        const existing = collabMap.get(w.name) ?? { 
          name: w.name, 
          pairCount: 0, 
          waitingOnCount: 0, 
          domain: memberDomains.get(w.name) ?? "Unknown" 
        };
        existing.waitingOnCount++;
        collabMap.set(w.name, existing);
      }
    }

    // Waiting-on 관계 (나를 기다리는)
    for (const item of items) {
      if (item.name === memberName) continue;
      const waitingForMe = item.collaborators?.filter(
        (c) => c.name === memberName && c.relation === "waiting-on"
      );
      if (waitingForMe && waitingForMe.length > 0) {
        const existing = collabMap.get(item.name) ?? { 
          name: item.name, 
          pairCount: 0, 
          waitingOnCount: 0, 
          domain: memberDomains.get(item.name) ?? "Unknown" 
        };
        existing.waitingOnCount += waitingForMe.length;
        collabMap.set(item.name, existing);
      }
    }

    // 궤도 할당
    const collaborators = Array.from(collabMap.values());
    const maxCount = Math.max(...collaborators.map((c) => c.pairCount + c.waitingOnCount), 1);

    // 궤도별로 그룹핑
    const innerNodes: typeof collaborators = [];
    const middleNodes: typeof collaborators = [];
    const outerNodes: typeof collaborators = [];

    collaborators.forEach((collab) => {
      const totalCount = collab.pairCount + collab.waitingOnCount;
      const intensity = totalCount / maxCount;

      if (collab.pairCount > 0 && intensity >= 0.5) {
        innerNodes.push(collab);
      } else if (collab.pairCount > 0) {
        middleNodes.push(collab);
      } else {
        outerNodes.push(collab);
      }
    });

    // 각 궤도 내에서 각도 분배
    const createOrbitNodes = (
      nodes: typeof collaborators,
      orbit: "inner" | "middle" | "outer",
      startAngle: number = -Math.PI / 2
    ): OrbitNode[] => {
      return nodes.map((collab, idx) => {
        const angle = startAngle + (2 * Math.PI * idx) / Math.max(nodes.length, 1);
        const totalCount = collab.pairCount + collab.waitingOnCount;
        
        let relation: "pair" | "waiting-on" | "both";
        if (collab.pairCount > 0 && collab.waitingOnCount > 0) {
          relation = "both";
        } else if (collab.pairCount > 0) {
          relation = "pair";
        } else {
          relation = "waiting-on";
        }

        return {
          name: collab.name,
          relation,
          pairCount: collab.pairCount,
          waitingOnCount: collab.waitingOnCount,
          totalCount,
          domain: collab.domain,
          orbit,
          angle,
        };
      });
    };

    const orbitNodes: OrbitNode[] = [
      ...createOrbitNodes(innerNodes, "inner"),
      ...createOrbitNodes(middleNodes, "middle"),
      ...createOrbitNodes(outerNodes, "outer"),
    ];

    return { orbitNodes, summary, myDomain };
  }, [items, memberName]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  };

  const getOrbitRadius = (orbit: "inner" | "middle" | "outer"): number => {
    switch (orbit) {
      case "inner": return 100;
      case "middle": return 170;
      case "outer": return 240;
    }
  };

  const getNodeRadius = (count: number): number => {
    const maxCount = Math.max(...orbitNodes.map((n) => n.totalCount), 1);
    return 22 + (count / maxCount) * 14;
  };

  const activeNode = selectedNode ?? hoveredNode;

  if (orbitNodes.length === 0) {
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

  const width = 600;
  const height = 550;
  const centerX = width / 2;
  const centerY = height / 2;

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
    const curveOffset = Math.min(dist * 0.15, 25);
    const ctrlX = (startX + endX) / 2 + perpX * curveOffset;
    const ctrlY = (startY + endY) / 2 + perpY * curveOffset;

    return `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
  };

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
            🌐 협업 궤도
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--notion-text-secondary)" }}>
            중심(나)과의 협업 빈도에 따른 거리 배치
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line x1="0" y1="4" x2="16" y2="4" stroke="#3b82f6" strokeWidth="2.5" />
            </svg>
            Pair
          </span>
          <span className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <defs>
                <marker id="orbitArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" />
                </marker>
              </defs>
              <line x1="0" y1="4" x2="12" y2="4" stroke="#ef4444" strokeWidth="2" markerEnd="url(#orbitArrow)" />
            </svg>
            Waiting-on
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
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
          <defs>
            <filter id="orbitShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
            <filter id="orbitGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodOpacity="0.3" />
            </filter>
            <marker id="arrowWaiting" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
              <path d="M0,1 L6,4 L0,7 Z" fill="#ef4444" />
            </marker>
          </defs>

          {/* 궤도 링 */}
          <circle
            cx={centerX}
            cy={centerY}
            r={100}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={1.5}
            strokeDasharray="8 4"
            opacity={0.6}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={170}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="6 4"
            opacity={0.4}
          />
          <circle
            cx={centerX}
            cy={centerY}
            r={240}
            fill="none"
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.3}
          />

          {/* 궤도 레이블 */}
          <text x={centerX + 105} y={centerY - 5} fontSize={9} fill="#94a3b8" fontWeight={500}>
            빈번한 Pair
          </text>
          <text x={centerX + 175} y={centerY - 5} fontSize={9} fill="#94a3b8" fontWeight={500}>
            일반 협업
          </text>
          <text x={centerX + 245} y={centerY - 5} fontSize={9} fill="#94a3b8" fontWeight={500}>
            Waiting
          </text>

          {/* 연결선 */}
          {orbitNodes.map((node) => {
            const orbitRadius = getOrbitRadius(node.orbit);
            const nodeX = centerX + orbitRadius * Math.cos(node.angle);
            const nodeY = centerY + orbitRadius * Math.sin(node.angle);
            const nodeRadius = getNodeRadius(node.totalCount);
            const isActive = activeNode === node.name;
            const opacity = activeNode ? (isActive ? 1 : 0.15) : 0.5;

            // Pair 연결선
            if (node.pairCount > 0) {
              const path = getCurvePath(centerX, centerY, nodeX, nodeY, 35, nodeRadius);
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

            // Waiting-on 연결선
            if (node.waitingOnCount > 0 && node.pairCount === 0) {
              const path = getCurvePath(centerX, centerY, nodeX, nodeY, 35, nodeRadius + 6);
              return (
                <path
                  key={`waiting-line-${node.name}`}
                  d={path}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth={Math.min(node.waitingOnCount + 1, 3)}
                  strokeOpacity={opacity}
                  strokeLinecap="round"
                  markerEnd="url(#arrowWaiting)"
                />
              );
            }

            return null;
          })}

          {/* 중앙 노드 (나) */}
          <g transform={`translate(${centerX},${centerY})`}>
            <circle
              r={35}
              fill={getDomainColor(myDomain)}
              stroke="white"
              strokeWidth={3}
              filter="url(#orbitGlow)"
            />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={12}
              fontWeight={700}
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.3)" }}
            >
              {memberName.length > 5 ? memberName.slice(0, 4) + "…" : memberName}
            </text>
            <text
              y={48}
              textAnchor="middle"
              fill="#64748b"
              fontSize={10}
              fontWeight={600}
            >
              (나)
            </text>
          </g>

          {/* 협업자 노드 */}
          {orbitNodes.map((node) => {
            const orbitRadius = getOrbitRadius(node.orbit);
            const x = centerX + orbitRadius * Math.cos(node.angle);
            const y = centerY + orbitRadius * Math.sin(node.angle);
            const nodeRadius = getNodeRadius(node.totalCount);
            const isActive = activeNode === node.name;
            const opacity = activeNode ? (isActive ? 1 : 0.25) : 1;
            const isBottleneck = node.waitingOnCount >= 2;

            return (
              <g
                key={node.name}
                transform={`translate(${x},${y})`}
                style={{ cursor: "pointer", opacity, transition: "opacity 0.2s" }}
                onMouseEnter={() => setHoveredNode(node.name)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode === node.name ? null : node.name)}
              >
                {/* 병목 표시 */}
                {isBottleneck && (
                  <circle
                    r={nodeRadius + 6}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth={2}
                    strokeDasharray="4 2"
                    opacity={0.7}
                  />
                )}
                {/* 선택 하이라이트 */}
                {isActive && (
                  <circle
                    r={nodeRadius + 4}
                    fill="none"
                    stroke={getDomainColor(node.domain)}
                    strokeWidth={3}
                    opacity={0.5}
                  />
                )}
                {/* 노드 본체 */}
                <circle
                  r={nodeRadius}
                  fill={getDomainColor(node.domain)}
                  stroke="white"
                  strokeWidth={2.5}
                  filter={isActive ? "url(#orbitGlow)" : "url(#orbitShadow)"}
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
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={8}
                      fontWeight={700}
                    >
                      {node.pairCount}
                    </text>
                  </g>
                )}
                {/* Waiting-on 뱃지 */}
                {node.waitingOnCount > 0 && (
                  <g transform={`translate(${-nodeRadius + 3}, ${-nodeRadius + 3})`}>
                    <circle r={9} fill="#ef4444" stroke="white" strokeWidth={1.5} />
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize={8}
                      fontWeight={700}
                    >
                      {node.waitingOnCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* 호버/선택 정보 패널 */}
        {activeNode && (
          <div
            className="absolute top-3 right-3 p-3 rounded-lg text-xs"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid var(--notion-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              backdropFilter: "blur(4px)",
              minWidth: 140,
            }}
          >
            {(() => {
              const node = orbitNodes.find((n) => n.name === activeNode);
              if (!node) return null;
              return (
                <>
                  <div className="font-bold mb-2" style={{ color: "var(--notion-text)" }}>
                    {node.name}
                  </div>
                  <div className="space-y-1" style={{ color: "var(--notion-text-secondary)" }}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ background: getDomainColor(node.domain) }}
                      />
                      {node.domain}
                    </div>
                    {node.pairCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">● Pair: {node.pairCount}건</span>
                      </div>
                    )}
                    {node.waitingOnCount > 0 && (
                      <div className="flex items-center gap-2">
                        <span style={{ color: node.waitingOnCount >= 2 ? "#ef4444" : undefined }}>
                          ● Waiting: {node.waitingOnCount}건
                        </span>
                      </div>
                    )}
                  </div>
                  {selectedNode && (
                    <button
                      onClick={() => setSelectedNode(null)}
                      className="mt-2 w-full text-xs py-1 rounded"
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
      <div className="mt-3 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-blue-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            Pair 수
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-red-500 text-white text-[7px] flex items-center justify-center font-bold">n</span>
            Waiting 수
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 rounded-full border-2 border-dashed border-red-400" />
            병목
          </span>
        </div>
        <div className="text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          중심에 가까울수록 빈번한 협업
        </div>
      </div>
    </div>
  );
}
