"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MonthSelector } from "./MonthSelector";
import { PlanFilters } from "./PlanFilters";
import { PlansList } from "./PlansList";
import { PlansGanttView } from "./gantt";
import {
  updatePlanStatusAction,
  createDraftPlanAtCellAction,
  resizePlanAction,
} from "@/lib/actions/plans";
import type { PlansBoardProps, FilterState, GroupByOption } from "./types";
import type { PlanStatus } from "@/lib/data/plans";

type ViewMode = "list" | "gantt";

/**
 * 메인 Plans 보드 컴포넌트
 * - mode='readonly': 조회만 가능 (/plans)
 * - mode='admin': CRUD 가능 (/admin/plans)
 */
export function PlansBoard({
  mode,
  initialPlans,
  undatedPlans = [],
  filterOptions,
  members,
  initialMonth,
}: PlansBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [filters, setFilters] = useState<FilterState>({});
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [viewMode, setViewMode] = useState<ViewMode>("gantt"); // 기본: 간트 뷰

  // 월 변경 시 서버에서 새 데이터 fetch (URL 파라미터 변경)
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    startTransition(() => {
      const basePath = mode === "admin" ? "/admin/plans" : "/plans";
      router.push(`${basePath}?month=${month}`);
    });
  };

  // 상태 빠른 변경 (admin 모드)
  const handleStatusChange = async (planId: string, status: PlanStatus) => {
    const result = await updatePlanStatusAction(planId, status);
    if (!result.success) {
      alert(result.error || "상태 변경에 실패했습니다.");
    }
  };

  // 간트 셀 클릭으로 Draft Plan 생성 (admin 모드)
  const handleCreateDraftAtCell = useCallback(
    async (context: {
      domain: string;
      project: string;
      module: string;
      feature: string;
      date: Date;
    }) => {
      const result = await createDraftPlanAtCellAction({
        domain: context.domain,
        project: context.project,
        module: context.module,
        feature: context.feature,
        date: context.date.toISOString().split("T")[0],
      });

      if (!result.success) {
        alert(result.error || "생성에 실패했습니다.");
        return;
      }

      // 새로고침하여 새 Plan 반영
      startTransition(() => {
        router.refresh();
      });
    },
    [router]
  );

  // 간트 막대 리사이즈 (admin 모드)
  const handleResizePlan = useCallback(
    async (planId: string, startDate: string, endDate: string) => {
      const result = await resizePlanAction({
        planId,
        start_date: startDate,
        end_date: endDate,
      });

      if (!result.success) {
        alert(result.error || "기간 변경에 실패했습니다.");
        return;
      }

      // 새로고침
      startTransition(() => {
        router.refresh();
      });
    },
    [router]
  );

  // Plan 열기 (admin 모드: 편집 페이지로 이동)
  const handleOpenPlan = useCallback(
    (planId: string) => {
      if (mode === "admin") {
        router.push(`/admin/plans/${planId}/edit`);
      }
    },
    [mode, router]
  );

  // 간트 뷰용 날짜 범위 계산
  const getMonthRange = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const rangeStart = new Date(year, month - 1, 1);
    const rangeEnd = new Date(year, month, 0);
    return { rangeStart, rangeEnd };
  };

  const { rangeStart, rangeEnd } = getMonthRange();

  const isAdmin = mode === "admin";
  const totalCount = initialPlans.length + undatedPlans.length;
  const filteredCount = initialPlans.filter((p) => {
    // 간단한 필터 카운트
    if (filters.status && p.status !== filters.status) return false;
    if (filters.type && p.type !== filters.type) return false;
    return true;
  }).length;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📆</span>
          <div>
            <div className="flex items-center gap-2">
              <h1
                className="text-xl font-semibold"
                style={{ color: "var(--notion-text)" }}
              >
                {isAdmin ? "All Plans" : "Plans"}
              </h1>
              {!isAdmin && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "rgba(107, 114, 128, 0.1)",
                    color: "#6b7280",
                  }}
                >
                  조회 전용
                </span>
              )}
              {isAdmin && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(247, 109, 87, 0.15), rgba(249, 235, 178, 0.3))",
                    color: "#F76D57",
                    border: "1px solid rgba(247, 109, 87, 0.2)",
                  }}
                >
                  관리자 전용
                </span>
              )}
            </div>
            <p
              className="text-sm mt-0.5"
              style={{ color: "var(--notion-text-muted)" }}
            >
              {isPending
                ? "로딩 중..."
                : `${filteredCount}개 / 전체 ${totalCount}개`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 뷰 모드 전환 */}
          <div
            className="flex rounded-lg overflow-hidden"
            style={{
              background: "var(--notion-bg-secondary)",
              border: "1px solid var(--notion-border)",
            }}
          >
            <button
              onClick={() => setViewMode("gantt")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: viewMode === "gantt" ? "var(--notion-bg)" : "transparent",
                color: viewMode === "gantt" ? "var(--notion-text)" : "var(--notion-text-muted)",
                boxShadow: viewMode === "gantt" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 10h8m-8 4h10m-10 4h6"
                />
              </svg>
              간트
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                background: viewMode === "list" ? "var(--notion-bg)" : "transparent",
                color: viewMode === "list" ? "var(--notion-text)" : "var(--notion-text-muted)",
                boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              리스트
            </button>
          </div>

          {/* 월 선택 */}
          <MonthSelector
            selectedMonth={selectedMonth}
            onChange={handleMonthChange}
          />

          {/* 새 계획 버튼 (admin 모드만) */}
          {isAdmin && (
            <Link
              href="/admin/plans/new"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#F76D57]/20"
              style={{
                background: "linear-gradient(135deg, #F76D57, #f9a88b)",
                color: "white",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              계획 등록
            </Link>
          )}
        </div>
      </div>

      {/* 뷰 모드별 렌더링 */}
      {viewMode === "gantt" ? (
        <>
          {/* 간트 뷰 (필터는 간트 뷰에서는 숨김) */}
          <PlansGanttView
            mode={mode}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            plans={initialPlans}
            onCreateDraftAtCell={isAdmin ? handleCreateDraftAtCell : undefined}
            onResizePlan={isAdmin ? handleResizePlan : undefined}
            onOpenPlan={isAdmin ? handleOpenPlan : undefined}
          />

          {/* 일정 미지정 (간트 뷰 아래에 표시) */}
          {undatedPlans.length > 0 && (
            <section
              className="p-4 rounded-xl border"
              style={{
                background: "var(--notion-bg-secondary)",
                borderColor: "var(--notion-border)",
              }}
            >
              <h2
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--notion-text-muted)" }}
              >
                ⏳ 일정 미지정
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "#f59e0b",
                  }}
                >
                  {undatedPlans.length}
                </span>
              </h2>
              <PlansList
                plans={undatedPlans}
                mode={mode}
                groupBy="none"
                filters={{}}
                onStatusChange={isAdmin ? handleStatusChange : undefined}
              />
            </section>
          )}
        </>
      ) : (
        <>
          {/* 리스트 뷰 */}
          {/* 필터 */}
          <PlanFilters
            filters={filters}
            onFiltersChange={setFilters}
            groupBy={groupBy}
            onGroupByChange={setGroupBy}
            filterOptions={filterOptions}
            members={members}
          />

          {/* Plans 목록 */}
          <div className="space-y-8">
            {/* 현재 월 계획 */}
            <section>
              <h2
                className="text-sm font-semibold mb-4 flex items-center gap-2"
                style={{ color: "var(--notion-text-muted)" }}
              >
                📅 {selectedMonth} 계획
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "rgba(59, 130, 246, 0.1)",
                    color: "#3b82f6",
                  }}
                >
                  {initialPlans.length}
                </span>
              </h2>
              <PlansList
                plans={initialPlans}
                mode={mode}
                groupBy={groupBy}
                filters={filters}
                onStatusChange={isAdmin ? handleStatusChange : undefined}
              />
            </section>

            {/* 일정 미지정 */}
            {undatedPlans.length > 0 && (
              <section>
                <h2
                  className="text-sm font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  ⏳ 일정 미지정
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: "rgba(245, 158, 11, 0.1)",
                      color: "#f59e0b",
                    }}
                  >
                    {undatedPlans.length}
                  </span>
                </h2>
                <PlansList
                  plans={undatedPlans}
                  mode={mode}
                  groupBy={groupBy}
                  filters={filters}
                  onStatusChange={isAdmin ? handleStatusChange : undefined}
                />
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
