/**
 * Plan Card Component
 * 
 * Alignment View에서 사용되는 Plan 카드 (+ Snapshot Overlay)
 */

"use client";

import type { AlignmentPlan, AlignmentSnapshotEntry } from "@/lib/data/alignmentData";
import { SnapshotOverlay } from "./SnapshotOverlay";

interface PlanCardProps {
  plan: AlignmentPlan;
  snapshots: AlignmentSnapshotEntry[];
  year: number;
  week: string;
}

export function PlanCard({ plan, snapshots, year, week }: PlanCardProps) {
  // 상태별 색상
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "done":
        return "bg-[#1a7f37] text-white";
      case "in_progress":
      case "in progress":
        return "bg-[#0969da] text-white";
      case "planned":
      case "todo":
        return "bg-[#848d97] text-white";
      case "blocked":
      case "on_hold":
        return "bg-[#cf222e] text-white";
      default:
        return "bg-[#6e7781] text-white";
    }
  };

  // Stage별 색상
  const getStageColor = (stage: string) => {
    switch (stage.toLowerCase()) {
      case "planning":
        return "text-[#0969da]";
      case "development":
      case "dev":
        return "text-[#8250df]";
      case "testing":
      case "qa":
        return "text-[#fb8500]";
      case "deployment":
      case "deploy":
        return "text-[#1a7f37]";
      default:
        return "text-[#57606a]";
    }
  };

  // 날짜 포맷 (YYYY-MM-DD → MM.DD)
  const formatShortDate = (dateStr: string) => {
    const [, month, day] = dateStr.split("-");
    return `${month}.${day}`;
  };

  return (
    <div className="p-4 bg-white border border-[#d0d7de] rounded-md hover:border-[#0969da] transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          {/* Meta 정보 */}
          <div className="flex items-center gap-2 mb-2 text-xs text-[#57606a]">
            {plan.domain && (
              <>
                <span className="font-medium">{plan.domain}</span>
                <span>/</span>
              </>
            )}
            <span className="font-medium">{plan.project}</span>
            <span>/</span>
            <span>{plan.module}</span>
            <span>/</span>
            <span>{plan.feature}</span>
          </div>

          {/* 제목 */}
          <h3 className="text-base font-semibold text-[#24292f] mb-2">
            {plan.title}
          </h3>

          {/* 설명 */}
          {plan.description && (
            <p className="text-sm text-[#57606a] line-clamp-2 mb-2">
              {plan.description}
            </p>
          )}
        </div>
      </div>

      {/* Info Row */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        {/* Stage */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#57606a]">Stage:</span>
          <span className={`font-medium ${getStageColor(plan.stage)}`}>
            {plan.stage}
          </span>
        </div>

        {/* Status */}
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
            plan.status
          )}`}
        >
          {plan.status}
        </span>

        {/* Date Range */}
        <div className="flex items-center gap-1.5">
          <svg
            className="w-3.5 h-3.5 text-[#57606a]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <span className="text-[#57606a]">
            {formatShortDate(plan.startDate)} ~ {formatShortDate(plan.endDate)}
          </span>
        </div>

        {/* Assignees */}
        {plan.assignees && plan.assignees.length > 0 && (
          <div className="flex items-center gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-[#57606a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <span className="text-[#57606a]">
              {plan.assignees.map((a) => a.displayName || a.userId).join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Snapshot Overlay */}
      <SnapshotOverlay
        planId={plan.id}
        snapshots={snapshots}
        year={year}
        week={week}
      />
    </div>
  );
}

