"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ScrumItem, RiskLevel } from "@/types/scrum";
import { getDomainColor, getProgressColor, getRiskLevelColor, getAchievementRate } from "@/lib/colorDefines";

interface CompactCellProps {
  items: ScrumItem[];
  avg: number;
}

export function CompactCell({ items, avg }: CompactCellProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const cellRef = useRef<HTMLDivElement>(null);

  // 최대 리스크 레벨
  const maxRiskLevel = Math.max(...items.map((i) => i.riskLevel ?? 0)) as RiskLevel;
  const riskColor = maxRiskLevel > 0 ? getRiskLevelColor(maxRiskLevel) : null;

  // 평균 달성률 계산
  const avgPlan = Math.round(items.reduce((s, i) => s + (i.planPercent ?? i.progressPercent), 0) / items.length);
  const avgAchievement = getAchievementRate(avg, avgPlan);

  useEffect(() => {
    if (isHovered && cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8,
      });
    }
  }, [isHovered]);

  return (
    <>
      <div
        ref={cellRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="h-full w-full flex flex-col items-center justify-center cursor-pointer h-10 relative"
      >
        {/* 달성률 표시 (진행/계획) */}
        <span
          className="text-[11px] font-bold"
          style={{ color: getProgressColor(avg) }}
        >
          {avgAchievement}%
        </span>
        <span className="text-[8px] text-[#8c959f]">
          {avg}/{avgPlan}
        </span>
        {/* 리스크 마커 */}
        {maxRiskLevel > 0 && riskColor && (
          <div
            className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full"
            style={{ background: riskColor.text }}
            title={`Risk Lv.${maxRiskLevel}`}
          />
        )}
      </div>
      {isHovered &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={{
              left: tooltipPos.x,
              top: tooltipPos.y,
              transform: "translateX(-50%)",
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-white" />
            <div className="bg-white border border-[#d0d7de] rounded-lg shadow-xl p-5 min-w-[300px] max-w-[400px]">
              {/* 헤더: 요약 정보 */}
              <div className="mb-4 pb-4 border-b border-[#d0d7de]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-[#1f2328]">{items.length}개 항목</span>
                  <span 
                    className="text-xl font-bold"
                    style={{ color: getProgressColor(avg) }}
                  >
                    {avgAchievement}% 달성
                  </span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[#8c959f]">계획</span>
                    <span className="font-semibold text-[#1f2328]">{avgPlan}%</span>
                  </div>
                  <span className="text-[#d0d7de]">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[#8c959f]">진행</span>
                    <span className="font-semibold" style={{ color: getProgressColor(avg) }}>{avg}%</span>
                  </div>
                </div>
              </div>
              {/* 항목 목록 */}
              <div className="space-y-4">
                {items.map((i, idx) => {
                  const c = getDomainColor(i.domain);
                  const itemRiskLevel = (i.riskLevel ?? 0) as RiskLevel;
                  const itemRiskColor = itemRiskLevel > 0 ? getRiskLevelColor(itemRiskLevel) : null;
                  const planPercent = i.planPercent ?? i.progressPercent;
                  const achievementRate = getAchievementRate(i.progressPercent, planPercent);
                  return (
                    <div key={idx} className="text-left">
                      {/* 상단: 도메인, 달성률, 리스크 레벨 */}
                      <div className="flex items-center gap-3 mb-2">
                        <span
                          className="px-2 py-1 rounded text-[11px] font-semibold"
                          style={{ background: c.bg, color: c.text }}
                        >
                          {i.domain}
                        </span>
                        <span
                          className="text-base font-bold"
                          style={{ color: getProgressColor(i.progressPercent) }}
                        >
                          {achievementRate}%
                        </span>
                        {itemRiskColor && (
                          <span
                            className="px-2 py-1 rounded text-[10px] font-semibold ml-auto"
                            style={{ background: itemRiskColor.text, color: "white" }}
                          >
                            Lv.{itemRiskLevel}
                          </span>
                        )}
                      </div>
                      {/* 계획 vs 진행 */}
                      <div className="flex items-center gap-4 text-sm mb-2 pl-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#8c959f]">계획</span>
                          <span className="font-medium text-[#1f2328]">{planPercent}%</span>
                        </div>
                        <span className="text-[#d0d7de]">→</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[#8c959f]">진행</span>
                          <span className="font-medium" style={{ color: getProgressColor(i.progressPercent) }}>{i.progressPercent}%</span>
                        </div>
                      </div>
                      {/* 토픽 */}
                      <div className="text-sm font-medium text-[#1f2328] pl-1 leading-relaxed">
                        {i.topic}
                      </div>
                      {/* 사유 표시 */}
                      {i.reason && i.reason.trim() !== "" && (
                        <div className="text-xs mt-2 pl-3 border-l-2" style={{ borderColor: "#9a6700", color: "#9a6700" }}>
                          [사유] {i.reason}
                        </div>
                      )}
                      {/* 리스크 내용 표시 */}
                      {itemRiskColor && i.risk && i.risk.trim() !== "" && (
                        <div className="text-xs mt-2 pl-3 border-l-2" style={{ borderColor: itemRiskColor.text, color: itemRiskColor.text }}>
                          {i.risk}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

interface ExpandedCellProps {
  items: ScrumItem[];
}

interface ExpandedCardProps {
  item: ScrumItem;
}

function ExpandedCard({ item }: ExpandedCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);
  const c = getDomainColor(item.domain);
  const riskLevel = (item.riskLevel ?? 0) as RiskLevel;
  const riskColor = riskLevel > 0 ? getRiskLevelColor(riskLevel) : null;
  const planPercent = item.planPercent ?? item.progressPercent;
  const achievementRate = getAchievementRate(item.progressPercent, planPercent);

  useEffect(() => {
    if (isHovered && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      setTooltipPos({
        x: rect.left + rect.width / 2,
        y: rect.top - 8,
      });
    }
  }, [isHovered]);

  return (
    <>
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="flex flex-col gap-0.5 px-1.5 py-1 bg-white rounded border cursor-pointer hover:border-[#0969da] transition-colors relative"
        style={{ borderColor: riskLevel >= 2 && riskColor ? riskColor.border : "#d0d7de" }}
      >
        <div className="flex items-center justify-between">
          {/* 달성률 표시 */}
          <span
            className="text-[11px] font-bold"
            style={{ color: getProgressColor(item.progressPercent) }}
          >
            {achievementRate}%
          </span>
          {riskLevel > 0 && riskColor && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: riskColor.text }}
            />
          )}
        </div>
        {/* 진행/계획 비율 */}
        <span className="text-[8px] text-[#8c959f]">
          {item.progressPercent}/{planPercent}
        </span>
        <span
          className="px-1 py-0.5 rounded text-[8px] font-semibold self-start"
          style={{ background: c.bg, color: c.text }}
        >
          {item.domain}
        </span>
        <span className="text-[9px] text-[#1f2328] leading-tight line-clamp-2">
          {item.topic}
        </span>
      </div>
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
            <div className="bg-[#1f2328] text-white rounded-lg shadow-xl p-5 min-w-[300px] max-w-[400px]">
              {/* 헤더: 도메인, 달성률, 리스크 */}
              <div className="flex items-center gap-3 mb-4">
                <span
                  className="px-2 py-1 rounded text-[11px] font-semibold"
                  style={{ background: c.bg, color: c.text }}
                >
                  {item.domain}
                </span>
                <span
                  className="text-xl font-bold"
                  style={{ color: getProgressColor(item.progressPercent) }}
                >
                  {achievementRate}% 달성
                </span>
                {riskLevel > 0 && riskColor && (
                  <span
                    className="px-2 py-1 rounded text-[11px] font-semibold ml-auto"
                    style={{ background: riskColor.text, color: "white" }}
                  >
                    Lv.{riskLevel}
                  </span>
                )}
              </div>
              {/* 계획 vs 진행 */}
              <div className="flex items-center gap-6 text-sm mb-4 p-3 rounded bg-[#2d333b]">
                <div className="flex items-center gap-2">
                  <span className="text-[#8c959f]">계획</span>
                  <span className="font-semibold text-white text-base">{planPercent}%</span>
                </div>
                <span className="text-[#8c959f]">→</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#8c959f]">진행</span>
                  <span className="font-semibold text-base" style={{ color: getProgressColor(item.progressPercent) }}>{item.progressPercent}%</span>
                </div>
              </div>
              {/* 토픽 */}
              <div className="text-sm text-white leading-relaxed mb-3">
                {item.topic}
              </div>
              {/* 사유 표시 */}
              {item.reason && item.reason.trim() !== "" && (
                <div className="text-sm mt-2 pt-2 border-t border-[#3d444d]">
                  <div className="text-[#9a6700] mb-1 text-xs">계획 대비 미비 사유</div>
                  <div className="pl-3 border-l-2" style={{ borderColor: "#9a6700", color: "#9a6700" }}>
                    {item.reason}
                  </div>
                </div>
              )}
              {/* 리스크 정보 */}
              {riskLevel > 0 && riskColor && (
                <div className="text-sm mt-3 pt-3 border-t border-[#3d444d]">
                  <div className="flex items-center gap-3 mb-2">
                    <span style={{ color: riskColor.text }}>Lv.{riskLevel} {riskColor.label}</span>
                    <span className="text-[#8c959f]">- {riskColor.description}</span>
                  </div>
                  {item.risk && item.risk.trim() !== "" && (
                    <div className="mt-2 pl-3 border-l-2" style={{ borderColor: riskColor.text, color: riskColor.text }}>
                      {item.risk}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1f2328]" />
          </div>,
          document.body
        )}
    </>
  );
}

export function ExpandedCell({ items }: ExpandedCellProps) {
  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, idx) => (
        <ExpandedCard key={idx} item={item} />
      ))}
    </div>
  );
}

