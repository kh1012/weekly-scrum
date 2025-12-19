import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

/**
 * /feedbacks 페이지 로딩 상태
 *
 * Next.js가 자동으로 Suspense boundary를 적용하여
 * 서버 데이터 로딩 중에 이 컴포넌트를 표시합니다.
 */
export default function FeedbacksLoading() {
  return (
    <LogoLoadingSpinner
      title="피드백을 불러오는 중입니다"
      description="잠시만 기다려주세요."
      className="min-h-[calc(100vh-5rem)]"
    />
  );
}

