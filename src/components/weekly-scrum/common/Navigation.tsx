"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  key: string;
  label: string;
  href: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "summary", label: "요약", href: "/summary" },
  { key: "cards", label: "카드", href: "/cards" },
  { key: "projects", label: "프로젝트", href: "/projects" },
  { key: "matrix", label: "매트릭스", href: "/matrix" },
  { key: "quadrant", label: "사분면", href: "/quadrant" },
  { key: "risks", label: "리스크", href: "/risks" },
  { key: "my", label: "개인 대시보드", href: "/my" },
];

const EXTRA_ITEMS: NavItem[] = [
  { key: "insights", label: "인사이트", href: "/insights" },
  { key: "shares", label: "공유사항", href: "/shares" },
];

function useIsActive() {
  const pathname = usePathname();
  
  return (href: string) => {
    if (href === "/summary") {
      return pathname === "/" || pathname === "/summary" || pathname === "/summary/";
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

  return (
    <div className="h-full flex flex-col" style={{ background: 'var(--notion-sidebar-bg)' }}>
      {/* Header */}
      <div className="px-3 py-3 flex items-center gap-2">
        <span className="font-semibold text-sm" style={{ color: 'var(--notion-text)' }}>
          Weekly Scrum
        </span>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-2 py-1">
        {/* 메인 메뉴 */}
        <div className="mb-4">
          <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--notion-text-muted)' }}>
            대시보드
          </div>
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={onItemClick}
                className={`notion-sidebar-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 추가 메뉴 */}
        <div>
          <div className="px-2 py-1.5 text-xs font-medium" style={{ color: 'var(--notion-text-muted)' }}>
            추가 기능
          </div>
          <div className="space-y-0.5">
            {EXTRA_ITEMS.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                onClick={onItemClick}
                className={`notion-sidebar-item ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="flex-1">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--notion-border)' }}>
        <div className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>
          v1.0
        </div>
      </div>
    </div>
  );
}

// 기존 Navigation (하위 호환용)
export function Navigation() {
  const isActive = useIsActive();

  return (
    <nav className="flex items-center gap-0.5 px-1 py-1 rounded" style={{ background: 'var(--notion-bg-secondary)' }}>
      {NAV_ITEMS.slice(0, 6).map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded transition-all ${
            isActive(item.href)
              ? "font-medium"
              : ""
          }`}
          style={{
            background: isActive(item.href) ? 'var(--notion-bg)' : 'transparent',
            color: isActive(item.href) ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
            boxShadow: isActive(item.href) ? 'rgba(15, 15, 15, 0.1) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 2px 4px' : 'none',
          }}
        >
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

  return (
    <nav className="grid grid-cols-4 gap-1 p-1">
      {NAV_ITEMS.slice(0, 8).map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={onItemClick}
          className="flex flex-col items-center gap-1 px-2 py-2 rounded transition-all"
          style={{
            background: isActive(item.href) ? 'var(--notion-bg-active)' : 'transparent',
            color: isActive(item.href) ? 'var(--notion-text)' : 'var(--notion-text-secondary)',
          }}
        >
          <span className="text-xs truncate w-full text-center">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
