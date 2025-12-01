"use client";

import { useMemo, useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { 
  getDomainColor, 
  getProgressColor, 
  getProgressBgColor,
  PROGRESS_COLORS,
  UI_COLORS 
} from "@/lib/colorDefines";

interface MatrixViewProps {
  items: ScrumItem[];
}

export function MatrixView({ items }: MatrixViewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 팀원 목록
  const members = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.name))).sort();
  }, [items]);

  // 프로젝트 목록
  const projects = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.project))).sort();
  }, [items]);

  // 팀원 × 프로젝트 매트릭스 데이터
  const matrix = useMemo(() => {
    const data: Record<string, Record<string, ScrumItem[]>> = {};
    
    members.forEach((member) => {
      data[member] = {};
      projects.forEach((project) => {
        data[member][project] = [];
      });
    });

    items.forEach((item) => {
      if (data[item.name] && data[item.name][item.project]) {
        data[item.name][item.project].push(item);
      }
    });

    return data;
  }, [items, members, projects]);

  // 프로젝트별 평균 진행률
  const projectAvgProgress = useMemo(() => {
    const result: Record<string, number> = {};
    projects.forEach((project) => {
      const projectItems = items.filter((item) => item.project === project);
      if (projectItems.length > 0) {
        result[project] = Math.round(
          projectItems.reduce((sum, item) => sum + item.progressPercent, 0) / projectItems.length
        );
      } else {
        result[project] = 0;
      }
    });
    return result;
  }, [items, projects]);

  // 팀원별 평균 진행률
  const memberAvgProgress = useMemo(() => {
    const result: Record<string, number> = {};
    members.forEach((member) => {
      const memberItems = items.filter((item) => item.name === member);
      if (memberItems.length > 0) {
        result[member] = Math.round(
          memberItems.reduce((sum, item) => sum + item.progressPercent, 0) / memberItems.length
        );
      } else {
        result[member] = 0;
      }
    });
    return result;
  }, [items, members]);

  // 축소 모드 셀 렌더링
  const renderCompactCell = (cellItems: ScrumItem[], avgProgress: number) => {
    return (
      <div className="group relative h-full w-full flex items-center justify-center cursor-pointer">
        <span
          className="text-[11px] font-bold"
          style={{ color: getProgressColor(avgProgress) }}
        >
          {avgProgress}%
        </span>
        {/* 호버 팝업 */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-50 hidden group-hover:block">
          <div className="bg-white border border-[#d0d7de] rounded-lg shadow-lg p-3 min-w-[200px] max-w-[280px]">
            <div className="text-[10px] text-[#656d76] mb-2 pb-2 border-b border-[#d0d7de]">
              {cellItems.length}개 항목 · 평균 {avgProgress}%
            </div>
            <div className="space-y-2">
              {cellItems.map((item, idx) => {
                const domainColor = getDomainColor(item.domain);
                return (
                  <div key={idx} className="text-left">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="px-1 py-0.5 rounded text-[8px] font-semibold"
                        style={{ background: domainColor.bg, color: domainColor.text }}
                      >
                        {item.domain}
                      </span>
                      <span
                        className="text-[9px] font-semibold"
                        style={{ color: getProgressColor(item.progressPercent) }}
                      >
                        {item.progressPercent}%
                      </span>
                    </div>
                    <div className="text-[10px] font-medium text-[#1f2328]">{item.topic}</div>
                    {item.progress && item.progress !== "-" && (
                      <div className="text-[9px] text-[#656d76] mt-0.5 line-clamp-2">
                        {item.progress}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 확장 모드 셀 렌더링
  const renderExpandedCell = (cellItems: ScrumItem[], avgProgress: number) => {
    return (
      <div className="space-y-1 min-w-[100px] max-w-[180px]">
        {cellItems.map((item, idx) => {
          const domainColor = getDomainColor(item.domain);
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-1 px-1.5 py-1 bg-white rounded border border-[#d0d7de]"
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span
                  className="px-1 py-0.5 rounded text-[7px] font-semibold shrink-0"
                  style={{ background: domainColor.bg, color: domainColor.text }}
                >
                  {item.domain}
                </span>
                <span className="text-[9px] text-[#1f2328] truncate">
                  {item.topic}
                </span>
              </div>
              <span
                className="text-[9px] font-semibold shrink-0"
                style={{ color: getProgressColor(item.progressPercent) }}
              >
                {item.progressPercent}%
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#d0d7de] rounded-md overflow-hidden">
      {/* 헤더: 모드 토글 */}
      <div className="flex items-center justify-between p-2 border-b border-[#d0d7de] bg-[#f6f8fa] rounded-t-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#656d76]">팀원 × 프로젝트 매트릭스</span>
          <span className="text-[10px] text-[#8c959f]">
            ({members.length}명 × {projects.length}개 프로젝트)
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md border border-[#d0d7de] bg-white hover:bg-[#f6f8fa] transition-colors"
          >
            {isExpanded ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 14h6m0 0v6m0-6L3 21M20 10h-6m0 0V4m0 6l7-7" />
                </svg>
                축소
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                확장
              </>
            )}
          </button>
          <button
            onClick={() => window.open("/weekly-scrum/matrix", "_blank", "width=1400,height=900")}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium rounded-md border border-[#d0d7de] bg-white hover:bg-[#f6f8fa] transition-colors"
            title="새 창에서 전체화면으로 보기"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            새 창
          </button>
        </div>
      </div>

      <div className="overflow-x-auto max-w-full">
        <table className="w-full border-collapse" style={{ tableLayout: "auto" }}>
          <thead>
            <tr className="bg-[#f6f8fa]">
              <th className={`text-center text-xs font-semibold text-[#656d76] p-2 border-b border-r border-[#d0d7de] sticky left-0 bg-[#f6f8fa] z-10 whitespace-nowrap ${!isExpanded ? "w-[70px]" : ""}`}>
                팀원
              </th>
              {projects.map((project) => (
                <th
                  key={project}
                  className={`text-center border-b border-r border-[#d0d7de] ${
                    isExpanded 
                      ? "text-xs font-semibold text-[#1f2328] p-2 whitespace-nowrap" 
                      : "p-1 w-[56px]"
                  }`}
                >
                  {isExpanded ? (
                    <>
                      <div className="truncate max-w-[120px]">{project}</div>
                      <div className="text-[10px] font-normal text-[#656d76] mt-0.5">
                        {projectAvgProgress[project]}%
                      </div>
                    </>
                  ) : (
                    <div className="group relative flex flex-col items-center justify-center min-h-[40px]">
                      <div 
                        className="w-10 h-6 rounded flex items-center justify-center text-[8px] font-semibold text-[#1f2328] bg-white border border-[#d0d7de] truncate px-1"
                        title={project}
                      >
                        {project.length > 4 ? project.slice(0, 4) + ".." : project}
                      </div>
                      <div className="text-[9px] font-medium mt-0.5" style={{ color: getProgressColor(projectAvgProgress[project]) }}>
                        {projectAvgProgress[project]}%
                      </div>
                      {/* 호버 팝업 */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 hidden group-hover:block">
                        <div className="bg-[#1f2328] text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                          {project}
                        </div>
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th className={`text-center text-xs font-semibold text-[#656d76] border-b border-[#d0d7de] ${isExpanded ? "p-2 whitespace-nowrap" : "p-1 w-[50px]"}`}>
                {isExpanded ? "평균" : "Avg"}
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member}>
                <td className={`border-b border-r border-[#d0d7de] sticky left-0 bg-white z-10 whitespace-nowrap text-center ${isExpanded ? "p-2" : "p-1.5"}`}>
                  <div className="flex items-center justify-center gap-2">
                    <div className={`rounded-full bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center font-semibold text-[#656d76] shrink-0 ${isExpanded ? "w-6 h-6 text-[10px]" : "w-5 h-5 text-[9px]"}`}>
                      {member.charAt(0)}
                    </div>
                    <span className={`font-medium text-[#1f2328] ${isExpanded ? "text-xs" : "text-[10px]"}`}>{member}</span>
                  </div>
                </td>
                {projects.map((project) => {
                  const cellItems = matrix[member][project];
                  if (cellItems.length === 0) {
                    return (
                      <td
                        key={project}
                        className={`border-b border-r border-[#d0d7de] text-center ${isExpanded ? "p-1.5" : "p-0"}`}
                      >
                        <div className={`flex items-center justify-center ${isExpanded ? "" : "h-10"}`}>
                          <span className="text-[10px] text-[#d0d7de]">-</span>
                        </div>
                      </td>
                    );
                  }

                  const avgProgress = Math.round(
                    cellItems.reduce((sum, item) => sum + item.progressPercent, 0) / cellItems.length
                  );

                  return (
                    <td
                      key={project}
                      className={`border-b border-r border-[#d0d7de] ${isExpanded ? "p-1.5 align-top" : "p-0"}`}
                      style={{ backgroundColor: getProgressBgColor(avgProgress) }}
                    >
                      {isExpanded 
                        ? renderExpandedCell(cellItems, avgProgress)
                        : <div className="h-10 w-full">{renderCompactCell(cellItems, avgProgress)}</div>
                      }
                    </td>
                  );
                })}
                <td className={`border-b border-[#d0d7de] text-center whitespace-nowrap ${isExpanded ? "p-2" : "p-1"}`}>
                  <span
                    className={`font-semibold ${isExpanded ? "text-xs" : "text-[10px]"}`}
                    style={{ color: getProgressColor(memberAvgProgress[member]) }}
                  >
                    {memberAvgProgress[member]}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#f6f8fa]">
              <td className={`border-r border-[#d0d7de] sticky left-0 bg-[#f6f8fa] z-10 whitespace-nowrap text-center ${isExpanded ? "p-2" : "p-1"}`}>
                <span className={`font-semibold text-[#656d76] ${isExpanded ? "text-xs" : "text-[9px]"}`}>
                  {isExpanded ? "평균" : "Avg"}
                </span>
              </td>
              {projects.map((project) => (
                <td key={project} className={`border-r border-[#d0d7de] text-center ${isExpanded ? "p-2" : "p-1"}`}>
                  <span
                    className={`font-semibold ${isExpanded ? "text-xs" : "text-[10px]"}`}
                    style={{ color: getProgressColor(projectAvgProgress[project]) }}
                  >
                    {projectAvgProgress[project]}%
                  </span>
                </td>
              ))}
              <td className={`text-center ${isExpanded ? "p-2" : "p-1"}`}>
                <span
                  className={`font-bold ${isExpanded ? "text-xs" : "text-[10px]"}`}
                  style={{
                    color: getProgressColor(
                      Math.round(items.reduce((sum, item) => sum + item.progressPercent, 0) / items.length)
                    ),
                  }}
                >
                  {Math.round(items.reduce((sum, item) => sum + item.progressPercent, 0) / items.length)}%
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* 범례 */}
      <div className="p-2 border-t border-[#d0d7de] bg-[#f6f8fa] rounded-b-md">
        <div className="flex items-center gap-3 text-[10px] text-[#656d76] flex-wrap">
          <span className="font-medium">진행률:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#dafbe1] border border-[#1a7f37]" />
            완료
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#ddf4ff] border border-[#0969da]" />
            70%+
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#fff8c5] border border-[#9a6700]" />
            40-70%
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-[#ffebe9] border border-[#cf222e]" />
            &lt;40%
          </span>
          {!isExpanded && (
            <span className="ml-2 text-[#8c959f]">· 셀 호버 시 상세 정보 표시</span>
          )}
        </div>
      </div>
    </div>
  );
}
