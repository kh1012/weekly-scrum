"use client";

import { useMemo, useState } from "react";
import type { ScrumItem, Relation } from "@/types/scrum";
import { getCollaborationMatrix } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CrossDomainMatrixProps {
  items: ScrumItem[];
}

type FilterMode = "both" | "pair" | "waiting-on";

// 명확한 색상 팔레트 정의
const INTENSITY_COLORS = {
  pair: {
    0: { bg: "#f1f5f9", text: "#94a3b8" },
    1: { bg: "#dbeafe", text: "#3b82f6" },
    2: { bg: "#93c5fd", text: "#1e40af" },
    3: { bg: "#3b82f6", text: "#ffffff" },
    4: { bg: "#1d4ed8", text: "#ffffff" },
  },
  "waiting-on": {
    0: { bg: "#f1f5f9", text: "#94a3b8" },
    1: { bg: "#fee2e2", text: "#ef4444" },
    2: { bg: "#fca5a5", text: "#b91c1c" },
    3: { bg: "#ef4444", text: "#ffffff" },
    4: { bg: "#dc2626", text: "#ffffff" },
  },
  both: {
    0: { bg: "#f1f5f9", text: "#94a3b8" },
    1: { bg: "#e0e7ff", text: "#6366f1" },
    2: { bg: "#a5b4fc", text: "#4338ca" },
    3: { bg: "#6366f1", text: "#ffffff" },
    4: { bg: "#4f46e5", text: "#ffffff" },
  },
};

