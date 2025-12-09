"use client";

import { useState } from "react";
import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { CircularProgress } from "../common/CircularProgress";
import { RiskLevelBadge } from "../common/RiskLevelBadge";
import {
  getDomainColor,
  getRiskLevelColor,
  PROGRESS_COLORS,
} from "@/lib/colorDefines";

interface ScrumListItemProps {
  item: ScrumItem;
  isCompleted?: boolean;
  showCompareCheckbox?: boolean;
  isCompareSelected?: boolean;
  onCompareToggle?: (item: ScrumItem) => void;
}

const COLLAB_COLORS: Record<string, { bg: string; text: string }> = {
  pair: { bg: "var(--notion-blue-bg)", text: "var(--notion-blue)" },
  pre: { bg: "var(--notion-orange-bg)", text: "var(--notion-orange)" },
  post: { bg: "var(--notion-green-bg)", text: "var(--notion-green)" },
};

const COLLAB_LABELS: Record<string, string> = {
  pair: "페어",
  pre: "선행",
  post: "후행",
};

export function ScrumListItem({
  item,
  isCompleted = false,
  showCompareCheckbox = false,
  isCompareSelected = false,
  onCompareToggle,
}: ScrumListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const domainColor = getDomainColor(item.domain);
  const riskLevel = item.riskLevel ?? 0;
  const riskColor = getRiskLevelColor(riskLevel as RiskLevel);

  // risk가 null이면 미정 상태
  const isRiskUnknown = item.risk === null && item.riskLevel === null;

  return (
    <div
      className={`notion-card transition-all duration-150 ${isCompleted ? "opacity-60" : ""} ${isCompareSelected ? "ring-2 ring-blue-500" : ""}`}
      style={{ borderColor: riskLevel >= 2 ? riskColor.border : "var(--notion-border)" }}
    >
      {/* 접힌 상태: 주요 정보만 표시 */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* 비교 체크박스 */}
        {showCompareCheckbox && (
          <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isCompareSelected}
              onChange={() => onCompareToggle?.(item)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
            />
          </label>
        )}

        {/* 확장/축소 아이콘 */}
        <button
          className="flex-shrink-0 text-gray-400"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 진행률 */}
        <CircularProgress percent={item.progressPercent} isCompleted={isCompleted} />

        {/* 도메인 */}
        <span
          className="px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0"
          style={{ background: domainColor.bg, color: domainColor.text }}
        >
          {item.domain}
        </span>

        {/* 경로: 프로젝트 / 모듈 / 피쳐 */}
        <div className="flex-1 min-w-0 flex items-center gap-1.5 text-xs truncate">
          <span className="font-medium truncate" style={{ color: "var(--notion-text-secondary)" }}>
            {item.project}
          </span>
          {item.module && (
            <>
              <span style={{ color: "var(--notion-text-muted)" }}>/</span>
              <span className="truncate" style={{ color: "var(--notion-text-tertiary)" }}>
                {item.module}
              </span>
            </>
          )}
          <span style={{ color: "var(--notion-text-muted)" }}>/</span>
          <span className="font-semibold truncate" style={{ color: "var(--notion-text)" }}>
            {item.topic}
          </span>
        </div>

        {/* 담당자 */}
        <span className="text-xs flex-shrink-0" style={{ color: "var(--notion-text-muted)" }}>
          {item.name}
        </span>

        {/* 리스크 뱃지 */}
        {riskLevel > 0 && (
          <RiskLevelBadge level={riskLevel as RiskLevel} size="sm" />
        )}
      </div>

      {/* 확장된 상태: 상세 내용 */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t" style={{ borderColor: "var(--notion-border)" }}>
          <div className="pt-3 space-y-3">
            {/* Past Week */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-semibold" style={{ color: PROGRESS_COLORS.completed.text }}>
                  Past Week
                </span>
              </div>
              <div className="space-y-1.5 pl-2" style={{ borderLeft: `2px solid ${PROGRESS_COLORS.completed.text}` }}>
                {/* Tasks */}
                <ContentSection label="Tasks" items={item.progress} />
                
                {/* Risk */}
                {item.risk && item.risk.length > 0 && (
                  <ContentSection label="Risk" items={item.risk} color={riskColor.text} />
                )}
                {isRiskUnknown && (
                  <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
                    <span className="font-medium" style={{ color: "var(--notion-text-tertiary)" }}>Risk: </span>
                    <span>미정</span>
                  </div>
                )}
                
                {/* Collaborators */}
                {item.collaborators && item.collaborators.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-medium" style={{ color: "var(--notion-text-muted)" }}>Collaborators:</span>
                    {item.collaborators.map((collab, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: COLLAB_COLORS[collab.relation]?.bg || "var(--notion-bg-tertiary)",
                          color: COLLAB_COLORS[collab.relation]?.text || "var(--notion-text-secondary)",
                        }}
                      >
                        {collab.name}
                        <span className="opacity-70 ml-0.5">({COLLAB_LABELS[collab.relation]})</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* This Week */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-semibold" style={{ color: "var(--notion-blue)" }}>
                  This Week
                </span>
              </div>
              <div className="space-y-1.5 pl-2" style={{ borderLeft: "2px solid var(--notion-blue)" }}>
                <ContentSection label="Tasks" items={item.next} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 콘텐츠 섹션 */
function ContentSection({
  label,
  items,
  color,
}: {
  label: string;
  items: string[];
  color?: string;
}) {
  const textColor = color || "var(--notion-text)";

  if (!items || items.length === 0) {
    return (
      <div className="text-xs" style={{ color: "var(--notion-text-muted)" }}>
        <span className="font-medium" style={{ color: textColor }}>{label}: </span>
        <span>-</span>
      </div>
    );
  }

  if (items.length === 1) {
    return (
      <div className="text-xs" style={{ color: "var(--notion-text)" }}>
        <span className="font-medium" style={{ color: textColor }}>{label}: </span>
        <span>{items[0]}</span>
      </div>
    );
  }

  return (
    <div className="text-xs">
      <span className="font-medium" style={{ color: textColor }}>{label}:</span>
      <ul className="mt-0.5 space-y-0.5 ml-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-1" style={{ color: "var(--notion-text)" }}>
            <span className="text-[8px] mt-1" style={{ color: textColor }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

