/**
 * Admin Dashboard View
 * Airbnb 스타일의 관리자 대시보드
 */

"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";

interface MemberData {
  userId: string;
  displayName: string;
  email: string;
  role: string;
  weeklyEntries: Record<string, number>;
}

interface AdminDashboardViewProps {
  stats: {
    totalMembers: number;
    totalSnapshots: number;
    totalEntries: number;
    completedThisWeek: number;
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

  // 역할별 정렬 및 색상
  const roleConfig: Record<string, { label: string; color: string; bg: string }> = {
    admin: { label: "Admin", color: "#dc2626", bg: "rgba(220, 38, 38, 0.1)" },
    leader: { label: "Leader", color: "#7c3aed", bg: "rgba(124, 58, 237, 0.1)" },
    member: { label: "Member", color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)" },
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="전체 멤버"
            value={stats.totalMembers}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-400"
          />
          <StatCard
            label="전체 스냅샷"
            value={stats.totalSnapshots}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            gradientFrom="from-indigo-500"
            gradientTo="to-purple-400"
          />
          <StatCard
            label="전체 엔트리"
            value={stats.totalEntries}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            }
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-400"
          />
          <StatCard
            label="이번 주 작성 완료"
            value={`${stats.completedThisWeek}/${stats.totalMembers}`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradientFrom="from-rose-500"
            gradientTo="to-pink-400"
            highlight={stats.completedThisWeek === stats.totalMembers}
          />
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
              <svg className="w-5 h-5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
              주차별 스냅샷 현황
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              멤버별 최근 4주간 스냅샷 엔트리 작성 현황
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    멤버
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    역할
                  </th>
                  {recentWeeks.map((w, idx) => (
                    <th
                      key={`${w.year}-${w.label}`}
                      className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wider"
                      style={{
                        color: idx === 0 ? "#3b82f6" : "#6b7280",
                        background: idx === 0 ? "rgba(59, 130, 246, 0.05)" : undefined,
                      }}
                    >
                      <div>{w.label}</div>
                      <div className="text-[10px] font-normal normal-case opacity-70">{w.year}</div>
                      {idx === 0 && (
                        <div className="text-[10px] font-normal text-blue-500 mt-0.5">현재</div>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {memberDataList.map((member) => (
                  <tr key={member.userId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{
                            background: `linear-gradient(135deg, ${
                              roleConfig[member.role]?.color || "#6b7280"
                            } 0%, ${roleConfig[member.role]?.color || "#6b7280"}dd 100%)`,
                          }}
                        >
                          {member.displayName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{member.displayName}</div>
                          <div className="text-xs text-gray-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: roleConfig[member.role]?.bg || "rgba(107, 114, 128, 0.1)",
                          color: roleConfig[member.role]?.color || "#6b7280",
                        }}
                      >
                        {roleConfig[member.role]?.label || member.role}
                      </span>
                    </td>
                    {recentWeeks.map((w, idx) => {
                      const weekKey = `${w.year}-${w.label}`;
                      const entryCount = member.weeklyEntries[weekKey] || 0;
                      const isCurrentWeek = idx === 0;
                      const hasEntries = entryCount > 0;

                      return (
                        <td
                          key={weekKey}
                          className="px-5 py-3 text-center"
                          style={{
                            background: isCurrentWeek ? "rgba(59, 130, 246, 0.05)" : undefined,
                          }}
                        >
                          <span
                            className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-lg text-sm font-semibold transition-all ${
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
          {/* Plans */}
          <button
            onClick={() => handleNavigate("/admin/plans")}
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
                  background: "linear-gradient(135deg, #f59e0b 0%, #f97316 100%)",
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 group-hover:text-amber-600 transition-colors">
                  Plans 관리
                </h3>
                <p className="text-sm text-gray-500">일정 계획 CRUD</p>
              </div>
              <svg
                className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

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
                  background: "linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)",
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* 관리자 안내 */}
        <div
          className="mt-8 p-4 rounded-xl text-sm"
          style={{
            background: "linear-gradient(135deg, rgba(244, 63, 94, 0.08), rgba(251, 146, 60, 0.05))",
            border: "1px solid rgba(244, 63, 94, 0.2)",
          }}
        >
          <div className="flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <p className="font-medium text-rose-700">관리자 전용 영역</p>
              <p className="mt-1 text-rose-600/80">
                이 영역은 admin 또는 leader 권한을 가진 사용자만 접근할 수 있습니다.
                전체 워크스페이스 데이터를 조회하고 관리할 수 있습니다.
              </p>
            </div>
          </div>
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

