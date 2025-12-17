import { LogoLoadingSpinner } from "@/components/weekly-scrum/common";

/**
 * Admin Plans 페이지 로딩 상태
 */
export default function PlansLoading() {
  return (
    <LogoLoadingSpinner
      title="간트 차트 로딩 중"
      description="계획 데이터를 불러오고 있습니다."
    />
  );
}
