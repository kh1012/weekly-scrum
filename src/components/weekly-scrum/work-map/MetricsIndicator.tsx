"use client";

import type { RiskLevel } from "@/types/scrum";
import type { Metrics } from "./metricsUtils";

interface MetricsIndicatorProps {
  metrics: Metrics;
  showDetails?: boolean;
}

/**
 * 진행률에 따른 색상 반환
 */
export function getProgressColor(value: number): string {
  if (value >= 80) return "#22c55e"; // green-500
  if (value >= 50) return "#3b82f6"; // blue-500
  if (value >= 30) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

/**
 * 진행률에 따른 배경색 반환 (투명도 적용)
 */
export function getProgressBgColor(value: number): string {
  if (value >= 80) return "rgba(34, 197, 94, 0.15)";
  if (value >= 50) return "rgba(59, 130, 246, 0.15)";
  if (value >= 30) return "rgba(245, 158, 11, 0.15)";
  return "rgba(239, 68, 68, 0.15)";
}

/**
 * 리스크 레벨에 따른 색상 반환
 */
export function getRiskColor(level: RiskLevel | null): { bg: string; text: string; border: string } {
  switch (level) {
    case 0:
      return {
        bg: "rgba(34, 197, 94, 0.1)",
        text: "#22c55e",
        border: "#22c55e",
      };
    case 1:
      return {
        bg: "rgba(245, 158, 11, 0.1)",
        text: "#f59e0b",
        border: "#f59e0b",
      };
    case 2:
      return {
        bg: "rgba(249, 115, 22, 0.1)",
        text: "#f97316",
        border: "#f97316",
      };
    case 3:
      return {
        bg: "rgba(239, 68, 68, 0.1)",
        text: "#ef4444",
        border: "#ef4444",
      };
    default:
      return {
        bg: "var(--notion-bg-secondary)",
        text: "var(--notion-text-muted)",
        border: "var(--notion-border)",
      };
  }
}

/**
 * 진행률 바 컴포넌트
 */
function ProgressBar({ progress }: { progress: number }) {
  const color = getProgressColor(progress);

  return (
    <div className="flex items-center gap-2">
      <div
        className="flex-1 h-2 rounded-full overflow-hidden"
        style={{ background: "var(--notion-bg-secondary)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${progress}%`,
            background: color,
          }}
        />
      </div>
      <span
        className="text-xs font-bold min-w-[36px] text-right"
        style={{ color }}
      >
        {progress}%
      </span>
    </div>
  );
}

/**
 * 리스크 레벨 인디케이터
 */
function RiskIndicator({ level }: { level: RiskLevel | null }) {
  const colors = getRiskColor(level);
  const displayLevel = level === null ? "—" : `R${level}`;

  return (
    <span
      className="text-xs font-bold px-2 py-0.5 rounded border"
      style={{
        background: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      {displayLevel}
    </span>
  );
}

/**
 * 메트릭 인디케이터 컴포넌트
 */
export function MetricsIndicator({ metrics, showDetails = false }: MetricsIndicatorProps) {
  return (
    <div className="space-y-2">
      {/* Progress Bar */}
      <ProgressBar progress={metrics.progress} />

      {/* Risk + Details */}
      <div className="flex items-center justify-between">
        <RiskIndicator level={metrics.riskLevel} />
        {showDetails && (
          <span className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
            {metrics.completedTaskCount}/{metrics.taskCount} tasks
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * 컴팩트 메트릭 인디케이터 (한 줄)
 */
export function CompactMetrics({ metrics }: { metrics: Metrics }) {
  const progressColor = getProgressColor(metrics.progress);
  const riskColors = getRiskColor(metrics.riskLevel);

  return (
    <div className="flex items-center gap-2">
      <span
        className="text-xs font-bold"
        style={{ color: progressColor }}
      >
        {metrics.progress}%
      </span>
      <span
        className="text-xs font-bold px-1.5 py-0.5 rounded border"
        style={{
          background: riskColors.bg,
          color: riskColors.text,
          borderColor: riskColors.border,
        }}
      >
        {metrics.riskLevel === null ? "—" : `R${metrics.riskLevel}`}
      </span>
    </div>
  );
}

/**
 * 진행률 뱃지 (카드용)
 */
export function ProgressBadge({ progress }: { progress: number }) {
  const color = getProgressColor(progress);
  const bgColor = getProgressBgColor(progress);

  return (
    <span
      className="text-xs font-bold px-2 py-1 rounded-full"
      style={{
        background: bgColor,
        color: color,
      }}
    >
      {progress}%
    </span>
  );
}
