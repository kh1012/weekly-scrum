/**
 * Personal Space Dashboard (Data-Only)
 * 
 * 개인 메트릭 및 사용 데이터를 표시하는 데이터 전용 대시보드
 * 테이블/리스트 중심의 레이아웃 (한눈에 파악 가능)
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

  // 날짜 포맷팅 (요일 포함: MM.DD (요일))
  const formatDateWithDay = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const weekday = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${month}.${day} (${weekday})`;
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-white">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8">
        {/* 헤더 */}
        <div className="mb-6 pb-4 border-b border-[#d0d7de]">
          <h1 className="text-2xl font-semibold text-[#24292f] mb-1">
            {userName ? `${userName}님의 대시보드` : "개인 대시보드"}
          </h1>
          <p className="text-sm text-[#57606a]">
            나에 대한 모든 수치/행동 데이터를 한 화면에서 확인하세요
          </p>
        </div>

        {/* 전체 메트릭 테이블 (한눈에 보기) */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#24292f] mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#57606a]"
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
            주요 지표
          </h2>
          <div className="overflow-hidden border border-[#d0d7de] rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f8fa]">
                  <th className="px-4 py-3 text-left font-semibold text-[#24292f] border-b border-[#d0d7de] w-1/3">
                    항목
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-[#24292f] border-b border-[#d0d7de] w-1/6">
                    수치
                  </th>
                  <th className="px-4 py-3 text-left font-normal text-[#57606a] border-b border-[#d0d7de]">
                    상세
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                {/* Snapshot Metrics */}
                <tr className="hover:bg-[#f6f8fa] transition-colors">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    Snapshot 주차 수
                  </td>
                  <td className="px-4 py-3 text-right text-[#0969da] font-semibold text-base">
                    {snapshots.weeksCount}
                  </td>
                  <td className="px-4 py-3 text-[#57606a] text-xs">
                    작성한 주차 수
                  </td>
                </tr>
                <tr className="hover:bg-[#f6f8fa] transition-colors">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    Snapshot 엔트리 (전체)
                  </td>
                  <td className="px-4 py-3 text-right text-[#0969da] font-semibold text-base">
                    {snapshots.entriesTotal}
                  </td>
                  <td className="px-4 py-3 text-[#57606a] text-xs">
                    총 작성한 엔트리 수
                  </td>
                </tr>
                <tr className="hover:bg-[#f6f8fa] transition-colors">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    이번 주 작성
                  </td>
                  <td className="px-4 py-3 text-right text-[#1a7f37] font-semibold text-base">
                    {snapshots.entriesThisWeek}
                  </td>
                  <td className="px-4 py-3 text-[#57606a] text-xs">
                    이번 주 엔트리 수
                  </td>
                </tr>
                <tr className="hover:bg-[#f6f8fa] transition-colors">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    지난 주 작성
                  </td>
                  <td className="px-4 py-3 text-right text-[#57606a] font-semibold text-base">
                    {snapshots.entriesLastWeek}
                  </td>
                  <td className="px-4 py-3 text-[#57606a] text-xs">
                    지난 주 엔트리 수
                  </td>
                </tr>

                {/* Plans Metrics */}
                <tr className="hover:bg-[#f6f8fa] transition-colors bg-[#f6f8fa]/50">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    할당된 Plans (진행중)
                  </td>
                  <td className="px-4 py-3 text-right text-[#8250df] font-semibold text-base">
                    {plans.assignedActive}
                  </td>
                  <td className="px-4 py-3 text-[#57606a] text-xs">
                    현재 진행 중인 Plans
                  </td>
                </tr>
                <tr className="hover:bg-[#f6f8fa] transition-colors bg-[#f6f8fa]/50">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    할당된 Plans (전체)
                  </td>
                  <td className="px-4 py-3 text-right text-[#57606a] font-semibold text-base">
                    {plans.assignedTotal}
                  </td>
                  <td className="px-4 py-3 text-[#57606a] text-xs">
                    총 할당된 Plans
                  </td>
                </tr>

                {/* Usage Metrics */}
                <tr className="hover:bg-[#f6f8fa] transition-colors">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    최근 7일 페이지 방문
                  </td>
                  <td className="px-4 py-3 text-right text-[#0969da] font-semibold text-base">
                    {usage.visits7dTotal}
                  </td>
                  <td className="px-4 py-3 text-[#57606a] text-xs">
                    총 페이지 뷰
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 2열 레이아웃 (트렌드 + 경로) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 페이지 방문 추이 */}
          {usage.visitsByDay14d.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-[#24292f] mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#57606a]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                  />
                </svg>
                페이지 방문 추이 (최근 14일)
              </h2>
              <div className="overflow-hidden border border-[#d0d7de] rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f8fa]">
                      <th className="px-4 py-2 text-left font-semibold text-[#24292f] border-b border-[#d0d7de]">
                        날짜
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-[#24292f] border-b border-[#d0d7de]">
                        방문 횟수
                      </th>
                      <th className="px-4 py-2 text-left font-normal text-[#57606a] border-b border-[#d0d7de] w-32">
                        시각화
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d0d7de]">
                    {usage.visitsByDay14d.map((item) => {
                      const maxCount = Math.max(...usage.visitsByDay14d.map((i) => i.count));
                      const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                      
                      return (
                        <tr key={item.date} className="hover:bg-[#f6f8fa] transition-colors">
                          <td className="px-4 py-2 text-[#24292f] font-medium">
                            {formatDateWithDay(item.date)}
                          </td>
                          <td className="px-4 py-2 text-right text-[#0969da] font-semibold">
                            {item.count}
                          </td>
                          <td className="px-4 py-2">
                            <div className="h-5 bg-[#f6f8fa] rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-[#0969da] rounded-sm transition-all"
                                style={{ width: `${barWidth}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 자주 방문한 페이지 */}
          {usage.topRoutes7d.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-[#24292f] mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#57606a]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                자주 방문한 페이지 (최근 7일)
              </h2>
              <div className="overflow-hidden border border-[#d0d7de] rounded-md">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#f6f8fa]">
                      <th className="px-4 py-2 text-left font-semibold text-[#24292f] border-b border-[#d0d7de]">
                        순위
                      </th>
                      <th className="px-4 py-2 text-left font-semibold text-[#24292f] border-b border-[#d0d7de]">
                        경로
                      </th>
                      <th className="px-4 py-2 text-right font-semibold text-[#24292f] border-b border-[#d0d7de]">
                        방문 횟수
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d0d7de]">
                    {usage.topRoutes7d.map((route, idx) => (
                      <tr key={route.path} className="hover:bg-[#f6f8fa] transition-colors">
                        <td className="px-4 py-2 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                              idx === 0
                                ? "bg-[#ffd33d] text-[#24292f]"
                                : idx === 1
                                ? "bg-[#c9d1d9] text-[#24292f]"
                                : idx === 2
                                ? "bg-[#f78166] text-white"
                                : "bg-[#f6f8fa] text-[#57606a]"
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-[#24292f] font-mono text-xs">
                          {route.path}
                        </td>
                        <td className="px-4 py-2 text-right text-[#0969da] font-semibold">
                          {route.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* 최근 활동 (리스트 형태) */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-[#24292f] mb-3 flex items-center gap-2">
            <svg
              className="w-5 h-5 text-[#57606a]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            최근 활동
          </h2>
          <div className="overflow-hidden border border-[#d0d7de] rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#f6f8fa]">
                  <th className="px-4 py-2 text-left font-semibold text-[#24292f] border-b border-[#d0d7de] w-1/3">
                    활동
                  </th>
                  <th className="px-4 py-2 text-right font-semibold text-[#24292f] border-b border-[#d0d7de]">
                    시각
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#d0d7de]">
                <tr className="hover:bg-[#f6f8fa] transition-colors">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    마지막 Snapshot 작성
                  </td>
                  <td className="px-4 py-3 text-right text-[#57606a]">
                    {formatRelativeTime(snapshots.lastSnapshotAt)}
                  </td>
                </tr>
                <tr className="hover:bg-[#f6f8fa] transition-colors">
                  <td className="px-4 py-3 text-[#24292f] font-medium">
                    마지막 페이지 방문
                  </td>
                  <td className="px-4 py-3 text-right text-[#57606a]">
                    {formatRelativeTime(usage.lastVisitAt)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