export function CrossDomainMatrix({ items }: CrossDomainMatrixProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("both");
  const [hoveredCell, setHoveredCell] = useState<{ source: string; target: string } | null>(null);

  const { matrixData, domains, maxValue, domainTotals } = useMemo(() => {
    const relationFilter = filterMode === "both" ? "both" : (filterMode as Relation);
    const data = getCollaborationMatrix(items, relationFilter);
    
    // 도메인 목록 추출
    const domainSet = new Set<string>();
    data.forEach((cell) => {
      domainSet.add(cell.sourceDomain);
      domainSet.add(cell.targetDomain);
    });
    const domains = Array.from(domainSet).sort();

    // 최대값 계산 (자기 도메인 제외)
    const maxValue = Math.max(
      ...data.filter((d) => d.sourceDomain !== d.targetDomain).map((d) => d.totalCount),
      1
    );

    // 도메인별 총 협업 수 계산
    const domainTotals = new Map<string, { outbound: number; inbound: number }>();
    domains.forEach((domain) => {
      const outbound = data
        .filter((d) => d.sourceDomain === domain && d.sourceDomain !== d.targetDomain)
        .reduce((sum, d) => sum + d.totalCount, 0);
      const inbound = data
        .filter((d) => d.targetDomain === domain && d.sourceDomain !== d.targetDomain)
        .reduce((sum, d) => sum + d.totalCount, 0);
      domainTotals.set(domain, { outbound, inbound });
    });

    return { matrixData: data, domains, maxValue, domainTotals };
  }, [items, filterMode]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  };

  const getCellValue = (source: string, target: string): number => {
    const cell = matrixData.find(
      (c) => c.sourceDomain === source && c.targetDomain === target
    );
    return cell?.totalCount ?? 0;
  };

  const getIntensityLevel = (value: number): 0 | 1 | 2 | 3 | 4 => {
    if (value === 0) return 0;
    const ratio = value / maxValue;
    if (ratio >= 0.8) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  };

  const getCellStyle = (value: number, isSelf: boolean) => {
    if (isSelf) {
      return { bg: "#e2e8f0", text: "#94a3b8" };
    }
    const level = getIntensityLevel(value);
    return INTENSITY_COLORS[filterMode][level];
  };

  // 고정 셀 크기
  const CELL_SIZE = 48;

  if (domains.length === 0) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          🔀 도메인 간 협업 매트릭스
        </h3>
        <div className="flex items-center justify-center h-32 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          협업 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
            🔀 도메인 간 협업 매트릭스
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--notion-text-secondary)" }}>
            행(From) → 열(To) 방향으로 협업 관계를 표시합니다
          </p>
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded" style={{ background: "var(--notion-bg-secondary)" }}>
          {(["both", "pair", "waiting-on"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1.5 text-xs rounded transition-all ${filterMode === mode ? "font-semibold" : ""}`}
              style={{
                background: filterMode === mode ? "var(--notion-bg)" : "transparent",
                color:
                  filterMode === mode
                    ? mode === "pair"
                      ? "#3b82f6"
                      : mode === "waiting-on"
                      ? "#ef4444"
                      : "var(--notion-text)"
                    : "var(--notion-text-secondary)",
                boxShadow: filterMode === mode ? "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px" : "none",
              }}
            >
              {mode === "both" ? "전체" : mode === "pair" ? "Pair" : "Waiting-on"}
            </button>
          ))}
        </div>
      </div>

      {/* 매트릭스 Grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-1"
          style={{
            gridTemplateColumns: `120px repeat(${domains.length}, ${CELL_SIZE}px) 60px`,
          }}
        >
          {/* 헤더 행 */}
          <div className="flex items-end justify-end pr-2 pb-1 text-xs font-medium" style={{ color: "var(--notion-text-muted)" }}>
            From ↓ / To →
          </div>
          {domains.map((domain) => (
            <div
              key={domain}
              className="flex flex-col items-center justify-end pb-1"
              style={{ height: 60 }}
            >
              <span
                className="w-3 h-3 rounded-full mb-1"
                style={{ background: getDomainColor(domain) }}
              />
              <span
                className="text-[10px] font-medium text-center leading-tight"
                style={{ color: "var(--notion-text-secondary)", maxWidth: CELL_SIZE }}
              >
                {domain.length > 6 ? domain.slice(0, 5) + "…" : domain}
              </span>
            </div>
          ))}
          <div className="flex items-end justify-center pb-1 text-[10px] font-semibold" style={{ color: "var(--notion-text-muted)" }}>
            OUT
          </div>

          {/* 데이터 행 */}
          {domains.map((sourceDomain) => (
            <>
              {/* 행 헤더 */}
              <div key={`row-${sourceDomain}`} className="flex items-center gap-2 pr-2">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: getDomainColor(sourceDomain) }}
                />
                <span className="text-xs font-medium truncate" style={{ color: "var(--notion-text)" }}>
                  {sourceDomain}
                </span>
              </div>
              
              {/* 셀들 */}
              {domains.map((targetDomain) => {
                const value = getCellValue(sourceDomain, targetDomain);
                const isSelf = sourceDomain === targetDomain;
                const style = getCellStyle(value, isSelf);
                const isHovered =
                  hoveredCell?.source === sourceDomain && hoveredCell?.target === targetDomain;

                return (
                  <div
                    key={`${sourceDomain}-${targetDomain}`}
                    className="relative flex items-center justify-center rounded-md font-semibold transition-all"
                    style={{
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      background: style.bg,
                      color: style.text,
                      fontSize: isSelf ? 16 : value >= 10 ? 14 : 16,
                      cursor: isSelf ? "default" : "pointer",
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                      boxShadow: isHovered
                        ? "0 4px 12px rgba(0,0,0,0.15)"
                        : "inset 0 0 0 1px rgba(0,0,0,0.06)",
                      zIndex: isHovered ? 10 : 1,
                    }}
                    onMouseEnter={() => !isSelf && setHoveredCell({ source: sourceDomain, target: targetDomain })}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {isSelf ? "−" : value > 0 ? value : ""}
                    
                    {/* 툴팁 */}
                    {isHovered && !isSelf && (
                      <div
                        className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1.5 rounded-md text-xs whitespace-nowrap z-20"
                        style={{
                          background: "var(--notion-text)",
                          color: "var(--notion-bg)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        }}
                      >
                        <strong>{sourceDomain}</strong> → <strong>{targetDomain}</strong>
                        <div className="font-bold text-center">{value}건</div>
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* 행 총계 (Outbound) */}
              <div
                className="flex items-center justify-center text-xs font-bold rounded"
                style={{
                  background: "var(--notion-bg-tertiary)",
                  color: "var(--notion-text-secondary)",
                }}
              >
                {domainTotals.get(sourceDomain)?.outbound ?? 0}
              </div>
            </>
          ))}

          {/* 열 총계 행 (Inbound) */}
          <div className="flex items-center justify-end pr-2 text-[10px] font-semibold" style={{ color: "var(--notion-text-muted)" }}>
            IN
          </div>
          {domains.map((domain) => (
            <div
              key={`col-total-${domain}`}
              className="flex items-center justify-center text-xs font-bold rounded"
              style={{
                height: 32,
                background: "var(--notion-bg-tertiary)",
                color: "var(--notion-text-secondary)",
              }}
            >
              {domainTotals.get(domain)?.inbound ?? 0}
            </div>
          ))}
          <div />
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-4 pt-3 flex items-center justify-between" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="flex items-center gap-4 text-xs">
          <span style={{ color: "var(--notion-text-secondary)" }}>협업 강도:</span>
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-medium"
                style={{
                  background: INTENSITY_COLORS[filterMode][level as 0 | 1 | 2 | 3 | 4].bg,
                  color: INTENSITY_COLORS[filterMode][level as 0 | 1 | 2 | 3 | 4].text,
                }}
              >
                {level === 0 ? "0" : level}
              </div>
            ))}
          </div>
          <span className="text-[10px]" style={{ color: "var(--notion-text-tertiary)" }}>
            (낮음 → 높음)
          </span>
        </div>
        <div className="text-xs" style={{ color: "var(--notion-text-tertiary)" }}>
          OUT: 협업 요청 / IN: 협업 수신
        </div>
      </div>
    </div>
  );
}

