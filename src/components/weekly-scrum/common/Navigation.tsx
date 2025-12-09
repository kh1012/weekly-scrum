"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVisitorCount } from "@/hooks/useVisitorCount";
import { RELEASES } from "../releases/releaseData";

// 기본적으로 접혀있는 카테고리 키
const COLLAPSED_BY_DEFAULT = ["analysis", "views", "personal"];
const SNB_COLLAPSED_KEY = "snb-collapsed-categories";

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
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    key: "structure",
    label: "구조탐색 (v2)",
    items: [
      {
        key: "work-map",
        label: "Work Map",
        href: "/work-map",
        emoji: "🗺️",
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
    key: "analysis",
    label: "분석",
    items: [
      { key: "summary", label: "요약", href: "/summary", emoji: "📊" },
      { key: "quadrant", label: "사분면", href: "/quadrant", emoji: "🎯" },
      { key: "risks", label: "리스크", href: "/risks", emoji: "⚠️" },
      {
        key: "collaboration",
        label: "팀 협업",
        href: "/collaboration",
        emoji: "🤝",
      },
    ],
  },
  {
    key: "views",
    label: "뷰",
    items: [
      { key: "cards", label: "카드", href: "/cards", emoji: "🗂" },
      { key: "projects", label: "프로젝트", href: "/projects", emoji: "📁" },
      { key: "matrix", label: "매트릭스", href: "/matrix", emoji: "📋" },
    ],
  },
  {
    key: "personal",
    label: "개인화",
    items: [
      { key: "my", label: "개인 대시보드", href: "/my", emoji: "👤" },
      { key: "report", label: "개인 리포트", href: "/report", emoji: "📋" },
    ],
  },
  {
    key: "extra",
    label: "추가 기능",
    items: [
      { key: "shares", label: "Shares", href: "/shares", emoji: "📣" },
      { key: "releases", label: "릴리즈 노트", href: "/releases", emoji: "📝" },
    ],
  },
];

// 플랫 아이템 (하위 호환용)
const NAV_ITEMS: NavItem[] = NAV_CATEGORIES.flatMap((cat) => cat.items);

function useIsActive() {
  const pathname = usePathname();

  return (href: string) => {
    if (href === "/summary") {
      return (
        pathname === "/" || pathname === "/summary" || pathname === "/summary/"
      );
    }
    return pathname === href || pathname === href + "/";
  };
}

// Notion 스타일 Side Navigation
interface SideNavigationProps {
  onItemClick?: () => void;
}

export function SideNavigation({ onItemClick }: SideNavigationProps) {
  const isActive = useIsActive();
  const { count, isLoading } = useVisitorCount();
  const pathname = usePathname();

  // 접힌 카테고리 상태
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(COLLAPSED_BY_DEFAULT)
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

  // 현재 활성화된 아이템이 있는 카테고리는 자동 펼침
  useEffect(() => {
    NAV_CATEGORIES.forEach((category) => {
      const hasActiveItem = category.items.some((item) => isActive(item.href));
      if (hasActiveItem && collapsedCategories.has(category.key)) {
        setCollapsedCategories((prev) => {
          const next = new Set(prev);
          next.delete(category.key);
          return next;
        });
      }
    });
  }, [pathname]);

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
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
          style={{
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            color: "white",
            fontWeight: 700,
          }}
        >
          W
        </div>
        <span
          className="font-bold text-base tracking-tight"
          style={{
            color: "var(--notion-text)",
            letterSpacing: "-0.02em",
          }}
        >
          Weekly Scrum
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {NAV_CATEGORIES.map((category, categoryIndex) => {
          const isCollapsed = collapsedCategories.has(category.key);
          const hasActiveItem = category.items.some((item) =>
            isActive(item.href)
          );
          const itemCount = category.items.length;

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
                      ? "rgba(59, 130, 246, 0.05)"
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
                      color: "var(--notion-text-muted)",
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
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    {category.label}
                  </span>
                </div>
                {isCollapsed && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded-full transition-all duration-200"
                    style={{
                      background: hasActiveItem
                        ? "rgba(59, 130, 246, 0.15)"
                        : "var(--notion-bg-secondary)",
                      color: hasActiveItem
                        ? "#3b82f6"
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
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        onClick={onItemClick}
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200"
                        style={{
                          background: active
                            ? "rgba(59, 130, 246, 0.1)"
                            : "transparent",
                          color: active
                            ? "#3b82f6"
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
                              ? "rgba(59, 130, 246, 0.15)"
                              : "transparent",
                          }}
                        >
                          {item.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span
                            className="block text-sm font-medium transition-colors duration-200"
                            style={{
                              color: active ? "#3b82f6" : "var(--notion-text)",
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
                            style={{ background: "#3b82f6" }}
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

// 기존 Navigation (하위 호환용)
export function Navigation() {
  const isActive = useIsActive();

  // 우선순위: Work Map, 요약, 사분면, 리스크, 팀 협업, 개인
  const priorityItems = [
    NAV_ITEMS.find((i) => i.key === "work-map"),
    NAV_ITEMS.find((i) => i.key === "summary"),
    NAV_ITEMS.find((i) => i.key === "quadrant"),
    NAV_ITEMS.find((i) => i.key === "risks"),
    NAV_ITEMS.find((i) => i.key === "collaboration"),
    NAV_ITEMS.find((i) => i.key === "my"),
  ].filter(Boolean) as NavItem[];

  return (
    <nav
      className="flex items-center gap-1 px-1.5 py-1.5 rounded-xl"
      style={{
        background: "var(--notion-bg-secondary)",
        boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.02)",
      }}
    >
      {priorityItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.key}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all duration-200 interactive-btn"
            style={{
              background: active ? "white" : "transparent",
              color: active ? "#3b82f6" : "var(--notion-text-secondary)",
              boxShadow: active
                ? "0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)"
                : "none",
              fontWeight: active ? 600 : 500,
            }}
          >
            <span className="text-base">{item.emoji}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

// 모바일 네비게이션
interface MobileNavigationProps {
  onItemClick?: () => void;
}

export function MobileNavigation({ onItemClick }: MobileNavigationProps) {
  const isActive = useIsActive();

  // 모바일 우선순위 메뉴
  const mobileItems = [
    NAV_ITEMS.find((i) => i.key === "work-map"),
    NAV_ITEMS.find((i) => i.key === "summary"),
    NAV_ITEMS.find((i) => i.key === "quadrant"),
    NAV_ITEMS.find((i) => i.key === "risks"),
    NAV_ITEMS.find((i) => i.key === "collaboration"),
    NAV_ITEMS.find((i) => i.key === "cards"),
    NAV_ITEMS.find((i) => i.key === "my"),
    NAV_ITEMS.find((i) => i.key === "shares"),
  ].filter(Boolean) as NavItem[];

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
