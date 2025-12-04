"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    key: "summary",
    label: "요약",
    href: "/weekly-scrum/summary",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    key: "cards",
    label: "카드",
    href: "/weekly-scrum/cards",
    icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
  },
  {
    key: "projects",
    label: "프로젝트",
    href: "/weekly-scrum/projects",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  },
  {
    key: "matrix",
    label: "매트릭스",
    href: "/weekly-scrum/matrix",
    icon: "M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
  },
  {
    key: "quadrant",
    label: "사분면",
    href: "/weekly-scrum/quadrant",
    icon: "M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z",
  },
  {
    key: "risks",
    label: "리스크",
    href: "/weekly-scrum/risks",
    icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  },
  {
    key: "insights",
    label: "인사이트",
    href: "/insights",
    icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  },
  {
    key: "shares",
    label: "Shares",
    href: "/shares",
    icon: "M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z",
  },
];

export function Navigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/weekly-scrum/summary") {
      return pathname === "/weekly-scrum" || pathname === "/weekly-scrum/summary";
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="flex items-center gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            isActive(item.href)
              ? "bg-[#f6f8fa] text-[#1f2328]"
              : "text-[#656d76] hover:text-[#1f2328] hover:bg-[#f6f8fa]"
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

