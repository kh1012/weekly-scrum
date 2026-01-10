"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useState, useEffect, Suspense } from "react";
import { Header } from "./Header";
import { NavigationProgress } from "./NavigationProgress";
import { SideNavigation } from "./Navigation";
import { Logo } from "./Logo";
import { TelemetryProvider } from "@/components/telemetry/TelemetryProvider";
import type { WorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import type { MenuSetting } from "@/lib/data/menu";
import type { MenuViewCount } from "@/lib/data/menu";
import type { MenuStats } from "@/lib/data/menu";
import type { MenuNewCount } from "@/lib/data/menu";

interface LayoutWrapperProps {
  children: ReactNode;
  /** 현재 유저의 workspace role */
  role?: WorkspaceRole;
  /** 현재 워크스페이스 ID (텔레메트리용) */
  workspaceId?: string;
  /** 현재 사용자 ID */
  userId?: string;
  /** 메뉴 설정 */
  menuSettings?: MenuSetting[];
  /** 메뉴 조회수 */
  menuViewCounts?: MenuViewCount[];
  /** 메뉴별 통계 */
  menuStats?: MenuStats;
  /** 메뉴별 새 데이터 개수 */
  menuNewCounts?: MenuNewCount[];
}

// max-w-full을 적용할 페이지 경로
const FULL_WIDTH_PAGES = [
  "/works/work-map",
  "/works/collaborator-graph",
  "/works/snapshots",
  "/manage",
  "/manage/snapshots",
  "/my",
  "/admin",
  "/works/plans",
  "/works/team-feed",
];

// 동적 경로 패턴 (하위 경로 모두 포함)
const FULL_WIDTH_DYNAMIC_PATTERNS = [
  "/manage/snapshots/",
  "/admin/",
  "/works/plans/gantt",
  "/feedbacks",
  "/works/team-feed",
  "/my/alignment",
  "/works/alignment",
  "/profile/settings",
  "/works/figma-files",
];

// padding 없는 페이지 경로
const NO_PADDING_PAGES = [
  "/my",
  "/feedbacks",
  "/works/team-feed",
  "/works/collaborator-graph",
  "/admin/meta-options",
  "/manage/snapshots",
];

// padding 없는 동적 경로 패턴
const NO_PADDING_DYNAMIC_PATTERNS = [
  "/manage/snapshots/",
  "/works/plans/gantt",
  "/admin/plans/gantt",
  "/admin",
  "/feedbacks",
  "/my/alignment",
  "/works/alignment",
  "/profile/settings",
  "/works/figma-files",
];

// localStorage 키
const LAST_VISITED_PAGE_KEY = "weekly-scrum-last-visited-page";

// 저장 대상 페이지 목록 (복원 가능한 페이지)
const SAVEABLE_PAGES = [
  "/works/work-map",
  "/works/snapshots",
  "/my",
  "/releases",
  "/works/team-feed",
];

export function getLastVisitedPage(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(LAST_VISITED_PAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * GitHub 스타일 Drawer Navigation
 */
interface DrawerNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  role?: WorkspaceRole;
  workspaceId?: string;
  userId?: string;
  menuSettings?: MenuSetting[];
  menuViewCounts?: MenuViewCount[];
  menuStats?: MenuStats;
  menuNewCounts?: MenuNewCount[];
}

function DrawerNavigation({
  isOpen,
  onClose,
  role,
  workspaceId,
  userId,
  menuSettings,
  menuViewCounts,
  menuStats,
  menuNewCounts,
}: DrawerNavigationProps) {
  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay - GitHub 스타일 */}
      <div
        className="fixed inset-0 z-[45] animate-fade-in"
        style={{ backgroundColor: "#c8d1da66" }}
        onClick={onClose}
        aria-label="메뉴 닫기"
      />

      {/* Drawer - GitHub 스타일 */}
      <aside
        className="fixed top-0 left-0 h-full w-[280px] sm:w-[320px] bg-white z-[60] flex flex-col animate-slide-in-left"
        style={{
          borderTopRightRadius: "12px",
          borderBottomRightRadius: "12px",
          boxShadow:
            "rgba(0, 0, 0, 0.1) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 5px 10px, rgba(0, 0, 0, 0.08) 0px 15px 40px",
        }}
      >
        {/* 헤더 - 고정 */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[#d0d7de] shrink-0">
          <div className="flex items-center gap-2">
            <Logo className="w-6 h-6" />
            <span className="text-base font-semibold text-[#24292f]">
              Weekly Scrum
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-md text-[#57606a] hover:bg-[#f6f8fa] transition-colors"
            aria-label="메뉴 닫기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* 네비게이션 - 스크롤 가능 영역 */}
        <div className="flex-1 overflow-y-auto py-2">
          <SideNavigation
            onItemClick={onClose}
            role={role}
            workspaceId={workspaceId}
            userId={userId}
            menuSettings={menuSettings}
            menuViewCounts={menuViewCounts}
            menuStats={menuStats}
            menuNewCounts={menuNewCounts}
          />
        </div>
      </aside>
    </>
  );
}

export function LayoutWrapper({
  children,
  role,
  workspaceId,
  userId,
  menuSettings,
  menuViewCounts,
  menuStats,
  menuNewCounts,
}: LayoutWrapperProps) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  // 페이지 변경 시 메뉴 닫기
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <TelemetryProvider workspaceId={workspaceId || ""}>
      <div className="min-h-screen bg-white">
        {/* 네비게이션 프로그레스 바 */}
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>

        {/* GNB */}
        <Header onMenuOpen={() => setIsMenuOpen(true)} role={role} />

        {/* Drawer SNB */}
        <DrawerNavigation
          isOpen={isMenuOpen}
          onClose={() => setIsMenuOpen(false)}
          role={role}
          workspaceId={workspaceId}
          userId={userId}
          menuSettings={menuSettings}
          menuViewCounts={menuViewCounts}
          menuStats={menuStats}
          menuNewCounts={menuNewCounts}
        />

        {/* 메인 영역 */}
        <div className="w-full">{children}</div>
      </div>
    </TelemetryProvider>
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
  const useNoPadding =
    NO_PADDING_PAGES.some((p) => pathname === p || pathname === p + "/") ||
    NO_PADDING_DYNAMIC_PATTERNS.some((pattern) => pathname.startsWith(pattern));

  // GNB 높이: h-16 (4rem = 64px)
  return (
    <main
      className={`mx-auto ${
        useNoPadding
          ? "h-[calc(100vh-4rem)] overflow-y-auto"
          : "px-4 py-6 sm:px-6 lg:px-8"
      } ${useFullWidth ? "max-w-full" : "max-w-6xl"}`}
    >
      {children}
    </main>
  );
}
