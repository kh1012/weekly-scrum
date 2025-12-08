"use client";

import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import { CircularProgress } from "../common/CircularProgress";
import { EmptyState } from "../common/EmptyState";
import { getDomainColor } from "@/lib/colorDefines";

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
  const categorizedItems = useMemo(() => {
    return items.map((item): CategorizedItem => {
      const reasons: string[] = [];
      let level: RiskLevel = "normal";

      // 진행률 기반 레벨 설정
      if (item.progressPercent < 30) {
        reasons.push(`진행률 ${item.progressPercent}% (30% 미만)`);
        level = "critical";
      } else if (item.progressPercent < 50) {
        reasons.push(`진행률 ${item.progressPercent}% (50% 미만)`);
        level = "warning";
      }

      // 리스크가 있는 경우 (critical이 아닌 경우만 warning으로 변경)
      if (item.risk && item.risk.length > 0) {
        reasons.push(`리스크: ${item.risk.join(", ")}`);
        if (level === "normal") level = "warning";
      }

      // reason이 있는 경우에도 표시
      if (item.reason && item.reason.trim() !== "") {
        reasons.push(`사유: ${item.reason}`);
        if (level === "normal") level = "warning";
      }

      return { item, level, reasons };
    });
  }, [items]);

  const critical = categorizedItems.filter((c) => c.level === "critical");
  const warning = categorizedItems.filter((c) => c.level === "warning");
  const normal = categorizedItems.filter((c) => c.level === "normal");

  if (items.length === 0) {
    return <EmptyState message="표시할 항목이 없습니다" />;
  }

  return (
    <div className="space-y-6">
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-3">
        <StatusCard level="critical" count={critical.length} />
        <StatusCard level="warning" count={warning.length} />
        <StatusCard level="normal" count={normal.length} />
      </div>

      {/* 위험 항목 */}
      {critical.length > 0 && (
        <RiskSection level="critical" items={critical} />
      )}

      {/* 주의 항목 */}
      {warning.length > 0 && (
        <RiskSection level="warning" items={warning} />
      )}

      {/* 정상 항목 */}
      {normal.length > 0 && (
        <RiskSection level="normal" items={normal} showReasons={false} />
      )}
    </div>
  );
}

const STATUS_CONFIG = {
  critical: { bg: "#ffebe9", border: "#ff8182", dot: "#cf222e", text: "#cf222e", label: "위험", description: "진행률 30% 미만", title: "위험 - 즉각적인 조치 필요" },
  warning: { bg: "#fff8c5", border: "#d4a72c", dot: "#9a6700", text: "#9a6700", label: "주의", description: "리스크 있음 또는 50% 미만", title: "주의 - 모니터링 필요" },
  normal: { bg: "#dafbe1", border: "#4ac26b", dot: "#1a7f37", text: "#1a7f37", label: "정상", description: "순조롭게 진행 중", title: "정상 진행 중" },
};

function StatusCard({ level, count }: { level: RiskLevel; count: number }) {
  const config = STATUS_CONFIG[level];
  return (
    <div className="rounded-md p-4" style={{ backgroundColor: config.bg, border: `1px solid ${config.border}` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.dot }} />
        <span className="text-xs font-semibold" style={{ color: config.text }}>{config.label}</span>
      </div>
      <div className="text-2xl font-bold" style={{ color: config.text }}>{count}</div>
      <div className="text-xs" style={{ color: config.text }}>{config.description}</div>
    </div>
  );
}

function RiskSection({ level, items, showReasons = true }: { level: RiskLevel; items: CategorizedItem[]; showReasons?: boolean }) {
  const config = STATUS_CONFIG[level];
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.dot }} />
        <h2 className="text-sm font-semibold" style={{ color: config.text }}>{config.title}</h2>
        <span className="text-xs text-[#656d76]">{items.length}개</span>
      </div>
      <div className={`grid ${level === "normal" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2"} gap-3`}>
        {items.map((c) => (
          <RiskItem key={`${c.item.name}-${c.item.project}-${c.item.topic}`} item={c.item} reasons={c.reasons} showReasons={showReasons} />
        ))}
      </div>
    </div>
  );
}

function RiskItem({ item, reasons, showReasons }: { item: ScrumItem; reasons: string[]; showReasons: boolean }) {
  const domainColor = getDomainColor(item.domain);

  return (
    <div className="flex items-start gap-3 p-3 bg-white border border-[#d0d7de] rounded-md hover:border-[#0969da] transition-colors">
      <CircularProgress percent={item.progressPercent} size={40} strokeWidth={4} isCompleted={item.progressPercent >= 100} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: domainColor.bg, color: domainColor.text }}>
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

        <div className="mt-2 space-y-1">
          {item.progress && item.progress.length > 0 && (
            <InfoBox color="#0969da" text={item.progress.join(" / ")} />
          )}
          {item.next && item.next.length > 0 && (
            <InfoBox color="#1a7f37" text={item.next.join(" / ")} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoBox({ color, text }: { color: string; text: string }) {
  return (
    <div className="flex items-stretch gap-0 bg-[#f6f8fa] rounded overflow-hidden border border-[#d0d7de]">
      <div className="w-1 shrink-0" style={{ backgroundColor: color }} />
      <p className="text-[10px] text-[#1f2328] px-2 py-1">{text}</p>
    </div>
  );
}

