/**
 * Personal Space Dashboard with Progressive Loading
 *
 * 증분 로딩을 적용한 대시보드
 * 1. 서버에서 핵심 메트릭만 받아 즉시 표시
 * 2. 클라이언트에서 차트 데이터를 추가 로딩
 */

"use client";

import { useState, useEffect } from "react";
import type { CoreMetrics } from "@/lib/dashboard/getPersonalDashboardMetricsCore";
import type { PersonalDashboardMetrics, RecentSnapshotEntry } from "@/lib/dashboard/getPersonalDashboardMetrics";
import { DataOnlyDashboard } from "./DataOnlyDashboard";

interface Props {
  userName?: string;
  coreMetrics: CoreMetrics;
  workspaceId: string;
}

interface EnhancedData {
  recentEntries?: RecentSnapshotEntry[];
  domainDistribution?: { label: string; count: number }[];
  weeklyTrend?: { week: string; count: number }[];
  weeklyProgressTrend?: { week: string; avgProgress: number; entryCount: number }[];
  topRoutes7d?: { path: string; count: number }[];
  visitsByDay14d?: { date: string; count: number }[];
}

export function DataOnlyDashboardProgressive({
  userName,
  coreMetrics,
  workspaceId,
}: Props) {
  const [enhancedData, setEnhancedData] = useState<EnhancedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 차트 및 부가 데이터 로딩
    const loadEnhancedData = async () => {
      try {
        const response = await fetch(
          `/api/dashboard/enhanced-data?workspaceId=${workspaceId}&type=all`
        );
        if (response.ok) {
          const data = await response.json();
          setEnhancedData(data);
        }
      } catch (error) {
        console.error("Failed to load enhanced data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEnhancedData();
  }, [workspaceId]);

  // 핵심 메트릭과 추가 데이터를 합쳐서 전달
  const fullMetrics: PersonalDashboardMetrics = {
    ...coreMetrics,
    recentEntries: enhancedData?.recentEntries || [],
    domainDistribution: enhancedData?.domainDistribution || [],
    weeklyTrend: enhancedData?.weeklyTrend || [],
    weeklyProgressTrend: enhancedData?.weeklyProgressTrend || [],
    usage: {
      ...coreMetrics.usage,
      topRoutes7d: enhancedData?.topRoutes7d || [],
      visitsByDay14d: enhancedData?.visitsByDay14d || [],
    },
  };

  return (
    <>
      <DataOnlyDashboard userName={userName} metrics={fullMetrics} />
      {isLoading && (
        <div className="fixed bottom-4 right-4 bg-white border border-[#d0d7de] rounded-lg shadow-lg px-4 py-3 flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-[#0969da]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm text-[#57606a]">차트 데이터 로딩 중...</span>
        </div>
      )}
    </>
  );
}
