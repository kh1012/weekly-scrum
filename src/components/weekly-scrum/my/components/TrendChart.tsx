"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TrendPeriod } from "../utils/dashboardUtils";

interface TrendDataPoint {
  week: string;
  label: string;
  progress: number;
  plan: number;
  achievement: number;
  count: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
  period: TrendPeriod;
  onPeriodChange: (period: TrendPeriod) => void;
  isRangeMode: boolean;
}

export function TrendChart({
  data,
  period,
  onPeriodChange,
  isRangeMode,
}: TrendChartProps) {
  // 단일 주차 모드인 경우 안내 메시지 표시
  if (!isRangeMode) {
    return (
      <div className="notion-card p-4">
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: "var(--notion-text)" }}
        >
          📈 주차별 추이
        </h3>
        <TrendPlaceholder />
      </div>
    );
  }

  // 데이터가 충분하지 않은 경우
  if (data.length <= 1) {
    return null;
  }

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-sm font-semibold"
          style={{ color: "var(--notion-text)" }}
        >
          📈 주차별 추이
        </h3>
        <select
          value={period}
          onChange={(e) => onPeriodChange(e.target.value as TrendPeriod)}
          className="notion-select text-xs"
        >
          <option value="1month">최근 1개월</option>
          <option value="6months">최근 6개월</option>
          <option value="year">연도별</option>
        </select>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--notion-border)"
            />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "var(--notion-text-secondary)" }}
              axisLine={{ stroke: "var(--notion-border)" }}
              interval={period === "year" ? 3 : 0}
            />
            <YAxis
              domain={[0, 120]}
              tick={{ fontSize: 11, fill: "var(--notion-text-secondary)" }}
              axisLine={{ stroke: "var(--notion-border)" }}
              width={35}
            />
            <Tooltip
              contentStyle={{
                background: "var(--notion-bg)",
                border: "1px solid var(--notion-border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  plan: "계획",
                  progress: "진척률",
                  achievement: "달성률",
                };
                return [`${value}%`, labels[name] || name];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => {
                const labels: Record<string, string> = {
                  plan: "계획",
                  progress: "진척률",
                  achievement: "달성률",
                };
                return labels[value] || value;
              }}
            />
            <Line
              type="monotone"
              dataKey="plan"
              stroke="var(--notion-gray)"
              strokeDasharray="5 5"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--notion-gray)" }}
            />
            <Line
              type="monotone"
              dataKey="progress"
              stroke="var(--notion-blue)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--notion-blue)" }}
            />
            <Line
              type="monotone"
              dataKey="achievement"
              stroke="var(--notion-green)"
              strokeWidth={2}
              dot={{ r: 3, fill: "var(--notion-green)" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TrendPlaceholder() {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 rounded-lg"
      style={{ background: "var(--notion-bg-secondary)" }}
    >
      <svg
        className="w-12 h-12 mb-3"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ color: "var(--notion-text-muted)" }}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
      <p
        className="text-sm font-medium mb-1"
        style={{ color: "var(--notion-text-secondary)" }}
      >
        단일 주차 데이터로는 추이를 확인할 수 없어요
      </p>
      <p className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
        상단에서{" "}
        <span className="font-medium" style={{ color: "var(--notion-blue)" }}>
          범위
        </span>{" "}
        모드를 선택하면 주차별 변화를 확인할 수 있습니다
      </p>
    </div>
  );
}
