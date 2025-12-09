"use client";

import { useState, useRef, useEffect } from "react";
import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { CircularProgress } from "../common/CircularProgress";
import { RiskLevelBadge } from "../common/RiskLevelBadge";
import {
  getDomainColor,
  PROGRESS_COLORS,
  getRiskLevelColor,
  getAchievementRate,
  getAchievementStatus,
  ACHIEVEMENT_COLORS,
} from "@/lib/colorDefines";

interface ScrumCardProps {
  item: ScrumItem;
  isCompleted?: boolean;
  showCompareCheckbox?: boolean;
  isCompareSelected?: boolean;
  onCompareToggle?: (item: ScrumItem) => void;
}

/**
 * ScrumItem을 Plain Text (submitted-scrum.txt) 포맷으로 변환
 */
function formatToPlainText(item: ScrumItem): string {
  const lines: string[] = [];
  
  // Header: [Domain / Project / Module / Feature]
  const modulePart = item.module ? ` / ${item.module}` : "";
  lines.push(`[${item.domain} / ${item.project}${modulePart} / ${item.topic}]`);
  
  // Name
  lines.push(`* Name: ${item.name}`);
  
  // Past Week
  lines.push("* Past Week");
  lines.push("    * Tasks");
  if (item.progress && item.progress.length > 0) {
    item.progress.forEach((task) => {
      lines.push(`        * ${task}`);
    });
  } else {
    lines.push("        * (없음)");
  }
  
  // Risk
  if (item.risk && item.risk.length > 0) {
    lines.push("    * Risk");
    item.risk.forEach((risk) => {
      lines.push(`        * ${risk}`);
    });
  } else {
    lines.push("    * Risk: None");
  }
  
  // RiskLevel
  if (item.riskLevel !== null && item.riskLevel !== undefined) {
    lines.push(`    * RiskLevel: ${item.riskLevel}`);
  } else {
    lines.push("    * RiskLevel: None");
  }
  
  // Collaborators
  if (item.collaborators && item.collaborators.length > 0) {
    lines.push("    * Collaborators");
    item.collaborators.forEach((collab) => {
      lines.push(`        * ${collab.name} (${collab.relation})`);
    });
  } else {
    lines.push("    * Collaborators: None");
  }
  
  // This Week
  lines.push("* This Week");
  lines.push("    * Tasks");
  if (item.next && item.next.length > 0) {
    item.next.forEach((task) => {
      lines.push(`        * ${task}`);
    });
  } else {
    lines.push("        * (없음)");
  }
  
  return lines.join("\n");
}

