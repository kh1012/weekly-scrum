"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import type { WeeklyScrumData } from "@/types/scrum";

interface MyBottleneckTimelineProps {
  weeklyData: Array<{
    weekKey: string;
    weekLabel: string;
    data: WeeklyScrumData;
  }>;
  memberName: string;
}

interface TimelineData {
  weekLabel: string;
  outbound: number; // 내가 기다리는 수
  inbound: number; // 나를 기다리는 수
}

export function MyBottleneckTimeline({ weeklyData, memberName }: MyBottleneckTimelineProps) {
  const timelineData = useMemo((): TimelineData[] => {
    return weeklyData.map(({ weekLabel, data }) => {
      const memberItems = data.items.filter((item) => item.name === memberName);

      // 내가 기다리는 수 (outbound) - 내가 pre로 지정한 사람
      let outbound = 0;
      for (const item of memberItems) {
        const pres = item.collaborators?.filter((c) => c.relation === "pre") ?? [];
        outbound += pres.length;
      }

      // 나를 기다리는 수 (inbound) - 다른 사람이 나를 pre로 지정
      let inbound = 0;
      for (const item of data.items) {
        if (item.name === memberName) continue;
        const waitingForMe = item.collaborators?.filter(
          (c) => c.name === memberName && c.relation === "pre"
        );
        inbound += waitingForMe?.length ?? 0;
      }

      return {
        weekLabel,
        outbound,
        inbound,
      };
    });
  }, [weeklyData, memberName]);

  // 추세 계산
  const trend = useMemo(() => {
    if (timelineData.length < 2) return null;

    const recent = timelineData[timelineData.length - 1];
    const previous = timelineData[timelineData.length - 2];

    const outboundDiff = recent.outbound - previous.outbound;
    const inboundDiff = recent.inbound - previous.inbound;

    return { outboundDiff, inboundDiff };
  }, [timelineData]);

  // 이상치 감지
  const anomalies = useMemo(() => {
    if (timelineData.length < 3) return [];

    const avgInbound = timelineData.reduce((sum, d) => sum + d.inbound, 0) / timelineData.length;
    const stdDev = Math.sqrt(
      timelineData.reduce((sum, d) => sum + Math.pow(d.inbound - avgInbound, 2), 0) / timelineData.length
    );

    return timelineData
      .map((d, idx) => ({
        ...d,
        idx,
        isAnomaly: d.inbound > avgInbound + stdDev * 1.5,
      }))
      .filter((d) => d.isAnomaly);
  }, [timelineData]);

  if (timelineData.length === 0 || timelineData.every((d) => d.outbound === 0 && d.inbound === 0)) {
    return (
      <div className="notion-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--notion-text)" }}>
          ⏳ 병목 추이
        </h3>
        <div className="flex items-center justify-center h-48 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
          병목 데이터가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold" style={{ color: "var(--notion-text)" }}>
          ⏳ 병목 추이
        </h3>
        {trend && (
          <div className="flex items-center gap-3 text-xs">
            <span style={{ color: "var(--notion-orange)" }}>
              대기(출) {trend.outboundDiff >= 0 ? "+" : ""}{trend.outboundDiff}
            </span>
            <span style={{ color: "var(--notion-red)" }}>
              대기(입) {trend.inboundDiff >= 0 ? "+" : ""}{trend.inboundDiff}
            </span>
          </div>
        )}
      </div>

      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--notion-border)" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fill: "var(--notion-text-secondary)", fontSize: 10 }}
              axisLine={{ stroke: "var(--notion-border)" }}
            />
            <YAxis
              tick={{ fill: "var(--notion-text-secondary)", fontSize: 10 }}
              axisLine={{ stroke: "var(--notion-border)" }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--notion-bg)",
                border: "1px solid var(--notion-border)",
                borderRadius: 8,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => [
                `${value}명`,
                name === "outbound" ? "내가 기다리는" : "나를 기다리는",
              ]}
            />
            <Legend
              wrapperStyle={{ fontSize: 11 }}
              formatter={(value) => (value === "outbound" ? "내가 기다림 (출)" : "나를 기다림 (입)")}
            />
            <Bar dataKey="outbound" fill="var(--notion-orange)" radius={[2, 2, 0, 0]}>
              {timelineData.map((entry, index) => (
                <Cell
                  key={`cell-out-${index}`}
                  fill={entry.outbound > 2 ? "var(--notion-orange)" : "rgba(245, 158, 11, 0.6)"}
                />
              ))}
            </Bar>
            <Bar dataKey="inbound" fill="var(--notion-red)" radius={[2, 2, 0, 0]}>
              {timelineData.map((entry, index) => {
                const isAnomaly = anomalies.some((a) => a.idx === index);
                return (
                  <Cell
                    key={`cell-in-${index}`}
                    fill={isAnomaly ? "var(--notion-red)" : "rgba(239, 68, 68, 0.6)"}
                    stroke={isAnomaly ? "var(--notion-red)" : "none"}
                    strokeWidth={isAnomaly ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 이상치 경고 */}
      {anomalies.length > 0 && (
        <div
          className="mt-3 p-2 rounded text-xs"
          style={{
            background: "var(--notion-red-bg)",
            color: "var(--notion-red)",
          }}
        >
          ⚠️ 병목 이상치 감지: {anomalies.map((a) => a.weekLabel).join(", ")}에서 평균 이상의 대기 발생
        </div>
      )}

      {/* 범례 설명 */}
      <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid var(--notion-border)", color: "var(--notion-text-secondary)" }}>
        <span style={{ color: "var(--notion-orange)" }}>대기(출)</span>: 다른 사람의 작업을 기다리는 수 / 
        <span style={{ color: "var(--notion-red)" }}> 대기(입)</span>: 나를 기다리는 사람 수
      </div>
    </div>
  );
}

