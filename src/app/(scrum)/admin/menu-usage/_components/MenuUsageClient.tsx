"use client";

/**
 * Menu/Page Usage Analytics Dashboard (Client)
 * 
 * Displays 3 tables:
 * A) Weekly menu usage (by menu_group/menu_key/event_type)
 * B) Weekly page usage (by page_path)
 * C) User menu usage (by user + menu_key)
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
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
            <select
              value={weeks}
              onChange={(e) => setWeeks(parseInt(e.target.value, 10))}
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            >
              <option value="4">최근 4주</option>
              <option value="8">최근 8주</option>
              <option value="12">최근 12주</option>
            </select>
          </div>

          {/* Menu Group */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              메뉴 그룹
            </label>
            <select
              value={menuGroup}
              onChange={(e) => setMenuGroup(e.target.value)}
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            >
              <option value="">전체</option>
              <option value="community">Community</option>
              <option value="works">Works</option>
              <option value="personal">Personal</option>
              <option value="admin">Admin</option>
              <option value="etc">Etc</option>
            </select>
          </div>

          {/* Event Type */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-[#24292f] mb-2">
              이벤트 타입
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 border border-[#d0d7de] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0969da] focus:border-[#0969da]"
            >
              <option value="">전체</option>
              <option value="PAGE_VIEW">PAGE_VIEW</option>
              <option value="MENU_CLICK">MENU_CLICK</option>
            </select>
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
 * Menu Usage Table
 */
function MenuUsageTable({ data }: { data: MenuUsageWeekly[] }) {
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
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">주차</th>
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">그룹</th>
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">메뉴</th>
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">이벤트</th>
            <th className="px-4 py-3 text-right font-semibold text-[#24292f]">횟수</th>
            <th className="px-4 py-3 text-right font-semibold text-[#24292f]">사용자 수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d0d7de]">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-[#f6f8fa] transition-colors"
            >
              <td className="px-4 py-3 text-[#24292f]">
                {formatWeek(row.week_start_seoul)}
              </td>
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
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">주차</th>
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">페이지 경로</th>
            <th className="px-4 py-3 text-right font-semibold text-[#24292f]">조회수</th>
            <th className="px-4 py-3 text-right font-semibold text-[#24292f]">사용자 수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d0d7de]">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-[#f6f8fa] transition-colors"
            >
              <td className="px-4 py-3 text-[#24292f]">
                {formatWeek(row.week_start_seoul)}
              </td>
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
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">주차</th>
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">사용자</th>
            <th className="px-4 py-3 text-left font-semibold text-[#24292f]">메뉴</th>
            <th className="px-4 py-3 text-right font-semibold text-[#24292f]">사용 횟수</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#d0d7de]">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="hover:bg-[#f6f8fa] transition-colors"
            >
              <td className="px-4 py-3 text-[#24292f]">
                {formatWeek(row.week_start_seoul)}
              </td>
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

/**
 * Format week string (YYYY-MM-DD → YYYY-W##)
 */
function formatWeek(weekStartSeoul: string): string {
  try {
    const date = new Date(weekStartSeoul);
    const year = date.getFullYear();
    // Simple week calculation
    const startOfYear = new Date(year, 0, 1);
    const diff = date.getTime() - startOfYear.getTime();
    const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
    return `${year}-W${week.toString().padStart(2, "0")}`;
  } catch {
    return weekStartSeoul;
  }
}

