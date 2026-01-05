/**
 * Personal Space Dashboard (Data-Only)
 * 
 * 개인 메트릭 및 사용 데이터를 표시하는 데이터 전용 대시보드
 * 테이블/리스트 중심의 레이아웃 (한눈에 파악 가능)
 */

"use client";

import type { PersonalDashboardMetrics } from "@/lib/dashboard/getPersonalDashboardMetrics";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";

interface DataOnlyDashboardProps {
  userName?: string;
  metrics: PersonalDashboardMetrics;
}

export function DataOnlyDashboard({
  userName,
  metrics,
}: DataOnlyDashboardProps) {
  const { snapshots, plans, usage, recentEntries, domainDistribution, weeklyTrend, weeklyProgressTrend } = metrics;

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
          {/* 안내 문구 (전체 너비) */}
          {(usage.visitsByDay14d.length > 0 || usage.topRoutes7d.length > 0) && (
            <div className="lg:col-span-2 px-4 py-3 bg-[#ddf4ff] border border-[#54aeff]/30 rounded-md">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-[#0969da] shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p className="text-sm text-[#0969da] font-medium mb-1">
                    메뉴 사용 데이터 안내
                  </p>
                  <p className="text-xs text-[#0969da]/90 leading-relaxed">
                    이 데이터는 메뉴 기능 개선을 위한 <strong>실험 데이터(PoC)</strong>입니다. 
                    빠른 의사결정과 반복 개선을 목적으로 수집되며, <strong>개인 평가 등 다른 용도로는 사용되지 않습니다</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 페이지 방문 추이 (꺾은선 그래프) */}
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
              <div className="border border-[#d0d7de] rounded-md p-4 bg-white">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart
                    data={usage.visitsByDay14d.map((item) => ({
                      date: formatShortDate(item.date),
                      fullDate: formatDateWithDay(item.date),
                      visits: item.count,
                    }))}
                    margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0969da" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0969da" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#57606a", fontSize: 12 }}
                      tickLine={{ stroke: "#d0d7de" }}
                      axisLine={{ stroke: "#d0d7de" }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis
                      tick={{ fill: "#57606a", fontSize: 12 }}
                      tickLine={{ stroke: "#d0d7de" }}
                      axisLine={{ stroke: "#d0d7de" }}
                      label={{
                        value: "방문 횟수",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#57606a", fontSize: 12 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #d0d7de",
                        borderRadius: "6px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                      }}
                      labelStyle={{ color: "#24292f", fontWeight: 600 }}
                      itemStyle={{ color: "#0969da" }}
                      formatter={(value: number, name: string, props: any) => [
                        `${value}회`,
                        "방문 횟수",
                      ]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullDate;
                        }
                        return label;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="visits"
                      stroke="#0969da"
                      strokeWidth={2.5}
                      fill="url(#colorVisits)"
                      dot={{ fill: "#0969da", r: 4 }}
                      activeDot={{ r: 6, fill: "#0969da" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                <div className="mt-3 pt-3 border-t border-[#d0d7de] flex items-center justify-between text-xs text-[#57606a]">
                  <span>
                    총 방문:{" "}
                    <strong className="text-[#0969da] font-semibold">
                      {usage.visitsByDay14d.reduce((sum, item) => sum + item.count, 0)}회
                    </strong>
                  </span>
                  <span>
                    일평균:{" "}
                    <strong className="text-[#0969da] font-semibold">
                      {(
                        usage.visitsByDay14d.reduce((sum, item) => sum + item.count, 0) /
                        usage.visitsByDay14d.length
                      ).toFixed(1)}
                      회
                    </strong>
                  </span>
                </div>
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

        {/* 주차별 평균 진행률 추이 (꺾은선 그래프) */}
        {weeklyProgressTrend.length > 0 && (
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
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
              주차별 평균 진행률 추이 (최근 8주)
            </h2>
            <div className="border border-[#d0d7de] rounded-md p-4 bg-white">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={weeklyProgressTrend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <defs>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1a7f37" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1a7f37" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#57606a", fontSize: 12 }}
                    tickLine={{ stroke: "#d0d7de" }}
                    axisLine={{ stroke: "#d0d7de" }}
                  />
                  <YAxis
                    tick={{ fill: "#57606a", fontSize: 12 }}
                    tickLine={{ stroke: "#d0d7de" }}
                    axisLine={{ stroke: "#d0d7de" }}
                    domain={[0, 100]}
                    label={{
                      value: "평균 진행률 (%)",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#57606a", fontSize: 12 },
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d0d7de",
                      borderRadius: "6px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#24292f", fontWeight: 600 }}
                    formatter={(value: number, name: string, props: any) => {
                      const entryCount = props.payload.entryCount;
                      return [
                        `${value}% (${entryCount}개 엔트리)`,
                        "평균 진행률",
                      ];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                    formatter={() => "태스크 평균 진행률"}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgProgress"
                    stroke="#1a7f37"
                    strokeWidth={3}
                    fill="url(#colorProgress)"
                    dot={{ fill: "#1a7f37", r: 5 }}
                    activeDot={{ r: 7, fill: "#1a7f37", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-[#d0d7de] grid grid-cols-3 gap-4 text-xs text-[#57606a]">
                <div>
                  전체 평균:{" "}
                  <strong className="text-[#1a7f37] font-semibold">
                    {(
                      weeklyProgressTrend.reduce((sum, item) => sum + item.avgProgress, 0) /
                      weeklyProgressTrend.length
                    ).toFixed(1)}
                    %
                  </strong>
                </div>
                <div>
                  최고:{" "}
                  <strong className="text-[#1a7f37] font-semibold">
                    {Math.max(...weeklyProgressTrend.map((item) => item.avgProgress)).toFixed(1)}%
                  </strong>
                </div>
                <div>
                  최근 주차:{" "}
                  <strong className="text-[#1a7f37] font-semibold">
                    {weeklyProgressTrend[weeklyProgressTrend.length - 1]?.avgProgress.toFixed(1) || 0}%
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 최근 스냅샷 엔트리 */}
        {recentEntries.length > 0 && (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              최근 작성한 스냅샷 엔트리
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-[#d0d7de] rounded-md p-4 hover:border-[#0969da] hover:shadow-sm transition-all bg-white"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ddf4ff] text-[#0969da]">
                      {entry.year} {entry.week}
                    </span>
                    <span className="text-xs text-[#57606a]">
                      {formatRelativeTime(entry.updatedAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#24292f] mb-2 line-clamp-1">
                    {entry.name}
                  </h3>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-[#57606a]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <span className="truncate">{entry.domain}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-[#57606a]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="truncate">{entry.project}</span>
                    </div>
                    {entry.feature && (
                      <div className="flex items-center gap-1 text-xs text-[#57606a]">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="truncate">{entry.feature}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 도메인/프로젝트 분포 */}
        {domainDistribution.length > 0 && (
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
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
              도메인 / 프로젝트 활동 분포
            </h2>
            <div className="overflow-hidden border border-[#d0d7de] rounded-md">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f6f8fa]">
                    <th className="px-4 py-2 text-left font-semibold text-[#24292f] border-b border-[#d0d7de]">
                      도메인 / 프로젝트
                    </th>
                    <th className="px-4 py-2 text-right font-semibold text-[#24292f] border-b border-[#d0d7de]">
                      엔트리 수
                    </th>
                    <th className="px-4 py-2 text-left font-normal text-[#57606a] border-b border-[#d0d7de] w-48">
                      비율
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#d0d7de]">
                  {domainDistribution.map((item) => {
                    const maxCount = Math.max(...domainDistribution.map((d) => d.count));
                    const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    const totalCount = domainDistribution.reduce((sum, d) => sum + d.count, 0);
                    const actualPercentage = totalCount > 0 ? (item.count / totalCount) * 100 : 0;

                    return (
                      <tr key={item.label} className="hover:bg-[#f6f8fa] transition-colors">
                        <td className="px-4 py-2 text-[#24292f] font-medium">
                          {item.label}
                        </td>
                        <td className="px-4 py-2 text-right text-[#0969da] font-semibold">
                          {item.count}
                        </td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-5 bg-[#f6f8fa] rounded-sm overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0969da] to-[#1f6feb] rounded-sm transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-[#57606a] w-12 text-right">
                              {actualPercentage.toFixed(1)}%
                            </span>
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

        {/* 주차별 작성량 추이 (꺾은선 그래프) */}
        {weeklyTrend.length > 0 && (
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
                  d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              주차별 스냅샷 작성 추이 (최근 8주)
            </h2>
            <div className="border border-[#d0d7de] rounded-md p-4 bg-white">
              <ResponsiveContainer width="100%" height={320}>
                <LineChart
                  data={weeklyTrend.map((item, idx) => ({
                    week: item.week,
                    count: item.count,
                    isLatest: idx === weeklyTrend.length - 1,
                  }))}
                  margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="week"
                    tick={{ fill: "#57606a", fontSize: 12 }}
                    tickLine={{ stroke: "#d0d7de" }}
                    axisLine={{ stroke: "#d0d7de" }}
                  />
                  <YAxis
                    tick={{ fill: "#57606a", fontSize: 12 }}
                    tickLine={{ stroke: "#d0d7de" }}
                    axisLine={{ stroke: "#d0d7de" }}
                    label={{
                      value: "엔트리 수",
                      angle: -90,
                      position: "insideLeft",
                      style: { fill: "#57606a", fontSize: 12 },
                    }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #d0d7de",
                      borderRadius: "6px",
                      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                    }}
                    labelStyle={{ color: "#24292f", fontWeight: 600 }}
                    formatter={(value: number) => [`${value}개`, "엔트리 수"]}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: "20px" }}
                    iconType="line"
                    formatter={() => "주차별 엔트리 수"}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#0969da"
                    strokeWidth={3}
                    dot={(props: any) => {
                      const { cx, cy, payload } = props;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={payload.isLatest ? 6 : 4}
                          fill={payload.isLatest ? "#1a7f37" : "#0969da"}
                          stroke="#ffffff"
                          strokeWidth={2}
                        />
                      );
                    }}
                    activeDot={{ r: 7, fill: "#0969da", stroke: "#ffffff", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-[#d0d7de] grid grid-cols-3 gap-4 text-xs text-[#57606a]">
                <div>
                  총 엔트리:{" "}
                  <strong className="text-[#0969da] font-semibold">
                    {weeklyTrend.reduce((sum, item) => sum + item.count, 0)}개
                  </strong>
                </div>
                <div>
                  주평균:{" "}
                  <strong className="text-[#0969da] font-semibold">
                    {(
                      weeklyTrend.reduce((sum, item) => sum + item.count, 0) /
                      weeklyTrend.length
                    ).toFixed(1)}
                    개
                  </strong>
                </div>
                <div>
                  최근 주차:{" "}
                  <strong className="text-[#1a7f37] font-semibold">
                    {weeklyTrend[weeklyTrend.length - 1]?.count || 0}개
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

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
