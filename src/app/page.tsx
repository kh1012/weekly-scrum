"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLastVisitedPage } from "@/components/weekly-scrum/common/LayoutWrapper";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

const DEFAULT_PAGE = "/work-map";

export default function Home() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);

  useEffect(() => {
    // localStorage에서 마지막 방문 페이지 확인
    const lastVisited = getLastVisitedPage();
    const targetPage = lastVisited || DEFAULT_PAGE;

    // 리다이렉트
    router.replace(targetPage);
    setIsRedirecting(false);
  }, [router]);

  // 리다이렉트 중 로딩 표시
  if (isRedirecting) {
    return (
      <LogoLoadingSpinner
        title="페이지 로딩 중..."
        description=""
        className="min-h-screen"
      />
    );
  }

  return null;
}
