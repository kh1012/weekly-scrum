/**
 * 루트 레벨 로딩 상태
 * 앱 전체의 초기 로딩 시 표시
 */

import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <LogoLoadingSpinner
        className="h-auto"
      />
    </div>
  );
}
