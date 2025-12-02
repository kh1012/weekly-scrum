"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { UI_COLORS, PROGRESS_COLORS, STATUS_COLORS, RISK_LEVEL_COLORS, ACHIEVEMENT_COLORS } from "@/lib/colorDefines";
import type { RiskLevel } from "@/types/scrum";

interface SummaryCardProps {
  value: number | string;
  label: string;
  color: string;
  highlight?: boolean;
}

export function SummaryCard({ value, label, color, highlight }: SummaryCardProps) {
  return (
    <div
      className={`bg-white rounded-md p-4 ${highlight ? "ring-2 ring-offset-1 ring-[#E53935]" : ""}`}
      style={{ 
        border: `1px solid ${highlight ? RISK_LEVEL_COLORS[3].border : UI_COLORS.border}`,
      }}
    >
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>
        {label}
      </div>
    </div>
  );
}

interface ProgressDistributionBarProps {
  distribution: {
    completed: number;
    high: number;
    medium: number;
    low: number;
  };
  total: number;
}

export function ProgressDistributionBar({
  distribution,
  total,
}: ProgressDistributionBarProps) {
  return (
    <div
      className="bg-white rounded-md p-4"
      style={{ border: `1px solid ${UI_COLORS.border}` }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: UI_COLORS.textPrimary }}
      >
        진행률 분포
      </h3>
      <div className="flex h-6 rounded-md overflow-hidden">
        {distribution.completed > 0 && (
          <ProgressBar
            value={distribution.completed}
            total={total}
            color={PROGRESS_COLORS.completed.text}
          />
        )}
        {distribution.high > 0 && (
          <ProgressBar
            value={distribution.high}
            total={total}
            color={PROGRESS_COLORS.high.text}
          />
        )}
        {distribution.medium > 0 && (
          <ProgressBar
            value={distribution.medium}
            total={total}
            color={PROGRESS_COLORS.medium.text}
          />
        )}
        {distribution.low > 0 && (
          <ProgressBar
            value={distribution.low}
            total={total}
            color={PROGRESS_COLORS.low.text}
          />
        )}
      </div>
      <div
        className="flex items-center gap-4 mt-2 text-xs"
        style={{ color: UI_COLORS.textSecondary }}
      >
        <Legend color={PROGRESS_COLORS.completed.text} label="완료" />
        <Legend color={PROGRESS_COLORS.high.text} label="70%+" />
        <Legend color={PROGRESS_COLORS.medium.text} label="40-70%" />
        <Legend color={PROGRESS_COLORS.low.text} label="40% 미만" />
      </div>
    </div>
  );
}

function ProgressBar({
  value,
  total,
  color,
}: {
  value: number;
  total: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center justify-center text-white text-xs font-medium"
      style={{ width: `${(value / total) * 100}%`, backgroundColor: color }}
    >
      {value}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}

interface RiskDistributionBarProps {
  distribution: Record<RiskLevel, number>;
  total: number;
}

export function RiskDistributionBar({ distribution, total }: RiskDistributionBarProps) {
  const hasRisks = distribution[1] + distribution[2] + distribution[3] > 0;

  return (
    <div
      className="bg-white rounded-md p-4"
      style={{ border: `1px solid ${UI_COLORS.border}` }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: UI_COLORS.textPrimary }}
      >
        리스크 레벨 분포
      </h3>
      <div className="flex h-6 rounded-md overflow-hidden">
        {!hasRisks ? (
          <div
            className="flex-1 flex items-center justify-center text-xs"
            style={{ backgroundColor: RISK_LEVEL_COLORS[0].bg, color: RISK_LEVEL_COLORS[0].text }}
          >
            리스크 없음
          </div>
        ) : (
          <>
            {distribution[3] > 0 && (
              <RiskBar value={distribution[3]} total={total} level={3} />
            )}
            {distribution[2] > 0 && (
              <RiskBar value={distribution[2]} total={total} level={2} />
            )}
            {distribution[1] > 0 && (
              <RiskBar value={distribution[1]} total={total} level={1} />
            )}
            {distribution[0] > 0 && (
              <RiskBar value={distribution[0]} total={total} level={0} />
            )}
          </>
        )}
      </div>
      <div
        className="flex items-center gap-4 mt-2 text-xs flex-wrap"
        style={{ color: UI_COLORS.textSecondary }}
      >
        <RiskLevelLegend level={3} />
        <RiskLevelLegend level={2} />
        <RiskLevelLegend level={1} />
        <RiskLevelLegend level={0} />
      </div>
    </div>
  );
}

