import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

/**
 * Admin 페이지 로딩 상태
 */
export default function AdminLoading() {
  return (
    <LogoLoadingSpinner
      title="로딩 중..."
      description=""
      className="min-h-[50vh]"
    />
  );
}
