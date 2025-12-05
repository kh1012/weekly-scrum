"use client";

import { useMemo, useState } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { getProgressColor, getDomainColor, RISK_LEVEL_COLORS, getAchievementRate } from "@/lib/colorDefines";
import type { RiskLevel, ScrumItem } from "@/types/scrum";

export function MyDashboardView() {
  const { currentData, members } = useScrumContext();
  const [selectedMember, setSelectedMember] = useState<string>("");

  // 멤버가 선택되지 않으면 첫 번째 멤버 선택
  const activeMember = selectedMember || members[0] || "";

  // 선택된 멤버의 항목들
  const memberItems = useMemo(() => {
    if (!currentData || !activeMember) return [];
    return currentData.items.filter((item) => item.name === activeMember);
  }, [currentData, activeMember]);

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
    };
  }, [memberItems]);

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
          onChange={(e) => setSelectedMember(e.target.value)}
          className="notion-select text-base font-medium px-4 py-2"
        >
          {members.map((member) => (
            <option key={member} value={member}>{member}</option>
          ))}
        </select>
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

          {/* 도메인별 & 프로젝트별 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 도메인별 */}
            <div className="notion-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--notion-text)' }}>
                🏷️ 도메인별 현황
              </h3>
              <div className="space-y-2">
                {stats.domains.map(({ domain, count, avgProgress }) => {
                  const color = getDomainColor(domain);
                  return (
                    <div key={domain} className="flex items-center gap-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-medium shrink-0"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {domain}
                      </span>
                      <div className="flex-1">
                        <div className="notion-progress h-2">
                          <div
                            className="notion-progress-bar"
                            style={{
                              width: `${avgProgress}%`,
                              backgroundColor: getProgressColor(avgProgress),
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-xs" style={{ color: 'var(--notion-text-secondary)' }}>
                        {count}개 · {avgProgress}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 프로젝트별 */}
            <div className="notion-card p-4">
              <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--notion-text)' }}>
                📁 프로젝트별 현황
              </h3>
              <div className="space-y-2">
                {stats.projects.map(({ project, count, avgProgress }) => (
                  <div key={project} className="flex items-center gap-3">
                    <span className="text-sm truncate flex-1" style={{ color: 'var(--notion-text)' }}>
                      {project}
                    </span>
                    <div className="w-24">
                      <div className="notion-progress h-2">
                        <div
                          className="notion-progress-bar"
                          style={{
                            width: `${avgProgress}%`,
                            backgroundColor: getProgressColor(avgProgress),
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: 'var(--notion-text-secondary)' }}>
                      {count}개 · {avgProgress}%
                    </span>
                  </div>
                ))}
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
                📝 업무 상세 목록
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
