"use client";

import type { ScrumItem } from "@/types/scrum";
import { CircularProgress } from "./CircularProgress";
import { getDomainColor, PROGRESS_COLORS, UI_COLORS } from "@/lib/colorDefines";

// Re-export for backward compatibility
export { getDomainColor } from "@/lib/colorDefines";

interface ScrumCardProps {
  item: ScrumItem;
  isCompleted?: boolean;
}

export function ScrumCard({ item, isCompleted = false }: ScrumCardProps) {
  const domainColor = getDomainColor(item.domain);

  return (
    <div
      className={`bg-white border rounded-md p-3 transition-all duration-150 ${
        isCompleted ? "opacity-60" : ""
      }`}
      style={{ 
        borderColor: UI_COLORS.border,
      }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = UI_COLORS.accent}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = UI_COLORS.border}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{
                background: domainColor.bg,
                color: domainColor.text,
              }}
            >
              {item.domain}
            </span>
            <span style={{ color: UI_COLORS.textMuted }} className="text-xs">/</span>
            <span className="text-xs font-medium truncate" style={{ color: UI_COLORS.textSecondary }}>
              {item.project}
            </span>
          </div>
          <h3 className="text-sm font-semibold truncate leading-tight" style={{ color: UI_COLORS.textPrimary }}>
            {item.topic}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: UI_COLORS.textMuted }}>
            {item.name}
          </p>
        </div>
        {/* Circular Progress */}
        <CircularProgress
          percent={item.progressPercent}
          isCompleted={isCompleted}
        />
      </div>

      {/* Content Sections */}
      <div className="space-y-1">
        {/* Progress */}
        <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: UI_COLORS.bgSecondary }}>
          <div className="w-0.5 shrink-0" style={{ backgroundColor: PROGRESS_COLORS.high.text }} />
          <p className="text-xs leading-relaxed px-2 py-1" style={{ color: UI_COLORS.textPrimary }}>
            {item.progress || "-"}
          </p>
        </div>

        {/* Risk */}
        <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: UI_COLORS.bgSecondary }}>
          <div className="w-0.5 shrink-0" style={{ backgroundColor: PROGRESS_COLORS.medium.text }} />
          <p className="text-xs leading-relaxed px-2 py-1" style={{ color: UI_COLORS.textPrimary }}>
            {item.risk || "-"}
          </p>
        </div>

        {/* Next */}
        <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: UI_COLORS.bgSecondary }}>
          <div className="w-0.5 shrink-0" style={{ backgroundColor: PROGRESS_COLORS.completed.text }} />
          <p className="text-xs leading-relaxed px-2 py-1" style={{ color: UI_COLORS.textPrimary }}>
            {item.next || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
