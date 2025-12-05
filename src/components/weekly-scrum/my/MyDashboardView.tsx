"use client";

import { useMemo, useState } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { getProgressColor, getDomainColor, RISK_LEVEL_COLORS, getAchievementRate } from "@/lib/colorDefines";
import type { RiskLevel, ScrumItem } from "@/types/scrum";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";

type TrendPeriod = "1month" | "6months" | "year";

export function MyDashboardView() {
  const { currentData, members, allData, sortedWeekKeys, selectMode } = useScrumContext();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("1month");
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // 멤버가 선택되지 않으면 첫 번째 멤버 선택
  const activeMember = selectedMember || members[0] || "";

  // 멤버 변경 시 도메인/프로젝트 필터 초기화
  const handleMemberChange = (member: string) => {
    setSelectedMember(member);
    setSelectedDomains(new Set());
    setSelectedProjects(new Set());
  };

  // 선택된 멤버의 전체 항목들 (필터 옵션용)
  const allMemberItems = useMemo(() => {
    if (!currentData || !activeMember) return [];
    return currentData.items.filter((item) => item.name === activeMember);
  }, [currentData, activeMember]);

  // 멤버의 도메인/프로젝트 목록
  const availableDomains = useMemo(() => {
    const set = new Set(allMemberItems.map((item) => item.domain));
    return Array.from(set).sort();
  }, [allMemberItems]);

  const availableProjects = useMemo(() => {
    // 선택된 도메인이 있으면 해당 도메인의 프로젝트만
    const filteredItems = selectedDomains.size > 0
      ? allMemberItems.filter((item) => selectedDomains.has(item.domain))
      : allMemberItems;
    const set = new Set(filteredItems.map((item) => item.project));
    return Array.from(set).sort();
  }, [allMemberItems, selectedDomains]);

  // 최종 필터링된 항목
  const memberItems = useMemo(() => {
    let items = allMemberItems;
    if (selectedDomains.size > 0) {
      items = items.filter((item) => selectedDomains.has(item.domain));
    }
    if (selectedProjects.size > 0) {
      items = items.filter((item) => selectedProjects.has(item.project));
    }
    return items;
  }, [allMemberItems, selectedDomains, selectedProjects]);

  // 기간별 주차 수 계산
  const getWeekCount = (period: TrendPeriod): number => {
    switch (period) {
      case "1month": return 4;
      case "6months": return 24;
      case "year": return 52;
      default: return 4;
    }
  };

  // range에서 마지막 날짜 추출 (예: "2025-12-01 ~ 2025-12-05" -> "12/05")
  const getEndDateLabel = (range: string): string => {
    if (!range) return "";
    // range 형식: "2025-12-01 ~ 2025-12-05"
    const parts = range.split("~");
    if (parts.length < 2) return "";
    const endDate = parts[1].trim(); // "2025-12-05"
    const dateParts = endDate.split("-");
    if (dateParts.length < 3) return "";
    const month = dateParts[1]; // "12"
    const day = dateParts[2]; // "05"
    return `${month}/${day}`;
  };

  // 주차별 트렌드 데이터
  const weeklyTrend = useMemo(() => {
    if (!activeMember) return [];
    
    const weekCount = getWeekCount(trendPeriod);
    const recentWeeks = sortedWeekKeys.slice(-weekCount);
    
    return recentWeeks.map((weekKey) => {
      const weekData = allData[weekKey];
      if (!weekData) return null;
      
      let items = weekData.items.filter((item) => item.name === activeMember);
      
      // 도메인/프로젝트 필터 적용
      if (selectedDomains.size > 0) {
        items = items.filter((item) => selectedDomains.has(item.domain));
      }
      if (selectedProjects.size > 0) {
        items = items.filter((item) => selectedProjects.has(item.project));
      }
      
      if (items.length === 0) return null;

      const avgProgress = Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length);
      const avgPlan = Math.round(items.reduce((sum, i) => sum + (i.planPercent ?? i.progressPercent), 0) / items.length);
      const achievement = getAchievementRate(avgProgress, avgPlan);

      // range에서 마지막 날짜 추출하여 레이블로 사용
      const endDateLabel = getEndDateLabel(weekData.range);

      return {
        week: weekData.week,
        label: trendPeriod === "year" 
          ? `${weekData.month}월` 
          : endDateLabel || `${weekData.month}/${weekData.week.replace('W', '')}`,
        progress: avgProgress,
        plan: avgPlan,
        achievement,
        count: items.length,
      };
    }).filter(Boolean);
  }, [activeMember, allData, sortedWeekKeys, trendPeriod, selectedDomains, selectedProjects]);

  // 멤버 통계
  const stats = useMemo(() => {
    if (memberItems.length === 0) return null;

    const total = memberItems.length;
    const completed = memberItems.filter((i) => i.progressPercent >= 100).length;
    const avgProgress = Math.round(memberItems.reduce((sum, i) => sum + i.progressPercent, 0) / total);
    const avgPlan = Math.round(memberItems.reduce((sum, i) => sum + (i.planPercent ?? i.progressPercent), 0) / total);
    const avgAchievement = getAchievementRate(avgProgress, avgPlan);
    const atRisk = memberItems.filter((i) => (i.riskLevel ?? 0) >= 2).length;

    // 도메인별 분포
    const domainMap: Record<string, ScrumItem[]> = {};
    memberItems.forEach((item) => {
      if (!domainMap[item.domain]) domainMap[item.domain] = [];
      domainMap[item.domain].push(item);
    });

    // 프로젝트별 분포
    const projectMap: Record<string, ScrumItem[]> = {};
    memberItems.forEach((item) => {
      if (!projectMap[item.project]) projectMap[item.project] = [];
      projectMap[item.project].push(item);
    });

    // 리스크 레벨별
    const riskCounts: Record<RiskLevel, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    memberItems.forEach((item) => {
      const level = (item.riskLevel ?? 0) as RiskLevel;
      riskCounts[level]++;
    });

    // 도메인별 파이 차트 데이터
    const domainPieData = Object.entries(domainMap).map(([domain, items]) => ({
      name: domain,
      value: items.length,
      color: getDomainColor(domain).text,
    }));

    // 프로젝트별 바 차트 데이터
    const projectBarData = Object.entries(projectMap).map(([project, items]) => ({
      name: project.length > 15 ? project.substring(0, 15) + '...' : project,
      fullName: project,
      count: items.length,
      avgProgress: Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length),
    })).sort((a, b) => b.count - a.count).slice(0, 6);

    return {
      total,
      completed,
      avgProgress,
      avgPlan,
      avgAchievement,
      atRisk,
      domains: Object.entries(domainMap).map(([domain, items]) => ({
        domain,
        count: items.length,
        avgProgress: Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length),
      })),
      projects: Object.entries(projectMap).map(([project, items]) => ({
        project,
        count: items.length,
        avgProgress: Math.round(items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length),
      })),
      riskCounts,
      domainPieData,
      projectBarData,
    };
  }, [memberItems]);

  // 도메인 토글
  const toggleDomain = (domain: string) => {
    const newSet = new Set(selectedDomains);
    if (newSet.has(domain)) {
      newSet.delete(domain);
    } else {
      newSet.add(domain);
    }
    setSelectedDomains(newSet);
    // 프로젝트 필터 초기화 (도메인 변경 시)
    setSelectedProjects(new Set());
  };

  // 프로젝트 토글
  const toggleProject = (project: string) => {
    const newSet = new Set(selectedProjects);
    if (newSet.has(project)) {
      newSet.delete(project);
    } else {
      newSet.add(project);
    }
    setSelectedProjects(newSet);
  };

  // 도메인 전체 선택/해제
  const toggleAllDomains = () => {
    if (selectedDomains.size === availableDomains.length) {
      setSelectedDomains(new Set());
    } else {
      setSelectedDomains(new Set(availableDomains));
    }
    setSelectedProjects(new Set());
  };

  // 프로젝트 전체 선택/해제
  const toggleAllProjects = () => {
    if (selectedProjects.size === availableProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(availableProjects));
    }
  };

  if (!currentData) {
    return (
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--notion-text-secondary)' }}>
        데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더: 멤버 선택 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--notion-text)' }}>
              개인 대시보드
            </h1>
            <p className="text-sm" style={{ color: 'var(--notion-text-secondary)' }}>
              개인 업무 현황을 한눈에 확인하세요
            </p>
          </div>
          <select
            value={activeMember}
            onChange={(e) => handleMemberChange(e.target.value)}
            className="notion-select text-base font-medium px-4 py-2"
          >
            {members.map((member) => (
              <option key={member} value={member}>{member}</option>
            ))}
          </select>
        </div>

        {/* 필터 영역 */}
        <div className="notion-card p-4">
          <div className="flex flex-col gap-4">
            {/* 도메인 필터 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--notion-text-secondary)' }}>
                  🏷️ 도메인 {selectedDomains.size > 0 && `(${selectedDomains.size}/${availableDomains.length})`}
                </span>
                <button
                  onClick={toggleAllDomains}
                  className="text-xs hover:underline"
                  style={{ color: 'var(--notion-blue)' }}
                >
                  {selectedDomains.size === availableDomains.length ? '전체 해제' : selectedDomains.size > 0 ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableDomains.map((domain) => {
                  const isChecked = selectedDomains.has(domain);
                  const color = getDomainColor(domain);
                  return (
                    <button
                      key={domain}
                      onClick={() => toggleDomain(domain)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all"
                      style={{
                        background: isChecked ? color.bg : 'var(--notion-bg-secondary)',
                        color: isChecked ? color.text : 'var(--notion-text-secondary)',
                        border: `1px solid ${isChecked ? color.text : 'var(--notion-border)'}`,
                      }}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                        style={{ 
                          borderColor: isChecked ? color.text : 'var(--notion-border-dark)',
                          background: isChecked ? color.text : 'var(--notion-bg)'
                        }}
                      >
                        {isChecked && (
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                      {domain}
                    </button>
                  );
                })}
              </div>
              {selectedDomains.size === 0 && (
                <p className="text-xs mt-1.5" style={{ color: 'var(--notion-text-muted)' }}>
                  도메인을 선택하지 않으면 전체가 표시됩니다
                </p>
              )}
            </div>

            {/* 프로젝트 필터 */}
            <div style={{ opacity: selectedDomains.size === 0 ? 0.5 : 1 }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium" style={{ color: 'var(--notion-text-secondary)' }}>
                  📁 프로젝트 {selectedProjects.size > 0 && `(${selectedProjects.size}/${availableProjects.length})`}
                </span>
                {selectedDomains.size > 0 && (
                  <button
                    onClick={toggleAllProjects}
                    className="text-xs hover:underline"
                    style={{ color: 'var(--notion-blue)' }}
                  >
                    {selectedProjects.size === availableProjects.length ? '전체 해제' : selectedProjects.size > 0 ? '전체 해제' : '전체 선택'}
                  </button>
                )}
              </div>
              {selectedDomains.size === 0 ? (
                <div 
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
                  style={{ background: 'var(--notion-bg-secondary)', border: '1px dashed var(--notion-border)' }}
                >
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--notion-text-muted)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>
                    도메인을 먼저 선택하면 프로젝트 필터를 사용할 수 있습니다
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {availableProjects.map((project) => {
                      const isChecked = selectedProjects.has(project);
                      return (
                        <button
                          key={project}
                          onClick={() => toggleProject(project)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-all"
                          style={{
                            background: isChecked ? 'var(--notion-blue-bg)' : 'var(--notion-bg-secondary)',
                            color: isChecked ? 'var(--notion-blue)' : 'var(--notion-text-secondary)',
                            border: `1px solid ${isChecked ? 'var(--notion-blue)' : 'var(--notion-border)'}`,
                          }}
                        >
                          <span 
                            className="w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                            style={{ 
                              borderColor: isChecked ? 'var(--notion-blue)' : 'var(--notion-border-dark)',
                              background: isChecked ? 'var(--notion-blue)' : 'var(--notion-bg)'
                            }}
                          >
                            {isChecked && (
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </span>
                          <span className="truncate max-w-[150px]" title={project}>{project}</span>
                        </button>
                      );
                    })}
                  </div>
                  {selectedProjects.size === 0 && (
                    <p className="text-xs mt-1.5" style={{ color: 'var(--notion-text-muted)' }}>
                      프로젝트를 선택하지 않으면 선택된 도메인의 전체 프로젝트가 표시됩니다
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 필터 상태 표시 */}
          {(selectedDomains.size > 0 || selectedProjects.size > 0) && (
            <div className="mt-3 pt-3 flex items-center gap-2 flex-wrap" style={{ borderTop: '1px solid var(--notion-border)' }}>
              <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>필터:</span>
              {selectedDomains.size > 0 && (
                <span className="notion-badge-blue text-xs">
                  도메인 {selectedDomains.size}개
                </span>
              )}
              {selectedProjects.size > 0 && (
                <span className="notion-badge-green text-xs">
                  프로젝트 {selectedProjects.size}개
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedDomains(new Set());
                  setSelectedProjects(new Set());
                }}
                className="text-xs hover:underline"
                style={{ color: 'var(--notion-red)' }}
              >
                초기화
              </button>
            </div>
          )}
        </div>
      </div>

      {stats && (
        <>
          {/* 요약 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard value={stats.total} label="전체 항목" />
            <StatCard 
              value={stats.completed} 
              label="완료" 
              color="var(--notion-green)" 
            />
            <StatCard 
              value={`${stats.avgProgress}%`} 
              label="평균 진척률" 
              color={getProgressColor(stats.avgProgress)} 
            />
            <StatCard 
              value={`${stats.avgAchievement}%`} 
              label="달성률" 
              color={stats.avgAchievement >= 80 ? 'var(--notion-green)' : 'var(--notion-red)'} 
            />
            <StatCard 
              value={stats.atRisk} 
              label="주의 필요" 
              color="var(--notion-orange)"
              highlight={stats.atRisk > 0}
            />
          </div>

          {/* 주차별 트렌드 차트 */}
          {selectMode === "single" ? (
            <div className="notion-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--notion-text)' }}>
                📈 주차별 추이
              </h3>
              <div 
                className="flex flex-col items-center justify-center py-8 rounded-lg"
                style={{ background: 'var(--notion-bg-secondary)' }}
              >
                <svg 
                  className="w-12 h-12 mb-3" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  style={{ color: 'var(--notion-text-muted)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--notion-text-secondary)' }}>
                  단일 주차 데이터로는 추이를 확인할 수 없어요
                </p>
                <p className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>
                  상단에서 <span className="font-medium" style={{ color: 'var(--notion-blue)' }}>범위</span> 모드를 선택하면 주차별 변화를 확인할 수 있습니다
                </p>
              </div>
            </div>
          ) : weeklyTrend.length > 1 && (
            <div className="notion-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--notion-text)' }}>
                  📈 주차별 추이
                </h3>
                <select
                  value={trendPeriod}
                  onChange={(e) => setTrendPeriod(e.target.value as TrendPeriod)}
                  className="notion-select text-xs"
                >
                  <option value="1month">최근 1개월</option>
                  <option value="6months">최근 6개월</option>
                  <option value="year">연도별</option>
                </select>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyTrend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--notion-border)" />
                    <XAxis 
                      dataKey="label" 
                      tick={{ fontSize: 11, fill: 'var(--notion-text-secondary)' }}
                      axisLine={{ stroke: 'var(--notion-border)' }}
                      interval={trendPeriod === "year" ? 3 : 0}
                    />
                    <YAxis 
                      domain={[0, 120]}
                      tick={{ fontSize: 11, fill: 'var(--notion-text-secondary)' }}
                      axisLine={{ stroke: 'var(--notion-border)' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--notion-bg)', 
                        border: '1px solid var(--notion-border)',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => {
                        const labels: Record<string, string> = {
                          plan: '계획',
                          progress: '진척률',
                          achievement: '달성률'
                        };
                        return [`${value}%`, labels[name] || name];
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => {
                        const labels: Record<string, string> = {
                          plan: '계획',
                          progress: '진척률',
                          achievement: '달성률'
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="plan" 
                      stroke="var(--notion-gray)" 
                      strokeDasharray="5 5"
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'var(--notion-gray)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="var(--notion-blue)" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'var(--notion-blue)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="achievement" 
                      stroke="var(--notion-green)" 
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'var(--notion-green)' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 도메인 & 프로젝트 차트 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 도메인별 파이 차트 */}
            <DomainPieChartCard 
              data={stats.domainPieData} 
              domainStats={stats.domains}
            />

            {/* 프로젝트별 바 차트 */}
            <div className="notion-card p-4">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--notion-text)' }}>
                📁 프로젝트별 진척률
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stats.projectBarData} 
                    layout="vertical"
                    margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--notion-border)" horizontal={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: 'var(--notion-text-secondary)' }}
                      axisLine={{ stroke: 'var(--notion-border)' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      tick={{ fontSize: 11, fill: 'var(--notion-text-secondary)' }}
                      axisLine={{ stroke: 'var(--notion-border)' }}
                      width={75}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--notion-bg)', 
                        border: '1px solid var(--notion-border)',
                        borderRadius: '6px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'avgProgress') {
                          return [`${value}%`, '평균 진척률'];
                        }
                        return [value, name];
                      }}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          return payload[0].payload.fullName;
                        }
                        return label;
                      }}
                    />
                    <Bar dataKey="avgProgress" radius={[0, 4, 4, 0]}>
                      {stats.projectBarData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={getProgressColor(entry.avgProgress)} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="notion-card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--notion-text)' }}>
              📊 전체 진척 현황
            </h3>
            <div className="flex items-center gap-4 mb-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span style={{ color: 'var(--notion-text-secondary)' }}>
                    계획 {stats.avgPlan}% → 실제 {stats.avgProgress}%
                  </span>
                  <span 
                    className="font-medium"
                    style={{ color: stats.avgAchievement >= 80 ? 'var(--notion-green)' : 'var(--notion-red)' }}
                  >
                    달성률 {stats.avgAchievement}%
                  </span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--notion-bg-secondary)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${stats.avgProgress}%`,
                      backgroundColor: getProgressColor(stats.avgProgress),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 리스크 현황 */}
          <div className="notion-card p-4">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--notion-text)' }}>
              ⚠️ 리스크 현황
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {([3, 2, 1, 0] as RiskLevel[]).map((level) => {
                const color = RISK_LEVEL_COLORS[level];
                const count = stats.riskCounts[level];
                return (
                  <div
                    key={level}
                    className="p-3 rounded text-center"
                    style={{ background: color.bg }}
                  >
                    <div className="text-lg font-bold" style={{ color: color.text }}>
                      {count}
                    </div>
                    <div className="text-xs" style={{ color: color.text }}>
                      Lv.{level} {color.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 항목 리스트 */}
          <div className="notion-card overflow-hidden">
            <div 
              className="px-4 py-3"
              style={{ 
                background: 'var(--notion-bg-secondary)',
                borderBottom: '1px solid var(--notion-border)'
              }}
            >
              <h3 className="text-sm font-semibold" style={{ color: 'var(--notion-text)' }}>
                📝 업무 상세 목록 ({memberItems.length}개)
              </h3>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--notion-border)' }}>
              {memberItems.map((item, idx) => (
                <ItemRow key={idx} item={item} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ 
  value, 
  label, 
  color, 
  highlight 
}: { 
  value: number | string; 
  label: string; 
  color?: string;
  highlight?: boolean;
}) {
  return (
    <div 
      className={`notion-card p-4 ${highlight ? 'ring-2 ring-offset-1 ring-orange-400' : ''}`}
    >
      <div className="text-2xl font-bold" style={{ color: color || 'var(--notion-text)' }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
        {label}
      </div>
    </div>
  );
}

function ItemRow({ item }: { item: ScrumItem }) {
  const domainColor = getDomainColor(item.domain);
  const riskLevel = (item.riskLevel ?? 0) as RiskLevel;
  const riskColor = RISK_LEVEL_COLORS[riskLevel];
  const achievementRate = getAchievementRate(item.progressPercent, item.planPercent ?? item.progressPercent);

  return (
    <div 
      className="px-4 py-3 hover:bg-[#fafafa] transition-colors"
      style={{ borderBottom: '1px solid var(--notion-border)' }}
    >
      <div className="flex items-start gap-3">
        {/* 진행률 인디케이터 */}
        <div 
          className="w-10 h-10 rounded flex items-center justify-center text-sm font-bold text-white shrink-0"
          style={{ backgroundColor: getProgressColor(item.progressPercent) }}
        >
          {item.progressPercent}%
        </div>

        {/* 내용 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            <span className="text-sm font-medium" style={{ color: 'var(--notion-text)' }}>
              {item.topic}
            </span>
            {riskLevel > 0 && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: riskColor.bg, color: riskColor.text }}
              >
                Lv.{riskLevel}
              </span>
            )}
          </div>
          <div className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
            {item.project} · 계획 {item.planPercent ?? item.progressPercent}% → 달성률 {achievementRate}%
          </div>
          {item.progress && (
            <div className="text-xs mt-1" style={{ color: 'var(--notion-text-muted)' }}>
              {item.progress}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 도메인별 파이 차트 카드 (클릭 시 상세 정보 표시)
interface DomainPieChartCardProps {
  data: { name: string; value: number; color: string }[];
  domainStats: { domain: string; count: number; avgProgress: number }[];
}

function DomainPieChartCard({ data, domainStats }: DomainPieChartCardProps) {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  const selectedStat = selectedDomain
    ? domainStats.find((d) => d.domain === selectedDomain)
    : null;

  const handlePieClick = (entry: { name: string }) => {
    setSelectedDomain(entry.name === selectedDomain ? null : entry.name);
  };

  return (
    <div className="notion-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: 'var(--notion-text)' }}>
          🏷️ 도메인별 업무 분포
        </h3>
        <span className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>
          클릭하여 상세 보기
        </span>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={75}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: 'var(--notion-text-secondary)', strokeWidth: 1 }}
              onClick={handlePieClick}
              style={{ cursor: 'pointer' }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={entry.name === selectedDomain ? 'var(--notion-text)' : 'transparent'}
                  strokeWidth={entry.name === selectedDomain ? 2 : 0}
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                background: 'var(--notion-bg)', 
                border: '1px solid var(--notion-border)',
                borderRadius: '6px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`${value}개`, '항목 수']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* 선택된 도메인 상세 정보 */}
      {selectedStat && (
        <div 
          className="mt-3 p-3 rounded-lg animate-fadeIn"
          style={{ 
            background: 'var(--notion-bg-secondary)',
            border: '1px solid var(--notion-border)'
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{ 
                  background: getDomainColor(selectedStat.domain).bg, 
                  color: getDomainColor(selectedStat.domain).text 
                }}
              >
                {selectedStat.domain}
              </span>
              <button
                onClick={() => setSelectedDomain(null)}
                className="text-xs hover:underline"
                style={{ color: 'var(--notion-text-muted)' }}
              >
                닫기
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>업무 항목</div>
              <div className="font-semibold" style={{ color: 'var(--notion-text)' }}>
                {selectedStat.count}개
              </div>
            </div>
            <div>
              <div className="text-xs" style={{ color: 'var(--notion-text-muted)' }}>평균 진척률</div>
              <div className="font-semibold" style={{ color: getProgressColor(selectedStat.avgProgress) }}>
                {selectedStat.avgProgress}%
              </div>
            </div>
          </div>
          <div className="mt-2">
            <div className="notion-progress h-2">
              <div
                className="notion-progress-bar"
                style={{
                  width: `${selectedStat.avgProgress}%`,
                  backgroundColor: getProgressColor(selectedStat.avgProgress),
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
