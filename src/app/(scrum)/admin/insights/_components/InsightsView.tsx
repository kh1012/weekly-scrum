"use client";

/**
 * Admin Insights View
 * 
 * DB 뷰를 사용한 3개 테이블 표시
 */

import Link from "next/link";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import type { FlagPlanSummary, ResourceDistribution, CollabEdge } from "@/lib/data/teamFeed";

interface InsightsViewProps {
  flagSummary: FlagPlanSummary[];
  resourceDist: ResourceDistribution[];
  collabEdges: CollabEdge[];
  errors: {
    flagSummary?: string;
    resourceDist?: string;
    collabEdges?: string;
  };
}

export function InsightsView({
  flagSummary,
  resourceDist,
  collabEdges,
  errors,
}: InsightsViewProps) {
  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          onClick={() => navigationProgress.start()}
          className="p-2 rounded-md transition-colors hover:bg-[#f6f8fa] text-[#57606a]"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-2xl">📊</span>
        <div>
          <h1 className="text-xl font-semibold text-[#24292f]">
            Insights
          </h1>
          <p className="text-sm text-[#57606a]">
            Flag 요약, 리소스 분포, 협업 통계
          </p>
        </div>
      </div>

      {/* Flag Plan Summary */}
      <section>
        <h2 className="text-lg font-semibold text-[#24292f] mb-3">
          Flag Plan Summary
        </h2>
        {errors.flagSummary ? (
          <div className="p-4 rounded-md border border-[#d73a49] bg-[#ffebe9] text-[#d73a49] text-sm">
            {errors.flagSummary}
          </div>
        ) : flagSummary.length > 0 ? (
          <div className="border border-[#d0d7de] rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f8fa]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-[#24292f]">Flag Title</th>
                  <th className="px-4 py-2 text-left font-semibold text-[#24292f]">Date Range</th>
                  <th className="px-4 py-2 text-right font-semibold text-[#24292f]">Days</th>
                  <th className="px-4 py-2 text-right font-semibold text-[#24292f]">Plan Count</th>
                </tr>
              </thead>
              <tbody>
                {flagSummary.map((row, index) => (
                  <tr key={index} className="border-t border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors">
                    <td className="px-4 py-3 text-[#24292f] font-medium">{row.flag_title}</td>
                    <td className="px-4 py-3 text-[#57606a]">
                      {row.flag_start_date} ~ {row.flag_end_date}
                    </td>
                    <td className="px-4 py-3 text-[#57606a] text-right">{row.days}일</td>
                    <td className="px-4 py-3 text-[#0969da] text-right font-semibold">{row.plan_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#f6f8fa] rounded-md">
            <p className="text-sm text-[#57606a]">데이터가 없습니다</p>
          </div>
        )}
      </section>

      {/* Resource Distribution */}
      <section>
        <h2 className="text-lg font-semibold text-[#24292f] mb-3">
          Resource Distribution
        </h2>
        {errors.resourceDist ? (
          <div className="p-4 rounded-md border border-[#d73a49] bg-[#ffebe9] text-[#d73a49] text-sm">
            {errors.resourceDist}
          </div>
        ) : resourceDist.length > 0 ? (
          <div className="border border-[#d0d7de] rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f8fa]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-[#24292f]">Display Name</th>
                  <th className="px-4 py-2 text-right font-semibold text-[#24292f]">Assigned Plan Count</th>
                </tr>
              </thead>
              <tbody>
                {resourceDist.map((row, index) => (
                  <tr key={index} className="border-t border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors">
                    <td className="px-4 py-3 text-[#24292f] font-medium">{row.display_name}</td>
                    <td className="px-4 py-3 text-[#0969da] text-right font-semibold">{row.assigned_plan_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#f6f8fa] rounded-md">
            <p className="text-sm text-[#57606a]">데이터가 없습니다</p>
          </div>
        )}
      </section>

      {/* Collaboration Edges */}
      <section>
        <h2 className="text-lg font-semibold text-[#24292f] mb-3">
          Collaboration Edges
        </h2>
        {errors.collabEdges ? (
          <div className="p-4 rounded-md border border-[#d73a49] bg-[#ffebe9] text-[#d73a49] text-sm">
            {errors.collabEdges}
          </div>
        ) : collabEdges.length > 0 ? (
          <div className="border border-[#d0d7de] rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f6f8fa]">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-[#24292f]">From User</th>
                  <th className="px-4 py-2 text-left font-semibold text-[#24292f]">To User</th>
                  <th className="px-4 py-2 text-right font-semibold text-[#24292f]">Collaboration Count</th>
                </tr>
              </thead>
              <tbody>
                {collabEdges.map((row, index) => (
                  <tr key={index} className="border-t border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors">
                    <td className="px-4 py-3 text-[#24292f] font-medium">{row.from_user}</td>
                    <td className="px-4 py-3 text-[#24292f] font-medium">{row.to_user}</td>
                    <td className="px-4 py-3 text-[#0969da] text-right font-semibold">{row.collaboration_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-[#f6f8fa] rounded-md">
            <p className="text-sm text-[#57606a]">데이터가 없습니다</p>
          </div>
        )}
      </section>
    </div>
  );
}

