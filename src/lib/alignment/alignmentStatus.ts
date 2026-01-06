/**
 * Alignment Status Calculation
 * 
 * Plan과 Execution(Snapshot Entries)의 정합성을 계산합니다.
 * - Plan window 내의 snapshot 개수를 계산
 * - Expected execution count와 비교하여 상태 분류
 */

import type { DraftBar } from "@/components/plans/gantt-draft/types";

export type AlignmentStatus = "green" | "orange" | "red" | null;

export interface AlignmentStatusInfo {
  status: AlignmentStatus;
  actualCount: number;
  expectedCount: number;
  explanation: string;
  debugInfo?: {
    planMetaKey: string;
    planDateRange: string;
    matchingSnapshots: Array<{
      metaKey: string;
      startDate: string;
      authorId?: string;
    }>;
    filteredOutSnapshots: Array<{
      metaKey: string;
      startDate: string;
      authorId?: string;
      reason: string;
    }>;
  };
}

/**
 * Plan window (주차 범위)를 계산합니다.
 * 
 * @param startDate - YYYY-MM-DD
 * @param endDate - YYYY-MM-DD
 * @returns 주차 수 (최소 1)
 */
function getWeeksInPlanWindow(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.ceil(diffDays / 7);
  return Math.max(1, weeks);
}

/**
 * Snapshot이 Plan window 내에 있는지 확인합니다.
 * 
 * @param snapshotDate - YYYY-MM-DD
 * @param planStart - YYYY-MM-DD
 * @param planEnd - YYYY-MM-DD
 * @returns true if snapshot is within plan window
 */
function isWithinPlanWindow(
  snapshotDate: string,
  planStart: string,
  planEnd: string
): boolean {
  const snapshot = new Date(snapshotDate);
  const start = new Date(planStart);
  const end = new Date(planEnd);
  return snapshot >= start && snapshot <= end;
}

/**
 * Meta key가 일치하는지 확인합니다.
 * 
 * @param meta1 - project::module::feature 형식
 * @param meta2 - project::module::feature 형식
 * @returns true if meta matches
 */
function metaMatches(meta1: string, meta2: string): boolean {
  return meta1 === meta2;
}

/**
 * Plan에 대한 실행 상태를 계산합니다.
 * 
 * @param plan - Plan bar (type === "plan")
 * @param allBars - 모든 bars (plans + snapshots)
 * @param userId - 계산할 사용자 ID (optional, 없으면 전체)
 * @returns AlignmentStatusInfo
 */
