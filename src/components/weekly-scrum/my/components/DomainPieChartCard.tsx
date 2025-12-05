"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { getDomainColor, getProgressColor } from "@/lib/colorDefines";

interface DomainPieChartCardProps {
  data: { name: string; value: number; color: string }[];
  domainStats: { domain: string; count: number; avgProgress: number }[];
}

export function DomainPieChartCard({ data, domainStats }: DomainPieChartCardProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const selectedStat = selectedDomain ? domainStats.find((d) => d.domain === selectedDomain) : null;

  const handlePieClick = (entry: { name: string }) => {
    setSelectedDomain(entry.name === selectedDomain ? null : entry.name);
  };

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          🏷️ 도메인별 업무 분포
        </h3>
        <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
          클릭하여 상세 보기
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: "var(--notion-text-secondary)", strokeWidth: 1 }}
              onClick={handlePieClick}
              style={{ cursor: "pointer" }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke={entry.name === selectedDomain ? "var(--notion-text)" : "transparent"}
                  strokeWidth={entry.name === selectedDomain ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "var(--notion-bg)",
                border: "1px solid var(--notion-border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value: number) => [`${value}개`, "항목 수"]}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 선택된 도메인 상세 정보 */}
      {selectedStat && (
        <div
          className="mt-3 p-3 rounded-lg animate-fadeIn"
          style={{
            background: "var(--notion-bg-secondary)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  background: getDomainColor(selectedStat.domain).bg,
                  color: getDomainColor(selectedStat.domain).text,
                }}
              >
                {selectedStat.domain}
              </span>
              <button
                onClick={() => setSelectedDomain(null)}
                className="text-xs hover:underline"
                style={{ color: "var(--notion-text-muted)" }}
              >
                닫기
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
                업무 항목
              </div>
              <div className="font-semibold" style={{ color: "var(--notion-text)" }}>
                {selectedStat.count}개
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
                평균 진척률
              </div>
              <div className="font-semibold" style={{ color: getProgressColor(selectedStat.avgProgress) }}>
                {selectedStat.avgProgress}%
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="notion-progress h-2">
              <div
                className="notion-progress-bar"
                style={{
                  width: `${selectedStat.avgProgress}%`,
                  backgroundColor: getProgressColor(selectedStat.avgProgress),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

