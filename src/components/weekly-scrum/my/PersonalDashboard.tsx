"use client";

/**
 * 개인 공간 대시보드 - Airbnb 스타일
 * 
 * 주요 기능:
 * - 스냅샷 관리 카드
 * - 개인 업무 통계 요약
 * - 빠른 접근 카드들
 */

import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";

interface PersonalDashboardProps {
  userName?: string;
  stats?: {
    totalSnapshots: number;
    thisWeekProgress: number;
    activeProjects: number;
    collaborators: number;
  };
}

export function PersonalDashboard({ userName, stats }: PersonalDashboardProps) {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    navigationProgress.start();
    router.push(href);
  };

  return (
    <div className="min-h-[calc(100vh-10rem)]">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userName ? `안녕하세요, ${userName}님` : "개인 대시보드"}
        </h1>
        <p className="text-gray-500">
          개인 업무 현황을 한눈에 확인하고 관리하세요
        </p>
      </div>

      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="전체 스냅샷"
            value={stats.totalSnapshots}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            color="blue"
          />
          <StatCard
            label="이번 주 진척률"
            value={`${stats.thisWeekProgress}%`}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            color="emerald"
          />
          <StatCard
            label="진행 중 프로젝트"
            value={stats.activeProjects}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            color="purple"
          />
          <StatCard
            label="협업자"
            value={stats.collaborators}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            color="amber"
          />
        </div>
      )}

      {/* 빠른 접근 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 스냅샷 관리 카드 - 메인 */}
        <ActionCard
          title="스냅샷 관리"
          description="주차별 스냅샷을 조회하고 편집하세요. 새 스냅샷을 작성하거나 기존 스냅샷을 수정할 수 있습니다."
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          gradientFrom="from-rose-500"
          gradientTo="to-pink-600"
          shadowColor="shadow-rose-500/25"
          onClick={() => handleNavigate("/manage/snapshots")}
          primary
        />

        {/* 새 스냅샷 작성 */}
        <ActionCard
          title="새 스냅샷 작성"
          description="이번 주 스냅샷을 새로 작성합니다. 데이터 불러오기 또는 빈 상태에서 시작할 수 있습니다."
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          }
          gradientFrom="from-emerald-500"
          gradientTo="to-teal-600"
          shadowColor="shadow-emerald-500/25"
          onClick={() => {
            // 현재 주차로 이동
            const now = new Date();
            const jan4 = new Date(now.getFullYear(), 0, 4);
            const dayOfWeek = jan4.getDay() || 7;
            const firstMonday = new Date(jan4);
            firstMonday.setDate(jan4.getDate() - dayOfWeek + 1);
            const diff = now.getTime() - firstMonday.getTime();
            const week = Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
            const year = now.getFullYear();
            handleNavigate(`/manage/snapshots/${year}/${week}/new`);
          }}
        />

        {/* 업무 현황 보기 */}
        <ActionCard
          title="업무 현황"
          description="개인 업무 통계, 진척률 추이, 협업 현황 등을 상세히 확인합니다."
          icon={
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          gradientFrom="from-blue-500"
          gradientTo="to-indigo-600"
          shadowColor="shadow-blue-500/25"
          onClick={() => handleNavigate("/my/stats")}
          disabled
          disabledText="준비 중"
        />
      </div>

      {/* 하단 안내 */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400">
          데이터는 Supabase에 안전하게 저장됩니다 · 새로고침해도 데이터가 유지됩니다
        </p>
      </div>
    </div>
  );
}

// 통계 카드
function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "blue" | "emerald" | "purple" | "amber";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    purple: "bg-purple-50 text-purple-600",
    amber: "bg-amber-50 text-amber-600",
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
}

// 액션 카드
function ActionCard({
  title,
  description,
  icon,
  gradientFrom,
  gradientTo,
  shadowColor,
  onClick,
  primary,
  disabled,
  disabledText,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
  shadowColor: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
  disabledText?: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group relative p-6 bg-white rounded-3xl border text-left overflow-hidden transition-all duration-300 ${
        disabled
          ? "border-gray-100 opacity-60 cursor-not-allowed"
          : primary
          ? "border-gray-200 hover:border-gray-300 hover:shadow-xl"
          : "border-gray-200 hover:border-gray-300 hover:shadow-lg"
      }`}
    >
      {/* 배경 그라데이션 */}
      {!disabled && (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom.replace("from-", "from-").replace("-500", "-50")} via-white ${gradientTo.replace("to-", "to-").replace("-600", "-50")} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
      )}

      <div className="relative">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-lg ${shadowColor} ${!disabled && "group-hover:scale-110"} transition-transform duration-300 text-white`}>
            {icon}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            {disabled && disabledText && (
              <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 rounded-full mt-1">
                {disabledText}
              </span>
            )}
          </div>
        </div>

        <p className="text-gray-600 text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {/* 화살표 */}
      {!disabled && (
        <div className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      )}
    </button>
  );
}

