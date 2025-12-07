"use client";

import { useMemo, useState } from "react";
import type { ScrumItem, Relation } from "@/types/scrum";
import { getCollaborationMatrix } from "@/lib/collaboration";
import { DOMAIN_COLORS } from "@/lib/colorDefines";

interface CrossDomainMatrixProps {
  items: ScrumItem[];
}

type FilterMode = "both" | "pair" | "waiting-on";

export function CrossDomainMatrix({ items }: CrossDomainMatrixProps) {
  const [filterMode, setFilterMode] = useState<FilterMode>("both");

  const { matrixData, domains, maxValue } = useMemo(() => {
    const relationFilter = filterMode === "both" ? "both" : (filterMode as Relation);
    const data = getCollaborationMatrix(items, relationFilter);
    
    // 도메인 목록 추출
    const domainSet = new Set<string>();
    data.forEach((cell) => {
      domainSet.add(cell.sourceDomain);
      domainSet.add(cell.targetDomain);
    });
    const domains = Array.from(domainSet).sort();

    // 최대값 계산
    const maxValue = Math.max(...data.map((d) => d.totalCount), 1);

    return { matrixData: data, domains, maxValue };
  }, [items, filterMode]);

  const getDomainColor = (domain: string): string => {
    const domainKey = domain as keyof typeof DOMAIN_COLORS;
    return DOMAIN_COLORS[domainKey]?.text ?? "var(--notion-text-secondary)";
  };

  const getCellValue = (source: string, target: string): number => {
    const cell = matrixData.find(
      (c) => c.sourceDomain === source && c.targetDomain === target
    );
    return cell?.totalCount ?? 0;
  };

  const getCellColor = (value: number): string => {
    if (value === 0) return "var(--notion-bg-secondary)";
    const intensity = value / maxValue;
    if (intensity >= 0.8) return "var(--notion-blue)";
    if (intensity >= 0.5) return "rgba(37, 99, 235, 0.7)";
    if (intensity >= 0.2) return "rgba(37, 99, 235, 0.4)";
    return "rgba(37, 99, 235, 0.2)";
  };

  const getTextColor = (value: number): string => {
    if (value === 0) return "var(--notion-text-tertiary)";
    const intensity = value / maxValue;
    return intensity >= 0.5 ? "white" : "var(--notion-text)";
  };

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
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🔀 도메인 간 협업 매트릭스
        </h3>
        <div className="flex items-center gap-1 p-0.5 rounded" style={{ background: "var(--notion-bg-secondary)" }}>
          <button
            onClick={() => setFilterMode("both")}
            className={`px-2 py-1 text-xs rounded transition-all ${filterMode === "both" ? "font-medium" : ""}`}
            style={{
              background: filterMode === "both" ? "var(--notion-bg)" : "transparent",
              color: filterMode === "both" ? "var(--notion-text)" : "var(--notion-text-secondary)",
              boxShadow: filterMode === "both" ? "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px" : "none",
            }}
          >
            전체
          </button>
          <button
            onClick={() => setFilterMode("pair")}
            className={`px-2 py-1 text-xs rounded transition-all ${filterMode === "pair" ? "font-medium" : ""}`}
            style={{
              background: filterMode === "pair" ? "var(--notion-bg)" : "transparent",
              color: filterMode === "pair" ? "var(--notion-blue)" : "var(--notion-text-secondary)",
              boxShadow: filterMode === "pair" ? "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px" : "none",
            }}
          >
            Pair
          </button>
          <button
            onClick={() => setFilterMode("waiting-on")}
            className={`px-2 py-1 text-xs rounded transition-all ${filterMode === "waiting-on" ? "font-medium" : ""}`}
            style={{
              background: filterMode === "waiting-on" ? "var(--notion-bg)" : "transparent",
              color: filterMode === "waiting-on" ? "var(--notion-red)" : "var(--notion-text-secondary)",
              boxShadow: filterMode === "waiting-on" ? "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px" : "none",
            }}
          >
            Waiting-on
          </button>
        </div>
      </div>

      {/* 매트릭스 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left" style={{ color: "var(--notion-text-secondary)" }}>
                From ↓ / To →
              </th>
              {domains.map((domain) => (
                <th key={domain} className="p-2 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: getDomainColor(domain) }}
                    />
                    <span style={{ color: "var(--notion-text-secondary)" }}>
                      {domain.length > 8 ? domain.slice(0, 8) + "…" : domain}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domains.map((sourceDomain) => (
              <tr key={sourceDomain}>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: getDomainColor(sourceDomain) }}
                    />
                    <span style={{ color: "var(--notion-text)" }}>
                      {sourceDomain}
                    </span>
                  </div>
                </td>
                {domains.map((targetDomain) => {
                  const value = getCellValue(sourceDomain, targetDomain);
                  const isSelf = sourceDomain === targetDomain;
                  return (
                    <td key={targetDomain} className="p-1">
                      <div
                        className="w-full aspect-square flex items-center justify-center rounded text-xs font-medium"
                        style={{
                          background: isSelf ? "var(--notion-bg-tertiary)" : getCellColor(value),
                          color: isSelf ? "var(--notion-text-tertiary)" : getTextColor(value),
                          minWidth: 32,
                          minHeight: 32,
                        }}
                        title={`${sourceDomain} → ${targetDomain}: ${value}건`}
                      >
                        {isSelf ? "-" : value || ""}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 범례 */}
      <div className="mt-3 pt-3 flex items-center justify-between text-xs" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div style={{ color: "var(--notion-text-secondary)" }}>
          행: 협업을 시작한 도메인 / 열: 협업 대상 도메인
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--notion-text-tertiary)" }}>낮음</span>
          <div className="flex gap-0.5">
            <span className="w-3 h-3 rounded" style={{ background: "rgba(37, 99, 235, 0.2)" }} />
            <span className="w-3 h-3 rounded" style={{ background: "rgba(37, 99, 235, 0.4)" }} />
            <span className="w-3 h-3 rounded" style={{ background: "rgba(37, 99, 235, 0.7)" }} />
            <span className="w-3 h-3 rounded" style={{ background: "var(--notion-blue)" }} />
          </div>
          <span style={{ color: "var(--notion-text-tertiary)" }}>높음</span>
        </div>
      </div>
    </div>
  );
}

