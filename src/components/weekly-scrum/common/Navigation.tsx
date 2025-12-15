"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVisitorCount } from "@/hooks/useVisitorCount";
import { RELEASES } from "../releases/releaseData";
import type { WorkspaceRole } from "@/lib/auth/getWorkspaceRole";

// localStorage 키
const SNB_COLLAPSED_KEY = "snb-collapsed-categories-v2";

interface NavItem {
  key: string;
  label: string;
  href: string;
  emoji: string;
  description?: string;
}

interface NavCategory {
  key: string;
  label: string;
  items: NavItem[];
  /** admin/owner만 볼 수 있는 섹션인지 */
  adminOnly?: boolean;
}

/**
 * SNB 메뉴 구조 (update.md 요구사항 반영)
 * - 업무: Work Map, Calendar, Snapshots
 * - 개인공간: Manage
 * - 관리자: Admin Dashboard, All Snapshots, Plans (조건부)
 * - 기타: Release Notes
 */
const BASE_NAV_CATEGORIES: NavCategory[] = [
  {
    key: "work",
    label: "업무",
    items: [
      {
        key: "work-map",
        label: "Work Map",
        href: "/work-map",
        emoji: "🗺️",
      },
      {
        key: "calendar",
        label: "Calendar",
        href: "/calendar",
        emoji: "📅",
      },
      {
        key: "snapshots",
        label: "Snapshots",
        href: "/snapshots",
        emoji: "📸",
      },
    ],
  },
  {
    key: "personal",
    label: "개인공간",
    items: [
      {
        key: "manage",
        label: "Manage",
        href: "/manage",
        emoji: "✏️",
        description: "내 스냅샷 관리",
      },
    ],
  },
  {
    key: "admin",
    label: "관리자",
    adminOnly: true,
    items: [
      {
        key: "admin-dashboard",
        label: "Dashboard",
        href: "/admin",
        emoji: "🏠",
      },
      {
        key: "admin-snapshots",
        label: "All Snapshots",
        href: "/admin/snapshots",
        emoji: "📋",
      },
      {
        key: "admin-plans",
        label: "Plans",
        href: "/admin/plans",
        emoji: "📆",
      },
    ],
  },
  {
    key: "extra",
    label: "기타",
    items: [
      {
        key: "releases",
        label: "릴리즈 노트",
        href: "/releases",
        emoji: "📝",
      },
    ],
  },
];

/**
 * role에 따라 메뉴 필터링
 */
function getNavCategories(role: WorkspaceRole): NavCategory[] {
  const isAdmin = role === "admin" || role === "leader";

  return BASE_NAV_CATEGORIES.filter((category) => {
    if (category.adminOnly && !isAdmin) {
      return false;
    }
    return true;
  });
}

function useIsActive() {
  const pathname = usePathname();

  return (href: string) => {
    // 정확히 일치하거나 하위 경로인 경우
    if (href === "/admin") {
      return pathname === "/admin" || pathname === "/admin/";
    }
    if (pathname === href || pathname === href + "/") {
      return true;
    }
    // /admin/snapshots는 /admin/snapshots/xxx도 활성화
    if (href !== "/" && pathname.startsWith(href + "/")) {
      return true;
    }
    return false;
  };
}

// Notion 스타일 Side Navigation
interface SideNavigationProps {
  onItemClick?: () => void;
  /** 현재 유저의 workspace role */
  role?: WorkspaceRole;
}

