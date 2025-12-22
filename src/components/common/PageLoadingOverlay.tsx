"use client";

import { useEffect, useState } from "react";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

/**
 * 페이지 초기 로딩 시 전체 화면 로딩 오버레이
 * SSR 단계와 하이드레이션 완료 사이의 시간을 커버
 */
export function PageLoadingOverlay() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 하이드레이션이 완료되면 로딩 상태 해제
    setIsLoading(false);
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      style={{ pointerEvents: "none" }}
    >
      <LogoLoadingSpinner
        title="페이지를 불러오는 중입니다"
        description="잠시만 기다려주세요."
        className="h-auto"
      />
    </div>
  );
}
