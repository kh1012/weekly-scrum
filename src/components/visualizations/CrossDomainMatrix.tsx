"use client";

import { useMemo, useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getCollaborationMatrix } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CrossDomainMatrixProps {
  items: ScrumItem[];
}

// 명확한 색상 팔레트 정의
const INTENSITY_COLORS = {
  pair: {
    0: { bg: "#f8fafc", text: "#cbd5e1" },
    1: { bg: "#dbeafe", text: "#3b82f6" },
    2: { bg: "#93c5fd", text: "#1e40af" },
    3: { bg: "#3b82f6", text: "#ffffff" },
    4: { bg: "#1d4ed8", text: "#ffffff" },
  },
  "waiting-on": {
    0: { bg: "#f8fafc", text: "#cbd5e1" },
    1: { bg: "#fee2e2", text: "#ef4444" },
    2: { bg: "#fca5a5", text: "#b91c1c" },
    3: { bg: "#ef4444", text: "#ffffff" },
    4: { bg: "#dc2626", text: "#ffffff" },
  },
};

export function CrossDomainMatrix({ items }: CrossDomainMatrixProps) {
  const [hoveredCell, setHoveredCell] = useState<{
    source: string;
    target: string;
    type: "pair" | "waiting-on";
  } | null>(null);

  // Pair 데이터
  const pairData = useMemo(() => {
    const data = getCollaborationMatrix(items, "pair");
    const domainSet = new Set<string>();
    data.forEach((cell) => {
      domainSet.add(cell.sourceDomain);
      domainSet.add(cell.targetDomain);
    });
    const domains = Array.from(domainSet).sort();
    const maxValue = Math.max(
      ...data.filter((d) => d.sourceDomain !== d.targetDomain).map((d) => d.pairCount),
      1
    );
    return { data, domains, maxValue };
  }, [items]);

  // Waiting-on 데이터
  const waitingOnData = useMemo(() => {
    const data = getCollaborationMatrix(items, "waiting-on");
    const maxValue = Math.max(
      ...data.filter((d) => d.sourceDomain !== d.targetDomain).map((d) => d.waitingOnCount),
      1
    );
    return { data, maxValue };
  }, [items]);

  // 도메인 목록 (Pair 기준)
  const domains = pairData.domains;

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "#64748b";
  };

  const getCellValue = (
    source: string,
    target: string,
    type: "pair" | "waiting-on"
  ): number => {
    const dataSet = type === "pair" ? pairData.data : waitingOnData.data;
    const cell = dataSet.find(
      (c) => c.sourceDomain === source && c.targetDomain === target
    );
    return type === "pair" ? (cell?.pairCount ?? 0) : (cell?.waitingOnCount ?? 0);
  };

  const getIntensityLevel = (
    value: number,
    maxValue: number
  ): 0 | 1 | 2 | 3 | 4 => {
    if (value === 0) return 0;
    const ratio = value / maxValue;
    if (ratio >= 0.8) return 4;
    if (ratio >= 0.5) return 3;
    if (ratio >= 0.25) return 2;
    return 1;
  };

  const getCellStyle = (
    value: number,
    maxValue: number,
    type: "pair" | "waiting-on",
    isSelf: boolean
  ) => {
    if (isSelf) {
      return { bg: "#e2e8f0", text: "#94a3b8" };
    }
    const level = getIntensityLevel(value, maxValue);
    return INTENSITY_COLORS[type][level];
  };

  // 셀 크기
  const CELL_SIZE = 36;

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

  // 단일 매트릭스 렌더링 컴포넌트
  const renderMatrix = (type: "pair" | "waiting-on") => {
    const maxValue = type === "pair" ? pairData.maxValue : waitingOnData.maxValue;
    const colors = INTENSITY_COLORS[type];
    const title = type === "pair" ? "Pair 협업" : "Waiting-on";
    const titleColor = type === "pair" ? "#3b82f6" : "#ef4444";

    return (
      <div className="flex-1 min-w-0">
        {/* 매트릭스 타이틀 */}
        <div className="flex items-center gap-2 mb-3">
          <span
            className="w-3 h-3 rounded"
            style={{ background: titleColor }}
          />
          <span className="text-sm font-semibold" style={{ color: titleColor }}>
            {title}
          </span>
        </div>

        {/* 매트릭스 Grid */}
        <div className="overflow-x-auto">
          <div
            className="inline-grid gap-px"
            style={{
              gridTemplateColumns: `80px repeat(${domains.length}, ${CELL_SIZE}px)`,
              background: "var(--notion-border)",
              borderRadius: 6,
              overflow: "hidden",
            }}
          >
            {/* 헤더 행 */}
            <div
              className="flex items-end justify-center pb-1 text-[9px] font-medium"
              style={{ background: "var(--notion-bg)", color: "var(--notion-text-muted)", height: 50 }}
            >
              From↓ To→
            </div>
            {domains.map((domain) => (
              <div
                key={`${type}-header-${domain}`}
                className="flex flex-col items-center justify-end pb-1"
                style={{ background: "var(--notion-bg)", height: 50 }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full mb-0.5"
                  style={{ background: getDomainColor(domain) }}
                />
                <span
                  className="text-[9px] font-medium text-center leading-tight"
                  style={{ color: "var(--notion-text-secondary)", maxWidth: CELL_SIZE }}
                >
                  {domain.length > 5 ? domain.slice(0, 4) + "…" : domain}
                </span>
              </div>
            ))}

            {/* 데이터 행 */}
            {domains.map((sourceDomain) => (
              <>
                {/* 행 헤더 */}
                <div
                  key={`${type}-row-${sourceDomain}`}
                  className="flex items-center gap-1.5 px-2"
                  style={{ background: "var(--notion-bg)", height: CELL_SIZE }}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: getDomainColor(sourceDomain) }}
                  />
                  <span
                    className="text-[10px] font-medium truncate"
                    style={{ color: "var(--notion-text)" }}
                  >
                    {sourceDomain}
                  </span>
                </div>

                {/* 셀들 */}
                {domains.map((targetDomain) => {
                  const value = getCellValue(sourceDomain, targetDomain, type);
                  const isSelf = sourceDomain === targetDomain;
                  const style = getCellStyle(value, maxValue, type, isSelf);
                  const isHovered =
                    hoveredCell?.source === sourceDomain &&
                    hoveredCell?.target === targetDomain &&
                    hoveredCell?.type === type;

                  return (
                    <div
                      key={`${type}-${sourceDomain}-${targetDomain}`}
                      className="relative flex items-center justify-center font-semibold transition-all"
                      style={{
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        background: style.bg,
                        color: style.text,
                        fontSize: value >= 10 ? 11 : 12,
                        cursor: isSelf ? "default" : "pointer",
                        transform: isHovered ? "scale(1.1)" : "scale(1)",
                        boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                        zIndex: isHovered ? 10 : 1,
                      }}
                      onMouseEnter={() =>
                        !isSelf && setHoveredCell({ source: sourceDomain, target: targetDomain, type })
                      }
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {isSelf ? "−" : value > 0 ? value : ""}

                      {/* 툴팁 */}
                      {isHovered && !isSelf && (
                        <div
                          className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-[10px] whitespace-nowrap z-20"
                          style={{
                            background: "var(--notion-text)",
                            color: "var(--notion-bg)",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                          }}
                        >
                          {sourceDomain} → {targetDomain}: <strong>{value}건</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        {/* 범례 */}
        <div className="mt-2 flex items-center gap-1.5 text-[10px]">
          <span style={{ color: "var(--notion-text-tertiary)" }}>강도:</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className="w-5 h-5 rounded flex items-center justify-center font-medium"
              style={{
                background: colors[level as 0 | 1 | 2 | 3 | 4].bg,
                color: colors[level as 0 | 1 | 2 | 3 | 4].text,
                fontSize: 9,
              }}
            >
              {level}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="notion-card p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🔀 도메인 간 협업 매트릭스
        </h3>
        <p className="text-xs mt-1" style={{ color: "var(--notion-text-secondary)" }}>
          행(From) → 열(To) 방향으로 협업 관계를 표시합니다
        </p>
      </div>

      {/* 좌우 매트릭스 */}
      <div className="flex gap-6 overflow-x-auto">
        {renderMatrix("pair")}
        <div
          className="w-px self-stretch flex-shrink-0"
          style={{ background: "var(--notion-border)" }}
        />
        {renderMatrix("waiting-on")}
      </div>
    </div>
  );
}
