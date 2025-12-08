"use client";

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ScrumItem } from "@/types/scrum";
import { getMemberSummary } from "@/lib/collaboration";

interface MyCollaborationRadarProps {
  items: ScrumItem[];
  memberName: string;
}

export function MyCollaborationRadar({ items, memberName }: MyCollaborationRadarProps) {
  const { radarData, summary } = useMemo(() => {
    const summary = getMemberSummary(items, memberName);

    // 최대값 계산 (정규화용)
    const allSummaries = Array.from(new Set(items.map((i) => i.name))).map((name) =>
      getMemberSummary(items, name)
    );

    const maxPair = Math.max(...allSummaries.map((s) => s.pairCount), 1);
    const maxOutbound = Math.max(...allSummaries.map((s) => s.preCount), 1);
    const maxInbound = Math.max(...allSummaries.map((s) => s.preInbound), 1);

    // 레이더 데이터 (0-100 스케일로 정규화)
    const radarData = [
      {
        subject: "Pair 협업",
        value: Math.round((summary.pairCount / maxPair) * 100),
        fullMark: 100,
        rawValue: summary.pairCount,
      },
      {
        subject: "Pre (출)",
        value: Math.round((summary.preCount / maxOutbound) * 100),
        fullMark: 100,
        rawValue: summary.preCount,
      },
      {
        subject: "Pre (입)",
        value: Math.round((summary.preInbound / maxInbound) * 100),
        fullMark: 100,
        rawValue: summary.preInbound,
      },
      {
        subject: "크로스 도메인",
        value: summary.crossDomainScore,
        fullMark: 100,
        rawValue: `${summary.crossDomainScore}%`,
      },
      {
        subject: "크로스 모듈",
        value: summary.crossModuleScore,
        fullMark: 100,
        rawValue: `${summary.crossModuleScore}%`,
      },
    ];

    return { radarData, summary };
  }, [items, memberName]);

  if (summary.totalCollaborations === 0) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          📡 협업 지표
        </h3>
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          협업 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-4">
      <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
        📡 협업 지표
      </h3>

      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="var(--notion-border)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "var(--notion-text-secondary)", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "var(--notion-text-tertiary)", fontSize: 9 }}
              tickCount={5}
            />
            <Radar
              name={memberName}
              dataKey="value"
              stroke="var(--notion-blue)"
              fill="var(--notion-blue)"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: "var(--notion-bg)",
                border: "1px solid var(--notion-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number) => [value, "점수"]}
              labelFormatter={(label) => String(label)}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* 요약 정보 */}
      <div className="grid grid-cols-5 gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--notion-border)" }}>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "var(--notion-blue)" }}>
            {summary.pairCount}
          </div>
          <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
            Pair
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "var(--notion-orange)" }}>
            {summary.preCount}
          </div>
          <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
            Pre(출)
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "var(--notion-red)" }}>
            {summary.preInbound}
          </div>
          <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
            Pre(입)
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "var(--notion-purple)" }}>
            {summary.crossDomainScore}%
          </div>
          <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
            X-도메인
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: "var(--notion-green)" }}>
            {summary.crossModuleScore}%
          </div>
          <div className="text-xs" style={{ color: "var(--notion-text-secondary)" }}>
            X-모듈
          </div>
        </div>
      </div>
    </div>
  );
}
