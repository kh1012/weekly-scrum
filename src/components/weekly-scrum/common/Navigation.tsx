"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVisitorCount } from "@/hooks/useVisitorCount";
import { RELEASES } from "../releases/releaseData";
import type { WorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import { Logo } from "./Logo";
import { navigationProgress } from "./NavigationProgress";
import { LiquidGlassTag } from "@/components/common/LiquidGlassTag";

// localStorage 키
const SNB_COLLAPSED_KEY = "snb-collapsed-categories-v2";

/** 네비게이션 아이템 */
interface NavItem {
  key: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  badge?: string;
}

/** 네비게이션 카테고리 */
interface NavCategory {
  key: string;
  label: string;
  items: NavItem[];
  adminOnly?: boolean;
}

// Font Awesome 스타일 아이콘 컴포넌트들
const Icons = {
  mapLocation: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
      <path d="M408 120c0 54.6-73.1 151.9-105.2 192c-7.7 9.6-22 9.6-29.6 0C241.1 271.9 168 174.6 168 120C168 53.7 221.7 0 288 0s120 53.7 120 120zm8 80.4c3.5-6.9 6.7-13.8 9.6-20.6c.5-1.2 1-2.5 1.5-3.7l116-46.4C558.9 123.4 576 135 576 152l0 270.8c0 9.8-6 18.6-15.1 22.3L416 503l0-302.6zM137.6 138.3c2.4 14.1 7.2 28.3 12.8 41.5c2.9 6.8 6.1 13.7 9.6 20.6l0 251.4L32.9 502.7C17.1 509 0 497.4 0 480.4L0 209.6c0-9.8 6-18.6 15.1-22.3l122.6-49zM327.8 332c13.9-17.4 35.7-45.7 56.2-77l0 249.3-192 54.9 0-248.4c20.5 31.3 42.3 59.6 56.2 77c20.5 25.6 59.1 25.6 79.6 0zM288 152a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
    </svg>
  ),
  cameraRetro: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M220.6 121.2L271.1 96 448 96l0 96-114.8 0c-21.9-15.1-48.5-24-77.2-24s-55.2 8.9-77.2 24L64 192l0-64 128 0c9.9 0 19.7-2.3 28.6-6.8zM0 128L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L271.1 32c-9.9 0-19.7 2.3-28.6 6.8L192 64l-32 0 0-16c0-8.8-7.2-16-16-16L80 32c-8.8 0-16 7.2-16 16l0 16-64 0zm256 208a64 64 0 1 0 0-128 64 64 0 1 0 0 128z" />
    </svg>
  ),
  calendarDays: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
      <path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z" />
    </svg>
  ),
  house: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
      <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 0 160c0 35.3-28.7 64-64 64l-320 0c-35.3 0-64-28.7-64-64l0-160-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" />
    </svg>
  ),
  penToSquare: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L680 180.1 576 76z" />
    </svg>
  ),
  listCheck: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
    </svg>
  ),
  table: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M64 256l0-96 160 0 0 96L64 256zm0 64l160 0 0 96L64 416l0-96zm224 96l0-96 160 0 0 96-160 0zM448 256l-160 0 0-96 160 0 0 96zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z" />
    </svg>
  ),
  scroll: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
      <path d="M0 80l0 48c0 17.7 14.3 32 32 32l16 0 48 0 0-80c0-26.5-21.5-48-48-48S0 53.5 0 80zM112 32c10 13.4 16 30 16 48l0 304c0 35.3 28.7 64 64 64s64-28.7 64-64l0-5.3c0-32.4 26.3-58.7 58.7-58.7L480 320l0-192c0-53-43-96-96-96L112 32zM464 480c61.9 0 112-50.1 112-112c0-8.8-7.2-16-16-16l-245.3 0c-14.7 0-26.7 11.9-26.7 26.7l0 5.3c0 53-43 96-96 96l176 0 96 0z" />
    </svg>
  ),
  comments: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 640 512">
      <path d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9c0 0 0 0 0 0s0 0 0 0l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 640 512">
      <path d="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z" />
    </svg>
  ),
};

/**
 * SNB 메뉴 구조 - GitHub 스타일
 */
