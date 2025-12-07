"use client";

import { useState, useRef, useCallback, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrumContext } from "@/context/ScrumContext";
import { getProgressColor, RISK_LEVEL_COLORS } from "@/lib/colorDefines";
import type { RiskLevel } from "@/types/scrum";

interface StatItemProps {
  children: ReactNode;
  tooltip: ReactNode;
}

function StatItem({ children, tooltip }: StatItemProps) {
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(() => {
    if (tooltipPos) {
      // 이미 열려있으면 닫기
      setTooltipPos(null);
    } else if (ref.current) {
      // 닫혀있으면 열기
      const rect = ref.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    }
  }, [tooltipPos]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    if (!tooltipPos) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        ref.current && !ref.current.contains(target) &&
        tooltipRef.current && !tooltipRef.current.contains(target)
      ) {
        setTooltipPos(null);
      }
    };

    // 약간의 딜레이를 두어 현재 클릭 이벤트가 처리된 후에 리스너 등록
    const timer = setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("click", handleClickOutside);
    };
  }, [tooltipPos]);

  const isActive = tooltipPos !== null;

  return (
    <>
      <span
        ref={ref}
        onClick={handleClick}
        className="cursor-pointer px-1.5 py-0.5 rounded transition-colors select-none"
        style={{ 
          background: isActive ? 'var(--notion-bg-hover)' : 'transparent' 
        }}
      >
        {children}
      </span>
      {tooltipPos &&
        createPortal(
          <div
            ref={tooltipRef}
            className="fixed z-[9999] animate-fadeIn"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translateX(-50%)",
            }}
          >
            <div 
              className="rounded-lg p-4 min-w-[200px] max-w-[320px]"
              style={{ 
                background: 'var(--notion-text)',
                boxShadow: 'var(--notion-shadow-md)'
              }}
            >
              {tooltip}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

export function StatsBar() {
  const { stats } = useScrumContext();
  const progressColor = getProgressColor(stats.avgProgress);
  const achievementColor = getProgressColor(stats.avgAchievement >= 100 ? 100 : stats.avgProgress);

  return (
    <div className="flex items-center gap-0.5 text-sm">
      {/* 항목 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-medium text-white/60 border-b border-white/10 pb-2">항목 현황</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-white/50 text-xs">전체</div>
                <div className="font-semibold text-white">{stats.total}개</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">완료</div>
                <div className="font-semibold" style={{ color: 'var(--notion-green)' }}>{stats.completed}개</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">진행 중</div>
                <div className="font-semibold" style={{ color: 'var(--notion-blue)' }}>{stats.inProgress}개</div>
              </div>
              <div>
                <div className="text-white/50 text-xs">완료율</div>
                <div className="font-semibold text-white">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
              </div>
            </div>
            <div className="text-xs text-white/40 pt-2 border-t border-white/10">
              {stats.domains.length}개 도메인 · {stats.projects.length}개 프로젝트 · {stats.members.length}명
            </div>
          </div>
        }
      >
        <span style={{ color: 'var(--notion-text-secondary)' }}>
          <span className="font-medium" style={{ color: 'var(--notion-text)' }}>{stats.total}</span> 항목
        </span>
      </StatItem>

      <span style={{ color: 'var(--notion-border)' }}>·</span>

      {/* 실행/계획 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-medium text-white/60 border-b border-white/10 pb-2">실행 / 계획</div>
            <div className="flex items-center justify-center gap-3 text-sm p-2 rounded whitespace-nowrap" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div className="flex flex-col items-center">
                <span className="text-white/50 text-xs">계획</span>
                <span className="font-semibold text-white text-lg">{stats.avgPlan}%</span>
              </div>
              <span className="text-white/40">→</span>
              <div className="flex flex-col items-center">
                <span className="text-white/50 text-xs">실행</span>
                <span className="font-semibold text-lg" style={{ color: progressColor }}>{stats.avgProgress}%</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/50">달성률</span>
                <span className="font-semibold" style={{ color: achievementColor }}>{stats.avgAchievement}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden mt-1" style={{ background: 'rgba(255,255,255,0.2)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(stats.avgAchievement, 100)}%`, background: achievementColor }}
                />
              </div>
            </div>
          </div>
        }
      >
        <span style={{ color: 'var(--notion-text-secondary)' }}>
          <span className="font-medium" style={{ color: progressColor }}>{stats.avgProgress}</span>
          <span style={{ color: 'var(--notion-text-muted)' }}>/</span>
          <span className="font-medium" style={{ color: 'var(--notion-text)' }}>{stats.avgPlan}%</span>
        </span>
      </StatItem>

      <span style={{ color: 'var(--notion-border)' }}>·</span>

      {/* 달성률 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-medium text-white/60 border-b border-white/10 pb-2">평균 달성률</div>
            <div className="text-center py-2">
              <div className="text-3xl font-bold" style={{ color: achievementColor }}>{stats.avgAchievement}%</div>
              <div className="text-xs text-white/50 mt-1">계획 대비 실행 비율</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-white/50">100% 이상 (초과 달성)</span>
                <span style={{ color: 'var(--notion-green)' }}>{stats.avgAchievement >= 100 ? "✓" : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">80~99% (정상)</span>
                <span style={{ color: 'var(--notion-blue)' }}>{stats.avgAchievement >= 80 && stats.avgAchievement < 100 ? "✓" : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">80% 미만 (지연)</span>
                <span style={{ color: 'var(--notion-red)' }}>{stats.avgAchievement < 80 ? "✓" : "-"}</span>
              </div>
            </div>
          </div>
        }
      >
        <span style={{ color: 'var(--notion-text-secondary)' }}>
          달성{" "}
          <span className="font-medium" style={{ color: achievementColor }}>{stats.avgAchievement}%</span>
        </span>
      </StatItem>

      <span style={{ color: 'var(--notion-border)' }}>·</span>

      {/* 리스크 집계 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-medium text-white/60 border-b border-white/10 pb-2">리스크 집계</div>
            <div className="space-y-2">
              {([3, 2, 1, 0] as RiskLevel[]).map((level) => {
                const color = RISK_LEVEL_COLORS[level];
                const count = stats.riskCounts[level];
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2 h-2 rounded-full" 
                        style={{ background: color.text }}
                      />
                      <span className="text-sm">
                        <span style={{ color: color.text }}>Lv.{level}</span>
                        <span className="text-white/50 ml-1">{color.label}</span>
                      </span>
                    </div>
                    <span className="font-semibold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-white/40 pt-2 border-t border-white/10">
              주의 필요 (Lv.2+): <span className="font-medium" style={{ color: 'var(--notion-orange)' }}>{stats.atRisk}개</span>
            </div>
          </div>
        }
      >
        <span className="flex items-center gap-1" style={{ color: 'var(--notion-text-secondary)' }}>
          리스크
          {stats.riskCounts[3] > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_LEVEL_COLORS[3].text }} />
              <span className="font-medium" style={{ color: RISK_LEVEL_COLORS[3].text }}>{stats.riskCounts[3]}</span>
            </span>
          )}
          {stats.riskCounts[2] > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_LEVEL_COLORS[2].text }} />
              <span className="font-medium" style={{ color: RISK_LEVEL_COLORS[2].text }}>{stats.riskCounts[2]}</span>
            </span>
          )}
          {stats.riskCounts[1] > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: RISK_LEVEL_COLORS[1].text }} />
              <span className="font-medium" style={{ color: RISK_LEVEL_COLORS[1].text }}>{stats.riskCounts[1]}</span>
            </span>
          )}
          {stats.atRisk === 0 && stats.riskCounts[1] === 0 && (
            <span className="font-medium" style={{ color: 'var(--notion-green)' }}>없음</span>
          )}
        </span>
      </StatItem>
    </div>
  );
}
