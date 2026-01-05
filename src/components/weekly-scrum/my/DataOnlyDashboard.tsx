/**
 * Personal Space Dashboard (Data-Only)
 * 
 * 개인 메트릭 및 사용 데이터를 표시하는 데이터 전용 대시보드
 * - 숏컷 버튼 없음
 * - CTA 없음
 * - 순수 데이터 표시만
 */

"use client";

import type { PersonalDashboardMetrics } from "@/lib/dashboard/getPersonalDashboardMetrics";

interface DataOnlyDashboardProps {
  userName?: string;
  metrics: PersonalDashboardMetrics;
}

export function DataOnlyDashboard({
  userName,
  metrics,
}: DataOnlyDashboardProps) {
  const { snapshots, plans, usage } = metrics;

  // 날짜 포맷팅 (상대 시간)
  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "없음";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString("ko-KR");
  };

  // 날짜 포맷팅 (짧은 형식: MM.DD)
  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${month}.${day}`;
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 pb-6 border-b border-[#d0d7de]">
          <h1 className="text-2xl font-semibold text-[#24292f] mb-1">
            {userName ? `${userName}님의 대시보드` : "개인 대시보드"}
          </h1>
          <p className="text-sm text-[#57606a]">
            나에 대한 모든 수치/행동 데이터를 한 화면에서 확인하세요
          </p>
        </div>

        {/* Section 1: KPI Grid */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#24292f] mb-4">
            주요 지표
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* Snapshot Metrics */}
            <MetricCard
              label="Snapshot 주차 수"
              value={snapshots.weeksCount}
              description="작성한 주차 수"
            />
            <MetricCard
              label="Snapshot 엔트리"
              value={snapshots.entriesTotal}
              description="총 엔트리 수"
            />
            <MetricCard
              label="이번 주 작성"
              value={snapshots.entriesThisWeek}
              description="이번 주 엔트리"
            />
            <MetricCard
              label="지난 주 작성"
              value={snapshots.entriesLastWeek}
              description="지난 주 엔트리"
            />

            {/* Plan Metrics */}
            <MetricCard
              label="할당된 Plans (진행중)"
              value={plans.assignedActive}
              description="활성 상태 Plans"
            />
            <MetricCard
              label="할당된 Plans (전체)"
              value={plans.assignedTotal}
              description="총 할당 Plans"
            />

            {/* Usage Metrics */}
            <MetricCard
              label="최근 7일 방문"
              value={usage.visits7dTotal}
              description="페이지 방문 횟수"
            />
          </div>
        </div>

        {/* Section 2: Usage Trend */}
        {usage.visitsByDay14d.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[#24292f] mb-4">
              페이지 방문 추이 (최근 14일)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-[#d0d7de] rounded-md">
                <thead className="bg-[#f6f8fa]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-[#24292f] border-b border-[#d0d7de]">
                      날짜
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-[#24292f] border-b border-[#d0d7de]">
                      방문 횟수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.visitsByDay14d.map((item, idx) => (
                    <tr
                      key={item.date}
                      className={idx % 2 === 0 ? "bg-white" : "bg-[#f6f8fa]"}
                    >
                      <td className="px-4 py-2 text-[#24292f] border-b border-[#d0d7de]">
                        {formatShortDate(item.date)}
                      </td>
                      <td className="px-4 py-2 text-right text-[#24292f] border-b border-[#d0d7de]">
                        {item.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 3: Top Routes */}
        {usage.topRoutes7d.length > 0 && (
          <div className="mb-8">
            <h2 className="text-base font-semibold text-[#24292f] mb-4">
              자주 방문한 페이지 (최근 7일)
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-[#d0d7de] rounded-md">
                <thead className="bg-[#f6f8fa]">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-[#24292f] border-b border-[#d0d7de]">
                      경로
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-[#24292f] border-b border-[#d0d7de]">
                      방문 횟수
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usage.topRoutes7d.map((route, idx) => (
                    <tr
                      key={route.path}
                      className={idx % 2 === 0 ? "bg-white" : "bg-[#f6f8fa]"}
                    >
                      <td className="px-4 py-2 text-[#24292f] font-mono text-xs border-b border-[#d0d7de]">
                        {route.path}
                      </td>
                      <td className="px-4 py-2 text-right text-[#24292f] border-b border-[#d0d7de]">
                        {route.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Recent Activity */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#24292f] mb-4">
            최근 활동
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ActivityCard
              label="마지막 Snapshot 작성"
              value={formatRelativeTime(snapshots.lastSnapshotAt)}
            />
            <ActivityCard
              label="마지막 페이지 방문"
              value={formatRelativeTime(usage.lastVisitAt)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// 메트릭 카드 컴포넌트
function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <div className="p-3 rounded-md bg-[#f6f8fa] border border-[#d0d7de]">
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-xl font-semibold text-[#24292f]">{value}</span>
      </div>
      <span className="text-xs font-medium text-[#24292f] block mb-0.5">
        {label}
      </span>
      {description && (
        <span className="text-xs text-[#57606a]">{description}</span>
      )}
    </div>
  );
}

// 활동 카드 컴포넌트
function ActivityCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-md bg-[#f6f8fa] border border-[#d0d7de]">
      <div className="text-xs text-[#57606a] mb-1">{label}</div>
      <div className="text-sm font-semibold text-[#24292f]">{value}</div>
    </div>
  );
}

