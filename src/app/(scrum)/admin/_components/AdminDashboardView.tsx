/**
 * Admin Dashboard View
 * GitHub 스타일의 관리자 대시보드
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { WORKLOAD_LEVEL_LABELS } from "@/lib/supabase/types";

// GitHub 스타일 부담 수준 색상
const WORKLOAD_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  light: {
    bg: "#ddf4ff",
    border: "#54aeff",
    text: "#0969da",
  },
  normal: {
    bg: "#fff8c5",
    border: "#d4a72c",
    text: "#7d4e00",
  },
  burden: {
    bg: "#ffebe9",
    border: "#ff8182",
    text: "#cf222e",
  },
};

interface MemberData {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  weeklyEntries: Record<string, number>;
  weeklyWorkload: Record<string, { level: string | null; note: string | null }>;
}

interface AdminDashboardViewProps {
  stats: {
    totalMembers: number;
    totalSnapshots: number;
    totalEntries: number;
    completedThisWeek: number;
    workloadLight: number;
    workloadNormal: number;
    workloadBurden: number;
  };
  recentWeeks: { year: number; week: number; label: string }[];
  memberDataList: MemberData[];
  currentWeekKey: string;
}

export function AdminDashboardView({
  stats,
  recentWeeks,
  memberDataList,
  currentWeekKey,
}: AdminDashboardViewProps) {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    navigationProgress.start();
    router.push(href);
  };

  // 역할별 설정
  const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    admin: { label: "A", color: "#cf222e", bg: "#ffebe9" },
    manager: { label: "MG", color: "#8250df", bg: "#fbefff" },
    member: { label: "M", color: "#57606a", bg: "#f6f8fa" },
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 pb-6 border-b border-[#d0d7de]">
          <h1 className="text-2xl font-semibold text-[#24292f] mb-1">
            관리자 대시보드
          </h1>
          <p className="text-sm text-[#57606a]">
            워크스페이스 전체 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="space-y-3 mb-8">
          {/* 첫 번째 줄: 기본 통계 */}
          <div>
            <h2 className="text-base font-semibold text-[#24292f] mb-3">
              전체 통계
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="전체 멤버" value={stats.totalMembers} />
              <StatCard label="전체 스냅샷" value={stats.totalSnapshots} />
              <StatCard label="전체 엔트리" value={stats.totalEntries} />
              <StatCard
                label="이번 주 작성 완료"
                value={`${stats.completedThisWeek}/${stats.totalMembers}`}
                highlight={stats.completedThisWeek === stats.totalMembers}
              />
            </div>
          </div>

          {/* 두 번째 줄: 부담 수준 통계 */}
          <div>
            <h2 className="text-base font-semibold text-[#24292f] mb-3">
              이번 주 부담 수준
            </h2>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="여유" value={stats.workloadLight} variant="light" />
              <StatCard label="적정" value={stats.workloadNormal} variant="normal" />
              <StatCard label="부담" value={stats.workloadBurden} variant="burden" />
            </div>
          </div>
        </div>

        {/* 주차별 스냅샷 현황 테이블 */}
        <div className="mb-8">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-[#24292f] mb-1">
              주차별 스냅샷 현황
            </h2>
            <p className="text-xs text-[#57606a]">
              멤버별 최근 6주간 스냅샷 엔트리 작성 현황 및 부담 수준
            </p>
          </div>

          <div className="border border-[#d0d7de] rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#f6f8fa]">
                    <th
                      rowSpan={2}
                      className="px-3 py-3 text-left text-xs font-semibold text-[#57606a] border-r border-[#d0d7de] whitespace-nowrap"
                    >
                      멤버
                    </th>
                    {recentWeeks.map((w, idx) => (
                      <th
                        key={`${w.year}-${w.label}`}
                        colSpan={2}
                        className={`px-3 py-2 text-center text-xs font-semibold border-r border-[#d0d7de] ${
                          idx === 0 ? "text-[#0969da] bg-[#ddf4ff]" : "text-[#57606a]"
                        }`}
                      >
                        <div>{w.label}</div>
                        <div className="text-[10px] font-normal opacity-70">
                          {w.year}
                        </div>
                        {idx === 0 && (
                          <div className="text-[10px] font-medium mt-0.5">
                            현재
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-[#f6f8fa] border-b border-[#d0d7de]">
                    {recentWeeks.map((w, idx) => (
                      <React.Fragment key={`${w.year}-${w.label}-sub`}>
                        <th
                          className={`px-2 py-2 text-center text-[10px] font-medium border-r border-[#d0d7de] ${
                            idx === 0 ? "text-[#0969da] bg-[#ddf4ff]" : "text-[#57606a]"
                          }`}
                        >
                          부담
                        </th>
                        <th
                          className={`px-2 py-2 text-center text-[10px] font-medium border-r border-[#d0d7de] ${
                            idx === 0 ? "text-[#0969da] bg-[#ddf4ff]" : "text-[#57606a]"
                          }`}
                        >
                          개수
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {memberDataList.map((member) => (
                    <tr
                      key={member.userId}
                      className="hover:bg-[#f6f8fa] transition-colors"
                    >
                      <td className="px-3 py-2.5 border-r border-[#d0d7de]">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                            style={{
                              background: roleConfig[member.role]?.bg || "#f6f8fa",
                              color: roleConfig[member.role]?.color || "#57606a",
                            }}
                          >
                            {member.displayName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-[#24292f] text-sm truncate">
                                {member.displayName}
                              </span>
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
                                style={{
                                  background: roleConfig[member.role]?.bg || "#f6f8fa",
                                  color: roleConfig[member.role]?.color || "#57606a",
                                }}
                              >
                                {roleConfig[member.role]?.label ||
                                  member.role.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      {recentWeeks.map((w, idx) => {
                        const weekKey = `${w.year}-${w.label}`;
                        const entryCount = member.weeklyEntries[weekKey] || 0;
                        const workload = member.weeklyWorkload[weekKey];
                        const isCurrentWeek = idx === 0;
                        const hasEntries = entryCount > 0;

                        return (
                          <React.Fragment key={weekKey}>
                            {/* 부담 수준 열 */}
                            <td
                              className={`px-2 py-2.5 text-center border-r border-[#d0d7de] ${
                                isCurrentWeek ? "bg-[#ddf4ff]" : ""
                              }`}
                            >
                              {workload?.level ? (
                                <div
                                  className="group relative inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-medium cursor-help"
                                  style={{
                                    backgroundColor: WORKLOAD_COLORS[workload.level].bg,
                                    color: WORKLOAD_COLORS[workload.level].text,
                                    border: `1px solid ${WORKLOAD_COLORS[workload.level].border}`,
                                  }}
                                  title={workload.note || undefined}
                                >
                                  {WORKLOAD_LEVEL_LABELS[workload.level as keyof typeof WORKLOAD_LEVEL_LABELS]}
                                  {/* Tooltip */}
                                  {workload.note && (
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-[#24292f] text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                      {workload.note}
                                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-[#24292f]" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-[#8c959f]">-</span>
                              )}
                            </td>

                            {/* 엔트리 개수 열 */}
                            <td
                              className={`px-2 py-2.5 text-center border-r border-[#d0d7de] ${
                                isCurrentWeek ? "bg-[#ddf4ff]" : ""
                              }`}
                            >
                              <span
                                className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded text-xs font-medium ${
                                  hasEntries
                                    ? isCurrentWeek
                                      ? "bg-[#ddf4ff] text-[#0969da] border border-[#0969da]"
                                      : "bg-[#f6f8fa] text-[#24292f]"
                                    : isCurrentWeek
                                    ? "bg-[#ffebe9] text-[#cf222e] border border-[#ff8182]"
                                    : "text-[#8c959f]"
                                }`}
                              >
                                {entryCount}
                              </span>
                            </td>
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 빠른 접근 카드 */}
        <div>
          <h2 className="text-base font-semibold text-[#24292f] mb-3">
            빠른 접근
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Gantt */}
            <button
              onClick={() => handleNavigate("/admin/plans/gantt")}
              className="group p-4 rounded-md bg-white border border-[#d0d7de] hover:border-[#0969da] text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#ddf4ff] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-[#0969da]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#24292f] group-hover:text-[#0969da] transition-colors">
                    Gantt 차트
                  </h3>
                  <p className="text-xs text-[#57606a]">전체 일정 시각화</p>
                </div>
                <svg
                  className="w-4 h-4 text-[#57606a] group-hover:text-[#0969da] group-hover:translate-x-0.5 transition-all shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>

            {/* Meta Options */}
            <button
              onClick={() => handleNavigate("/admin/meta-options")}
              className="group p-4 rounded-md bg-white border border-[#d0d7de] hover:border-[#0969da] text-left transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-[#ddf4ff] flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-[#0969da]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[#24292f] group-hover:text-[#0969da] transition-colors">
                    Meta Options
                  </h3>
                  <p className="text-xs text-[#57606a]">스냅샷 메타 옵션 관리</p>
                </div>
                <svg
                  className="w-4 h-4 text-[#57606a] group-hover:text-[#0969da] group-hover:translate-x-0.5 transition-all shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// GitHub 스타일 통계 카드
function StatCard({
  label,
  value,
  variant,
  highlight,
}: {
  label: string;
  value: number | string;
  variant?: "light" | "normal" | "burden";
  highlight?: boolean;
}) {
  const variantStyles = {
    light: "bg-[#ddf4ff] border-[#54aeff] text-[#0969da]",
    normal: "bg-[#fff8c5] border-[#d4a72c] text-[#7d4e00]",
    burden: "bg-[#ffebe9] border-[#ff8182] text-[#cf222e]",
  };

  return (
    <div
      className={`p-3 rounded-md border transition-colors ${
        variant
          ? `${variantStyles[variant]}`
          : highlight
          ? "bg-[#ddf4ff] border-[#0969da]"
          : "bg-[#f6f8fa] border-[#d0d7de] hover:border-[#0969da]"
      }`}
    >
      <div className={`text-2xl font-semibold mb-1 ${variant ? "" : "text-[#24292f]"}`}>
        {value}
      </div>
      <div className={`text-xs ${variant ? "" : "text-[#57606a]"}`}>
        {label}
      </div>
      {highlight && !variant && (
        <div className="absolute top-2 right-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0969da] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0969da]" />
          </span>
        </div>
      )}
    </div>
  );
}
