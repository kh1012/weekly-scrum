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

interface NavItem {
  key: string;
  label: string;
  href: string;
  emoji: string;
  icon?: React.ReactNode; // Font Awesome 스타일 SVG 아이콘
  description?: string;
  disabled?: boolean;
  isNew?: boolean; // New 태그 표시
}

// Font Awesome 스타일 아이콘 컴포넌트들
const Icons = {
  // 업무 > Work Map (fa-map-location-dot)
  mapLocation: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
      <path d="M408 120c0 54.6-73.1 151.9-105.2 192c-7.7 9.6-22 9.6-29.6 0C241.1 271.9 168 174.6 168 120C168 53.7 221.7 0 288 0s120 53.7 120 120zm8 80.4c3.5-6.9 6.7-13.8 9.6-20.6c.5-1.2 1-2.5 1.5-3.7l116-46.4C558.9 123.4 576 135 576 152l0 270.8c0 9.8-6 18.6-15.1 22.3L416 503l0-302.6zM137.6 138.3c2.4 14.1 7.2 28.3 12.8 41.5c2.9 6.8 6.1 13.7 9.6 20.6l0 251.4L32.9 502.7C17.1 509 0 497.4 0 480.4L0 209.6c0-9.8 6-18.6 15.1-22.3l122.6-49zM327.8 332c13.9-17.4 35.7-45.7 56.2-77l0 249.3-192 54.9 0-248.4c20.5 31.3 42.3 59.6 56.2 77c20.5 25.6 59.1 25.6 79.6 0zM288 152a40 40 0 1 0 0-80 40 40 0 1 0 0 80z" />
    </svg>
  ),
  // 업무 > Flow (fa-arrows-rotate)
  arrowsRotate: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" />
    </svg>
  ),
  // 업무 > Snapshots (fa-camera-retro)
  cameraRetro: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M220.6 121.2L271.1 96 448 96l0 96-114.8 0c-21.9-15.1-48.5-24-77.2-24s-55.2 8.9-77.2 24L64 192l0-64 128 0c9.9 0 19.7-2.3 28.6-6.8zM0 128L0 416c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L271.1 32c-9.9 0-19.7 2.3-28.6 6.8L192 64l-32 0 0-16c0-8.8-7.2-16-16-16L80 32c-8.8 0-16 7.2-16 16l0 16-64 0zm256 208a64 64 0 1 0 0-128 64 64 0 1 0 0 128z" />
    </svg>
  ),
  // 업무 > Plans (fa-calendar-days)
  calendarDays: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
      <path d="M128 0c17.7 0 32 14.3 32 32l0 32 128 0 0-32c0-17.7 14.3-32 32-32s32 14.3 32 32l0 32 48 0c26.5 0 48 21.5 48 48l0 48L0 160l0-48C0 85.5 21.5 64 48 64l48 0 0-32c0-17.7 14.3-32 32-32zM0 192l448 0 0 272c0 26.5-21.5 48-48 48L48 512c-26.5 0-48-21.5-48-48L0 192zm64 80l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm128 0l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zM64 400l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16zm144-16c-8.8 0-16 7.2-16 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0zm112 16l0 32c0 8.8 7.2 16 16 16l32 0c8.8 0 16-7.2 16-16l0-32c0-8.8-7.2-16-16-16l-32 0c-8.8 0-16 7.2-16 16z" />
    </svg>
  ),
  // 개인공간 > Dashboard (fa-house)
  house: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
      <path d="M575.8 255.5c0 18-15 32.1-32 32.1l-32 0 0 160c0 35.3-28.7 64-64 64l-320 0c-35.3 0-64-28.7-64-64l0-160-32 0c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z" />
    </svg>
  ),
  // 개인공간 > 스냅샷 관리 (fa-pen-to-square)
  penToSquare: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M471.6 21.7c-21.9-21.9-57.3-21.9-79.2 0L362.3 51.7l97.9 97.9 30.1-30.1c21.9-21.9 21.9-57.3 0-79.2L471.6 21.7zm-299.2 220c-6.1 6.1-10.8 13.6-13.5 21.9l-29.6 88.8c-2.9 8.6-.6 18.1 5.8 24.6s15.9 8.7 24.6 5.8l88.8-29.6c8.2-2.7 15.7-7.4 21.9-13.5L680 180.1 576 76z" />
    </svg>
  ),
  // 관리자 > All Snapshots (fa-list-check)
  listCheck: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
      <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z" />
    </svg>
  ),
  // 기타 > 릴리즈 노트 (fa-scroll)
  scroll: (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 576 512">
      <path d="M0 80l0 48c0 17.7 14.3 32 32 32l16 0 48 0 0-80c0-26.5-21.5-48-48-48S0 53.5 0 80zM112 32c10 13.4 16 30 16 48l0 304c0 35.3 28.7 64 64 64s64-28.7 64-64l0-5.3c0-32.4 26.3-58.7 58.7-58.7L480 320l0-192c0-53-43-96-96-96L112 32zM464 480c61.9 0 112-50.1 112-112c0-8.8-7.2-16-16-16l-245.3 0c-14.7 0-26.7 11.9-26.7 26.7l0 5.3c0 53-43 96-96 96l176 0 96 0z" />
    </svg>
  ),
};