export function calculateAlignmentStatus(
  plan: DraftBar,
  allBars: DraftBar[],
  userId?: string
): AlignmentStatusInfo {
  // Snapshot이면 null
  if ((plan as any).isSnapshot) {
    return {
      status: null,
      actualCount: 0,
      expectedCount: 0,
      explanation: "N/A",
    };
  }

  // Plan의 meta key 생성
  const planMetaKey = `${plan.rowId.split("::")[0]}::${
    plan.rowId.split("::")[1] || ""
  }::${plan.rowId.split("::")[2] || ""}`;

  // Plan window 주차 수 계산
  const expectedCount = getWeeksInPlanWindow(plan.startDate, plan.endDate);

  // 디버그 정보 수집
  const filteredOutSnapshots: Array<{
    metaKey: string;
    startDate: string;
    authorId?: string;
    reason: string;
  }> = [];

  // Plan window 내의 snapshot entries 필터링
  const matchingSnapshots = allBars.filter((bar) => {
    // Snapshot이 아니면 제외
    if (!(bar as any).isSnapshot) return false;

    const snapshotMetaKey = (bar as any).metaKey || "";
    const snapshotAuthorId = (bar as any).authorId;

    // userId가 지정되었으면 해당 사용자만 필터링
    if (userId && snapshotAuthorId !== userId) {
      filteredOutSnapshots.push({
        metaKey: snapshotMetaKey,
        startDate: bar.startDate,
        authorId: snapshotAuthorId,
        reason: `Author mismatch (expected: ${userId})`,
      });
      return false;
    }

    // Meta key 일치 확인
    if (!metaMatches(planMetaKey, snapshotMetaKey)) {
      filteredOutSnapshots.push({
        metaKey: snapshotMetaKey,
        startDate: bar.startDate,
        authorId: snapshotAuthorId,
        reason: `MetaKey mismatch (expected: ${planMetaKey})`,
      });
      return false;
    }

    // Plan window 내에 있는지 확인
    if (!isWithinPlanWindow(bar.startDate, plan.startDate, plan.endDate)) {
      filteredOutSnapshots.push({
        metaKey: snapshotMetaKey,
        startDate: bar.startDate,
        authorId: snapshotAuthorId,
        reason: `Out of date range (plan: ${plan.startDate} ~ ${plan.endDate})`,
      });
      return false;
    }

    return true;
  });

  const actualCount = matchingSnapshots.length;

  // 상태 분류
  let status: AlignmentStatus;
  let explanation: string;

  if (actualCount === 0) {
    status = "red";
    explanation = "No execution snapshot detected within the planned period.";
  } else if (actualCount < expectedCount) {
    status = "orange";
    explanation =
      "Execution snapshots exist, but coverage is below the expected range.";
  } else {
    status = "green";
    explanation = "Execution coverage meets or exceeds expectations.";
  }

  return {
    status,
    actualCount,
    expectedCount,
    explanation,
    debugInfo: {
      planMetaKey,
      planDateRange: `${plan.startDate} ~ ${plan.endDate}`,
      matchingSnapshots: matchingSnapshots.map((bar) => ({
        metaKey: (bar as any).metaKey || "",
        startDate: bar.startDate,
        authorId: (bar as any).authorId,
      })),
      filteredOutSnapshots,
    },
  };
}

/**
 * 여러 사용자에 대한 실행 상태를 계산합니다.
 * 
 * @param plan - Plan bar
 * @param allBars - 모든 bars
 * @param userIds - 계산할 사용자 ID 목록
 * @returns Map<userId, AlignmentStatusInfo>
 */
export function calculateAlignmentStatusForUsers(
  plan: DraftBar,
  allBars: DraftBar[],
  userIds: string[]
): Map<string, AlignmentStatusInfo> {
  const result = new Map<string, AlignmentStatusInfo>();

  for (const userId of userIds) {
    const status = calculateAlignmentStatus(plan, allBars, userId);
    result.set(userId, status);
  }

  return result;
}

/**
 * 전체 Plan에 대한 불일치 목록을 생성합니다.
 * 
 * @param plans - Plan bars only
 * @param allBars - 모든 bars
 * @param userId - 계산할 사용자 ID (optional)
 * @returns Array of mismatches (RED + ORANGE only)
 */
export interface AlignmentMismatch {
  planId: string;
  planTitle: string;
  metaPath: string; // "Project / Module / Feature"
  status: "red" | "orange";
  explanation: string;
  actualCount: number;
  expectedCount: number;
  planStartDate: string;
  planEndDate: string;
}

export function detectAlignmentMismatches(
  plans: DraftBar[],
  allBars: DraftBar[],
  userId?: string
): AlignmentMismatch[] {
  const mismatches: AlignmentMismatch[] = [];

  for (const plan of plans) {
    if ((plan as any).isSnapshot) continue;

    const statusInfo = calculateAlignmentStatus(plan, allBars, userId);

    if (statusInfo.status === "red" || statusInfo.status === "orange") {
      // Meta path 생성
      const parts = plan.rowId.split("::");
      const metaPath = parts.filter((p) => p).join(" / ");

      mismatches.push({
        planId: plan.serverId || plan.clientUid,
        planTitle: plan.title,
        metaPath,
        status: statusInfo.status,
        explanation: statusInfo.explanation,
        actualCount: statusInfo.actualCount,
        expectedCount: statusInfo.expectedCount,
        planStartDate: plan.startDate,
        planEndDate: plan.endDate,
      });
    }
  }

  return mismatches;
}

