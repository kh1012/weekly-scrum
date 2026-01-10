/**
 * AlignmentGanttView - Alignment 전용 Gantt Chart Wrapper
 *
 * DraftGanttView를 래핑하여 Alignment 기능을 제공:
 * - Status Coloring (RED/ORANGE/GREEN)
 * - Mismatch Review Panel
 * - Timeline Focus Interaction
 * - Plans + Snapshots 통합 표시
 */

"use client";

import { useMemo, useRef, useCallback } from "react";
import {
  DraftGanttView,
  type DraftGanttViewRef,
} from "@/components/plans/gantt-draft/DraftGanttView";
import type { AlignmentGanttItem } from "@/lib/data/plans";
import {
  calculateAlignmentStatus,
  detectAlignmentMismatches,
} from "@/lib/alignment/alignmentStatus";
import type { DraftBar } from "@/components/plans/gantt-draft/types";
import type { AlignmentMismatch } from "@/lib/alignment/alignmentStatus";

export interface AlignmentGanttViewProps {
  /** Workspace ID */
  workspaceId: string;

  /** Alignment items (Plans + Snapshots) */
  items: AlignmentGanttItem[];

  /** Workspace members */
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: "PLANNING" | "FE" | "BE" | "DESIGN" | "QA" | null;
  }>;

  /** Gantt chart title */
  title: string;

  /** Gantt chart description (optional) */
  description?: string;

  /** Selected assignees for filtering (optional) */
  selectedAssignees?: Set<string>;

  /** Assignee filter change handler (optional) */
  onAssigneesChange?: (assignees: Set<string>) => void;

  /** View mode change handler (optional) */
  onViewModeChange?: (mode: "detailed" | "summarized") => void;

  /** Enable alignment coverage check (default: false) */
  enableAlignmentCheck?: boolean;

  /** Enable alignment coverage check change handler */
  onEnableAlignmentCheckChange?: (enabled: boolean) => void;

  /** Coverage check start date (YYYY-MM-DD, default: 2025-01-12) */
  coverageCheckStartDate?: string;

  /** 데이터 새로고침 핸들러 */
  onRefreshData?: () => void;

  /** 데이터 새로고침 중 상태 */
  isRefreshing?: boolean;
}

/**
 * AlignmentGanttView Component
 *
 * Alignment 기능에 특화된 Gantt Chart 래퍼 컴포넌트
 * Plans와 Alignment가 공통으로 사용하는 DraftGanttView를 래핑하여
 * Alignment 고유 기능을 제공합니다.
 */
export function AlignmentGanttView({
  workspaceId,
  items,
  members,
  title,
  description = "계획과 기록을 Align 해봅니다.",
  selectedAssignees,
  onAssigneesChange,
  onViewModeChange,
  enableAlignmentCheck = false,
  onEnableAlignmentCheckChange,
  coverageCheckStartDate = "2025-01-12",
  onRefreshData,
  isRefreshing = false,
}: AlignmentGanttViewProps) {
  const ganttRef = useRef<DraftGanttViewRef>(null);

  /**
   * AlignmentGanttItem을 InitialPlan 형식으로 변환하고 Status 계산
   */
  const { initialPlans, mismatches } = useMemo(() => {
    // 1. AlignmentGanttItem → InitialPlan 변환
    const plans = items.map((item) => {
      const plan = {
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
        isSnapshot: item.type === "snapshot",
        avgProgress: item.avgProgress,
        metaKey: item.metaKey,
        year: item.year,
        week: item.week,
        authorName: item.authorName,
        authorId: item.authorId,
        past_week: item.past_week,
        this_week: item.this_week,
        collaborators: item.collaborators,
        risks: item.risks,
        risk_level: item.risk_level,
      };

      return plan;
    });

    // 2. DraftBar 형식으로 변환 (Status 계산용)
    const mockBars: DraftBar[] = plans.map((p) => ({
      clientUid: p.id,
      rowId: `${p.project}::${p.module}::${p.feature}`,
      serverId: p.id,
      title: p.title,
      stage: p.stage,
      status: p.status as any,
      startDate: p.startDate,
      endDate: p.endDate,
      assignees: p.assignees.map((a) => ({
        userId: a.userId,
        role: a.role as any,
        displayName: a.displayName,
      })),
      dirty: false,
      createdAtLocal: new Date().toISOString(),
      updatedAtLocal: new Date().toISOString(),
      isSnapshot: p.isSnapshot,
      metaKey: p.metaKey,
      authorId: p.authorId,
    }));

    // 3. Plan bars에 대해 Alignment 상태 계산
    const plansWithStatus = plans.map((plan, index) => {
      if (plan.isSnapshot) {
        return plan;
      }

      // 커버리지 검증이 비활성화되어 있으면 alignment 정보 추가하지 않음
      if (!enableAlignmentCheck) {
        return plan;
      }

      // 기간 필터: coverageCheckStartDate 이전 계획은 검증하지 않음
      if (plan.startDate < coverageCheckStartDate) {
        return plan;
      }

      const mockBar = mockBars[index];
      const statusInfo = calculateAlignmentStatus(mockBar, mockBars);

      return {
        ...plan,
        alignmentStatus: statusInfo.status,
        alignmentActualCount: statusInfo.actualCount,
        alignmentExpectedCount: statusInfo.expectedCount,
        alignmentDebugInfo: statusInfo.debugInfo,
      };
    });

    // 4. Mismatch 검출 (커버리지 검증이 활성화되고 기간 필터를 통과한 경우만)
    let detectedMismatches: any[] = [];
    if (enableAlignmentCheck) {
      const planBars = mockBars.filter(
        (bar) => !bar.isSnapshot && bar.startDate >= coverageCheckStartDate
      );
      detectedMismatches = detectAlignmentMismatches(planBars, mockBars);
    }

    return {
      initialPlans: plansWithStatus,
      mismatches: detectedMismatches,
    };
  }, [items, enableAlignmentCheck, coverageCheckStartDate]);

  /**
   * Mismatch 클릭 시 Timeline Focus 핸들러
   */
  const handleFocusMismatch = useCallback((mismatch: AlignmentMismatch) => {
    // metaPath format: "Project / Module / Feature"
    const parts = mismatch.metaPath.split(" / ");
    const rowId = parts.join("::");

    // Scroll to the row and highlight
    ganttRef.current?.scrollToRow(rowId, { highlight: true, smooth: true });
  }, []);

  return (
    <DraftGanttView
      ref={ganttRef}
      workspaceId={workspaceId}
      initialPlans={initialPlans}
      members={members}
      readOnly={true}
      title={title}
      description={description}
      selectedStages={new Set()}
      selectedAssignees={selectedAssignees || new Set()}
      onAssigneesChange={onAssigneesChange}
      onViewModeChange={onViewModeChange}
      onRefreshData={onRefreshData}
      isRefreshing={isRefreshing}
      enableAlignmentCheck={enableAlignmentCheck}
      onEnableAlignmentCheckChange={onEnableAlignmentCheckChange}
      mismatches={mismatches}
      onFocusMismatch={handleFocusMismatch}
      isAlignmentPage={true}
    />
  );
}