interface NavCategory {
  key: string;
  label: string;
  items: NavItem[];
  /** admin/owner만 볼 수 있는 섹션인지 */
  adminOnly?: boolean;
}

/**
 * SNB 메뉴 구조 (update2.md 요구사항 반영)
 * - 업무: Work Map, Flow, Snapshots, Plans (전원 조회 전용)
 * - 개인공간: Manage
 * - 관리자: Admin Dashboard, All Snapshots, All Plans (CRUD)
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
        icon: Icons.mapLocation,
      },
      {
        key: "calendar",
        label: "Flow",
        href: "/calendar",
        emoji: "🔄",
        icon: Icons.arrowsRotate,
      },
      {
        key: "plans",
        label: "Plans",
        href: "/plans/gantt",
        emoji: "📆",
        icon: Icons.calendarDays,
        isNew: true,
      },
      {
        key: "snapshots",
        label: "Snapshots",
        href: "/snapshots",
        emoji: "📸",
        icon: Icons.cameraRetro,
      },
    ],
  },
  {
    key: "personal",
    label: "개인공간",
    items: [
      {
        key: "my-dashboard",
        label: "Dashboard",
        href: "/my",
        emoji: "🏠",
        icon: Icons.house,
        description: "개인 대시보드",
      },
      {
        key: "my-snapshots",
        label: "스냅샷 관리",
        href: "/manage/snapshots",
        emoji: "✏️",
        icon: Icons.penToSquare,
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
        icon: Icons.house,
        isNew: true,
      },
      {
        key: "admin-plans",
        label: "All Plans",
        href: "/admin/plans",
        emoji: "📆",
        icon: Icons.calendarDays,
        description: "일정 계획 관리",
        isNew: true,
      },
      {
        key: "admin-snapshots",
        label: "All Snapshots",
        href: "/admin/snapshots",
        emoji: "📋",
        icon: Icons.listCheck,
        description: "Coming Soon",
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
        emoji: "📝",
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
        <Logo size={32} />
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
                        ? "rgba(247, 109, 87, 0.7)"
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
                        ? "#F76D57"
                        : "var(--notion-text-muted)",
                    }}
                  >
                    {category.label}
                  </span>
                  {isAdminSection && (
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(247, 109, 87, 0.15), rgba(249, 235, 178, 0.3))",
                        color: "#F76D57",
                        border: "1px solid rgba(247, 109, 87, 0.2)",
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
                          ? "rgba(247, 109, 87, 0.15)"
                          : "rgba(59, 130, 246, 0.15)"
                        : "var(--notion-bg-secondary)",
                      color: hasActiveItem
                        ? isAdminSection
                          ? "#F76D57"
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
                    const accentColor = isAdminSection ? "#F76D57" : "#3b82f6";
                    const accentBg = isAdminSection
                      ? "rgba(247, 109, 87, 0.1)"
                      : "rgba(59, 130, 246, 0.1)";

                    // disabled 상태 처리
                    if (item.disabled) {
                      return (
                        <div
                          key={item.key}
                          className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-not-allowed opacity-50"
                          title={item.description || "Coming Soon"}
                        >
                          <span
                            className="w-7 h-7 flex items-center justify-center rounded-lg"
                            style={{
                              background: "transparent",
                              color: "var(--notion-text-muted)",
                            }}
                          >
                            {item.icon || item.emoji}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-medium"
                                style={{ color: "var(--notion-text-muted)" }}
                              >
                                {item.label}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500">
                                Coming Soon
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={() => {
                          if (!active) navigationProgress.start();
                          onItemClick?.();
                        }}
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
                          className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
                          style={{
                            background: active
                              ? isAdminSection
                                ? "linear-gradient(135deg, rgba(247, 109, 87, 0.2), rgba(249, 235, 178, 0.15))"
                                : "rgba(59, 130, 246, 0.15)"
                              : "transparent",
                            color: active
                              ? accentColor
                              : "var(--notion-text-muted)",
                          }}
                        >
                          {item.icon || item.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="text-sm font-medium transition-colors duration-200"
                              style={{
                                color: active
                                  ? accentColor
                                  : "var(--notion-text)",
                              }}
                            >
                              {item.label}
                            </span>
                            {item.isNew && (
                              <LiquidGlassTag
                                variant="purple"
                                shimmer
                                className="ml-2"
                              >
                                New
                              </LiquidGlassTag>
                            )}
                          </div>
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
      ["work-map", "calendar", "snapshots", "plans", "manage"].includes(
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
            onClick={() => {
              if (!active) navigationProgress.start();
              onItemClick?.();
            }}
            className="flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl transition-all duration-200 animate-scale-in"
            style={{
              background: active ? "rgba(59, 130, 246, 0.1)" : "transparent",
              color: active ? "#3b82f6" : "var(--notion-text-secondary)",
              animationDelay: `${index * 0.03}s`,
            }}
          >
            <span
              className="w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
              style={{
                background: active
                  ? "rgba(59, 130, 246, 0.15)"
                  : "var(--notion-bg-secondary)",
                color: active ? "#3b82f6" : "var(--notion-text-muted)",
              }}
            >
              {item.icon || item.emoji}
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
