"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import NProgress from "nprogress";

// NProgress 설정
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.1,
});

// 클라이언트 마운트 상태 추적
let isClientMounted = false;

/**
 * 페이지 네비게이션 시 상단에 프로그레스 바 표시
 * - 클라이언트 사이드 네비게이션 감지
 * - NProgress 라이브러리 사용
 * - SSR에서 실행되지 않도록 보호
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);

  // 클라이언트에서만 마운트 확인
  useEffect(() => {
    setMounted(true);
    isClientMounted = true;
    // 초기 마운트 시 프로그레스 완료 (SSR에서 시작된 경우 대비)
    NProgress.done();
  }, []);

  useEffect(() => {
    if (!mounted) return;
    // 경로 변경 시 프로그레스 완료
    NProgress.done();
  }, [pathname, searchParams, mounted]);

  return null;
}

/**
 * 프로그래매틱하게 프로그레스 시작/종료
 * SSR에서는 동작하지 않도록 보호
 */
export const navigationProgress = {
  start: () => {
    // 클라이언트에서만 실행
    if (typeof window !== "undefined" && isClientMounted) {
      NProgress.start();
    }
  },
  done: () => {
    // 클라이언트에서만 실행
    if (typeof window !== "undefined") {
      NProgress.done();
    }
  },
};

