"use client";

/**
 * 개인 공간 대시보드 - Trendy Airbnb 스타일
 *
 * 주요 기능:
 * - 스냅샷 관리 카드
 * - 개인 업무 통계 요약
 * - 빠른 접근 카드들
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { NewSnapshotModal } from "@/components/weekly-scrum/manage/NewSnapshotModal";
import { getCurrentISOWeek } from "@/lib/date/isoWeek";

interface PersonalDashboardProps {
  userName?: string;
  stats?: {
    totalSnapshots: number;
    totalEntries: number;
    thisWeekProgress: number;
    activeProjects: number;
    activeModules: number;
    activeFeatures: number;
    collaborators: number;
  };
  trends?: {
    snapshotsTrend: number;
    entriesTrend: number;
    progressTrend: number;
    projectsTrend: number;
    modulesTrend: number;
    featuresTrend: number;
    collaboratorsTrend: number;
  };
}

/**
 * 추세를 문자열로 포맷팅
 */
function formatTrend(value: number, suffix: string = ""): string | undefined {
  if (value === 0) return undefined;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
}

export function PersonalDashboard({ userName, stats, trends }: PersonalDashboardProps) {
  const router = useRouter();
  const [isNewSnapshotModalOpen, setIsNewSnapshotModalOpen] = useState(false);
  const currentWeek = getCurrentISOWeek();

  const handleNavigate = (href: string) => {
    navigationProgress.start();
    router.push(href);
  };

  // 새 스냅샷 모달 핸들러
  const handleLoadExistingData = () => {
    setIsNewSnapshotModalOpen(false);
    navigationProgress.start();
    router.push(`/manage/snapshots/${currentWeek.year}/${currentWeek.week}/new?mode=load`);
  };

  const handleCreateEmpty = () => {
    setIsNewSnapshotModalOpen(false);
    navigationProgress.start();
    router.push(`/manage/snapshots/${currentWeek.year}/${currentWeek.week}/new?mode=empty`);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="max-w-[1440px] mx-auto px-6 py-8">
      {/* 헤더 - 대담한 타이포그래피 */}
      <div className="mb-10">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
          {userName ? (
            <>
              안녕하세요,{" "}
              <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                {userName}
              </span>
              님
            </>
          ) : (
            "개인 대시보드"
          )}
        </h1>
        <p className="text-lg text-gray-500 font-light">
          업무 현황을 한눈에 확인하고 관리하세요
        </p>
      </div>

      {/* 통계 카드 - 글래스모피즘 스타일 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10">
          <GlassStatCard
            label="전체 스냅샷"
            value={stats.totalSnapshots}
            trend={formatTrend(trends?.snapshotsTrend || 0)}
            trendUp={(trends?.snapshotsTrend || 0) > 0}
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-400"
          />
          <GlassStatCard
            label="스냅샷 엔트리"
            value={stats.totalEntries}
            trend={formatTrend(trends?.entriesTrend || 0)}
            trendUp={(trends?.entriesTrend || 0) > 0}
            gradientFrom="from-indigo-500"
            gradientTo="to-purple-400"
          />
          <GlassStatCard
            label="평균 진척률"
            value={`${stats.thisWeekProgress}%`}
            trend={formatTrend(trends?.progressTrend || 0, "%")}
            trendUp={(trends?.progressTrend || 0) > 0}
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-400"
          />
          <GlassStatCard
            label="진행 중 프로젝트"
            value={stats.activeProjects}
            trend={formatTrend(trends?.projectsTrend || 0)}
            trendUp={(trends?.projectsTrend || 0) > 0}
            gradientFrom="from-violet-500"
            gradientTo="to-purple-400"
          />
          <GlassStatCard
            label="진행 중 모듈"
            value={stats.activeModules}
            trend={formatTrend(trends?.modulesTrend || 0)}
            trendUp={(trends?.modulesTrend || 0) > 0}
            gradientFrom="from-pink-500"
            gradientTo="to-rose-400"
          />
          <GlassStatCard
            label="진행 중 기능"
            value={stats.activeFeatures}
            trend={formatTrend(trends?.featuresTrend || 0)}
            trendUp={(trends?.featuresTrend || 0) > 0}
            gradientFrom="from-amber-500"
            gradientTo="to-orange-400"
          />
          <GlassStatCard
            label="협업자"
            value={stats.collaborators}
            trend={formatTrend(trends?.collaboratorsTrend || 0)}
            trendUp={(trends?.collaboratorsTrend || 0) > 0}
            gradientFrom="from-cyan-500"
            gradientTo="to-blue-400"
          />
        </div>
      )}

      {/* 빠른 접근 카드들 - 대형 인터랙티브 카드 */}
      <div className="space-y-6">
        {/* 메인 카드 - 스냅샷 관리 */}
        <HeroCard
          title="스냅샷 관리"
          subtitle="주차별 스냅샷 조회 및 관리"
          description="새 스냅샷을 작성하거나 기존 스냅샷을 수정하세요. 프로젝트별, 모듈별로 업무를 정리할 수 있습니다."
          icon="📋"
          onClick={() => handleNavigate("/manage/snapshots")}
          gradientFrom="from-rose-500"
          gradientVia="via-pink-500"
          gradientTo="to-fuchsia-500"
        />

        {/* 서브 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <InteractiveCard
            title="새 스냅샷 작성"
            description="이번 주 스냅샷을 새로 작성합니다"
            icon="✏️"
            badge="Quick Action"
            onClick={() => setIsNewSnapshotModalOpen(true)}
            gradientFrom="from-emerald-400"
            gradientTo="to-cyan-400"
          />

          <InteractiveCard
            title="업무 현황"
            description="개인 통계, 진척률 추이, 협업 현황 확인"
            icon="📊"
            badge="Coming Soon"
            disabled
            onClick={() => handleNavigate("/my/stats")}
            gradientFrom="from-blue-400"
            gradientTo="to-indigo-400"
          />
        </div>
      </div>

      {/* 하단 안내 - 미니멀 스타일 */}
      <div className="mt-16 py-8 border-t border-gray-100">
        <div className="text-center">
          <p className="text-gray-600 font-medium mb-2">
            ✨ 스냅샷을 관리하면서 한 주를 기록해보세요
          </p>
          <p className="text-xs text-gray-400">
            매주 업무를 정리하고 진척 상황을 추적하면 성장이 보입니다
          </p>
        </div>
      </div>
      </div>

      {/* 새 스냅샷 모달 */}
      <NewSnapshotModal
        isOpen={isNewSnapshotModalOpen}
        onClose={() => setIsNewSnapshotModalOpen(false)}
        year={currentWeek.year}
        week={currentWeek.week}
        onLoadExistingData={handleLoadExistingData}
        onCreateEmpty={handleCreateEmpty}
      />
    </div>
  );
}

