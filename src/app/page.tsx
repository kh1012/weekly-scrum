"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getLastVisitedPage } from "@/components/weekly-scrum/common/LayoutWrapper";

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
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--notion-bg)" }}
      >
        <div className="text-center">
          <div
            className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"
          />
          <p className="text-sm" style={{ color: "var(--notion-text-muted)" }}>
            페이지 로딩 중...
          </p>
        </div>
      </div>
    );
  }

  return null;
}