const BASE_NAV_CATEGORIES: NavCategory[] = [
  {
    key: "community",
    label: "Community",
    items: [
      {
        key: "feedbacks",
        label: "Feedbacks",
        href: "/feedbacks",
        icon: Icons.comments,
        badge: "HOT",
      },
    ],
  },
  {
    key: "work",
    label: "Works",
    items: [
      {
        key: "team-feed",
        label: "Team Feed",
        href: "/team-feed",
        icon: Icons.users,
        badge: "NEW",
      },
      {
        key: "plans",
        label: "Plans",
        href: "/plans/gantt",
        icon: Icons.calendarDays,
      },
      {
        key: "snapshots",
        label: "Snapshots",
        href: "/snapshots",
        icon: Icons.cameraRetro,
      },
      {
        key: "work-map",
        label: "Work Map",
        href: "/work-map",
        icon: Icons.mapLocation,
      },
    ],
  },
  {
    key: "personal",
    label: "Personal Space",
    items: [
      {
        key: "my-dashboard",
        label: "Dashboard",
        href: "/my",
        icon: Icons.house,
      },
      {
        key: "my-snapshots",
        label: "Snapshot Management",
        href: "/manage/snapshots",
        icon: Icons.penToSquare,
      },
    ],
  },
  {
    key: "admin",
    label: "Admin Space",
    adminOnly: true,
    items: [
      {
        key: "admin-dashboard",
        label: "Dashboard",
        href: "/admin",
        icon: Icons.house,
      },
      {
        key: "admin-calendar",
        label: "Weekly Log",
        href: "/calendar",
        icon: Icons.calendarDays,
      },
      {
        key: "admin-plans",
        label: "Plans Management",
        href: "/admin/plans",
        icon: Icons.calendarDays,
      },
      {
        key: "admin-meta-options",
        label: "Meta Options",
        href: "/admin/meta-options",
        icon: Icons.table,
      },
      {
        key: "admin-snapshots",
        label: "All Snapshots",
        href: "/admin/snapshots",
        icon: Icons.listCheck,
        disabled: true,
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
        icon: Icons.scroll,
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

/**
 * GitHub 스타일 Side Navigation
 */
interface SideNavigationProps {
  onItemClick?: () => void;
  role?: WorkspaceRole;
}

export function SideNavigation({
  onItemClick,
  role = "member",
}: SideNavigationProps) {
  const isActive = useIsActive();
  const { count, isLoading } = useVisitorCount();
  const navCategories = getNavCategories(role);

  // 접힌 카테고리 상태
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(["extra"])
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
    <div className="h-full flex flex-col bg-white">
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {navCategories.map((category) => {
          const isCollapsed = collapsedCategories.has(category.key);
          const isAdminSection = category.adminOnly;

          return (
            <div key={category.key} className="mb-4">
              {/* 카테고리 헤더 */}
              <button
                onClick={() => toggleCategory(category.key)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-[#57606a] hover:text-[#24292f] transition-colors"
              >
                <span className="uppercase">{category.label}</span>
                <svg
                  className={`w-3 h-3 transition-transform ${
                    isCollapsed ? "-rotate-90" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* 메뉴 아이템 */}
              {!isCollapsed && (
                <div className="mt-1 space-y-1">
                  {category.items.map((item) => {
                    const active = isActive(item.href);
                    const isDisabled = item.disabled;

                    return (
                      <Link
                        key={item.key}
                        href={isDisabled ? "#" : item.href}
                        onClick={() => {
                          if (isDisabled) return;
                          if (!active) navigationProgress.start();
                          onItemClick?.();
                        }}
                        className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                          isDisabled
                            ? "opacity-50 cursor-not-allowed"
                            : active
                            ? "bg-[#f6f8fa] text-[#24292f] font-semibold"
                            : "text-[#57606a] hover:bg-[#f6f8fa] hover:text-[#24292f]"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <LiquidGlassTag
                            variant={
                              item.badge === "NEW"
                                ? "green"
                                : item.badge === "HOT"
                                ? "pink"
                                : "gray"
                            }
                            shimmer
                          >
                            {item.badge}
                          </LiquidGlassTag>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: 버전 + 방문자 수 */}
      <div className="shrink-0 px-4 py-3 border-t border-[#d0d7de]">
        <div className="flex items-center justify-between text-xs text-[#57606a]">
          <div className="px-2 py-1 bg-[#f6f8fa] rounded-md">
            v{RELEASES[0]?.version ?? "2.0"}
          </div>
          <div className="flex items-center gap-2 px-2 py-1 bg-[#f6f8fa] rounded-md">
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

// 모바일 네비게이션은 제거됨 (drawer로 대체)
export function MobileNavigation() {
  return null;
}
