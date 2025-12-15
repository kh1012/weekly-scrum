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
  isSelectMode?: boolean;
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
  isSelectMode = false,
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

  // 카드 클릭 핸들러 (선택 모드일 때)
  const handleCardClick = () => {
    if (isSelectMode && onCompareToggle) {
      onCompareToggle(item);
    }
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-2xl border transition-all duration-300
        ${isSelectMode ? "cursor-pointer" : ""}
        ${isCompareSelected 
          ? "border-blue-400 shadow-lg shadow-blue-100 ring-2 ring-blue-100" 
          : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
        }
      `}
      style={{ 
        background: riskLevel >= 2 
          ? `linear-gradient(135deg, ${riskColor.bg}20, white)` 
          : "white",
      }}
      onClick={handleCardClick}
    >
      {/* 복사 메시지 토스트 */}
      {copyMessage && (
        <div 
          className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-xs font-medium z-20 shadow-lg animate-bounce-in"
          style={{ 
            background: "#1f2937", 
            color: "white",
          }}
        >
          {copyMessage}
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            {/* 태그 라인 */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {/* 비교 체크박스 - 선택 모드일 때만 표시 */}
              {showCompareCheckbox && isSelectMode && (
                <label className="flex items-center cursor-pointer mr-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isCompareSelected}
                    onChange={() => onCompareToggle?.(item)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                  />
                </label>
              )}
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide"
                style={{ background: domainColor.bg, color: domainColor.text }}
              >
                {item.domain}
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-xs font-medium text-gray-600 truncate">
                {item.project}
              </span>
              {item.module && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-gray-400 truncate">
                    {item.module}
                  </span>
                </>
              )}
            </div>
            
            {/* Feature 제목 */}
            <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
              {item.topic}
            </h3>
            
            {/* 담당자 + 리스크 */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-500">
                  {item.name.charAt(0)}
                </div>
                <span className="text-xs font-medium text-gray-600">{item.name}</span>
              </div>
              {riskLevel > 0 && (
                <RiskLevelBadge level={riskLevel as RiskLevel} size="sm" />
              )}
            </div>
          </div>
          
          {/* 우측: 진행률 + 메뉴 */}
          <div className="flex items-start gap-2">
            <CircularProgress percent={item.progressPercent} isCompleted={isCompleted} />
            
            {/* 메뉴 버튼 */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
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
                  className="absolute right-0 top-full mt-1 w-48 rounded-xl overflow-hidden z-50 shadow-xl border border-gray-100 bg-white animate-fadeIn"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={handleCopyJson}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                      </svg>
                    </span>
                    JSON으로 복사
                  </button>
                  <button
                    onClick={handleCopyPlainText}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center">
                      <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </span>
                    Plain Text로 복사
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 진행률 카드 */}
        {item.planPercent !== undefined && item.planPercent > 0 && (
          <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <span>계획 <span className="font-semibold text-gray-900">{item.planPercent}%</span></span>
                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
                <span>실제 <span className="font-semibold text-gray-900">{item.progressPercent}%</span></span>
              </div>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: achievementColor.bg, color: achievementColor.text }}
              >
                {achievementRate}% 달성
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-gray-200">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(achievementRate, 100)}%`,
                  background: `linear-gradient(90deg, ${achievementColor.text}, ${achievementColor.text}cc)`,
                }}
              />
            </div>
          </div>
        )}

        {/* Past Week */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: PROGRESS_COLORS.completed.text }}
            />
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Past Week
            </span>
          </div>
          <div className="space-y-2 pl-4 border-l-2" style={{ borderColor: `${PROGRESS_COLORS.completed.text}40` }}>
            {/* Tasks with progress bars */}
            <TaskList tasks={item.progress} label="Tasks" />
            
            {/* Risk */}
            {item.risk && item.risk.length > 0 && (
              <div className="mt-2">
                <span className="text-[10px] font-semibold text-red-500 uppercase">Risk:</span>
                <ul className="mt-1 space-y-1">
                  {item.risk.map((risk, idx) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-1.5">
                      <span className="text-red-400 text-[8px] mt-1">⚠</span>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {isRiskUnknown && (
              <div className="text-xs text-gray-400">
                <span className="font-medium">Risk:</span> 미정
              </div>
            )}

            {/* Collaborators */}
            {item.collaborators && item.collaborators.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] font-medium text-gray-400">with:</span>
                {item.collaborators.map((collab, idx) => {
                  // relations 우선, relation은 fallback
                  const relation = collab.relations?.[0] || collab.relation || "pair";
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: COLLAB_COLORS[relation]?.bg || '#f3f4f6',
                        color: COLLAB_COLORS[relation]?.text || '#6b7280',
                      }}
                    >
                      <span className="font-medium">{collab.name}</span>
                      <span className="opacity-60">{COLLAB_LABELS[relation]}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* This Week */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-1.5 h-1.5 rounded-full bg-blue-500"
            />
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              This Week
            </span>
          </div>
          <div className="space-y-2 pl-4 border-l-2 border-blue-100">
            <TaskList tasks={item.next} label="Tasks" isNext />
          </div>
        </div>
      </div>
    </div>
  );
}

const COLLAB_COLORS: Record<string, { bg: string; text: string }> = {
  pair: { bg: '#dbeafe', text: '#2563eb' },
  pre: { bg: '#ffedd5', text: '#ea580c' },
  post: { bg: '#dcfce7', text: '#16a34a' },
};

const COLLAB_LABELS: Record<string, string> = {
  pair: '페어',
  pre: '선행',
  post: '후행',
};

/** Task 리스트 컴포넌트 - 프로그래스 바 포함 */
function TaskList({ 
  tasks, 
  label,
  isNext = false,
}: { 
  tasks: string[]; 
  label: string;
  isNext?: boolean;
}) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="text-xs text-gray-400">
        <span className="font-medium">{label}:</span> -
      </div>
    );
  }

  return (
    <div>
      <span className="text-[10px] font-semibold text-gray-500 uppercase">{label}:</span>
      <ul className="mt-1.5 space-y-2">
        {tasks.map((task, idx) => {
          const progress = extractTaskProgress(task);
          const taskText = task.replace(/\s*\(\d+%\)\s*$/, '').trim();
          
          return (
            <li key={idx} className="group/task">
              <div className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">•</span>
                <div className="flex-1">
                  <span className="text-xs text-gray-700">{taskText}</span>
                  {progress !== null && (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            progress >= 100 
                              ? 'bg-emerald-500' 
                              : progress >= 50 
                                ? 'bg-blue-500' 
                                : 'bg-amber-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold tabular-nums ${
                        progress >= 100 
                          ? 'text-emerald-600' 
                          : progress >= 50 
                            ? 'text-blue-600' 
                            : 'text-amber-600'
                      }`}>
                        {progress}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Task 문자열에서 진행률 추출 (예: "작업 완료 (100%)" -> 100)
 */
function extractTaskProgress(task: string): number | null {
  const match = task.match(/\((\d+)%\)/);
  return match ? parseInt(match[1], 10) : null;
}
