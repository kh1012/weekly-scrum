"use client";

import { useMemo, useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getCollaborationMatrix } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CrossDomainMatrixProps {
  items: ScrumItem[];
}

interface DomainArc {
  domain: string;
  startAngle: number;
  endAngle: number;
  color: string;
  pairOut: number;
  pairIn: number;
  waitingOut: number;
  waitingIn: number;
  total: number;
}

interface FlowRibbon {
  source: string;
  target: string;
  sourceStart: number;
  sourceEnd: number;
  targetStart: number;
  targetEnd: number;
  value: number;
  type: "pair" | "waiting-on";
}

export function CrossDomainMatrix({ items }: CrossDomainMatrixProps) {
  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null);
  const [hoveredRibbon, setHoveredRibbon] = useState<FlowRibbon | null>(null);
  const [selectedType, setSelectedType] = useState<"all" | "pair" | "waiting-on">("all");

  const { domainArcs, flowRibbons, domains } = useMemo(() => {
    const pairData = getCollaborationMatrix(items, "pair");
    const waitingData = getCollaborationMatrix(items, "waiting-on");

    // 도메인 목록
    const domainSet = new Set<string>();
    pairData.forEach((cell) => {
      domainSet.add(cell.sourceDomain);
      domainSet.add(cell.targetDomain);
    });
    const domains = Array.from(domainSet).sort();

    if (domains.length === 0) {
      return { domainArcs: [], flowRibbons: [], domains: [] };
    }

    // 도메인별 통계 계산
    const domainStats = new Map<string, { pairOut: number; pairIn: number; waitingOut: number; waitingIn: number }>();
    domains.forEach((d) => domainStats.set(d, { pairOut: 0, pairIn: 0, waitingOut: 0, waitingIn: 0 }));

    pairData.forEach((cell) => {
      if (cell.sourceDomain !== cell.targetDomain) {
        const source = domainStats.get(cell.sourceDomain)!;
        const target = domainStats.get(cell.targetDomain)!;
        source.pairOut += cell.pairCount;
        target.pairIn += cell.pairCount;
      }
    });

    waitingData.forEach((cell) => {
      if (cell.sourceDomain !== cell.targetDomain) {
        const source = domainStats.get(cell.sourceDomain)!;
        const target = domainStats.get(cell.targetDomain)!;
        source.waitingOut += cell.waitingOnCount;
        target.waitingIn += cell.waitingOnCount;
      }
    });

    // 총량 계산
    const totals = domains.map((d) => {
      const s = domainStats.get(d)!;
      return s.pairOut + s.pairIn + s.waitingOut + s.waitingIn;
    });
    const grandTotal = Math.max(totals.reduce((a, b) => a + b, 0), 1);

    // 각도 할당 (Gap 포함)
    const gapAngle = 0.04; // 도메인 간 간격
    const totalGap = gapAngle * domains.length;
    const availableAngle = 2 * Math.PI - totalGap;

    let currentAngle = -Math.PI / 2;
    const domainArcs: DomainArc[] = domains.map((domain, idx) => {
      const stats = domainStats.get(domain)!;
      const total = totals[idx];
      const arcAngle = Math.max((total / grandTotal) * availableAngle, 0.15); // 최소 크기 보장

      const arc: DomainArc = {
        domain,
        startAngle: currentAngle,
        endAngle: currentAngle + arcAngle,
        color: getDomainColor(domain),
        pairOut: stats.pairOut,
        pairIn: stats.pairIn,
        waitingOut: stats.waitingOut,
        waitingIn: stats.waitingIn,
        total,
      };

      currentAngle += arcAngle + gapAngle;
      return arc;
    });

    // Flow Ribbons 생성
    const flowRibbons: FlowRibbon[] = [];
    const domainCurrentAngle = new Map<string, number>();
    domainArcs.forEach((arc) => domainCurrentAngle.set(arc.domain, arc.startAngle));

    // Pair 리본
    pairData.forEach((cell) => {
      if (cell.sourceDomain === cell.targetDomain || cell.pairCount === 0) return;

      const sourceArc = domainArcs.find((a) => a.domain === cell.sourceDomain)!;
      const targetArc = domainArcs.find((a) => a.domain === cell.targetDomain)!;
      const sourceTotal = sourceArc.total || 1;
      const targetTotal = targetArc.total || 1;

      const sourceAngleSpan = (sourceArc.endAngle - sourceArc.startAngle) * (cell.pairCount / sourceTotal);
      const targetAngleSpan = (targetArc.endAngle - targetArc.startAngle) * (cell.pairCount / targetTotal);

      const sourceStart = domainCurrentAngle.get(cell.sourceDomain)!;
      const targetStart = domainCurrentAngle.get(cell.targetDomain)!;

      flowRibbons.push({
        source: cell.sourceDomain,
        target: cell.targetDomain,
        sourceStart,
        sourceEnd: sourceStart + sourceAngleSpan,
        targetStart,
        targetEnd: targetStart + targetAngleSpan,
        value: cell.pairCount,
        type: "pair",
      });

      domainCurrentAngle.set(cell.sourceDomain, sourceStart + sourceAngleSpan);
      domainCurrentAngle.set(cell.targetDomain, targetStart + targetAngleSpan);
    });

    // Waiting-on 리본
    waitingData.forEach((cell) => {
      if (cell.sourceDomain === cell.targetDomain || cell.waitingOnCount === 0) return;

      const sourceArc = domainArcs.find((a) => a.domain === cell.sourceDomain)!;
      const targetArc = domainArcs.find((a) => a.domain === cell.targetDomain)!;
      const sourceTotal = sourceArc.total || 1;
      const targetTotal = targetArc.total || 1;

      const sourceAngleSpan = (sourceArc.endAngle - sourceArc.startAngle) * (cell.waitingOnCount / sourceTotal);
      const targetAngleSpan = (targetArc.endAngle - targetArc.startAngle) * (cell.waitingOnCount / targetTotal);

      const sourceStart = domainCurrentAngle.get(cell.sourceDomain)!;
      const targetStart = domainCurrentAngle.get(cell.targetDomain)!;

      flowRibbons.push({
        source: cell.sourceDomain,
        target: cell.targetDomain,
        sourceStart,
        sourceEnd: sourceStart + sourceAngleSpan,
        targetStart,
        targetEnd: targetStart + targetAngleSpan,
        value: cell.waitingOnCount,
        type: "waiting-on",
      });

      domainCurrentAngle.set(cell.sourceDomain, sourceStart + sourceAngleSpan);
      domainCurrentAngle.set(cell.targetDomain, targetStart + targetAngleSpan);
    });

    return { domainArcs, flowRibbons, domains };
  }, [items]);

  function getDomainColor(domain: string): string {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  }

  // Arc path 생성
  const createArcPath = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const startInnerX = Math.cos(startAngle) * innerRadius;
    const startInnerY = Math.sin(startAngle) * innerRadius;
    const endInnerX = Math.cos(endAngle) * innerRadius;
    const endInnerY = Math.sin(endAngle) * innerRadius;
    const startOuterX = Math.cos(startAngle) * outerRadius;
    const startOuterY = Math.sin(startAngle) * outerRadius;
    const endOuterX = Math.cos(endAngle) * outerRadius;
    const endOuterY = Math.sin(endAngle) * outerRadius;

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

    return `
      M ${startInnerX} ${startInnerY}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${endInnerX} ${endInnerY}
      L ${endOuterX} ${endOuterY}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${startOuterX} ${startOuterY}
      Z
    `;
  };

  // Ribbon path 생성
  const createRibbonPath = (ribbon: FlowRibbon, radius: number) => {
    const sourceStart = { x: Math.cos(ribbon.sourceStart) * radius, y: Math.sin(ribbon.sourceStart) * radius };
    const sourceEnd = { x: Math.cos(ribbon.sourceEnd) * radius, y: Math.sin(ribbon.sourceEnd) * radius };
    const targetStart = { x: Math.cos(ribbon.targetStart) * radius, y: Math.sin(ribbon.targetStart) * radius };
    const targetEnd = { x: Math.cos(ribbon.targetEnd) * radius, y: Math.sin(ribbon.targetEnd) * radius };

    // 베지어 곡선으로 연결
    return `
      M ${sourceStart.x} ${sourceStart.y}
      Q 0 0 ${targetStart.x} ${targetStart.y}
      A ${radius} ${radius} 0 0 1 ${targetEnd.x} ${targetEnd.y}
      Q 0 0 ${sourceEnd.x} ${sourceEnd.y}
      A ${radius} ${radius} 0 0 1 ${sourceStart.x} ${sourceStart.y}
      Z
    `;
  };

  const filteredRibbons = flowRibbons.filter((r) => {
    if (selectedType === "all") return true;
    return r.type === selectedType;
  });

  if (domains.length === 0) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          🔀 도메인 간 협업 흐름
        </h3>
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          협업 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const size = 500;
  const center = size / 2;
  const outerRadius = 200;
  const innerRadius = 170;
  const ribbonRadius = innerRadius - 5;

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
            🔀 도메인 간 협업 흐름
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--notion-text-secondary)" }}>
            도메인 간의 협업 관계를 시각화합니다
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded" style={{ background: "var(--notion-bg-secondary)" }}>
          {(["all", "pair", "waiting-on"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-3 py-1.5 text-xs rounded transition-all ${selectedType === type ? "font-semibold" : ""}`}
              style={{
                background: selectedType === type ? "var(--notion-bg)" : "transparent",
                color:
                  selectedType === type
                    ? type === "pair"
                      ? "#3b82f6"
                      : type === "waiting-on"
                      ? "#ef4444"
                      : "var(--notion-text)"
                    : "var(--notion-text-secondary)",
                boxShadow: selectedType === type ? "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px" : "none",
              }}
            >
              {type === "all" ? "전체" : type === "pair" ? "Pair" : "Waiting-on"}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          background: "radial-gradient(ellipse at center, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <svg width="100%" height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`translate(${center}, ${center})`}>
            {/* Ribbons (연결선) */}
            {filteredRibbons.map((ribbon, idx) => {
              const isHighlighted =
                !hoveredDomain ||
                ribbon.source === hoveredDomain ||
                ribbon.target === hoveredDomain;
              const isRibbonHovered = hoveredRibbon === ribbon;
              const color = ribbon.type === "pair" ? "#3b82f6" : "#ef4444";

              return (
                <path
                  key={`ribbon-${idx}`}
                  d={createRibbonPath(ribbon, ribbonRadius)}
                  fill={color}
                  fillOpacity={isRibbonHovered ? 0.7 : isHighlighted ? 0.35 : 0.08}
                  stroke={color}
                  strokeWidth={isRibbonHovered ? 2 : 0}
                  style={{ cursor: "pointer", transition: "fill-opacity 0.2s" }}
                  onMouseEnter={() => setHoveredRibbon(ribbon)}
                  onMouseLeave={() => setHoveredRibbon(null)}
                />
              );
            })}

            {/* Domain Arcs */}
            {domainArcs.map((arc) => {
              const isHighlighted = !hoveredDomain || arc.domain === hoveredDomain;
              const midAngle = (arc.startAngle + arc.endAngle) / 2;
              const labelRadius = outerRadius + 25;
              const labelX = Math.cos(midAngle) * labelRadius;
              const labelY = Math.sin(midAngle) * labelRadius;

              return (
                <g key={arc.domain}>
                  {/* Arc */}
                  <path
                    d={createArcPath(arc.startAngle, arc.endAngle, innerRadius, outerRadius)}
                    fill={arc.color}
                    fillOpacity={isHighlighted ? 1 : 0.3}
                    stroke="white"
                    strokeWidth={2}
                    style={{ cursor: "pointer", transition: "fill-opacity 0.2s" }}
                    onMouseEnter={() => setHoveredDomain(arc.domain)}
                    onMouseLeave={() => setHoveredDomain(null)}
                  />
                  {/* Label */}
                  <text
                    x={labelX}
                    y={labelY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fontWeight={600}
                    fill={isHighlighted ? arc.color : "#94a3b8"}
                    style={{ transition: "fill 0.2s", pointerEvents: "none" }}
                  >
                    {arc.domain}
                  </text>
                </g>
              );
            })}

            {/* Center label */}
            <text
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fill="#64748b"
              fontWeight={500}
            >
              {hoveredDomain || (hoveredRibbon ? `${hoveredRibbon.source} → ${hoveredRibbon.target}` : "도메인 협업")}
            </text>
            {(hoveredDomain || hoveredRibbon) && (
              <text
                y={18}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fill="#94a3b8"
              >
                {hoveredDomain
                  ? `${domainArcs.find((a) => a.domain === hoveredDomain)?.total ?? 0}건`
                  : hoveredRibbon
                  ? `${hoveredRibbon.value}건 (${hoveredRibbon.type === "pair" ? "Pair" : "Waiting"})`
                  : ""}
              </text>
            )}
          </g>
        </svg>

        {/* Tooltip */}
        {hoveredRibbon && (
          <div
            className="absolute top-3 right-3 p-3 rounded-lg text-xs"
            style={{
              background: "rgba(255,255,255,0.95)",
              border: "1px solid var(--notion-border)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              backdropFilter: "blur(4px)",
            }}
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className="w-3 h-3 rounded"
                style={{ background: hoveredRibbon.type === "pair" ? "#3b82f6" : "#ef4444" }}
              />
              <span className="font-semibold" style={{ color: "var(--notion-text)" }}>
                {hoveredRibbon.type === "pair" ? "Pair 협업" : "Waiting-on"}
              </span>
            </div>
            <div className="flex items-center gap-2" style={{ color: "var(--notion-text-secondary)" }}>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: getDomainColor(hoveredRibbon.source) }}
              />
              <span>{hoveredRibbon.source}</span>
              <span>→</span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: getDomainColor(hoveredRibbon.target) }}
              />
              <span>{hoveredRibbon.target}</span>
            </div>
            <div
              className="mt-1 text-center font-bold"
              style={{ color: hoveredRibbon.type === "pair" ? "#3b82f6" : "#ef4444" }}
            >
              {hoveredRibbon.value}건
            </div>
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="flex flex-wrap gap-2">
          {domainArcs.map((arc) => (
            <span
              key={arc.domain}
              className="flex items-center gap-1.5 text-xs px-2 py-1 rounded cursor-pointer transition-all"
              style={{
                background: hoveredDomain === arc.domain ? arc.color : "var(--notion-bg-secondary)",
                color: hoveredDomain === arc.domain ? "white" : "var(--notion-text)",
              }}
              onMouseEnter={() => setHoveredDomain(arc.domain)}
              onMouseLeave={() => setHoveredDomain(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: hoveredDomain === arc.domain ? "white" : arc.color }}
              />
              {arc.domain}
              <span className="opacity-60">({arc.total})</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3 text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ background: "rgba(59, 130, 246, 0.5)" }} />
            Pair
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded" style={{ background: "rgba(239, 68, 68, 0.5)" }} />
            Waiting-on
          </span>
        </div>
      </div>
    </div>
  );
}
