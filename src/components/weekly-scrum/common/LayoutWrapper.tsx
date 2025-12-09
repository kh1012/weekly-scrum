"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect } from "react";
import { Header, Sidebar } from "./Header";

interface LayoutWrapperProps {
  children: ReactNode;
}

// max-w-full을 적용할 페이지 경로
const FULL_WIDTH_PAGES = ["/matrix", "/quadrant", "/work-map", "/snapshots"];

// localStorage 키
const LAST_VISITED_PAGE_KEY = "weekly-scrum-last-visited-page";

// 저장 대상 페이지 목록 (복원 가능한 페이지)
const SAVEABLE_PAGES = [
  "/work-map",
  "/snapshots",
  "/cards",
  "/matrix",
  "/quadrant",
  "/summary",
  "/collaboration",
  "/projects",
  "/risks",
  "/my",
  "/report",
  "/releases",
];

export function getLastVisitedPage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_VISITED_PAGE_KEY);
  } catch {
    return null;
  }
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 현재 경로를 localStorage에 저장
  useEffect(() => {
    if (
      SAVEABLE_PAGES.some((p) => pathname === p || pathname.startsWith(p + "/"))
    ) {
      try {
        localStorage.setItem(LAST_VISITED_PAGE_KEY, pathname);
      } catch {
        // localStorage 사용 불가 시 무시
      }
    }
  }, [pathname]);

  return (
    <div className="min-h-screen" style={{ background: "var(--notion-bg)" }}>
      {/* PC 사이드바 */}
      <Sidebar isOpen={isSidebarOpen} />

      {/* 메인 영역 */}
      <div
        className={`transition-all duration-200 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <Header
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        {children}
      </div>
    </div>
  );
}

// Main 컨텐츠 래퍼 (경로에 따라 max-width 변경)
export function MainContent({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // 전체 너비를 사용하는 페이지 확인
  const useFullWidth = FULL_WIDTH_PAGES.some(
    (p) => pathname === p || pathname === p + "/"
  );

  return (
    <main
      className={`mx-auto px-4 py-6 sm:px-6 lg:px-8 ${
        useFullWidth ? "max-w-full" : "max-w-6xl"
      }`}
    >
      {children}
    </main>
  );
}