// 글래스모피즘 통계 카드
function GlassStatCard({
  label,
  value,
  trend,
  trendUp,
  gradientFrom,
  gradientTo,
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <div className="group relative p-4 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden">
      {/* 배경 그라데이션 원 */}
      <div
        className={`absolute -top-4 -right-4 w-16 h-16 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-20 group-hover:opacity-30 group-hover:scale-125 transition-all duration-500`}
      />

      <div className="relative">
        <div className="flex items-baseline gap-1.5 mb-0.5">
          <span className="text-2xl font-black text-gray-900">{value}</span>
          {trend && (
            <span
              className={`text-[10px] font-semibold ${
                trendUp ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {trend}
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
    </div>
  );
}

// 히어로 카드 (메인)
function HeroCard({
  title,
  subtitle,
  description,
  icon,
  onClick,
  gradientFrom,
  gradientVia,
  gradientTo,
}: {
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  onClick: () => void;
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
}) {
  return (
    <button
      onClick={onClick}
      className="group relative w-full p-8 rounded-[2rem] overflow-hidden text-left transition-all duration-500 hover:shadow-2xl hover:scale-[1.01]"
    >
      {/* 배경 그라데이션 */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientVia} ${gradientTo}`}
      />

      {/* 노이즈 텍스처 */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" /%3E%3C/filter%3E%3Crect width="100%" height="100%" filter="url(%23noise)" /%3E%3C/svg%3E")',
        }}
      />

      {/* 움직이는 그라데이션 원 */}
      <div className="absolute -bottom-20 -right-20 w-60 h-60 rounded-full bg-white/10 group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute top-10 right-40 w-32 h-32 rounded-full bg-white/5 group-hover:translate-x-10 transition-transform duration-500" />

      <div className="relative flex items-start justify-between">
        <div className="flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white/90 text-xs font-semibold mb-4">
            <span>{icon}</span>
            <span>{subtitle}</span>
          </div>

          <h2 className="text-3xl font-black text-white mb-3 group-hover:translate-x-2 transition-transform duration-300">
            {title}
          </h2>

          <p className="text-white/70 text-sm max-w-md leading-relaxed">
            {description}
          </p>
        </div>

        {/* 화살표 */}
        <div className="shrink-0 w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:scale-110 transition-all duration-300">
          <svg
            className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </button>
  );
}

// 인터랙티브 카드 (서브)
function InteractiveCard({
  title,
  description,
  icon,
  badge,
  onClick,
  disabled,
  gradientFrom,
  gradientTo,
}: {
  title: string;
  description: string;
  icon: string;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
  gradientFrom: string;
  gradientTo: string;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group relative w-full p-6 rounded-3xl bg-white border text-left overflow-hidden transition-all duration-300 ${
        disabled
          ? "border-gray-100 opacity-60 cursor-not-allowed"
          : "border-gray-100 hover:border-gray-200 hover:shadow-xl hover:scale-[1.02]"
      }`}
    >
      {/* 호버 그라데이션 배경 */}
      {!disabled && (
        <div
          className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
        />
      )}

      <div className="relative flex items-start gap-4">
        {/* 아이콘 */}
        <div
          className={`shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                  disabled
                    ? "bg-gray-100 text-gray-400"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500">{description}</p>
        </div>

        {/* 화살표 */}
        {!disabled && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
