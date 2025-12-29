"use client";

/**
 * Menu/Page Usage Analytics Dashboard (Client)
 * 
 * Displays 3 tables:
 * A) Weekly menu usage (by menu_group/menu_key/event_type)
 * B) Weekly page usage (by page_path)
 * C) User menu usage (by user + menu_key)
 */

import { useState, useRef, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import type {
  MenuUsageWeekly,
  PageUsageWeekly,
  UserMenuUsageWeekly,
} from "@/lib/data/menuUsage";

interface MenuUsageClientProps {
  menuUsage: MenuUsageWeekly[];
  pageUsage: PageUsageWeekly[];
  userMenuUsage: UserMenuUsageWeekly[];
  initialWeeks: number;
  initialMenuGroup?: string;
  initialEventType?: string;
}

export function MenuUsageClient({
  menuUsage,
  pageUsage,
  userMenuUsage,
  initialWeeks,
  initialMenuGroup,
  initialEventType,
}: MenuUsageClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"menu" | "page" | "user">("menu");
  
  // Filter states
  const [weeks, setWeeks] = useState(initialWeeks);
  const [menuGroup, setMenuGroup] = useState(initialMenuGroup || "");
  const [eventType, setEventType] = useState(initialEventType || "");

  const handleApplyFilters = () => {
    const params = new URLSearchParams();
    params.set("weeks", weeks.toString());
    if (menuGroup) params.set("menuGroup", menuGroup);
    if (eventType) params.set("eventType", eventType);
    router.push(`/admin/menu-usage?${params.toString()}`);
  };

  const handleResetFilters = () => {
    setWeeks(8);
    setMenuGroup("");
    setEventType("");
    router.push("/admin/menu-usage");
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#24292f]">Menu Usage Analytics</h1>
            <p className="text-sm mt-1 text-[#57606a]">
              실시간 메뉴/페이지 사용 분석 (최근 {initialWeeks}주)
            </p>
          </div>
        </div>

      {/* Filters */}
      <div className="p-4 bg-[#f6f8fa] border border-[#d0d7de] rounded-md space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Weeks */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              주차 범위
            </label>
            <CustomDropdown
              value={weeks.toString()}
              onChange={(val) => setWeeks(parseInt(val, 10))}
              options={[
                { value: "4", label: "최근 4주" },
                { value: "8", label: "최근 8주" },
                { value: "12", label: "최근 12주" },
              ]}
            />
          </div>

          {/* Menu Group */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              메뉴 그룹
            </label>
            <CustomDropdown
              value={menuGroup}
              onChange={setMenuGroup}
              options={[
                { value: "", label: "전체" },
                { value: "community", label: "Community" },
                { value: "works", label: "Works" },
                { value: "personal", label: "Personal" },
                { value: "admin", label: "Admin" },
                { value: "etc", label: "Etc" },
              ]}
            />
          </div>

          {/* Event Type */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              이벤트 타입
            </label>
            <CustomDropdown
              value={eventType}
              onChange={setEventType}
              options={[
                { value: "", label: "전체" },
                { value: "PAGE_VIEW", label: "PAGE_VIEW" },
                { value: "MENU_CLICK", label: "MENU_CLICK" },
              ]}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="px-4 py-2 text-sm font-medium text-white bg-[#0969da] hover:bg-[#0550ae] rounded-md transition-colors"
          >
            필터 적용
          </button>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 text-sm font-medium text-[#24292f] bg-white hover:bg-[#f6f8fa] border border-[#d0d7de] rounded-md transition-colors"
          >
            초기화
          </button>
        </div>
      </div>

      {/* Filter summary */}
      {(initialMenuGroup || initialEventType) && (
        <div className="flex items-center gap-2 p-3 bg-[#ddf4ff] border border-[#0969da]/20 rounded-md text-sm">
          <span className="text-[#0969da]">필터 적용:</span>
          {initialMenuGroup && (
            <span className="px-2 py-1 bg-white rounded text-[#24292f]">
              Group: {initialMenuGroup}
            </span>
          )}
          {initialEventType && (
            <span className="px-2 py-1 bg-white rounded text-[#24292f]">
              Type: {initialEventType}
            </span>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#d0d7de]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("menu")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "menu"
                ? "border-[#0969da] text-[#0969da]"
                : "border-transparent text-[#57606a] hover:text-[#24292f]"
            }`}
          >
            Menu Usage ({menuUsage.length})
          </button>
          <button
            onClick={() => setActiveTab("page")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "page"
                ? "border-[#0969da] text-[#0969da]"
                : "border-transparent text-[#57606a] hover:text-[#24292f]"
            }`}
          >
            Page Usage ({pageUsage.length})
          </button>
          <button
            onClick={() => setActiveTab("user")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "user"
                ? "border-[#0969da] text-[#0969da]"
                : "border-transparent text-[#57606a] hover:text-[#24292f]"
            }`}
          >
            User Activity ({userMenuUsage.length})
          </button>
        </div>
      </div>

        {/* Tables */}
        {activeTab === "menu" && <MenuUsageTable data={menuUsage} />}
        {activeTab === "page" && <PageUsageTable data={pageUsage} />}
        {activeTab === "user" && <UserMenuUsageTable data={userMenuUsage} />}
      </div>
    </div>
  );
}

/**
 * Custom Dropdown Component
 */
interface CustomDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

function CustomDropdown({ value, onChange, options }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  const buttonId = useId();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        const dropdown = document.getElementById(`dropdown-${buttonId}`);
        if (dropdown && !dropdown.contains(e.target as Node)) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, buttonId]);

  const selectedOption = options.find((opt) => opt.value === value);

  const dropdownContent = isOpen && mounted && buttonRef.current ? (
    <div
      id={`dropdown-${buttonId}`}
      className="fixed z-50 mt-1 bg-white rounded-md border border-[#d0d7de] py-1 max-h-60 overflow-y-auto min-w-[200px] animate-fadeIn"
      style={{
        top: `${buttonRef.current.getBoundingClientRect().bottom + window.scrollY}px`,
        left: `${buttonRef.current.getBoundingClientRect().left + window.scrollX}px`,
        width: `${buttonRef.current.offsetWidth}px`,
        boxShadow: "0 8px 24px rgba(140,149,159,0.2)",
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => {
            onChange(option.value);
            setIsOpen(false);
          }}
          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
            option.value === value
              ? "bg-[#ddf4ff] text-[#0969da] font-medium"
              : "text-[#24292f] hover:bg-[#f6f8fa]"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <button
        id={buttonId}
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da] flex items-center justify-between"
      >
        <span className="text-[#24292f]">{selectedOption?.label || "선택"}</span>
        <svg
          className={`w-4 h-4 text-[#57606a] transition-transform ${
            isOpen ? "rotate-180" : ""
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
      {mounted && createPortal(dropdownContent, document.body)}
    </>
  );
}

/**
 * Sortable Table Header
 */
interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: "asc" | "desc" } | null;
  onSort: (key: string) => void;
  align?: "left" | "right";
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align = "left",
}: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort.direction : null;

  return (
    <th
      className={`px-4 py-3 font-semibold text-[#24292f] cursor-pointer hover:bg-[#eaeef2] transition-colors ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${align === "right" ? "justify-end" : ""}`}>
        <span>{label}</span>
        <div className="flex flex-col">
          <svg
            className={`w-3 h-3 ${
              isActive && direction === "asc" ? "text-[#0969da]" : "text-[#d0d7de]"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M5 10l5-5 5 5H5z" />
          </svg>
          <svg
            className={`w-3 h-3 -mt-1 ${
              isActive && direction === "desc" ? "text-[#0969da]" : "text-[#d0d7de]"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M15 10l-5 5-5-5h10z" />
          </svg>
        </div>
      </div>
    </th>
  );
}

/**
 * Menu Usage Table
 */
function MenuUsageTable({ data }: { data: MenuUsageWeekly[] }) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    let aVal: any = a[key as keyof MenuUsageWeekly];
    let bVal: any = b[key as keyof MenuUsageWeekly];

    // Handle null values
    if (aVal === null) aVal = "";
    if (bVal === null) bVal = "";

    if (typeof aVal === "string") {
      return aVal.localeCompare(bVal) * multiplier;
    }
    return (aVal - bVal) * multiplier;
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-[#f6f8fa] rounded-md">
        <p className="text-[#57606a]">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#d0d7de] rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-[#f6f8fa] border-b border-[#d0d7de]">
          <tr>
            <SortableHeader
              label="그룹"
              sortKey="menu_group"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              label="메뉴"
              sortKey="menu_key"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              label="이벤트"
              sortKey="event_type"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              label="횟수"
              sortKey="event_count"
              currentSort={sortConfig}
              onSort={handleSort}
              align="right"
            />
            <SortableHeader
              label="사용자 수"
              sortKey="unique_users"
              currentSort={sortConfig}
              onSort={handleSort}
              align="right"
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d0d7de]">
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-[#f6f8fa] transition-colors"
            >
              <td className="px-4 py-3 text-[#24292f]">
                {row.menu_group || "-"}
              </td>
              <td className="px-4 py-3 text-[#24292f]">
                {row.menu_key || "-"}
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    row.event_type === "PAGE_VIEW"
                      ? "bg-[#ddf4ff] text-[#0969da]"
                      : "bg-[#fff8c5] text-[#9a6700]"
                  }`}
                >
                  {row.event_type}
                </span>
              </td>
              <td className="px-4 py-3 text-right font-medium text-[#24292f]">
                {row.event_count.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-[#57606a]">
                {row.unique_users.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Page Usage Table
 */
function PageUsageTable({ data }: { data: PageUsageWeekly[] }) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    const aVal: any = a[key as keyof PageUsageWeekly];
    const bVal: any = b[key as keyof PageUsageWeekly];

    if (typeof aVal === "string") {
      return aVal.localeCompare(bVal) * multiplier;
    }
    return (aVal - bVal) * multiplier;
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-[#f6f8fa] rounded-md">
        <p className="text-[#57606a]">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#d0d7de] rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-[#f6f8fa] border-b border-[#d0d7de]">
          <tr>
            <SortableHeader
              label="페이지 경로"
              sortKey="page_path"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              label="조회수"
              sortKey="event_count"
              currentSort={sortConfig}
              onSort={handleSort}
              align="right"
            />
            <SortableHeader
              label="사용자 수"
              sortKey="unique_users"
              currentSort={sortConfig}
              onSort={handleSort}
              align="right"
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d0d7de]">
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-[#f6f8fa] transition-colors"
            >
              <td className="px-4 py-3 font-mono text-xs text-[#24292f]">
                {row.page_path}
              </td>
              <td className="px-4 py-3 text-right font-medium text-[#24292f]">
                {row.event_count.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right text-[#57606a]">
                {row.unique_users.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * User Menu Usage Table
 */
function UserMenuUsageTable({ data }: { data: UserMenuUsageWeekly[] }) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;
    const multiplier = direction === "asc" ? 1 : -1;

    let aVal: any = a[key as keyof UserMenuUsageWeekly];
    let bVal: any = b[key as keyof UserMenuUsageWeekly];

    // Handle null values
    if (aVal === null) aVal = "";
    if (bVal === null) bVal = "";

    if (typeof aVal === "string") {
      return aVal.localeCompare(bVal) * multiplier;
    }
    return (aVal - bVal) * multiplier;
  });

  if (data.length === 0) {
    return (
      <div className="text-center py-12 bg-[#f6f8fa] rounded-md">
        <p className="text-[#57606a]">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#d0d7de] rounded-md">
      <table className="w-full text-sm">
        <thead className="bg-[#f6f8fa] border-b border-[#d0d7de]">
          <tr>
            <SortableHeader
              label="사용자"
              sortKey="display_name"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              label="메뉴"
              sortKey="menu_key"
              currentSort={sortConfig}
              onSort={handleSort}
            />
            <SortableHeader
              label="사용 횟수"
              sortKey="event_count"
              currentSort={sortConfig}
              onSort={handleSort}
              align="right"
            />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d0d7de]">
          {sortedData.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-[#f6f8fa] transition-colors"
            >
              <td className="px-4 py-3 text-[#24292f]">
                {row.display_name || row.user_id.substring(0, 8)}
              </td>
              <td className="px-4 py-3 text-[#24292f]">
                {row.menu_key || "-"}
              </td>
              <td className="px-4 py-3 text-right font-medium text-[#24292f]">
                {row.event_count.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

