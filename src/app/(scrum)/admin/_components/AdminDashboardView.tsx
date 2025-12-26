/**
 * Admin Dashboard View
 * Airbnb 스타일의 관리자 대시보드
 */

"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { WORKLOAD_LEVEL_LABELS } from "@/lib/supabase/types";

// 인라인 스타일용 색상 맵
const WORKLOAD_COLOR_VALUES: Record<string, string> = {
  light: "#10b981", // emerald-500
  normal: "#3b82f6", // blue-500
  burden: "#ef4444", // red-500
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

  // 역할별 색상
  const roleConfig: Record<
    string,
    { label: string; color: string; bg: string }
  > = {
    admin: { label: "A", color: "#dc2626", bg: "rgba(220, 38, 38, 0.1)" },
    leader: { label: "L", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)" },
    member: { label: "M", color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)" },
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-rose-50/30">
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 md:mb-10">
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 md:mb-3">
            관리자{" "}
            <span className="bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
              대시보드
            </span>
          </h1>
          <p className="text-sm md:text-lg text-gray-500 font-light">
            워크스페이스 전체 현황을 한눈에 확인하세요
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="space-y-4 mb-8">
          {/* 첫 번째 줄: 기본 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="전체 멤버"
              value={stats.totalMembers}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              }
              gradientFrom="from-blue-500"
              gradientTo="to-cyan-400"
            />
            <StatCard
              label="전체 스냅샷"
              value={stats.totalSnapshots}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              }
              gradientFrom="from-indigo-500"
              gradientTo="to-purple-400"
            />
            <StatCard
              label="전체 엔트리"
              value={stats.totalEntries}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              }
              gradientFrom="from-emerald-500"
              gradientTo="to-teal-400"
            />
            <StatCard
              label="이번 주 작성 완료"
              value={`${stats.completedThisWeek}/${stats.totalMembers}`}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              gradientFrom="from-rose-500"
              gradientTo="to-pink-400"
              highlight={stats.completedThisWeek === stats.totalMembers}
            />
          </div>

          {/* 두 번째 줄: 부담 수준 통계 */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="여유"
              value={stats.workloadLight}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 512 512"
                >
                  <path d="M272 96c-78.6 0-145.1 51.5-167.7 122.5c33.6-17 71.5-26.5 111.7-26.5h88c8.8 0 16 7.2 16 16s-7.2 16-16 16H288 216s0 0 0 0c-16.6 0-32.7 1.9-48.3 5.4c-25.9 5.9-49.9 16.4-71.4 30.7c0 0 0 0 0 0C38.3 298.8 0 364.9 0 440v16c0 13.3 10.7 24 24 24s24-10.7 24-24V440c0-48.7 20.7-92.5 53.8-123.2C121.6 392.3 190.3 448 272 448l1 0c132.1-.7 239-130.9 239-291.4c0-42.6-7.5-83.1-21.1-119.6c-2.6-6.9-12.7-6.6-16.2-.1C455.9 72.1 418.7 96 376 96L272 96z" />
                </svg>
              }
              gradientFrom="from-emerald-500"
              gradientTo="to-green-400"
            />
            <StatCard
              label="적정"
              value={stats.workloadNormal}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 448 512"
                >
                  <path d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z" />
                </svg>
              }
              gradientFrom="from-blue-500"
              gradientTo="to-sky-400"
            />
            <StatCard
              label="부담"
              value={stats.workloadBurden}
              icon={
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 448 512"
                >
                  <path d="M159.3 5.4c7.8-7.3 19.9-7.2 27.7 .1c27.6 25.9 53.5 53.8 77.7 84c11-14.4 23.5-30.1 37-42.9c7.9-7.4 20.1-7.4 28 .1c34.6 33 63.9 76.6 84.5 118c20.3 40.8 33.8 82.5 33.8 111.9C448 404.2 348.2 512 224 512C98.4 512 0 404.1 0 276.5c0-38.4 17.8-85.3 45.4-131.7C73.3 97.7 112.7 48.6 159.3 5.4zM225.7 416c25.3 0 47.7-7 68.8-21c42.1-29.4 53.4-88.2 28.1-134.4c-4.5-9-16-9.6-22.5-2l-25.2 29.3c-6.6 7.6-18.5 7.4-24.7-.5c-16.5-21-46-58.5-62.8-79.8c-6.3-8-18.3-8.1-24.7-.1c-33.8 42.5-50.8 69.3-50.8 99.4C112 375.4 162.6 416 225.7 416z" />
                </svg>
              }
              gradientFrom="from-red-500"
              gradientTo="to-orange-400"
            />
          </div>
        </div>

        {/* 주차별 스냅샷 현황 테이블 */}
        <div
          className="rounded-2xl overflow-hidden mb-8"
          style={{
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.06)",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          }}
        >
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-rose-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
                />
              </svg>
              주차별 스냅샷 현황
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              멤버별 최근 6주간 스냅샷 엔트리 작성 현황 및 부담 수준
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th
                    rowSpan={2}
                    className="px-3 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap border-r border-gray-200"
                  >
                    멤버
                  </th>
                  {recentWeeks.map((w, idx) => (
                    <th
                      key={`${w.year}-${w.label}`}
                      colSpan={2}
                      className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wider border-r border-gray-200"
                      style={{
                        color: idx === 0 ? "#3b82f6" : "#6b7280",
                        background:
                          idx === 0 ? "rgba(59, 130, 246, 0.05)" : undefined,
                      }}
                    >
                      <div>{w.label}</div>
                      <div className="text-[10px] font-normal normal-case opacity-70">
                        {w.year}
                      </div>
                      {idx === 0 && (
                        <div className="text-[10px] font-normal text-blue-500 mt-0.5">
                          현재
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
                <tr className="bg-gray-50/80">
                  {recentWeeks.map((w, idx) => (
                    <React.Fragment key={`${w.year}-${w.label}-sub`}>
                      <th
                        className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider border-r border-gray-100"
                        style={{
                          background:
                            idx === 0 ? "rgba(59, 130, 246, 0.03)" : undefined,
                        }}
                      >
                        부담
                      </th>
                      <th
                        className="px-2 py-2 text-center text-[10px] font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200"
                        style={{
                          background:
                            idx === 0 ? "rgba(59, 130, 246, 0.03)" : undefined,
                        }}
                      >
                        개수
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {memberDataList.map((member) => (
                  <tr
                    key={member.userId}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-3 py-2.5 border-r border-gray-200">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{
                            background: `linear-gradient(135deg, ${
                              roleConfig[member.role]?.color || "#6b7280"
                            } 0%, ${
                              roleConfig[member.role]?.color || "#6b7280"
                            }dd 100%)`,
                          }}
                        >
                          {member.displayName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-medium text-gray-900 text-sm truncate">
                              {member.displayName}
                            </span>
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0"
                              style={{
                                background:
                                  roleConfig[member.role]?.bg ||
                                  "rgba(107, 114, 128, 0.1)",
                                color:
                                  roleConfig[member.role]?.color || "#6b7280",
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
                            className="px-2 py-2.5 text-center border-r border-gray-100"
                            style={{
                              background: isCurrentWeek
                                ? "rgba(59, 130, 246, 0.03)"
                                : undefined,
                            }}
                          >
                            {workload?.level ? (
                              <div
                                className="group relative inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold cursor-help"
                                style={{
                                  backgroundColor: `${
                                    WORKLOAD_COLOR_VALUES[workload.level]
                                  }15`,
                                  color: WORKLOAD_COLOR_VALUES[workload.level],
                                  border: `1px solid ${
                                    WORKLOAD_COLOR_VALUES[workload.level]
                                  }30`,
                                }}
                                title={workload.note || undefined}
                              >
                                {
                                  WORKLOAD_LEVEL_LABELS[
                                    workload.level as keyof typeof WORKLOAD_LEVEL_LABELS
                                  ]
                                }
                                {/* Tooltip */}
                                {workload.note && (
                                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                    {workload.note}
                                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900" />
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-300">
                                -
                              </span>
                            )}
                          </td>

                          {/* 엔트리 개수 열 */}
                          <td
                            className="px-2 py-2.5 text-center border-r border-gray-200"
                            style={{
                              background: isCurrentWeek
                                ? "rgba(59, 130, 246, 0.03)"
                                : undefined,
                            }}
                          >
                            <span
                              className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-md text-xs font-semibold transition-all ${
                                hasEntries
                                  ? isCurrentWeek
                                    ? "bg-green-100 text-green-700 shadow-sm"
                                    : "bg-gray-100 text-gray-700"
                                  : isCurrentWeek
                                  ? "bg-red-50 text-red-400"
                                  : "text-gray-300"
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

        {/* 빠른 접근 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gantt */}
          <button
            onClick={() => handleNavigate("/admin/plans/gantt")}
            className="group p-5 rounded-2xl text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                }}
              >
                <svg
                  className="w-6 h-6 text-white"
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
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  Gantt 차트
                </h3>
                <p className="text-sm text-gray-500">전체 일정 시각화</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform"
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
            className="group p-5 rounded-2xl text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style={{
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.06)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background:
                    "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                }}
              >
                <svg
                  className="w-6 h-6 text-white"
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
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-emerald-600 transition-colors">
                  Meta Options
                </h3>
                <p className="text-sm text-gray-500">스냅샷 메타 옵션 관리</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform"
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
  );
}

// 통계 카드 컴포넌트
function StatCard({
  label,
  value,
  icon,
  gradientFrom,
  gradientTo,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`relative p-4 rounded-xl overflow-hidden transition-all duration-300 ${
        highlight ? "ring-2 ring-green-400 ring-offset-2" : ""
      }`}
      style={{
        background: "white",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.04)",
      }}
    >
      {/* 그라데이션 오버레이 */}
      <div
        className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 rounded-full -translate-y-1/2 translate-x-1/2`}
      />

      <div className="relative">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-br ${gradientFrom} ${gradientTo}`}
        >
          <div className="text-white">{icon}</div>
        </div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-xs text-gray-500 mt-1">{label}</div>
      </div>

      {highlight && (
        <div className="absolute top-2 right-2">
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
          </span>
        </div>
      )}
    </div>
  );
}
