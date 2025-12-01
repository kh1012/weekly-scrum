"use client";

import { getProgressColor, UI_COLORS } from "@/lib/colorDefines";

interface CircularProgressProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  isCompleted?: boolean;
}

export function CircularProgress({
  percent,
  size = 44,
  strokeWidth = 5,
  isCompleted = false,
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100) * circumference;
  const color = getProgressColor(percent);

  return (
    <div className="relative inline-flex items-center justify-center shrink-0">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={UI_COLORS.borderLight}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>
      {/* Percent text */}
      <span className="absolute text-[10px] font-semibold" style={{ color }}>
        {isCompleted ? "완료" : `${percent}%`}
      </span>
    </div>
  );
}

