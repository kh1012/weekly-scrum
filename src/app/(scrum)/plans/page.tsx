import { PlansBoard } from "@/components/plans";
import { listPlansForMonth, listPlansWithoutDates, getFilterOptions } from "@/lib/data/plans";
import { listWorkspaceMembers } from "@/lib/data/members";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PageProps {
  searchParams: Promise<{ month?: string }>;
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
 * Plans 목록 페이지 (Read-only)
 * - 모든 로그인 사용자 접근 가능
 * - 조회만 가능, CRUD 기능 없음
 */
export default async function PlansPage({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // 현재 월 기본값
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const selectedMonth = params.month || defaultMonth;
  
  const { monthStart, monthEnd } = getMonthBounds(selectedMonth);

  // 데이터 병렬 조회
  const [plans, undatedPlans, filterOptions, members] = await Promise.all([
    listPlansForMonth({
      workspaceId: DEFAULT_WORKSPACE_ID,
      monthStart,
      monthEnd,
    }),
    listPlansWithoutDates({
      workspaceId: DEFAULT_WORKSPACE_ID,
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
      mode="readonly"
      initialPlans={plans}
      undatedPlans={undatedPlans}
      filterOptions={filterOptions}
      members={members}
      initialMonth={selectedMonth}
    />
  );
}

