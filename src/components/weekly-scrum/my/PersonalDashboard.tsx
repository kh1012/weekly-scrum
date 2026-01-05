"use client";

/**
 * 개인 공간 대시보드 - GitHub 스타일
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
  /** 현재 주차에 스냅샷 데이터가 존재하는지 여부 */
  hasCurrentWeekData?: boolean;
  /** 워크스페이스 ID */
  workspaceId?: string;
  /** 사용자 ID */
  userId?: string;
}

/**
 * 추세를 문자열로 포맷팅
 */
function formatTrend(value: number, suffix: string = ""): string | undefined {
  if (value === 0) return undefined;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${suffix}`;
}

export function PersonalDashboard({ userName, stats, trends, hasCurrentWeekData = false, workspaceId, userId }: PersonalDashboardProps) {
  const router = useRouter();
  const [isNewSnapshotModalOpen, setIsNewSnapshotModalOpen] = useState(false);
  const currentWeek = getCurrentISOWeek();

  const handleNavigate = (href: string) => {
    navigationProgress.start();
    router.push(href);
  };

  // 새 스냅샷 모달 핸들러
  const handleLoadExistingData = (selectedWeekKeys: string[]) => {
    setIsNewSnapshotModalOpen(false);
    navigationProgress.start();
    // 선택된 주차 키들을 쿼리 파라미터로 전달
    const weekKeysParam = selectedWeekKeys.join(',');
    router.push(`/manage/snapshots/${currentWeek.year}/${currentWeek.week}/new?mode=load&weeks=${encodeURIComponent(weekKeysParam)}`);
  };

  const handleCreateEmpty = () => {
    setIsNewSnapshotModalOpen(false);
    navigationProgress.start();
    router.push(`/manage/snapshots/${currentWeek.year}/${currentWeek.week}/new?mode=empty`);
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      {/* 상단 컨텐츠 영역 (제한된 너비) */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 pb-6 border-b border-[#d0d7de]">
          <h1 className="text-2xl font-semibold text-[#24292f] mb-1">
            {userName ? `${userName}님의 대시보드` : "개인 대시보드"}
          </h1>
          <p className="text-sm text-[#57606a]">
            업무 현황을 한눈에 확인하고 관리하세요
          </p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[#24292f] mb-4">
              통계 요약
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <StatCard
                label="전체 스냅샷"
                value={stats.totalSnapshots}
                trend={formatTrend(trends?.snapshotsTrend || 0)}
                trendUp={(trends?.snapshotsTrend || 0) > 0}
              />
              <StatCard
                label="스냅샷 엔트리"
                value={stats.totalEntries}
                trend={formatTrend(trends?.entriesTrend || 0)}
                trendUp={(trends?.entriesTrend || 0) > 0}
              />
              <StatCard
                label="평균 진척률"
                value={`${stats.thisWeekProgress}%`}
                trend={formatTrend(trends?.progressTrend || 0, "%")}
                trendUp={(trends?.progressTrend || 0) > 0}
              />
              <StatCard
                label="진행 중 프로젝트"
                value={stats.activeProjects}
                trend={formatTrend(trends?.projectsTrend || 0)}
                trendUp={(trends?.projectsTrend || 0) > 0}
              />
              <StatCard
                label="진행 중 모듈"
                value={stats.activeModules}
                trend={formatTrend(trends?.modulesTrend || 0)}
                trendUp={(trends?.modulesTrend || 0) > 0}
              />
              <StatCard
                label="진행 중 기능"
                value={stats.activeFeatures}
                trend={formatTrend(trends?.featuresTrend || 0)}
                trendUp={(trends?.featuresTrend || 0) > 0}
              />
              <StatCard
                label="협업자"
                value={stats.collaborators}
                trend={formatTrend(trends?.collaboratorsTrend || 0)}
                trendUp={(trends?.collaboratorsTrend || 0) > 0}
              />
            </div>
          </div>
        )}

        {/* 빠른 접근 카드들 */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[#24292f]">
            빠른 접근
          </h2>

          {/* 메인 카드 - 스냅샷 관리 */}
          <PrimaryActionCard
            title="스냅샷 관리"
            description="주차별 스냅샷 조회 및 관리. 새 스냅샷을 작성하거나 기존 스냅샷을 수정하세요."
            onClick={() => handleNavigate("/manage/snapshots")}
          />

          {/* 서브 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActionCard
              title="새 스냅샷 작성"
              description="이번 주 스냅샷을 새로 작성합니다"
              badge="Quick Action"
              onClick={() => setIsNewSnapshotModalOpen(true)}
            />

            <ActionCard
              title="업무 현황"
              description="개인 통계, 진척률 추이, 협업 현황 확인"
              badge="Coming Soon"
              disabled
              onClick={() => handleNavigate("/my/stats")}
            />
          </div>
        </div>

        {/* 하단 안내 */}
        <div className="mt-12 pt-6 border-t border-[#d0d7de]">
          <div className="text-center">
            <p className="text-sm text-[#57606a] mb-1">
              스냅샷을 관리하면서 한 주를 기록해보세요
            </p>
            <p className="text-xs text-[#8c959f]">
              매주 업무를 정리하고 진척 상황을 추적하면 성장이 보입니다
            </p>
          </div>
        </div>
      </div>

      {/* 스냅샷 타임라인 섹션 (Full Width) */}
      {userId && workspaceId && (
        <div className="w-full border-t-2 border-[#d0d7de] bg-[#f6f8fa] py-8">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 mb-6">
            <h2 className="text-lg font-semibold text-[#24292f] mb-1">
              나의 스냅샷 타임라인
            </h2>
            <p className="text-sm text-[#57606a]">
              주차별 스냅샷 엔트리를 Gantt 형태로 시각화하고 연속성을 확인하세요
            </p>
          </div>
          
          {/* 타임라인 컴포넌트는 여기에 추가될 예정 */}
          <div className="w-full overflow-x-auto">
            {/* Placeholder */}
            <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8">
              <div className="bg-white border border-[#d0d7de] rounded-md p-8 text-center text-[#57606a]">
                타임라인이 곧 추가됩니다...
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 새 스냅샷 모달 */}
      <NewSnapshotModal
        isOpen={isNewSnapshotModalOpen}
        onClose={() => setIsNewSnapshotModalOpen(false)}
        year={currentWeek.year}
        week={currentWeek.week}
        onLoadExistingData={handleLoadExistingData}
        onCreateEmpty={handleCreateEmpty}
        hasCurrentWeekData={hasCurrentWeekData}
        workspaceId={workspaceId}
        userId={userId}
      />
    </div>
  );
}

// GitHub 스타일 통계 카드
function StatCard({
  label,
  value,
  trend,
  trendUp,
}: {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className="p-3 rounded-md bg-[#f6f8fa] border border-[#d0d7de] hover:border-[#0969da] transition-colors">
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-xl font-semibold text-[#24292f]">{value}</span>
        {trend && (
          <span
            className={`text-xs font-medium ${
              trendUp ? "text-[#1a7f37]" : "text-[#cf222e]"
            }`}
          >
            {trend}
          </span>
        )}
      </div>
      <span className="text-xs text-[#57606a]">{label}</span>
    </div>
  );
}

// 메인 액션 카드
function PrimaryActionCard({
  title,
  description,
  onClick,
}: {
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group w-full p-6 rounded-md bg-white border border-[#d0d7de] hover:border-[#0969da] text-left transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <svg
              className="w-5 h-5 text-[#57606a] group-hover:text-[#0969da] transition-colors"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M2 4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4zm2-1a1 1 0 0 0-1 1v1h10V4a1 1 0 0 0-1-1H4zM3 7v5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V7H3z" />
            </svg>
            <h3 className="text-base font-semibold text-[#24292f] group-hover:text-[#0969da] transition-colors">
              {title}
            </h3>
          </div>
          <p className="text-sm text-[#57606a]">{description}</p>
        </div>

        {/* 화살표 */}
        <div className="shrink-0">
          <svg
            className="w-5 h-5 text-[#57606a] group-hover:text-[#0969da] group-hover:translate-x-0.5 transition-all"
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
      </div>
    </button>
  );
}

// 서브 액션 카드
function ActionCard({
  title,
  description,
  badge,
  onClick,
  disabled,
}: {
  title: string;
  description: string;
  badge?: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`group w-full p-4 rounded-md border text-left transition-colors ${
        disabled
          ? "bg-[#f6f8fa] border-[#d0d7de] opacity-60 cursor-not-allowed"
          : "bg-white border-[#d0d7de] hover:border-[#0969da]"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${disabled ? "text-[#57606a]" : "text-[#24292f] group-hover:text-[#0969da]"} transition-colors`}>
              {title}
            </h3>
            {badge && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  disabled
                    ? "bg-[#d0d7de] text-[#57606a]"
                    : "bg-[#ddf4ff] text-[#0969da]"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          <p className="text-xs text-[#57606a]">{description}</p>
        </div>

        {/* 화살표 */}
        {!disabled && (
          <div className="shrink-0">
            <svg
              className="w-4 h-4 text-[#57606a] group-hover:text-[#0969da] group-hover:translate-x-0.5 transition-all"
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
        )}
      </div>
    </button>
  );
}
