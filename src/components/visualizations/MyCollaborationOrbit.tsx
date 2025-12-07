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
  relation: "pair" | "waiting-on";
  count: number;
  domain: string;
  orbit: "inner" | "middle" | "outer";
  angle: number;
}

export function MyCollaborationOrbit({ items, memberName }: MyCollaborationOrbitProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { orbitNodes, summary } = useMemo(() => {
    const summary = getMemberSummary(items, memberName);
    
    // 멤버 도메인 매핑
    const memberDomains = new Map<string, string>();
    items.forEach((item) => {
      if (!memberDomains.has(item.name)) {
        memberDomains.set(item.name, item.domain);
      }
    });

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

    const orbitNodes: OrbitNode[] = collaborators.map((collab, idx) => {
      const totalCount = collab.pairCount + collab.waitingOnCount;
      const intensity = totalCount / maxCount;

      let orbit: "inner" | "middle" | "outer";
      let relation: "pair" | "waiting-on";

      if (collab.pairCount > collab.waitingOnCount) {
        relation = "pair";
        orbit = intensity >= 0.6 ? "inner" : "middle";
      } else {
        relation = "waiting-on";
        orbit = "outer";
      }

      // 같은 궤도 내에서 각도 분배
      const angle = (2 * Math.PI * idx) / collaborators.length;

      return {
        name: collab.name,
        relation,
        count: totalCount,
        domain: collab.domain,
        orbit,
        angle,
      };
    });

    return { orbitNodes, summary };
  }, [items, memberName]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "var(--notion-text-secondary)";
  };

  const getOrbitRadius = (orbit: "inner" | "middle" | "outer"): number => {
    switch (orbit) {
      case "inner":
        return 70;
      case "middle":
        return 115;
      case "outer":
        return 160;
    }
  };

  const getNodeSize = (count: number): number => {
    const maxCount = Math.max(...orbitNodes.map((n) => n.count), 1);
    return 10 + (count / maxCount) * 10;
  };

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

  const width = 400;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2;

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🌐 협업 궤도
        </h3>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--notion-text-secondary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--notion-blue)" }} />
            Pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "var(--notion-red)" }} />
            Waiting-on
          </span>
        </div>
      </div>

      <div className="relative" style={{ height: 400 }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          {/* 궤도 원 */}
          <circle cx={centerX} cy={centerY} r={70} fill="none" stroke="var(--notion-border)" strokeDasharray="4 4" opacity={0.5} />
          <circle cx={centerX} cy={centerY} r={115} fill="none" stroke="var(--notion-border)" strokeDasharray="4 4" opacity={0.3} />
          <circle cx={centerX} cy={centerY} r={160} fill="none" stroke="var(--notion-border)" strokeDasharray="4 4" opacity={0.2} />

          {/* 연결선 */}
          {orbitNodes.map((node) => {
            const radius = getOrbitRadius(node.orbit);
            const x = centerX + radius * Math.cos(node.angle);
            const y = centerY + radius * Math.sin(node.angle);
            const color = node.relation === "pair" ? "var(--notion-blue)" : "var(--notion-red)";

            return (
              <line
                key={`line-${node.name}`}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke={color}
                strokeWidth={1}
                opacity={hoveredNode === node.name ? 0.8 : 0.2}
              />
            );
          })}

          {/* 중앙 노드 (나) */}
          <g transform={`translate(${centerX},${centerY})`}>
            <circle r={24} fill="var(--notion-text)" />
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--notion-bg)"
              fontSize={10}
              fontWeight={600}
            >
              {memberName.slice(0, 3)}
            </text>
          </g>

          {/* 협업자 노드 */}
          {orbitNodes.map((node) => {
            const radius = getOrbitRadius(node.orbit);
            const x = centerX + radius * Math.cos(node.angle);
            const y = centerY + radius * Math.sin(node.angle);
            const nodeSize = getNodeSize(node.count);
            const color = node.relation === "pair" ? "var(--notion-blue)" : "var(--notion-red)";
            const isHovered = hoveredNode === node.name;

            return (
              <g
                key={node.name}
                transform={`translate(${x},${y})`}
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredNode(node.name)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                <circle
                  r={nodeSize}
                  fill={getDomainColor(node.domain)}
                  stroke={color}
                  strokeWidth={isHovered ? 3 : 2}
                  opacity={isHovered ? 1 : 0.8}
                />
                <text
                  y={nodeSize + 12}
                  textAnchor="middle"
                  fontSize={9}
                  fill="var(--notion-text)"
                  fontWeight={isHovered ? 600 : 400}
                >
                  {node.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* 호버 정보 */}
        {hoveredNode && (
          <div
            className="absolute top-2 right-2 p-2 rounded-lg text-xs"
            style={{
              background: "var(--notion-bg)",
              border: "1px solid var(--notion-border)",
              boxShadow: "var(--notion-shadow-sm)",
            }}
          >
            {(() => {
              const node = orbitNodes.find((n) => n.name === hoveredNode);
              if (!node) return null;
              return (
                <>
                  <div className="font-semibold" style={{ color: "var(--notion-text)" }}>
                    {node.name}
                  </div>
                  <div style={{ color: "var(--notion-text-secondary)" }}>
                    {node.domain} · {node.count}회 협업
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-3 pt-3 grid grid-cols-3 gap-2 text-xs" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="text-center">
          <div className="font-medium" style={{ color: "var(--notion-text)" }}>내부 궤도</div>
          <div style={{ color: "var(--notion-text-secondary)" }}>빈번한 Pair</div>
        </div>
        <div className="text-center">
          <div className="font-medium" style={{ color: "var(--notion-text)" }}>중간 궤도</div>
          <div style={{ color: "var(--notion-text-secondary)" }}>일반 협업</div>
        </div>
        <div className="text-center">
          <div className="font-medium" style={{ color: "var(--notion-text)" }}>외부 궤도</div>
          <div style={{ color: "var(--notion-text-secondary)" }}>Waiting-on</div>
        </div>
      </div>
    </div>
  );
}

