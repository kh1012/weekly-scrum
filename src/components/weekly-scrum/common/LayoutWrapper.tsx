"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect, Suspense } from "react";
import { Header, Sidebar } from "./Header";
import { NavigationProgress } from "./NavigationProgress";
import type { WorkspaceRole } from "@/lib/auth/getWorkspaceRole";

interface LayoutWrapperProps {
  children: ReactNode;
  /** 현재 유저의 workspace role */
  role?: WorkspaceRole;
}

// max-w-full을 적용할 페이지 경로
const FULL_WIDTH_PAGES = [
  "/matrix",
  "/quadrant",
  "/work-map",
  "/snapshots",
  "/manage",
  "/manage/snapshots",
  "/calendar",
  "/my",
  "/admin",
  "/plans",
];

// 동적 경로 패턴 (하위 경로 모두 포함)
const FULL_WIDTH_DYNAMIC_PATTERNS = [
  "/manage/snapshots/",
  "/admin/",
];

// padding 없는 페이지 경로
const NO_PADDING_PAGES = ["/calendar", "/my", "/manage/snapshots"];

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

export function LayoutWrapper({ children, role }: LayoutWrapperProps) {
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
      {/* 네비게이션 프로그레스 바 */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>

      {/* PC 사이드바 */}
      <Sidebar isOpen={isSidebarOpen} role={role} />

      {/* 메인 영역 */}
      <div
        className={`transition-all duration-200 ${
          isSidebarOpen ? "lg:ml-64" : "lg:ml-0"
        }`}
      >
        <Header
          isSidebarOpen={isSidebarOpen}
          onSidebarToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          role={role}
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
  const useFullWidth =
    FULL_WIDTH_PAGES.some((p) => pathname === p || pathname === p + "/") ||
    FULL_WIDTH_DYNAMIC_PATTERNS.some((pattern) => pathname.startsWith(pattern));

  // padding 없는 페이지 확인
  const useNoPadding = NO_PADDING_PAGES.some(
    (p) => pathname === p || pathname === p + "/"
  );

  return (
    <main
      className={`mx-auto ${useNoPadding ? "" : "px-4 py-6 sm:px-6 lg:px-8"} ${
        useFullWidth ? "max-w-full" : "max-w-6xl"
      }`}
    >
      {children}
    </main>
  );
}
