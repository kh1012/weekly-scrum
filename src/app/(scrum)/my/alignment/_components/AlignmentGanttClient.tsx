"use client";

import { DraftGanttView } from "@/components/plans/gantt-draft/DraftGanttView";
import type { AlignmentGanttItem } from "@/lib/data/alignmentGanttData";

interface AlignmentGanttClientProps {
  workspaceId: string;
  items: AlignmentGanttItem[];
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null;
  }>;
  userName?: string;
}

/**
 * Alignment Gantt Client Component
 * 
 * DraftGanttView를 활용한 읽기 전용 간트 차트
 * Plans + Snapshot Entries를 타임라인에서 시각화
 */
export function AlignmentGanttClient({
  workspaceId,
  items,
  members,
  userName,
}: AlignmentGanttClientProps) {
  // AlignmentGanttItem을 InitialPlan 형식으로 변환
  const initialPlans = items.map((item) => ({
    id: item.id,
    clientUid: item.id,
    title: item.title,
    domain: item.domain || "",
    project: item.project || "",
    module: item.module || "",
    feature: item.feature || "",
    startDate: item.start_date,
    endDate: item.end_date,
    status: item.status || "active",
    stage: item.stage || "in_progress",
    priority: item.priority,
    assignees: item.assignees || [],
  }));

  return (
    <DraftGanttView
      workspaceId={workspaceId}
      initialPlans={initialPlans}
      members={members}
      readOnly={true}
      title={userName ? `${userName}님의 Alignment` : "Alignment"}
      // 필터 제거 (사용자 개인 데이터만 표시)
      selectedStages={new Set()}
      selectedAssignees={new Set()}
    />
  );
}

