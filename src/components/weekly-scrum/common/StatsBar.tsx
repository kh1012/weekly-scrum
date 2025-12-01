"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { createPortal } from "react-dom";
import { useScrumContext } from "@/context/ScrumContext";
import { getProgressColor, RISK_LEVEL_COLORS, getAchievementRate } from "@/lib/colorDefines";
import type { RiskLevel } from "@/types/scrum";

interface StatItemProps {
  children: ReactNode;
  tooltip: ReactNode;
}

function StatItem({ children, tooltip }: StatItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isHovered && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    }
  }, [isHovered]);

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="cursor-pointer hover:bg-[#f6f8fa] px-2 py-1 rounded transition-colors"
      >
        {children}
      </span>
      {isHovered &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translateX(-50%)",
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[#1f2328]" />
            <div className="bg-[#1f2328] text-white rounded-lg shadow-xl p-4 min-w-[200px] max-w-[320px]">
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
    <div className="flex items-center gap-1 text-sm">
      {/* 항목 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#8c959f] border-b border-[#3d444d] pb-2">항목 현황</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-[#8c959f] text-xs">전체</div>
                <div className="font-bold text-white">{stats.total}개</div>
              </div>
              <div>
                <div className="text-[#8c959f] text-xs">완료</div>
                <div className="font-bold text-[#1a7f37]">{stats.completed}개</div>
              </div>
              <div>
                <div className="text-[#8c959f] text-xs">진행 중</div>
                <div className="font-bold text-[#0969da]">{stats.inProgress}개</div>
              </div>
              <div>
                <div className="text-[#8c959f] text-xs">완료율</div>
                <div className="font-bold text-white">{stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%</div>
              </div>
            </div>
            <div className="text-xs text-[#8c959f] pt-2 border-t border-[#3d444d]">
              {stats.domains.length}개 도메인 · {stats.projects.length}개 프로젝트 · {stats.members.length}명
            </div>
          </div>
        }
      >
        <span className="text-[#656d76]">
          <span className="font-semibold text-[#1f2328]">{stats.total}</span> 항목
        </span>
      </StatItem>

      <span className="text-[#d0d7de]">·</span>

      {/* 실행/계획 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#8c959f] border-b border-[#3d444d] pb-2">실행 / 계획</div>
            <div className="flex items-center gap-4 text-sm p-2 rounded bg-[#2d333b]">
              <div className="flex items-center gap-2">
                <span className="text-[#8c959f]">계획</span>
                <span className="font-bold text-white text-lg">{stats.avgPlan}%</span>
              </div>
              <span className="text-[#8c959f]">→</span>
              <div className="flex items-center gap-2">
                <span className="text-[#8c959f]">실행</span>
                <span className="font-bold text-lg" style={{ color: progressColor }}>{stats.avgProgress}%</span>
              </div>
            </div>
            <div className="text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#8c959f]">달성률</span>
                <span className="font-bold" style={{ color: achievementColor }}>{stats.avgAchievement}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-[#3d444d] mt-1">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(stats.avgAchievement, 100)}%`, background: achievementColor }}
                />
              </div>
            </div>
          </div>
        }
      >
        <span className="text-[#656d76]">
          <span className="font-semibold" style={{ color: progressColor }}>{stats.avgProgress}</span>
          <span className="text-[#8c959f]">/</span>
          <span className="font-semibold text-[#1f2328]">{stats.avgPlan}%</span>
        </span>
      </StatItem>

      <span className="text-[#d0d7de]">·</span>

      {/* 달성률 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#8c959f] border-b border-[#3d444d] pb-2">평균 달성률</div>
            <div className="text-center py-2">
              <div className="text-3xl font-bold" style={{ color: achievementColor }}>{stats.avgAchievement}%</div>
              <div className="text-xs text-[#8c959f] mt-1">계획 대비 실행 비율</div>
            </div>
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-[#8c959f]">100% 이상 (초과 달성)</span>
                <span className="text-[#1a7f37]">{stats.avgAchievement >= 100 ? "✓" : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c959f]">80~99% (정상)</span>
                <span className="text-[#0969da]">{stats.avgAchievement >= 80 && stats.avgAchievement < 100 ? "✓" : "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8c959f]">80% 미만 (지연)</span>
                <span className="text-[#cf222e]">{stats.avgAchievement < 80 ? "✓" : "-"}</span>
              </div>
            </div>
          </div>
        }
      >
        <span className="text-[#656d76]">
          달성{" "}
          <span className="font-semibold" style={{ color: achievementColor }}>{stats.avgAchievement}%</span>
        </span>
      </StatItem>

      <span className="text-[#d0d7de]">·</span>

      {/* 리스크 집계 */}
      <StatItem
        tooltip={
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#8c959f] border-b border-[#3d444d] pb-2">리스크 집계</div>
            <div className="space-y-2">
              {([3, 2, 1, 0] as RiskLevel[]).map((level) => {
                const color = RISK_LEVEL_COLORS[level];
                const count = stats.riskCounts[level];
                return (
                  <div key={level} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ background: color.text }}
                      />
                      <span className="text-sm">
                        <span style={{ color: color.text }}>Lv.{level}</span>
                        <span className="text-[#8c959f] ml-1">{color.label}</span>
                      </span>
                    </div>
                    <span className="font-bold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-[#8c959f] pt-2 border-t border-[#3d444d]">
              주의 필요 (Lv.2+): <span className="font-semibold text-[#FB8C00]">{stats.atRisk}개</span>
            </div>
          </div>
        }
      >
        <span className="text-[#656d76] flex items-center gap-1.5">
          리스크
          {stats.riskCounts[3] > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full" style={{ background: RISK_LEVEL_COLORS[3].text }} />
              <span className="font-semibold" style={{ color: RISK_LEVEL_COLORS[3].text }}>{stats.riskCounts[3]}</span>
            </span>
          )}
          {stats.riskCounts[2] > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full" style={{ background: RISK_LEVEL_COLORS[2].text }} />
              <span className="font-semibold" style={{ color: RISK_LEVEL_COLORS[2].text }}>{stats.riskCounts[2]}</span>
            </span>
          )}
          {stats.riskCounts[1] > 0 && (
            <span className="flex items-center gap-0.5">
              <span className="w-2 h-2 rounded-full" style={{ background: RISK_LEVEL_COLORS[1].text }} />
              <span className="font-semibold" style={{ color: RISK_LEVEL_COLORS[1].text }}>{stats.riskCounts[1]}</span>
            </span>
          )}
          {stats.atRisk === 0 && stats.riskCounts[1] === 0 && (
            <span className="font-semibold text-[#1a7f37]">없음</span>
          )}
        </span>
      </StatItem>
    </div>
  );
}

