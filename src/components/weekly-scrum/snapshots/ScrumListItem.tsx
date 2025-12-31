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
  isSelectMode?: boolean;
}

const COLLAB_COLORS: Record<string, { bg: string; text: string }> = {
  pair: { bg: "#ddf4ff", text: "#0969da" },
  pre: { bg: "#fff8c5", text: "#9a6700" },
  post: { bg: "#dafbe1", text: "#1a7f37" },
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
  isSelectMode = false,
}: ScrumListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const domainColor = getDomainColor(item.domain);
  const riskLevel = item.riskLevel ?? 0;
  const riskColor = getRiskLevelColor(riskLevel as RiskLevel);

  // risk가 null이면 미정 상태
  const isRiskUnknown = item.risk === null && item.riskLevel === null;

  // 아이템 스타일 클래스 결정
  const itemClasses = [
    "notion-card",
    "transition-colors",
    isSelectMode ? "cursor-pointer" : "",
    isCompleted ? "opacity-60" : "",
    isCompareSelected ? "ring-2 ring-[#0969da]" : "",
  ].filter(Boolean).join(" ");

  return (
    <div
      className={itemClasses}
      style={{ 
        borderColor: riskLevel >= 2 ? riskColor.border : "#d0d7de",
        borderRadius: "6px",
      }}
    >
      {/* 접힌 상태: 주요 정보만 표시 */}
      <div
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-[#f6f8fa] transition-colors"
        onClick={() => {
          if (isSelectMode && onCompareToggle) {
            onCompareToggle(item);
          } else {
            setIsExpanded(!isExpanded);
          }
        }}
      >
        {/* 비교 체크박스 - 선택 모드일 때만 표시 */}
        {showCompareCheckbox && isSelectMode && (
          <label className="flex items-center cursor-pointer" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isCompareSelected}
              onChange={() => onCompareToggle?.(item)}
              className="w-4 h-4 rounded border-[#d0d7de] text-[#0969da] focus:ring-[#0969da]"
            />
          </label>
        )}

        {/* 확장/축소 아이콘 */}
        <button className="flex-shrink-0 text-[#57606a]">
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
          <span className="font-medium truncate text-[#57606a]">
            {item.project}
          </span>
          {item.module && (
            <>
              <span className="text-[#8c959f]">/</span>
              <span className="truncate text-[#8c959f]">
                {item.module}
              </span>
            </>
          )}
          <span className="text-[#8c959f]">/</span>
          <span className="font-semibold truncate text-[#24292f]">
            {item.topic}
          </span>
        </div>

        {/* 담당자 */}
        <span className="text-xs flex-shrink-0 text-[#57606a]">
          {item.name}
        </span>

        {/* 리스크 뱃지 */}
        {riskLevel > 0 && (
          <RiskLevelBadge level={riskLevel as RiskLevel} size="sm" />
        )}
      </div>

      {/* 확장된 상태: 상세 내용 */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-[#d0d7de]">
          <div className="pt-3 space-y-3">
            {/* Progress (Past Week) */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-semibold" style={{ color: PROGRESS_COLORS.completed.text }}>
                  Progress
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
                  <div className="text-xs text-[#57606a]">
                    <span className="font-medium text-[#8c959f]">Risk: </span>
                    <span>미정</span>
                  </div>
                )}
                
                {/* Collaborators */}
                {item.collaborators && item.collaborators.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] font-medium text-[#57606a]">Collaborators:</span>
                    {item.collaborators.map((collab, idx) => {
                      // relations 우선, relation은 fallback
                      const rel = collab.relations?.[0] || collab.relation || "pair";
                      return (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: COLLAB_COLORS[rel]?.bg || "#f6f8fa",
                            color: COLLAB_COLORS[rel]?.text || "#57606a",
                          }}
                        >
                          {collab.name}
                          <span className="opacity-70 ml-0.5">({COLLAB_LABELS[rel]})</span>
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Next (This Week) */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-semibold text-[#0969da]">
                  Next
                </span>
              </div>
              <div className="space-y-1.5 pl-2 border-l-2 border-[#0969da]">
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
  const textColor = color || "#24292f";

  if (!items || items.length === 0) {
    return (
      <div className="text-xs text-[#57606a]">
        <span className="font-medium" style={{ color: textColor }}>{label}: </span>
        <span>-</span>
      </div>
    );
  }

  if (items.length === 1) {
    return (
      <div className="text-xs text-[#24292f]">
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
          <li key={idx} className="flex items-start gap-1 text-[#24292f]">
            <span className="text-[8px] mt-1" style={{ color: textColor }}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
