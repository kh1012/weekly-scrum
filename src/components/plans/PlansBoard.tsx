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
type MonthRangeOption = 3 | 4 | 5 | 6;

/**
 * 메인 Plans 보드 컴포넌트
 * - mode='readonly': 조회만 가능 (/plans)
 * - mode='admin': CRUD 가능 (/admin/plans)
 * - URL params로 필터 상태 관리 (서버 사이드 필터링)
 */
export function PlansBoard({
  mode,
  initialPlans,
  undatedPlans = [],
  filterOptions,
  members,
  initialMonth,
  initialFilters = {},
}: PlansBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [groupBy, setGroupBy] = useState<GroupByOption>("none");
  const [viewMode, setViewMode] = useState<ViewMode>("gantt"); // 기본: 간트 뷰
  const [monthRange, setMonthRange] = useState<MonthRangeOption>(3); // 기본: 3개월

  // URL 파라미터 빌드 함수
  const buildUrlWithParams = useCallback(
    (newMonth: string, newFilters: FilterState) => {
      const basePath = mode === "admin" ? "/admin/plans" : "/plans";
      const params = new URLSearchParams();
      
      params.set("month", newMonth);
      
      if (newFilters.type) params.set("type", newFilters.type);
      if (newFilters.status) params.set("status", newFilters.status);
      if (newFilters.stage) params.set("stage", newFilters.stage);
      if (newFilters.domain) params.set("domain", newFilters.domain);
      if (newFilters.project) params.set("project", newFilters.project);
      if (newFilters.module) params.set("module", newFilters.module);
      if (newFilters.feature) params.set("feature", newFilters.feature);
      if (newFilters.assigneeUserId) params.set("assignee", newFilters.assigneeUserId);
      
      return `${basePath}?${params.toString()}`;
    },
    [mode]
  );

  // 월 변경 시 서버에서 새 데이터 fetch (URL 파라미터 변경)
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    startTransition(() => {
      router.push(buildUrlWithParams(month, filters));
    });
  };

  // 필터 변경 시 URL 업데이트 (서버 사이드 필터링)
  const handleFiltersChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
      startTransition(() => {
        router.push(buildUrlWithParams(selectedMonth, newFilters));
      });
    },
    [selectedMonth, buildUrlWithParams, router]
  );

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

  // 간트 뷰용 날짜 범위 계산 (현재 월 기준 전, 현재, 후 개월)
  const getMultiMonthRange = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    // 선택된 월을 중심으로 전후 개월 포함
    const monthsBefore = Math.floor((monthRange - 1) / 2);
    const monthsAfter = monthRange - 1 - monthsBefore;
    
    const rangeStart = new Date(year, month - 1 - monthsBefore, 1);
    const rangeEnd = new Date(year, month + monthsAfter, 0); // 마지막 달의 마지막 일
    return { rangeStart, rangeEnd };
  };

  const { rangeStart, rangeEnd } = getMultiMonthRange();

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
      {/* 모드 배너 */}
      {isAdmin ? (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "linear-gradient(135deg, rgba(247, 109, 87, 0.08), rgba(249, 235, 178, 0.05))",
            border: "1px solid rgba(247, 109, 87, 0.15)",
            color: "#c94a3a",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span className="font-medium">관리자 전용 관리 화면</span>
          <span style={{ color: "var(--notion-text-muted)" }}>— 계획을 생성, 수정, 삭제할 수 있습니다.</span>
        </div>
      ) : (
        <div
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: "rgba(107, 114, 128, 0.06)",
            border: "1px solid rgba(107, 114, 128, 0.1)",
            color: "#6b7280",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-medium">읽기 전용</span>
          <span style={{ color: "var(--notion-text-muted)" }}>— 계획을 조회만 할 수 있습니다.</span>
        </div>
      )}

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

          {/* 개월 수 선택 (간트 뷰에서만 표시) */}
          {viewMode === "gantt" && (
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{
                background: "var(--notion-bg-secondary)",
                border: "1px solid var(--notion-border)",
              }}
            >
              {([3, 4, 5, 6] as MonthRangeOption[]).map((num) => (
                <button
                  key={num}
                  onClick={() => setMonthRange(num)}
                  className="px-2.5 py-1.5 text-xs font-medium transition-colors"
                  style={{
                    background: monthRange === num ? "var(--notion-bg)" : "transparent",
                    color: monthRange === num ? "var(--notion-text)" : "var(--notion-text-muted)",
                    boxShadow: monthRange === num ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                  }}
                >
                  {num}개월
                </button>
              ))}
            </div>
          )}

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
            onFiltersChange={handleFiltersChange}
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
