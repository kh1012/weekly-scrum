/**
 * Alignment Content
 * 
 * Plans + Snapshot Overlay 렌더링
 */

"use client";

import { useState, useEffect } from "react";
import { DraftGanttView } from "@/components/plans/gantt-draft/DraftGanttView";
import type { WorkspaceMemberOption } from "@/components/plans/gantt-draft/CreatePlanModal";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import type {
  AlignmentPlan,
  AlignmentSnapshotEntry,
} from "@/lib/data/alignmentData";

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

  const { plans, snapshots, members } = data;

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

  // Members를 WorkspaceMemberOption 형식으로 변환
  const memberOptions: WorkspaceMemberOption[] = members.map((m) => ({
    userId: m.userId,
    displayName: m.displayName,
    email: m.email,
    basicRole: m.basicRole as any,
  }));

  return (
    <div className="space-y-6">
      {/* Plans (Read-only Gantt View) */}
      <div>
        <DraftGanttView
          workspaceId={workspaceId}
          initialPlans={plans}
          members={memberOptions}
          readOnly={true}
          title="내 계획 (Plans)"
        />
      </div>

      {/* Snapshot Overlay - 다음 스텝에서 구현 */}
      {/* TODO: Snapshot 오버레이 구현 */}
      {snapshots.length > 0 && (
        <div className="mt-4 p-4 bg-[#f6f8fa] border border-[#d0d7de] rounded-md">
          <p className="text-sm text-[#57606a]">
            이번 주 기록된 Snapshot: {snapshots.length}건
          </p>
          <p className="text-xs text-[#848d97] mt-1">
            (Snapshot 오버레이 UI는 다음 단계에서 구현됩니다)
          </p>
        </div>
      )}
    </div>
  );
}

