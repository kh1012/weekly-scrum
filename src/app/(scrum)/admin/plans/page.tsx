import { PlansBoard } from "@/components/plans";
import { listPlansForMonth, listPlansWithoutDates, getFilterOptions } from "@/lib/data/plans";
import type { PlanFilters, PlanType, PlanStatus } from "@/lib/data/plans";
import { listWorkspaceMembers } from "@/lib/data/members";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PageProps {
  searchParams: Promise<{
    month?: string;
    type?: string;
    status?: string;
    stage?: string;
    project?: string;
    module?: string;
    feature?: string;
    assignee?: string;
  }>;
}

/**
 * 월의 시작일과 종료일 계산
 */
function getMonthBounds(monthStr: string): { monthStart: string; monthEnd: string } {
  const [year, month] = monthStr.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0); // 해당 월의 마지막 날

  return {
    monthStart: start.toISOString().split("T")[0],
    monthEnd: end.toISOString().split("T")[0],
  };
}

/**
 * URL params에서 필터 객체 생성
 */
function parseFiltersFromParams(params: Awaited<PageProps["searchParams"]>): PlanFilters {
  const filters: PlanFilters = {};
  
  if (params.type) filters.type = params.type as PlanType;
  if (params.status) filters.status = params.status as PlanStatus;
  if (params.stage) filters.stage = params.stage;
  if (params.project) filters.project = params.project;
  if (params.module) filters.module = params.module;
  if (params.feature) filters.feature = params.feature;
  if (params.assignee) filters.assigneeUserId = params.assignee;
  
  return filters;
}

/**
 * Admin Plans 목록 페이지 (CRUD 가능)
 * - admin/leader만 접근 가능 (layout.tsx에서 가드)
 * - URL params로 필터 상태 관리
 */
export default async function AdminPlansPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // 현재 월 기본값
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = params.month || defaultMonth;
  
  const { monthStart, monthEnd } = getMonthBounds(selectedMonth);
  
  // URL params에서 필터 파싱
  const filters = parseFiltersFromParams(params);

  // 데이터 병렬 조회 (서버 사이드 필터링)
  const [plans, undatedPlans, filterOptions, members] = await Promise.all([
    listPlansForMonth({
      workspaceId: DEFAULT_WORKSPACE_ID,
      monthStart,
      monthEnd,
      filters,
    }),
    listPlansWithoutDates({
      workspaceId: DEFAULT_WORKSPACE_ID,
      filters,
    }),
    getFilterOptions({
      workspaceId: DEFAULT_WORKSPACE_ID,
    }),
    listWorkspaceMembers({
      workspaceId: DEFAULT_WORKSPACE_ID,
    }),
  ]);

  return (
    <PlansBoard
      mode="admin"
      initialPlans={plans}
      undatedPlans={undatedPlans}
      filterOptions={filterOptions}
      members={members}
      initialMonth={selectedMonth}
      initialFilters={filters}
    />
  );
}
