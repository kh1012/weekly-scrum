"use client";

import { useMemo, useState } from "react";
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
  const barWidth = size === "sm" ? "w-8" : "w-10";
  const barHeight = size === "sm" ? "h-1.5" : "h-2";
  
  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* 달성률 */}
      <span className={`font-bold ${size === "sm" ? "text-[9px]" : "text-[10px]"}`} style={{ color }}>
        {achievementRate}%
      </span>
      {/* 진행/계획 */}
      <span className={`text-[#8c959f] ${size === "sm" ? "text-[7px]" : "text-[8px]"}`}>
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
        {/* 중앙 텍스트 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-bold" style={{ color }}>{achievementRate}%</span>
        </div>
      </div>
      {/* 진행/계획 */}
      <span className="text-[9px] text-[#8c959f]">{progress}/{plan}</span>
    </div>
  );
}

interface MatrixViewProps {
  items: ScrumItem[];
  isFullscreen?: boolean;
}

export function MatrixView({ items, isFullscreen = false }: MatrixViewProps) {
  const isExpanded = isFullscreen;

  // hover 상태 관리
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);

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

  return (
    <div className={`bg-white border border-[#d0d7de] rounded-md overflow-hidden ${isFullscreen ? "h-full flex flex-col" : ""}`}>
      <MatrixHeader members={members.length} projects={projects.length} isFullscreen={isFullscreen} />

      <div className={`overflow-x-auto max-w-full ${isFullscreen ? "flex-1 overflow-y-auto" : ""}`}>
        <table className="w-full border-collapse" style={{ tableLayout: isFullscreen ? "fixed" : "auto" }}>
          {isFullscreen && (
            <colgroup>
              <col style={{ width: "100px" }} />
              {projects.map((p) => (
                <col key={p} />
              ))}
              <col style={{ width: "60px" }} />
            </colgroup>
          )}
          <thead>
            <tr className="bg-[#f6f8fa]">
              <th className={`text-center text-xs font-semibold text-[#1f2328] p-2 border-b border-r border-[#d0d7de] sticky left-0 z-10 bg-[#f6f8fa] ${isExpanded ? "w-[100px]" : "w-[70px]"}`}>팀원</th>
              {projects.map((p) => (
                  <th 
                    key={p} 
                    className={`text-center border-b border-r border-[#d0d7de] cursor-pointer transition-all duration-200 ${isExpanded ? "text-xs font-semibold text-[#1f2328] p-2" : "p-1 w-[56px]"}`}
                    style={getCellStyle(null, p)}
                    onMouseEnter={() => setHoveredCol(p)}
                    onMouseLeave={() => setHoveredCol(null)}
                  >
                    {isExpanded ? (
                      <div className="truncate max-w-[120px]">{p}</div>
                    ) : (
                      <div className="group relative flex flex-col items-center justify-center min-h-[32px]">
                        <div className="w-10 h-6 rounded flex items-center justify-center text-[8px] font-semibold text-[#1f2328] bg-white border border-[#d0d7de] truncate px-1" title={p}>
                          {p.length > 4 ? p.slice(0, 4) + ".." : p}
                        </div>
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 hidden group-hover:block">
                          <div className="bg-[#1f2328] text-white text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap">{p}</div>
                        </div>
                      </div>
                    )}
                  </th>
              ))}
              <th className={`text-center text-xs font-semibold text-[#1f2328] border-b border-[#d0d7de] bg-[#f6f8fa] ${isExpanded ? "p-2 w-[60px]" : "p-1 w-[50px]"}`}>{isExpanded ? "평균" : "Avg"}</th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member}>
                <td 
                  className={`border-b border-r border-[#d0d7de] sticky left-0 bg-white z-10 text-center cursor-pointer transition-all duration-200 ${isExpanded ? "p-2" : "p-1.5"}`}
                  style={getCellStyle(member, null)}
                  onMouseEnter={() => setHoveredRow(member)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className={`font-medium text-[#1f2328] ${isExpanded ? "text-xs" : "text-[10px]"}`}>{member}</span>
                  </div>
                </td>
                {projects.map((p) => {
                  const cellItems = matrix[member][p];
                  const cellStyle = getCellStyle(member, p);
                  if (cellItems.length === 0) {
                    return (
                      <td 
                        key={p} 
                        className={`border-b border-r border-[#d0d7de] text-center transition-all duration-200 ${isExpanded ? "p-1" : "p-0"}`}
                        style={cellStyle}
                      >
                        <div className={`flex items-center justify-center ${isExpanded ? "" : "h-10"}`}>
                          <span className="text-[10px] text-[#d0d7de]">-</span>
                        </div>
                      </td>
                    );
                  }
                  const avg = Math.round(cellItems.reduce((s, i) => s + i.progressPercent, 0) / cellItems.length);
                  return (
                    <td 
                      key={p} 
                      className={`border-b border-r border-[#d0d7de] transition-all duration-200 ${isExpanded ? "p-1 align-top" : "p-0"}`} 
                      style={{ backgroundColor: getProgressBgColor(avg), ...cellStyle }}
                    >
                      {isExpanded ? <ExpandedCell items={cellItems} /> : <CompactCell items={cellItems} avg={avg} />}
                    </td>
                  );
                })}
                <td 
                  className={`border-b border-[#d0d7de] text-center bg-white transition-all duration-200 ${isExpanded ? "p-2" : "p-1"}`}
                  style={getCellStyle(member, null)}
                >
                  <div className="flex items-center justify-center">
                    <MiniProgressBar progress={memberAvg[member].progress} plan={memberAvg[member].plan} size={isExpanded ? "md" : "sm"} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-white">
              <td className={`border-t border-r border-[#d0d7de] sticky left-0 z-10 text-center bg-white ${isExpanded ? "p-2" : "p-1"}`}>
                <span className={`font-semibold text-[#1f2328] ${isExpanded ? "text-xs" : "text-[9px]"}`}>{isExpanded ? "평균" : "Avg"}</span>
              </td>
              {projects.map((p) => (
                <td 
                  key={p} 
                  className={`border-t border-r border-[#d0d7de] text-center bg-white transition-all duration-200 ${isExpanded ? "p-2" : "p-1"}`}
                  style={getCellStyle(null, p)}
                >
                  <div className="flex items-center justify-center">
                    <MiniProgressBar progress={projectAvg[p].progress} plan={projectAvg[p].plan} size={isExpanded ? "md" : "sm"} />
                  </div>
                </td>
              ))}
              <td className={`text-center border-t border-[#d0d7de] bg-white ${isExpanded ? "p-3" : "p-2"}`}>
                <div className="flex items-center justify-center">
                  <CircularProgressBar progress={totalAvg.progress} plan={totalAvg.plan} size={isExpanded ? 64 : 52} />
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <MatrixLegend isExpanded={isExpanded} />
    </div>
  );
}
