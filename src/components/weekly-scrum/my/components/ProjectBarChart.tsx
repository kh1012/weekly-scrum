"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { getProgressColor } from "@/lib/colorDefines";

interface ProjectData {
  name: string;
  fullName: string;
  count: number;
  avgProgress: number;
}

interface ProjectBarChartProps {
  data: ProjectData[];
}

export function ProjectBarChart({ data }: ProjectBarChartProps) {
  return (
    <div className="notion-card p-4">
      <h3
        className="text-sm font-semibold mb-4"
        style={{ color: "var(--notion-text)" }}
      >
        📁 프로젝트별 진척률
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--notion-border)"
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "var(--notion-text-secondary)" }}
              axisLine={{ stroke: "var(--notion-border)" }}
              tickCount={6}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11, fill: "var(--notion-text-secondary)" }}
              axisLine={{ stroke: "var(--notion-border)" }}
              width={75}
            />
            <Tooltip
              contentStyle={{
                background: "var(--notion-bg)",
                border: "1px solid var(--notion-border)",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value: number, name: string) => {
                if (name === "avgProgress") {
                  return [`${value}%`, "평균 진척률"];
                }
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullName;
                }
                return label;
              }}
            />
            <Bar dataKey="avgProgress" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getProgressColor(entry.avgProgress)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
