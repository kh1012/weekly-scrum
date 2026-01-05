/**
 * Snapshot Overlay Component
 * 
 * Plan 블록에 연결되어 표시되는 Snapshot 요약
 */

"use client";

import { useState } from "react";
import type { AlignmentSnapshotEntry } from "@/lib/data/alignmentData";

interface SnapshotOverlayProps {
  planId: string;
  planMeta: {
    domain?: string;
    project: string;
    module: string;
    feature: string;
  };
  snapshots: AlignmentSnapshotEntry[];
  year: number;
  week: string;
}

export function SnapshotOverlay({
  planId,
  planMeta,
  snapshots,
  year,
  week,
}: SnapshotOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 해당 Plan과 연결된 Snapshots 필터링
  // 1순위: plan_id 매칭
  // 2순위: meta 정보(domain/project/module/feature) 매칭 (plan_id가 없는 경우)
  const linkedSnapshots = snapshots.filter((s) => {
    // 1. plan_id로 직접 연결된 경우
    if (s.planId === planId) return true;

    // 2. plan_id가 없지만 meta 정보가 일치하는 경우
    if (!s.planId) {
      const domainMatch = !planMeta.domain || s.domain === planMeta.domain;
      const projectMatch = s.project === planMeta.project;
      const moduleMatch = s.module === planMeta.module;
      const featureMatch = s.feature === planMeta.feature;

      return domainMatch && projectMatch && moduleMatch && featureMatch;
    }

    return false;
  });

  // Empty State: 이번 주에 기록된 Snapshot이 없음
  if (linkedSnapshots.length === 0) {
    return (
      <div className="mt-2 p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs text-[#57606a]">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#848d97]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <span className="font-medium">This Week</span>
        </div>
        <p className="mt-2 text-[#848d97]">
          이번 주에 기록된 Snapshot이 없습니다.
        </p>
      </div>
    );
  }

  // Collapsed View: Summary
  if (!isExpanded) {
    return (
      <div
        className="mt-2 p-3 bg-[#ddf4ff] border border-[#54aeff] rounded-md cursor-pointer hover:bg-[#b6e3ff] transition-colors"
        onClick={() => setIsExpanded(true)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-[#0969da]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
              />
            </svg>
            <span className="text-sm font-semibold text-[#0969da]">
              This Week
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0969da] text-white">
              {linkedSnapshots.length}건
            </span>
            <svg
              className="w-4 h-4 text-[#0969da]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // Expanded View: Entry List
  return (
    <div className="mt-2 p-3 bg-[#ddf4ff] border border-[#54aeff] rounded-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-[#0969da]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
            />
          </svg>
          <span className="text-sm font-semibold text-[#0969da]">
            This Week
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#0969da] text-white">
            {linkedSnapshots.length}건
          </span>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="p-1 hover:bg-[#b6e3ff] rounded transition-colors"
        >
          <svg
            className="w-4 h-4 text-[#0969da]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-2">
        {linkedSnapshots.map((snapshot) => {
          // Next 텍스트 추출 (thisWeek 또는 pastWeek의 첫 작업)
          let nextText = "";
          if (snapshot.thisWeek?.tasks && snapshot.thisWeek.tasks.length > 0) {
            nextText = snapshot.thisWeek.tasks[0];
          } else if (
            snapshot.pastWeek?.tasks &&
            snapshot.pastWeek.tasks.length > 0
          ) {
            nextText = snapshot.pastWeek.tasks[0].title;
          }

          return (
            <a
              key={snapshot.id}
              href={`/manage/snapshots/${year}/${week}/edit?entry=${snapshot.id}`}
              className="block p-2 bg-white border border-[#d0d7de] rounded hover:border-[#0969da] transition-colors"
            >
              <div className="text-sm font-medium text-[#24292f] mb-1">
                {snapshot.name}
              </div>
              {nextText && (
                <div className="text-xs text-[#57606a] truncate">
                  {nextText}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}

