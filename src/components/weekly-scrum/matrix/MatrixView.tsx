"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import type { ScrumItem } from "@/types/scrum";
import { getProgressColor, getProgressBgColor, getAchievementRate } from "@/lib/colorDefines";
import { MatrixHeader, MatrixLegend } from "./MatrixHeader";
import { CompactCell, ExpandedCell } from "./MatrixCell";

// 미니 선형 프로그레스 바 컴포넌트 (달성률 기반)
function MiniProgressBar({ 
  progress, 
  plan, 
  size = "md" 
}: { 
  progress: number; 
  plan: number;
  size?: "sm" | "md" 
}) {
  const achievementRate = getAchievementRate(progress, plan);
  const color = getProgressColor(progress);
  const barWidth = size === "sm" ? "w-10" : "w-12";
  const barHeight = size === "sm" ? "h-1.5" : "h-2";
  
  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* 달성률 - 1.2배 폰트 */}
      <span className={`font-bold ${size === "sm" ? "text-[11px]" : "text-xs"}`} style={{ color }}>
        {achievementRate}%
      </span>
      {/* 진행/계획 - 1.2배 폰트 */}
      <span className={`text-[#8c959f] ${size === "sm" ? "text-[9px]" : "text-[10px]"}`}>
        {progress}/{plan}
      </span>
      <div className={`${barWidth} ${barHeight} rounded-full bg-[#e5e7eb] overflow-hidden`}>
        <div
          className={`${barHeight} rounded-full transition-all`}
          style={{
            width: `${Math.min(achievementRate, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// 원형 프로그레스 바 컴포넌트 (전체 평균용)
function CircularProgressBar({ 
  progress, 
  plan,
  size = 56
}: { 
  progress: number; 
  plan: number;
  size?: number;
}) {
  const achievementRate = getAchievementRate(progress, plan);
  const color = getProgressColor(progress);
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(achievementRate, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* 배경 원 */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
          />
          {/* 진행률 원 */}
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
            className="transition-all duration-300"
          />
        </svg>
        {/* 중앙 텍스트 - 1.2배 폰트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-bold" style={{ color }}>{achievementRate}%</span>
        </div>
      </div>
      {/* 진행/계획 - 1.2배 폰트 */}
      <span className="text-[11px] text-[#8c959f]">{progress}/{plan}</span>
    </div>
  );
}

interface MatrixViewProps {
  items: ScrumItem[];
  isFullscreen?: boolean;
}

export function MatrixView({ items, isFullscreen = false }: MatrixViewProps) {
  const isExpanded = isFullscreen;
  const containerRef = useRef<HTMLDivElement>(null);
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  
  // 배율 상태 관리
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number } | null>(null);

  // hover 상태 관리
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

  // 컨테이너 크기 계산 (GNB 아래 영역 가득 채우기)
  useEffect(() => {
    if (isFullscreen) return;
    
    const calculateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        // GNB 높이와 여백 고려
        const availableHeight = viewportHeight - rect.top - 24; // 24px 하단 여백
        // 좌우 여백 동일하게 적용 (중앙 정렬)
        const horizontalPadding = 32; // 좌우 16px씩
        const availableWidth = viewportWidth - horizontalPadding;
        setContainerSize({
          width: Math.max(600, Math.min(availableWidth, 1600)), // 최대 1600px
          height: Math.max(400, availableHeight)
        });
      }
    };

    calculateSize();
    window.addEventListener("resize", calculateSize);
    return () => window.removeEventListener("resize", calculateSize);
  }, [isFullscreen]);

  const members = useMemo(() => Array.from(new Set(items.map((i) => i.name))).sort(), [items]);
  const projects = useMemo(() => Array.from(new Set(items.map((i) => i.project))).sort(), [items]);

  // 셀 강조 여부 확인
  const isCellHighlighted = (row: string | null, col: string | null) => {
    if (!hoveredRow && !hoveredCol) return true; // hover 없으면 모두 표시
    if (hoveredRow && row === hoveredRow) return true;
    if (hoveredCol && col === hoveredCol) return true;
    return false;
  };

  // 셀 스타일 계산 (비강조 시 blur + grayscale 효과)
  const getCellStyle = (row: string | null, col: string | null) => {
    if (!hoveredRow && !hoveredCol) {
      return { filter: "none", opacity: 1 };
    }
    if (isCellHighlighted(row, col)) {
      return { filter: "none", opacity: 1 };
    }
    return { 
      filter: "blur(1px) grayscale(0.5)",
      opacity: 0.5,
    };
  };

  const matrix = useMemo(() => {
    const data: Record<string, Record<string, ScrumItem[]>> = {};
    members.forEach((m) => {
      data[m] = {};
      projects.forEach((p) => { data[m][p] = []; });
    });
    items.forEach((i) => { data[i.name][i.project]?.push(i); });
    return data;
  }, [items, members, projects]);

  // 프로젝트별 평균 (진행률 + 계획)
  const projectAvg = useMemo(() => {
    const result: Record<string, { progress: number; plan: number }> = {};
    projects.forEach((p) => {
      const pItems = items.filter((i) => i.project === p);
      if (pItems.length > 0) {
        result[p] = {
          progress: Math.round(pItems.reduce((s, i) => s + i.progressPercent, 0) / pItems.length),
          plan: Math.round(pItems.reduce((s, i) => s + (i.planPercent ?? i.progressPercent), 0) / pItems.length),
        };
      } else {
        result[p] = { progress: 0, plan: 0 };
      }
    });
    return result;
  }, [items, projects]);

  // 멤버별 평균 (진행률 + 계획)
  const memberAvg = useMemo(() => {
    const result: Record<string, { progress: number; plan: number }> = {};
    members.forEach((m) => {
      const mItems = items.filter((i) => i.name === m);
      if (mItems.length > 0) {
        result[m] = {
          progress: Math.round(mItems.reduce((s, i) => s + i.progressPercent, 0) / mItems.length),
          plan: Math.round(mItems.reduce((s, i) => s + (i.planPercent ?? i.progressPercent), 0) / mItems.length),
        };
      } else {
        result[m] = { progress: 0, plan: 0 };
      }
    });
    return result;
  }, [items, members]);

  // 전체 평균 (진행률 + 계획)
  const totalAvg = useMemo(() => {
    if (items.length === 0) return { progress: 0, plan: 0 };
    return {
      progress: Math.round(items.reduce((s, i) => s + i.progressPercent, 0) / items.length),
      plan: Math.round(items.reduce((s, i) => s + (i.planPercent ?? i.progressPercent), 0) / items.length),
    };
  }, [items]);

  // Avg 열 너비 (1.2배)
  const avgColWidth = isExpanded ? 84 : 72;
  // 첫 번째 열 너비 (1.2배)
  const firstColWidth = isExpanded ? 120 : 84;

  return (
    <div 
      ref={containerRef}
      className={`bg-white border border-[#d0d7de] rounded-md overflow-hidden flex flex-col ${
        isFullscreen ? "h-full w-full" : ""
      }`}
      style={!isFullscreen && containerSize ? { 
        height: containerSize.height,
        width: containerSize.width 
      } : undefined}
    >
      <MatrixHeader 
        members={members.length} 
        projects={projects.length} 
        isFullscreen={isFullscreen}
        scale={scale}
        onScaleChange={!isFullscreen ? setScale : undefined}
      />

      <div 
        ref={tableWrapperRef}
        className="overflow-auto flex-1 relative"
      >
        <div 
          className="min-w-full min-h-full"
          style={{ 
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: `${100 / scale}%`,
            height: `${100 / scale}%`,
          }}
        >
          <table className="w-full h-full border-collapse" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: firstColWidth }} />
              {/* 프로젝트 열들은 남은 공간을 균등하게 분배 */}
              {projects.map((p) => (
                <col key={p} />
              ))}
              <col style={{ width: avgColWidth }} />
            </colgroup>
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#f6f8fa]">
                <th 
                  className="text-center text-sm font-semibold text-[#1f2328] p-2.5 border-b border-r border-[#d0d7de] sticky left-0 z-30 bg-[#f6f8fa]"
                  style={{ width: firstColWidth }}
                >
                  팀원
                </th>
                {projects.map((p) => (
                  <th 
                    key={p} 
                    className={`text-center border-b border-r border-[#d0d7de] cursor-pointer transition-all duration-200 bg-[#f6f8fa] ${isExpanded ? "text-sm font-semibold text-[#1f2328] p-2.5" : "p-2"}`}
                    style={getCellStyle(null, p)}
                    onMouseEnter={() => setHoveredCol(p)}
                    onMouseLeave={() => setHoveredCol(null)}
                    title={p}
                  >
                    <div className="truncate text-xs font-semibold text-[#1f2328] px-1">
                      {p}
                    </div>
                  </th>
                ))}
                {/* 헤더 Avg 열 - sticky right */}
                <th 
                  className="text-center text-sm font-semibold text-[#1f2328] border-b border-l border-[#d0d7de] bg-[#f0f3f6] sticky right-0 z-30 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]"
                  style={{ width: avgColWidth, padding: isExpanded ? 10 : 6 }}
                >
                  {isExpanded ? "평균" : "Avg"}
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member}>
                  <td 
                    className={`border-b border-r border-[#d0d7de] sticky left-0 bg-white z-10 text-center cursor-pointer transition-all duration-200 ${isExpanded ? "p-2.5" : "p-2"}`}
                    style={{ ...getCellStyle(member, null), width: firstColWidth }}
                    onMouseEnter={() => setHoveredRow(member)}
                    onMouseLeave={() => setHoveredRow(null)}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className={`font-medium text-[#1f2328] ${isExpanded ? "text-sm" : "text-xs"}`}>{member}</span>
                    </div>
                  </td>
                  {projects.map((p) => {
                    const cellItems = matrix[member][p];
                    const cellStyle = getCellStyle(member, p);
                    if (cellItems.length === 0) {
                      return (
                        <td 
                          key={p} 
                          className={`border-b border-r border-[#d0d7de] text-center transition-all duration-200 ${isExpanded ? "p-1.5" : "p-1"}`}
                          style={cellStyle}
                        >
                          <div className={`flex items-center justify-center ${isExpanded ? "" : "h-12"}`}>
                            <span className="text-xs text-[#d0d7de]">-</span>
                          </div>
                        </td>
                      );
                    }
                    const avg = Math.round(cellItems.reduce((s, i) => s + i.progressPercent, 0) / cellItems.length);
                    return (
                      <td 
                        key={p} 
                        className={`border-b border-r border-[#d0d7de] transition-all duration-200 ${isExpanded ? "p-1.5 align-top" : "p-1"}`} 
                        style={{ backgroundColor: getProgressBgColor(avg), ...cellStyle }}
                      >
                        {isExpanded ? <ExpandedCell items={cellItems} /> : <CompactCell items={cellItems} avg={avg} />}
                      </td>
                    );
                  })}
                  {/* 멤버별 Avg 열 - sticky right */}
                  <td 
                    className="border-b border-l border-[#d0d7de] text-center bg-[#fafbfc] sticky right-0 z-10 transition-all duration-200 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]"
                    style={{ ...getCellStyle(member, null), width: avgColWidth, padding: isExpanded ? 10 : 6 }}
                  >
                    <div className="flex items-center justify-center">
                      <MiniProgressBar progress={memberAvg[member].progress} plan={memberAvg[member].plan} size={isExpanded ? "md" : "sm"} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer - sticky bottom */}
            <tfoot className="sticky bottom-0 z-20">
              <tr className="bg-[#f0f3f6] shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                <td 
                  className="border-t border-r border-[#d0d7de] sticky left-0 z-30 text-center bg-[#f0f3f6]"
                  style={{ width: firstColWidth, padding: isExpanded ? 10 : 6 }}
                >
                  <span className={`font-semibold text-[#1f2328] ${isExpanded ? "text-sm" : "text-xs"}`}>{isExpanded ? "평균" : "Avg"}</span>
                </td>
                {projects.map((p) => (
                  <td 
                    key={p} 
                    className="border-t border-r border-[#d0d7de] text-center bg-[#f0f3f6] transition-all duration-200"
                    style={{ ...getCellStyle(null, p), padding: isExpanded ? 10 : 6 }}
                  >
                    <div className="flex items-center justify-center">
                      <MiniProgressBar progress={projectAvg[p].progress} plan={projectAvg[p].plan} size={isExpanded ? "md" : "sm"} />
                    </div>
                  </td>
                ))}
                {/* 전체 평균 셀 - sticky right + bottom (코너) */}
                <td 
                  className="text-center border-t border-l border-[#d0d7de] bg-[#e8ebef] sticky right-0 z-30 shadow-[-2px_0_4px_rgba(0,0,0,0.05)]"
                  style={{ width: avgColWidth, padding: isExpanded ? 14 : 10 }}
                >
                  <div className="flex items-center justify-center">
                    <CircularProgressBar progress={totalAvg.progress} plan={totalAvg.plan} size={isExpanded ? 72 : 56} />
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <MatrixLegend isExpanded={isExpanded} />
    </div>
  );
}