export function SideNavigation({
  onItemClick,
  role = "member",
}: SideNavigationProps) {
  const isActive = useIsActive();
  const { count, isLoading } = useVisitorCount();

  // role에 따른 메뉴 구성
  const navCategories = getNavCategories(role);

  // 기본적으로 접혀있는 카테고리
  const defaultCollapsed = ["extra"];

  // 접힌 카테고리 상태
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(defaultCollapsed)
  );
  const [isInitialized, setIsInitialized] = useState(false);

  // localStorage에서 상태 불러오기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SNB_COLLAPSED_KEY);
      if (stored) {
        setCollapsedCategories(new Set(JSON.parse(stored)));
      }
    } catch {
      // 무시
    }
    setIsInitialized(true);
  }, []);

  // 상태 저장
  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem(
        SNB_COLLAPSED_KEY,
        JSON.stringify(Array.from(collapsedCategories))
      );
    } catch {
      // 무시
    }
  }, [collapsedCategories, isInitialized]);

  // 카테고리 토글
  const toggleCategory = (key: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div className="h-full flex flex-col" style={{ background: "transparent" }}>
      {/* Header */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
          >
            {/* Background */}
            <rect width="64" height="64" rx="12" fill="#F76D57"/>
            
            {/* Popcorn/Ice cream top (cream color) */}
            <g transform="translate(3, 2) scale(0.9)">
              <path fill="#F9EBB2" d="M56,13.998c-1.237,0-2.387-0.375-3.343-1.018c-0.671-0.451-1.242-1.037-1.685-1.715
                c-0.055,0.82-0.352,1.564-0.825,2.174c-0.731,0.941-1.862,1.559-3.147,1.559c-0.839,0-1.616-0.262-2.26-0.703
                c-0.594-0.408-1.065-0.975-1.369-1.635c-0.328,0.658-0.772,1.248-1.309,1.742c-1.069,0.988-2.493,1.596-4.062,1.596
                c-1.583,0-3.02-0.619-4.092-1.619c-0.498-0.467-0.917-1.014-1.233-1.625c-0.429,0.533-0.948,0.986-1.532,1.348
                c-0.915,0.564-1.989,0.896-3.143,0.896c-2.048,0-3.854-1.029-4.937-2.596c-0.412-0.596-0.715-1.27-0.89-1.994
                c-0.437,0.572-1.015,1.027-1.693,1.299c-0.459,0.184-0.956,0.291-1.48,0.291c-2.209,0-4-1.791-4-4s1.791-4,4-4
                c0.839,0,1.616,0.26,2.26,0.703c0.594,0.406,1.065,0.975,1.369,1.637c0.327-0.662,0.771-1.25,1.308-1.746
                C25.006,3.605,26.431,2.998,28,2.998c1.583,0,3.02,0.617,4.092,1.619c0.498,0.467,0.917,1.014,1.233,1.623
                c0.429-0.531,0.948-0.986,1.532-1.348C35.772,4.328,36.846,3.998,38,3.998c0.445,0,0.878,0.053,1.296,0.145
                c0.675,0.148,1.305,0.412,1.873,0.768c0.188-0.66,0.524-1.26,0.996-1.732c0.725-0.729,1.727-1.18,2.835-1.18
                c1.729,0,3.188,1.104,3.747,2.641c0.08,0.221,0.145,0.449,0.185,0.684c0.503,0.17,0.978,0.402,1.41,0.693
                c0.143-0.406,0.326-0.791,0.548-1.15c1.056-1.719,2.946-2.867,5.11-2.867c3.313,0,6,2.686,6,6C62,11.311,59.313,13.998,56,13.998z"/>
            </g>
            
            {/* Container base (coral) */}
            <rect x="16" y="22" width="32" height="38" rx="3" fill="#F76D57"/>
            
            {/* Container lines (dark) */}
            <line x1="26" y1="24" x2="26" y2="56" stroke="#394240" strokeWidth="2"/>
            <line x1="32" y1="24" x2="32" y2="56" stroke="#394240" strokeWidth="2"/>
            <line x1="38" y1="24" x2="38" y2="56" stroke="#394240" strokeWidth="2"/>
          </svg>
        </div>
        <span
          className="font-semibold text-base"
          style={{
            color: "var(--notion-text)",
          }}
        >
          Weekly Scrum
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {navCategories.map((category, categoryIndex) => {
          const isCollapsed = collapsedCategories.has(category.key);
          const hasActiveItem = category.items.some((item) =>
            isActive(item.href)
          );
          const itemCount = category.items.length;
          const isAdminSection = category.adminOnly;

          return (
            <div
              key={category.key}
              className="mb-3 animate-slide-in-left"
              style={{ animationDelay: `${categoryIndex * 0.05}s` }}
            >
              {/* 카테고리 헤더 (클릭 가능) */}
              <button
                onClick={() => toggleCategory(category.key)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group"
                style={{
                  background:
                    hasActiveItem && isCollapsed
                      ? isAdminSection
                        ? "rgba(239, 68, 68, 0.05)"
                        : "rgba(59, 130, 246, 0.05)"
                      : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  <svg
                    className="w-3 h-3 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{
                      color: isAdminSection
                        ? "rgba(239, 68, 68, 0.6)"
                        : "var(--notion-text-muted)",
                      transform: isCollapsed
                        ? "rotate(-90deg)"
                        : "rotate(0deg)",
                    }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      color: isAdminSection
                        ? "rgba(239, 68, 68, 0.8)"
                        : "var(--notion-text-muted)",
                    }}
                  >
                    {category.label}
                  </span>
                  {isAdminSection && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "rgb(239, 68, 68)",
                      }}
                    >
                      Admin
                    </span>
                  )}
                </div>
                {isCollapsed && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full transition-all duration-200"
                    style={{
                      background: hasActiveItem
                        ? isAdminSection
                          ? "rgba(239, 68, 68, 0.15)"
                          : "rgba(59, 130, 246, 0.15)"
                        : "var(--notion-bg-secondary)",
                      color: hasActiveItem
                        ? isAdminSection
                          ? "rgb(239, 68, 68)"
                          : "#3b82f6"
                        : "var(--notion-text-muted)",
                    }}
                  >
                    {itemCount}
                  </span>
                )}
              </button>

              {/* 아이템 목록 */}
              <div
                className="transition-all duration-300 ease-out"
                style={{
                  maxHeight: isCollapsed ? "0px" : `${itemCount * 56 + 8}px`,
                  opacity: isCollapsed ? 0 : 1,
                  overflow: "hidden",
                  marginTop: isCollapsed ? "0px" : "4px",
                }}
              >
                <div className="space-y-1">
                  {category.items.map((item) => {
                    const active = isActive(item.href);
                    const accentColor = isAdminSection
                      ? "rgb(239, 68, 68)"
                      : "#3b82f6";
                    const accentBg = isAdminSection
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(59, 130, 246, 0.1)";

                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={onItemClick}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                        style={{
                          background: active ? accentBg : "transparent",
                          color: active
                            ? accentColor
                            : "var(--notion-text-secondary)",
                          transform: active
                            ? "translateX(2px)"
                            : "translateX(0)",
                        }}
                        onMouseEnter={(e) => {
                          if (!active) {
                            e.currentTarget.style.background =
                              "rgba(0, 0, 0, 0.03)";
                            e.currentTarget.style.transform = "translateX(4px)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!active) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.transform = "translateX(0)";
                          }
                        }}
                      >
                        <span
                          className="text-lg w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
                          style={{
                            background: active
                              ? isAdminSection
                                ? "rgba(239, 68, 68, 0.15)"
                                : "rgba(59, 130, 246, 0.15)"
                              : "transparent",
                          }}
                        >
                          {item.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span
                            className="block text-sm font-medium transition-colors duration-200"
                            style={{
                              color: active
                                ? accentColor
                                : "var(--notion-text)",
                            }}
                          >
                            {item.label}
                          </span>
                          {item.description && (
                            <span
                              className="block text-[10px] mt-0.5 truncate"
                              style={{ color: "var(--notion-text-muted)" }}
                            >
                              {item.description}
                            </span>
                          )}
                        </div>
                        {active && (
                          <div
                            className="w-1.5 h-1.5 rounded-full animate-pulse"
                            style={{ background: accentColor }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer with Visitor Count */}
      <div
        className="px-5 py-4 border-t"
        style={{ borderColor: "rgba(0, 0, 0, 0.05)" }}
      >
        <div className="flex items-center justify-between">
          <div
            className="text-xs font-medium px-2 py-1 rounded-lg"
            style={{
              color: "var(--notion-text-muted)",
              background: "var(--notion-bg-secondary)",
            }}
          >
            v{RELEASES[0]?.version ?? "2.0"}
          </div>
          <div
            className="flex items-center gap-2 text-xs px-2 py-1 rounded-lg transition-all duration-200"
            style={{
              color: "var(--notion-text-muted)",
              background: "var(--notion-bg-secondary)",
            }}
          >
            <span>👀</span>
            {isLoading ? (
              <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="font-medium">{count.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 모바일 네비게이션
interface MobileNavigationProps {
  onItemClick?: () => void;
  role?: WorkspaceRole;
}

export function MobileNavigation({
  onItemClick,
  role = "member",
}: MobileNavigationProps) {
  const isActive = useIsActive();
  const navCategories = getNavCategories(role);

  // 모바일에서는 주요 메뉴만 표시
  const mobileItems = navCategories
    .flatMap((cat) => cat.items)
    .filter((item) =>
      ["work-map", "calendar", "snapshots", "manage", "releases"].includes(
        item.key
      )
    );

  return (
    <nav className="grid grid-cols-4 gap-2 p-2">
      {mobileItems.map((item, index) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            onClick={onItemClick}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all duration-200 animate-scale-in"
            style={{
              background: active ? "rgba(59, 130, 246, 0.1)" : "transparent",
              color: active ? "#3b82f6" : "var(--notion-text-secondary)",
              animationDelay: `${index * 0.03}s`,
            }}
          >
            <span
              className="text-xl w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: active
                  ? "rgba(59, 130, 246, 0.15)"
                  : "var(--notion-bg-secondary)",
              }}
            >
              {item.emoji}
            </span>
            <span
              className="text-[11px] font-medium truncate w-full text-center"
              style={{
                color: active ? "#3b82f6" : "var(--notion-text-secondary)",
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
