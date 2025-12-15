"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// NProgress 설정
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.1,
});

/**
 * 페이지 네비게이션 시 상단에 프로그레스 바 표시
 * - 클라이언트 사이드 네비게이션 감지
 * - NProgress 라이브러리 사용
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 경로 변경 시 프로그레스 완료
    NProgress.done();
  }, [pathname, searchParams]);

  return null;
}

/**
 * 프로그래매틱하게 프로그레스 시작/종료
 */
export const navigationProgress = {
  start: () => NProgress.start(),
  done: () => NProgress.done(),
};

