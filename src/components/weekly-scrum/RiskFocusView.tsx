"use client";

import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import { CircularProgress } from "./CircularProgress";
import { 
  getDomainColor, 
  getProgressColor,
  PROGRESS_COLORS,
  UI_COLORS 
} from "@/lib/colorDefines";

interface RiskFocusViewProps {
  items: ScrumItem[];
}

type RiskLevel = "critical" | "warning" | "normal";

interface CategorizedItem {
  item: ScrumItem;
  level: RiskLevel;
  reasons: string[];
}

export function RiskFocusView({ items }: RiskFocusViewProps) {
  // 항목을 위험도별로 분류
  const categorizedItems = useMemo(() => {
    const result: CategorizedItem[] = items.map((item) => {
      const reasons: string[] = [];
      let level: RiskLevel = "normal";

      // 진행률이 낮으면 위험
      if (item.progressPercent < 30) {
        reasons.push(`진행률 ${item.progressPercent}% (30% 미만)`);
        level = "critical";
      } else if (item.progressPercent < 50) {
        reasons.push(`진행률 ${item.progressPercent}% (50% 미만)`);
        if (level !== "critical") level = "warning";
      }

      // 리스크가 있으면 경고
      if (item.risk && item.risk !== "-" && item.risk.trim() !== "") {
        reasons.push(`리스크: ${item.risk}`);
        if (level !== "critical") level = "warning";
      }

      return { item, level, reasons };
    });

    return result;
  }, [items]);

  // 위험도별 분류
  const critical = categorizedItems.filter((c) => c.level === "critical");
  const warning = categorizedItems.filter((c) => c.level === "warning");
  const normal = categorizedItems.filter((c) => c.level === "normal");

  const renderItem = (categorized: CategorizedItem, showReasons: boolean = true) => {
    const { item, reasons } = categorized;
    const domainColor = getDomainColor(item.domain);

    return (
      <div
        key={`${item.name}-${item.project}-${item.topic}`}
        className="flex items-start gap-3 p-3 bg-white border border-[#d0d7de] rounded-md hover:border-[#0969da] transition-colors"
      >
        <CircularProgress
          percent={item.progressPercent}
          size={40}
          strokeWidth={4}
          isCompleted={item.progressPercent >= 100}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
              style={{ background: domainColor.bg, color: domainColor.text }}
            >
              {item.domain}
            </span>
            <span className="text-xs text-[#656d76]">{item.project}</span>
          </div>
          <h4 className="text-sm font-medium text-[#1f2328] mb-0.5">{item.topic}</h4>
          <p className="text-xs text-[#656d76]">{item.name}</p>
          
          {showReasons && reasons.length > 0 && (
            <div className="mt-2 space-y-1">
              {reasons.map((reason, idx) => (
                <p key={idx} className="text-xs text-[#9a6700] flex items-start gap-1">
                  <svg className="w-3 h-3 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {reason}
                </p>
              ))}
            </div>
          )}

          {/* Progress/Next 정보 */}
          <div className="mt-2 space-y-1">
            {item.progress && item.progress !== "-" && (
              <div className="flex items-stretch gap-0 bg-[#f6f8fa] rounded overflow-hidden border border-[#d0d7de]">
                <div className="w-1 bg-[#0969da] shrink-0" />
                <p className="text-[10px] text-[#1f2328] px-2 py-1">{item.progress}</p>
              </div>
            )}
            {item.next && item.next !== "-" && (
              <div className="flex items-stretch gap-0 bg-[#f6f8fa] rounded overflow-hidden border border-[#d0d7de]">
                <div className="w-1 bg-[#1a7f37] shrink-0" />
                <p className="text-[10px] text-[#1f2328] px-2 py-1">{item.next}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#ffebe9] border border-[#ff8182] rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#cf222e]" />
            <span className="text-xs font-semibold text-[#cf222e]">위험</span>
          </div>
          <div className="text-2xl font-bold text-[#cf222e]">{critical.length}</div>
          <div className="text-xs text-[#a40e26]">진행률 30% 미만</div>
        </div>
        <div className="bg-[#fff8c5] border border-[#d4a72c] rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#9a6700]" />
            <span className="text-xs font-semibold text-[#9a6700]">주의</span>
          </div>
          <div className="text-2xl font-bold text-[#9a6700]">{warning.length}</div>
          <div className="text-xs text-[#7d4e00]">리스크 있음 또는 50% 미만</div>
        </div>
        <div className="bg-[#dafbe1] border border-[#4ac26b] rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-[#1a7f37]" />
            <span className="text-xs font-semibold text-[#1a7f37]">정상</span>
          </div>
          <div className="text-2xl font-bold text-[#1a7f37]">{normal.length}</div>
          <div className="text-xs text-[#116329]">순조롭게 진행 중</div>
        </div>
      </div>

      {/* 위험 항목 */}
      {critical.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#cf222e]" />
            <h2 className="text-sm font-semibold text-[#cf222e]">위험 - 즉각적인 조치 필요</h2>
            <span className="text-xs text-[#656d76]">{critical.length}개</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {critical.map((c) => renderItem(c))}
          </div>
        </div>
      )}

      {/* 주의 항목 */}
      {warning.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#9a6700]" />
            <h2 className="text-sm font-semibold text-[#9a6700]">주의 - 모니터링 필요</h2>
            <span className="text-xs text-[#656d76]">{warning.length}개</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {warning.map((c) => renderItem(c))}
          </div>
        </div>
      )}

      {/* 정상 항목 */}
      {normal.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[#1a7f37]" />
            <h2 className="text-sm font-semibold text-[#1a7f37]">정상 진행 중</h2>
            <span className="text-xs text-[#656d76]">{normal.length}개</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {normal.map((c) => renderItem(c, false))}
          </div>
        </div>
      )}

      {/* 항목이 없는 경우 */}
      {items.length === 0 && (
        <div className="text-center py-12 bg-white rounded-md border border-[#d0d7de]">
          <svg
            className="w-12 h-12 mx-auto mb-3 text-[#8c959f]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-[#656d76] font-medium">표시할 항목이 없습니다</p>
        </div>
      )}
    </div>
  );
}

