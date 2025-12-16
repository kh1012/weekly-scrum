"use client";

import { PlanCard } from "./PlanCard";
import type { PlansBoardMode, GroupByOption, FilterState } from "./types";
import type { PlanWithAssignees, PlanStatus } from "@/lib/data/plans";

interface PlansListProps {
  plans: PlanWithAssignees[];
  mode: PlansBoardMode;
  groupBy: GroupByOption;
  filters: FilterState;
  onStatusChange?: (planId: string, status: PlanStatus) => void;
}

/**
 * 그룹 키 추출 함수
 */
function getGroupKey(plan: PlanWithAssignees, groupBy: GroupByOption): string {
  switch (groupBy) {
    case "project":
      return plan.project || "미지정";
    case "module":
      return plan.module || "미지정";
    case "stage":
      return plan.stage || "미지정";
    case "feature":
      return plan.feature || "미지정";
    case "assignee":
      const assignee = plan.assignees?.[0];
      return assignee?.profiles?.display_name || assignee?.profiles?.email || "미지정";
    default:
      return "all";
  }
}

/**
 * 클라이언트 측 필터링 (서버에서 기본 필터링 후 추가 필터링)
 */
function applyClientFilters(
  plans: PlanWithAssignees[],
  filters: FilterState
): PlanWithAssignees[] {
  return plans.filter((plan) => {
    if (filters.type && plan.type !== filters.type) return false;
    if (filters.status && plan.status !== filters.status) return false;
    if (filters.project && plan.project !== filters.project) return false;
    if (filters.module && plan.module !== filters.module) return false;
    if (filters.feature && plan.feature !== filters.feature) return false;
    if (filters.stage && plan.stage !== filters.stage) return false;
    if (filters.assigneeUserId) {
      const hasAssignee = plan.assignees?.some(
        (a) => a.user_id === filters.assigneeUserId
      );
      if (!hasAssignee) return false;
    }
    return true;
  });
}

/**
 * Plans 목록 컴포넌트
 */
export function PlansList({
  plans,
  mode,
  groupBy,
  filters,
  onStatusChange,
}: PlansListProps) {
  // 클라이언트 측 필터링 적용
  const filteredPlans = applyClientFilters(plans, filters);

  // 그룹화
  const groupedPlans = filteredPlans.reduce(
    (acc, plan) => {
      const key = getGroupKey(plan, groupBy);
      if (!acc[key]) acc[key] = [];
      acc[key].push(plan);
      return acc;
    },
    {} as Record<string, PlanWithAssignees[]>
  );

  // 그룹 정렬 (미지정은 맨 뒤로)
  const sortedGroups = Object.keys(groupedPlans).sort((a, b) => {
    if (a === "미지정") return 1;
    if (b === "미지정") return -1;
    return a.localeCompare(b, "ko");
  });

  if (filteredPlans.length === 0) {
    return (
      <div
        className="text-center py-12 rounded-xl"
        style={{
          background: "var(--notion-bg-secondary)",
          color: "var(--notion-text-muted)",
        }}
      >
        <p className="text-lg">📆</p>
        <p className="mt-2">해당하는 계획이 없습니다</p>
      </div>
    );
  }

  // 그룹 없음
  if (groupBy === "none") {
    return (
      <div className="space-y-2">
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            mode={mode}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    );
  }

  // 그룹별 표시
  return (
    <div className="space-y-6">
      {sortedGroups.map((groupKey) => (
        <div key={groupKey}>
          <h3
            className="text-sm font-semibold mb-3 flex items-center gap-2"
            style={{ color: "var(--notion-text)" }}
          >
            <span>{groupKey}</span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                background: "var(--notion-bg-secondary)",
                color: "var(--notion-text-muted)",
              }}
            >
              {groupedPlans[groupKey].length}
            </span>
          </h3>
          <div className="space-y-2">
            {groupedPlans[groupKey].map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                mode={mode}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

