/**
 * (scrum) 그룹의 모든 페이지 로딩 상태
 * 서버에서 데이터를 가져오는 동안 전체 페이지 로딩 스피너 표시
 */

import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <LogoLoadingSpinner
        className="h-auto"
      />
    </div>
  );
}
