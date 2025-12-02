"use client";

import type { InsightData } from "@/types/insight";
import { ExecutiveSummary } from "./ExecutiveSummary";
import { DecisionPoints } from "./DecisionPoints";
import { RiskTable } from "./RiskTable";
import { ExecutionGap } from "./ExecutionGap";
import { QuadrantSummary } from "./QuadrantSummary";

interface InsightDashboardProps {
  data: InsightData;
  range?: string;
}

export function InsightDashboard({ data, range }: InsightDashboardProps) {
  return (
    <div className="space-y-5">
      {/* 헤더 영역 */}
      {range && (
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#1f2328]">
            핵심 인사이트 대시보드
          </h1>
          <span className="text-sm text-[#656d76]">{range}</span>
        </div>
      )}

      {/* 상단 2컬럼 레이아웃: Executive Summary + Decision Points */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ExecutiveSummary items={data.executiveSummary} />
        <DecisionPoints items={data.decisionPoints} />
      </div>

      {/* Risk Table - 전체 너비 */}
      <RiskTable items={data.risks} />

      {/* 하단 2컬럼 레이아웃: Execution Gap + Quadrant Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ExecutionGap items={data.executionGap} />
        <QuadrantSummary data={data.quadrantSummary} />
      </div>
    </div>
  );
}

