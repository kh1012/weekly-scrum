"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVisitorCount } from "@/hooks/useVisitorCount";

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
    label: "구조 탐색",
    items: [
      {
        key: "work-map",
        label: "Work Map",
        href: "/work-map",
        emoji: "🗺️",
        description: "Project → Module → Feature",
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
      { key: "snapshots", label: "스냅샷 뷰어", href: "/snapshots", emoji: "📸" },
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
    items: [{ key: "shares", label: "Shares", href: "/shares", emoji: "📣" }],
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

  return (
    <div
      className="h-full flex flex-col"
      style={{ background: "var(--notion-sidebar-bg)" }}
    >
      {/* Header */}
      <div className="px-3 py-3 flex items-center gap-2">
        <span
          className="font-semibold text-sm"
          style={{ color: "var(--notion-text)" }}
        >
          Weekly Scrum
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            background: "var(--notion-accent-light)",
            color: "var(--notion-accent)",
          }}
        >
          v2
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {NAV_CATEGORIES.map((category) => (
          <div key={category.key} className="mb-3">
            <div
              className="px-2 py-1.5 text-xs font-medium"
              style={{ color: "var(--notion-text-muted)" }}
            >
              {category.label}
            </div>
            <div className="space-y-0.5">
              {category.items.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onItemClick}
                  className={`notion-sidebar-item ${
                    isActive(item.href) ? "active" : ""
                  }`}
                >
                  <span className="text-base w-5 text-center">
                    {item.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="block">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer with Visitor Count */}
      <div
        className="px-3 py-3 border-t"
        style={{ borderColor: "var(--notion-border)" }}
      >
        <div className="flex items-center justify-between">
          <div
            className="text-xs"
            style={{ color: "var(--notion-text-muted)" }}
          >
            v2.0
          </div>
          <div
            className="flex items-center gap-1.5 text-xs"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <span>👀</span>
            {isLoading ? (
              <span className="inline-block w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>{count.toLocaleString()}</span>
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
      className="flex items-center gap-0.5 px-1 py-1 rounded"
      style={{ background: "var(--notion-bg-secondary)" }}
    >
      {priorityItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded transition-all ${
            isActive(item.href) ? "font-medium" : ""
          }`}
          style={{
            background: isActive(item.href)
              ? "var(--notion-bg)"
              : "transparent",
            color: isActive(item.href)
              ? "var(--notion-text)"
              : "var(--notion-text-secondary)",
            boxShadow: isActive(item.href)
              ? "rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 2px 4px"
              : "none",
          }}
        >
          <span>{item.emoji}</span>
          <span>{item.label}</span>
        </Link>
      ))}
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
    <nav className="grid grid-cols-4 gap-1 p-1">
      {mobileItems.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={onItemClick}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded transition-all"
          style={{
            background: isActive(item.href)
              ? "var(--notion-bg-active)"
              : "transparent",
            color: isActive(item.href)
              ? "var(--notion-text)"
              : "var(--notion-text-secondary)",
          }}
        >
          <span className="text-lg">{item.emoji}</span>
          <span className="text-xs truncate w-full text-center">
            {item.label}
          </span>
        </Link>
      ))}
    </nav>
  );
}
