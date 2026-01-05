/**
 * Alignment Content
 * 
 * Plans + Snapshot Overlay 렌더링
 */

"use client";

import { useState, useEffect } from "react";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import type {
  AlignmentPlan,
  AlignmentSnapshotEntry,
} from "@/lib/data/alignmentData";
import { PlanCard } from "./PlanCard";

interface AlignmentContentProps {
  workspaceId: string;
  userId: string;
  year: number;
  week: string; // W01, W02, ...
}

interface AlignmentData {
  plans: AlignmentPlan[];
  snapshots: AlignmentSnapshotEntry[];
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: string;
  }>;
}

export function AlignmentContent({
  workspaceId,
  userId,
  year,
  week,
}: AlignmentContentProps) {
  const [data, setData] = useState<AlignmentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/alignment?workspaceId=${workspaceId}&userId=${userId}&year=${year}&week=${week}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch alignment data");
        }
        const result: AlignmentData = await response.json();
        setData(result);
      } catch (err) {
        console.error("Error fetching alignment data:", err);
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [workspaceId, userId, year, week]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LogoLoadingSpinner title="Alignment 데이터를 불러오는 중" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-[#cf222e] bg-[#ffebe9] border border-[#ff8182] rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { plans, snapshots } = data;

  // Plans가 없는 경우
  if (plans.length === 0) {
    return (
      <div className="p-6 text-center text-[#57606a] bg-[#f6f8fa] rounded-md">
        <p className="mb-2 text-lg font-semibold">
          현재 할당된 계획(Plans)이 없습니다.
        </p>
        <p className="text-sm">
          팀에서 계획을 생성하고 당신을 담당자(Assignee)로 지정하면 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Plans List with Snapshot Overlays */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            snapshots={snapshots}
            year={year}
            week={week}
          />
        ))}
      </div>

      {/* Unlinked Snapshots Warning */}
      {(() => {
        // 모든 Plans의 meta 정보 수집
        const planMetaSet = new Set(
          plans.map((p) => `${p.domain || ""}|${p.project}|${p.module}|${p.feature}`)
        );

        // 연결된 Snapshot: plan_id가 있거나 meta 정보가 일치
        const linkedSnapshotIds = new Set(
          snapshots
            .filter((s) => {
              if (s.planId) return true; // plan_id로 연결
              // meta 정보로 매칭 시도
              const metaKey = `${s.domain || ""}|${s.project}|${s.module}|${s.feature}`;
              return planMetaSet.has(metaKey);
            })
            .map((s) => s.id)
        );

        const unlinkedSnapshots = snapshots.filter(
          (s) => !linkedSnapshotIds.has(s.id)
        );

        if (unlinkedSnapshots.length === 0) return null;

        return (
          <div className="mt-6 p-4 bg-[#fff8c5] border border-[#d4a72c] rounded-md">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-[#9a6700] flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#24292f] mb-2">
                  이번 주 Snapshot 중 일부는 팀의 Plans와 연결되지 않았습니다.
                </p>
                <div className="space-y-2">
                  {unlinkedSnapshots.map((snapshot) => (
                    <a
                      key={snapshot.id}
                      href={`/manage/snapshots/${year}/${week}/edit?entry=${snapshot.id}`}
                      className="block p-2 bg-white border border-[#d0d7de] rounded hover:border-[#0969da] transition-colors text-sm"
                    >
                      <div className="font-medium text-[#24292f]">
                        {snapshot.name}
                      </div>
                      <div className="text-xs text-[#57606a] mt-1">
                        {snapshot.project} / {snapshot.module} /{" "}
                        {snapshot.feature}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

