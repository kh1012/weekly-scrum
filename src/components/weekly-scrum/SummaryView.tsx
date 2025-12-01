"use client";

import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import { 
  getDomainColor, 
  getProgressColor,
  PROGRESS_COLORS,
  UI_COLORS,
  STATUS_COLORS
} from "@/lib/colorDefines";

interface SummaryViewProps {
  items: ScrumItem[];
}

export function SummaryView({ items }: SummaryViewProps) {
  // 도메인별 통계
  const domainStats = useMemo(() => {
    const stats: Record<string, { items: ScrumItem[]; avgProgress: number }> = {};
    
    items.forEach((item) => {
      if (!stats[item.domain]) {
        stats[item.domain] = { items: [], avgProgress: 0 };
      }
      stats[item.domain].items.push(item);
    });

    Object.keys(stats).forEach((domain) => {
      const domainItems = stats[domain].items;
      stats[domain].avgProgress = Math.round(
        domainItems.reduce((sum, item) => sum + item.progressPercent, 0) / domainItems.length
      );
    });

    return Object.entries(stats)
      .map(([domain, data]) => ({ domain, ...data }))
      .sort((a, b) => b.avgProgress - a.avgProgress);
  }, [items]);

  // 팀원별 통계
  const memberStats = useMemo(() => {
    const stats: Record<string, { items: ScrumItem[]; avgProgress: number }> = {};
    
    items.forEach((item) => {
      if (!stats[item.name]) {
        stats[item.name] = { items: [], avgProgress: 0 };
      }
      stats[item.name].items.push(item);
    });

    Object.keys(stats).forEach((name) => {
      const memberItems = stats[name].items;
      stats[name].avgProgress = Math.round(
        memberItems.reduce((sum, item) => sum + item.progressPercent, 0) / memberItems.length
      );
    });

    return Object.entries(stats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.items.length - a.items.length);
  }, [items]);

  // 리스크 항목
  const riskItems = useMemo(() => {
    return items.filter((item) => item.risk && item.risk !== "-" && item.risk.trim() !== "");
  }, [items]);

  // 진행률 분포
  const progressDistribution = useMemo(() => {
    const dist = {
      completed: items.filter((i) => i.progressPercent >= 100).length,
      high: items.filter((i) => i.progressPercent >= 70 && i.progressPercent < 100).length,
      medium: items.filter((i) => i.progressPercent >= 40 && i.progressPercent < 70).length,
      low: items.filter((i) => i.progressPercent < 40).length,
    };
    return dist;
  }, [items]);

  const total = items.length;

  return (
    <div className="space-y-6">
      {/* 상단 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
          <div className="text-2xl font-bold" style={{ color: UI_COLORS.textPrimary }}>{total}</div>
          <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>전체 항목</div>
        </div>
        <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
          <div className="text-2xl font-bold" style={{ color: PROGRESS_COLORS.completed.text }}>{progressDistribution.completed}</div>
          <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>완료</div>
        </div>
        <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
          <div className="text-2xl font-bold" style={{ color: PROGRESS_COLORS.high.text }}>{progressDistribution.high + progressDistribution.medium}</div>
          <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>진행 중</div>
        </div>
        <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
          <div className="text-2xl font-bold" style={{ color: STATUS_COLORS.risk.text }}>{riskItems.length}</div>
          <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>리스크</div>
        </div>
      </div>

      {/* 진행률 분포 바 */}
      <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
        <h3 className="text-sm font-semibold mb-3" style={{ color: UI_COLORS.textPrimary }}>진행률 분포</h3>
        <div className="flex h-6 rounded-md overflow-hidden">
          {progressDistribution.completed > 0 && (
            <div
              className="flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(progressDistribution.completed / total) * 100}%`, backgroundColor: PROGRESS_COLORS.completed.text }}
            >
              {progressDistribution.completed}
            </div>
          )}
          {progressDistribution.high > 0 && (
            <div
              className="flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(progressDistribution.high / total) * 100}%`, backgroundColor: PROGRESS_COLORS.high.text }}
            >
              {progressDistribution.high}
            </div>
          )}
          {progressDistribution.medium > 0 && (
            <div
              className="flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(progressDistribution.medium / total) * 100}%`, backgroundColor: PROGRESS_COLORS.medium.text }}
            >
              {progressDistribution.medium}
            </div>
          )}
          {progressDistribution.low > 0 && (
            <div
              className="flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${(progressDistribution.low / total) * 100}%`, backgroundColor: PROGRESS_COLORS.low.text }}
            >
              {progressDistribution.low}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: UI_COLORS.textSecondary }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROGRESS_COLORS.completed.text }} />완료</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROGRESS_COLORS.high.text }} />70%+</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROGRESS_COLORS.medium.text }} />40-70%</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: PROGRESS_COLORS.low.text }} />40% 미만</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 도메인별 현황 */}
        <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: UI_COLORS.textPrimary }}>도메인별 현황</h3>
          <div className="space-y-3">
            {domainStats.map(({ domain, items: domainItems, avgProgress }) => {
              const color = getDomainColor(domain);
              return (
                <div key={domain}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {domain}
                      </span>
                      <span className="text-xs" style={{ color: UI_COLORS.textSecondary }}>{domainItems.length}개</span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: UI_COLORS.textPrimary }}>{avgProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: UI_COLORS.borderLight }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${avgProgress}%`,
                        backgroundColor: getProgressColor(avgProgress),
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 팀원별 워크로드 */}
        <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: UI_COLORS.textPrimary }}>팀원별 워크로드</h3>
          <div className="space-y-3">
            {memberStats.map(({ name, items: memberItems, avgProgress }) => {
              const completedCount = memberItems.filter((i) => i.progressPercent >= 100).length;
              return (
                <div key={name} className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                    style={{ backgroundColor: UI_COLORS.bgSecondary, border: `1px solid ${UI_COLORS.border}`, color: UI_COLORS.textSecondary }}
                  >
                    {name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium" style={{ color: UI_COLORS.textPrimary }}>{name}</span>
                      <span className="text-xs" style={{ color: UI_COLORS.textSecondary }}>
                        {completedCount}/{memberItems.length}개 완료 · 평균 {avgProgress}%
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {memberItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="h-2 rounded-full flex-1"
                          style={{
                            backgroundColor: getProgressColor(item.progressPercent),
                          }}
                          title={`${item.topic}: ${item.progressPercent}%`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 리스크 항목 */}
      {riskItems.length > 0 && (
        <div className="bg-white rounded-md p-4" style={{ border: `1px solid ${UI_COLORS.border}` }}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: UI_COLORS.textPrimary }}>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" style={{ color: STATUS_COLORS.risk.text }}>
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            주의 필요 항목
          </h3>
          <div className="space-y-2">
            {riskItems.map((item, idx) => {
              const color = getDomainColor(item.domain);
              return (
                <div 
                  key={idx} 
                  className="flex items-start gap-3 p-3 rounded-md"
                  style={{ backgroundColor: PROGRESS_COLORS.medium.bg, border: `1px solid ${PROGRESS_COLORS.medium.border}` }}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: color.bg, color: color.text }}
                      >
                        {item.domain}
                      </span>
                      <span className="text-sm font-medium" style={{ color: UI_COLORS.textPrimary }}>{item.topic}</span>
                      <span className="text-xs" style={{ color: UI_COLORS.textSecondary }}>({item.name})</span>
                    </div>
                    <p className="text-xs" style={{ color: PROGRESS_COLORS.medium.text }}>{item.risk}</p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: PROGRESS_COLORS.medium.text }}>{item.progressPercent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