function RiskBar({ value, total, level }: { value: number; total: number; level: RiskLevel }) {
  const color = RISK_LEVEL_COLORS[level];
  return (
    <div
      className="flex items-center justify-center text-white text-xs font-medium cursor-help"
      style={{ width: `${(value / total) * 100}%`, backgroundColor: color.text }}
      title={`Lv.${level} ${color.label}: ${color.description}`}
    >
      {value}
    </div>
  );
}

function RiskLevelLegend({ level }: { level: RiskLevel }) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const legendRef = useRef<HTMLSpanElement>(null);
  const color = RISK_LEVEL_COLORS[level];

  useEffect(() => {
    if (isHovered && legendRef.current) {
      const rect = legendRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [isHovered]);

  return (
    <>
      <span
        ref={legendRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex items-center gap-1 cursor-help"
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: color.text }}
        />
        Lv.{level} {color.label}
      </span>
      {isHovered &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div 
              className="rounded-lg shadow-lg px-3 py-2 min-w-[180px] max-w-[280px]"
              style={{ background: color.text }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-xs font-bold">
                  Level {level}
                </span>
                <span 
                  className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                  style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                >
                  {color.label}
                </span>
              </div>
              <div className="text-[11px] text-white/90 leading-normal">
                {color.description}
              </div>
            </div>
            <div 
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]"
              style={{ borderTopColor: color.text }}
            />
          </div>,
          document.body
        )}
    </>
  );
}

interface AchievementSummaryProps {
  stats: {
    avgPlan: number;
    avgProgress: number;
    avgAchievement: number;
    exceeded: number;
    normal: number;
    delayed: number;
  };
}

export function AchievementSummary({ stats }: AchievementSummaryProps) {
  const total = stats.exceeded + stats.normal + stats.delayed;

  return (
    <div
      className="bg-white rounded-md p-4"
      style={{ border: `1px solid ${UI_COLORS.border}` }}
    >
      <h3
        className="text-sm font-semibold mb-3"
        style={{ color: UI_COLORS.textPrimary }}
      >
        계획 대비 달성률
      </h3>
      <div className="flex items-center gap-6 mb-3">
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: UI_COLORS.textMuted }}>
            {stats.avgPlan}%
          </div>
          <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>평균 계획</div>
        </div>
        <div className="text-xl" style={{ color: UI_COLORS.textMuted }}>→</div>
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: PROGRESS_COLORS.high.text }}>
            {stats.avgProgress}%
          </div>
          <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>평균 진척</div>
        </div>
        <div className="text-xl" style={{ color: UI_COLORS.textMuted }}>=</div>
        <div className="text-center">
          <div 
            className="text-2xl font-bold"
            style={{ color: stats.avgAchievement >= 80 ? ACHIEVEMENT_COLORS.exceeded.text : ACHIEVEMENT_COLORS.delayed.text }}
          >
            {stats.avgAchievement}%
          </div>
          <div className="text-xs" style={{ color: UI_COLORS.textSecondary }}>달성률</div>
        </div>
      </div>
      <div className="flex h-4 rounded-md overflow-hidden">
        {stats.exceeded > 0 && (
          <div
            className="flex items-center justify-center text-white text-[10px] font-medium"
            style={{ width: `${(stats.exceeded / total) * 100}%`, backgroundColor: ACHIEVEMENT_COLORS.exceeded.text }}
          >
            {stats.exceeded}
          </div>
        )}
        {stats.normal > 0 && (
          <div
            className="flex items-center justify-center text-white text-[10px] font-medium"
            style={{ width: `${(stats.normal / total) * 100}%`, backgroundColor: ACHIEVEMENT_COLORS.normal.text }}
          >
            {stats.normal}
          </div>
        )}
        {stats.delayed > 0 && (
          <div
            className="flex items-center justify-center text-white text-[10px] font-medium"
            style={{ width: `${(stats.delayed / total) * 100}%`, backgroundColor: ACHIEVEMENT_COLORS.delayed.text }}
          >
            {stats.delayed}
          </div>
        )}
      </div>
      <div
        className="flex items-center gap-4 mt-2 text-xs"
        style={{ color: UI_COLORS.textSecondary }}
      >
        <Legend color={ACHIEVEMENT_COLORS.exceeded.text} label="초과달성 (100%+)" />
        <Legend color={ACHIEVEMENT_COLORS.normal.text} label="정상 (80-100%)" />
        <Legend color={ACHIEVEMENT_COLORS.delayed.text} label="지연 (<80%)" />
      </div>
    </div>
  );
}

