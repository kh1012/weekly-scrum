import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

/**
 * /my 페이지 로딩 상태
 *
 * Next.js가 자동으로 Suspense boundary를 적용하여
 * 서버 데이터 로딩 중에 이 컴포넌트를 표시합니다.
 * - MIDAS 로고 로딩 스피너
 * - 상단 NProgress 바 (NavigationProgress에서 처리)
 */
export default function MyPageLoading() {
  return (
    <LogoLoadingSpinner
      title="대시보드를 불러오는 중입니다"
      description="잠시만 기다려주세요."
      className="min-h-[calc(100vh-5rem)]"
    />
  );
}
