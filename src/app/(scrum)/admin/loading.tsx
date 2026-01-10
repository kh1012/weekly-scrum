import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

/**
 * Admin 페이지 로딩 상태
 */
export default function AdminLoading() {
  return (
    <LogoLoadingSpinner
      className="min-h-[50vh]"
    />
  );
}
