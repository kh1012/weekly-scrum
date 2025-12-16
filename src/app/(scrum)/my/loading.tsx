import { DashboardSkeleton } from "@/components/weekly-scrum/my/DashboardSkeleton";

/**
 * /my 페이지 로딩 상태
 *
 * Next.js가 자동으로 Suspense boundary를 적용하여
 * 서버 데이터 로딩 중에 이 컴포넌트를 표시합니다.
 * - 대시보드 레이아웃 스켈레톤
 * - 중앙 로딩 스피너
 * - 상단 NProgress 바 (NavigationProgress에서 처리)
 */
export default function MyPageLoading() {
  return <DashboardSkeleton />;
}
