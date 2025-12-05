"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
  description?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "summary",
    label: "요약",
    href: "/summary",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    description: "전체 현황 요약",
  },
  {
    key: "cards",
    label: "카드",
    href: "/cards",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
    description: "개별 항목 카드 뷰",
  },
  {
    key: "projects",
    label: "프로젝트",
    href: "/projects",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
    description: "프로젝트별 그룹 뷰",
  },
  {
    key: "matrix",
    label: "매트릭스",
    href: "/matrix",
    icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
    description: "멤버 × 프로젝트 매트릭스",
  },
  {
    key: "quadrant",
    label: "사분면",
    href: "/quadrant",
    icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
    description: "진행률-리스크 사분면",
  },
  {
    key: "risks",
    label: "리스크",
    href: "/risks",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    description: "리스크 집중 뷰",
  },
  {
    key: "insights",
    label: "인사이트",
    href: "/insights",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    description: "AI 인사이트 분석",
  },
  {
    key: "shares",
    label: "Shares",
    href: "/shares",
    icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
    description: "리더 공유 사항",
  },
];

function useIsActive() {
  const pathname = usePathname();
  
  return (href: string) => {
    if (href === "/summary") {
      return pathname === "/" || pathname === "/summary";
    }
    return pathname.startsWith(href);
  };
}

// Side Navigation (Drawer)
interface SideNavigationProps {
  onItemClick?: () => void;
}

export function SideNavigation({ onItemClick }: SideNavigationProps) {
  const isActive = useIsActive();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Weekly Scrum</h2>
            <p className="text-xs text-slate-500">대시보드 메뉴</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={onItemClick}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group ${
                isActive(item.href)
                  ? "bg-blue-50 text-blue-600"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                isActive(item.href)
                  ? "bg-blue-100"
                  : "bg-slate-100 group-hover:bg-slate-200"
              }`}>
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
                    d={item.icon}
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                {item.description && (
                  <div className={`text-xs truncate ${
                    isActive(item.href) ? "text-blue-500" : "text-slate-400"
                  }`}>
                    {item.description}
                  </div>
                )}
              </div>
              {isActive(item.href) && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              )}
            </Link>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="text-xs text-slate-400 text-center">
          Weekly Scrum Dashboard v1.0
        </div>
      </div>
    </div>
  );
}

// 기존 Navigation (deprecated - 하위 호환용)
export function Navigation() {
  const isActive = useIsActive();

  return (
    <nav className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
            isActive(item.href)
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={item.icon}
            />
          </svg>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

// 모바일 네비게이션 (deprecated - SideNavigation 사용)
interface MobileNavigationProps {
  onItemClick?: () => void;
}

export function MobileNavigation({ onItemClick }: MobileNavigationProps) {
  const isActive = useIsActive();

  return (
    <nav className="grid grid-cols-4 gap-2">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={onItemClick}
          className={`flex flex-col items-center gap-1.5 px-2 py-2.5 text-xs font-medium rounded-xl transition-all ${
            isActive(item.href)
              ? "bg-blue-50 text-blue-600"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
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
              d={item.icon}
            />
          </svg>
          <span className="truncate">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