/**
 * 클립보드에 텍스트 복사
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

export function ScrumCard({ 
  item, 
  isCompleted = false,
  showCompareCheckbox = false,
  isCompareSelected = false,
  onCompareToggle,
}: ScrumCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const domainColor = getDomainColor(item.domain);
  const riskLevel = item.riskLevel ?? 0;
  const riskColor = getRiskLevelColor(riskLevel as RiskLevel);
  const achievementRate = getAchievementRate(item.progressPercent, item.planPercent ?? item.progressPercent);
  const achievementStatus = getAchievementStatus(achievementRate);
  const achievementColor = ACHIEVEMENT_COLORS[achievementStatus];

  // risk가 null이면 미정 상태
  const isRiskUnknown = item.risk === null && item.riskLevel === null;

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    if (!isMenuOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  // 복사 메시지 자동 숨김
  useEffect(() => {
    if (!copyMessage) return;
    const timer = setTimeout(() => setCopyMessage(null), 2000);
    return () => clearTimeout(timer);
  }, [copyMessage]);

  // JSON으로 복사
  const handleCopyJson = async () => {
    const success = await copyToClipboard(JSON.stringify(item, null, 2));
    setCopyMessage(success ? "JSON이 복사되었습니다" : "복사 실패");
    setIsMenuOpen(false);
  };

  // Plain Text로 복사
  const handleCopyPlainText = async () => {
    const plainText = formatToPlainText(item);
    const success = await copyToClipboard(plainText);
    setCopyMessage(success ? "텍스트가 복사되었습니다" : "복사 실패");
    setIsMenuOpen(false);
  };

  return (
    <div
      className={`notion-card p-3 transition-all duration-150 ${isCompleted ? "opacity-60" : ""} ${isCompareSelected ? "ring-2 ring-blue-500" : ""}`}
      style={{ borderColor: riskLevel >= 2 ? riskColor.border : 'var(--notion-border)' }}
    >
      {/* 복사 메시지 토스트 */}
      {copyMessage && (
        <div 
          className="absolute top-2 right-2 px-3 py-1.5 rounded-lg text-xs font-medium z-10 animate-fadeIn"
          style={{ 
            background: "var(--notion-text)", 
            color: "var(--notion-bg)",
          }}
        >
          {copyMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            {/* 비교 체크박스 */}
            {showCompareCheckbox && (
              <label className="flex items-center cursor-pointer mr-1">
                <input
                  type="checkbox"
                  checked={isCompareSelected}
                  onChange={() => onCompareToggle?.(item)}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                />
              </label>
            )}
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            <span style={{ color: 'var(--notion-text-muted)' }} className="text-xs">/</span>
            <span className="text-xs font-medium truncate" style={{ color: 'var(--notion-text-secondary)' }}>
              {item.project}
            </span>
            {item.module && (
              <>
                <span style={{ color: 'var(--notion-text-muted)' }} className="text-xs">/</span>
                <span className="text-xs font-medium truncate" style={{ color: 'var(--notion-text-tertiary)' }}>
                  {item.module}
                </span>
              </>
            )}
            {riskLevel > 0 && (
              <span className="ml-auto">
                <RiskLevelBadge level={riskLevel as RiskLevel} size="sm" />
              </span>
            )}
          </div>
          <h3 className="text-sm font-semibold truncate leading-tight" style={{ color: 'var(--notion-text)' }}>
            {item.topic}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--notion-text-muted)' }}>
            {item.name}
          </p>
        </div>
        
        {/* 우측: 진행률 + 메뉴 */}
        <div className="flex items-start gap-2">
          <CircularProgress percent={item.progressPercent} isCompleted={isCompleted} />
          
          {/* 메뉴 버튼 */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              style={{ color: "var(--notion-text-muted)" }}
              title="메뉴"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="5" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="12" cy="19" r="2" />
              </svg>
            </button>
            
            {/* 드롭다운 메뉴 */}
            {isMenuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-44 rounded-lg overflow-hidden z-50 animate-fadeIn"
                style={{
                  background: "var(--notion-bg)",
                  boxShadow: "var(--notion-shadow-lg)",
                  border: "1px solid var(--notion-border)",
                }}
              >
                <button
                  onClick={handleCopyJson}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors"
                  style={{ color: "var(--notion-text)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                  JSON으로 복사하기
                </button>
                <button
                  onClick={handleCopyPlainText}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover:bg-gray-50 transition-colors"
                  style={{ color: "var(--notion-text)" }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Plain Text로 복사하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Plan vs Progress */}
      {item.planPercent !== undefined && item.planPercent > 0 && (
        <div className="mb-2 p-2 rounded" style={{ background: 'var(--notion-bg-secondary)' }}>
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span style={{ color: 'var(--notion-text-muted)' }}>계획 {item.planPercent}% → 실제 {item.progressPercent}%</span>
            <span
              className="px-1.5 py-0.5 rounded text-[9px] font-medium"
              style={{ background: achievementColor.bg, color: achievementColor.text }}
            >
              {achievementRate}% 달성
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--notion-border)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(achievementRate, 100)}%`,
                background: achievementColor.text,
              }}
            />
          </div>
        </div>
      )}

      {/* Content Sections */}
      <div className="space-y-1">
        {item.plan && <ContentBar label="Plan" color={PROGRESS_COLORS.high.text} content={item.plan} />}
        <ContentBarMulti label="Progress" color={PROGRESS_COLORS.completed.text} items={item.progress} />
        {item.reason && item.reason.trim() !== "" && (
          <ContentBar label="Reason" color="var(--notion-orange)" content={item.reason} />
        )}
        <ContentBarMulti label="Next" color="var(--notion-blue)" items={item.next} />
        {item.risk && item.risk.length > 0 && (
          <ContentBarMulti label="Risk" color={riskColor.text} items={item.risk} />
        )}
        {isRiskUnknown && (
          <ContentBar label="Risk" color="var(--notion-text-tertiary)" content="미정" />
        )}
      </div>

      {/* Collaborators */}
      {item.collaborators && item.collaborators.length > 0 && (
        <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--notion-border)' }}>
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[9px] font-medium" style={{ color: 'var(--notion-text-muted)' }}>협업:</span>
            {item.collaborators.map((collab, idx) => (
              <span
                key={idx}
                className="text-[10px] px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: COLLAB_COLORS[collab.relation]?.bg || 'var(--notion-bg-tertiary)',
                  color: COLLAB_COLORS[collab.relation]?.text || 'var(--notion-text-secondary)',
                }}
              >
                {collab.name}
                <span className="opacity-70 ml-0.5">({COLLAB_LABELS[collab.relation]})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const COLLAB_COLORS: Record<string, { bg: string; text: string }> = {
  pair: { bg: 'var(--notion-blue-bg)', text: 'var(--notion-blue)' },
  pre: { bg: 'var(--notion-orange-bg)', text: 'var(--notion-orange)' },
  post: { bg: 'var(--notion-green-bg)', text: 'var(--notion-green)' },
};

const COLLAB_LABELS: Record<string, string> = {
  pair: '페어',
  pre: '선행',
  post: '후행',
};

/** 단일 라인 콘텐츠 바 */
function ContentBar({ label, color, content }: { label: string; color: string; content: string }) {
  return (
    <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: 'var(--notion-bg-secondary)' }}>
      <div className="w-0.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 px-2 py-1">
        <span className="text-[9px] font-medium mr-1.5" style={{ color }}>{label}</span>
        <span className="text-xs leading-relaxed" style={{ color: 'var(--notion-text)' }}>
          {content || "-"}
        </span>
      </div>
    </div>
  );
}

/** 멀티라인 콘텐츠 바 (배열 지원) */
function ContentBarMulti({ label, color, items }: { label: string; color: string; items: string[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: 'var(--notion-bg-secondary)' }}>
        <div className="w-0.5 shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 px-2 py-1">
          <span className="text-[9px] font-medium mr-1.5" style={{ color }}>{label}</span>
          <span className="text-xs leading-relaxed" style={{ color: 'var(--notion-text)' }}>-</span>
        </div>
      </div>
    );
  }

  // 단일 항목인 경우 기존처럼 표시
  if (items.length === 1) {
    return (
      <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: 'var(--notion-bg-secondary)' }}>
        <div className="w-0.5 shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 px-2 py-1">
          <span className="text-[9px] font-medium mr-1.5" style={{ color }}>{label}</span>
          <span className="text-xs leading-relaxed" style={{ color: 'var(--notion-text)' }}>
            {items[0]}
          </span>
        </div>
      </div>
    );
  }

  // 멀티라인인 경우 리스트로 표시
  return (
    <div className="flex items-stretch gap-0 rounded overflow-hidden" style={{ backgroundColor: 'var(--notion-bg-secondary)' }}>
      <div className="w-0.5 shrink-0" style={{ backgroundColor: color }} />
      <div className="flex-1 px-2 py-1">
        <span className="text-[9px] font-medium block mb-0.5" style={{ color }}>{label}</span>
        <ul className="space-y-0.5 ml-2">
          {items.map((item, idx) => (
            <li key={idx} className="text-xs leading-relaxed flex items-start gap-1" style={{ color: 'var(--notion-text)' }}>
              <span style={{ color }} className="text-[8px] mt-1">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
