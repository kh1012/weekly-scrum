"use client";

import { useMemo, useState } from "react";
import type { WeeklyScrumData, ScrumItem } from "@/types/scrum";
import { 
  getDomainColor, 
  getProgressColor, 
  getProgressBgColor,
  PROGRESS_COLORS,
  UI_COLORS 
} from "@/lib/colorDefines";

interface MatrixFullScreenProps {
  allData: Record<string, WeeklyScrumData>;
}

function weekKeyToSortValue(key: string): number {
  const [year, month, week] = key.split("-");
  const weekNum = parseInt(week.replace("W", ""), 10);
  return parseInt(year, 10) * 10000 + parseInt(month, 10) * 100 + weekNum;
}

export function MatrixFullScreen({ allData }: MatrixFullScreenProps) {
  const sortedWeekKeys = useMemo(() => {
    return Object.keys(allData).sort((a, b) => weekKeyToSortValue(b) - weekKeyToSortValue(a));
  }, [allData]);

  const [selectedWeekKey, setSelectedWeekKey] = useState(sortedWeekKeys[0] || "");

  const currentData = allData[selectedWeekKey];
  const items = currentData?.items || [];

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

  // 확장 모드 셀 렌더링
  const renderExpandedCell = (cellItems: ScrumItem[]) => {
    return (
      <div className="space-y-1.5">
        {cellItems.map((item, idx) => {
          const domainColor = getDomainColor(item.domain);
          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-2 px-2 py-1.5 bg-white rounded border border-[#d0d7de]"
            >
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0"
                  style={{ background: domainColor.bg, color: domainColor.text }}
                >
                  {item.domain}
                </span>
                <span className="text-xs text-[#1f2328] truncate">
                  {item.topic}
                </span>
              </div>
              <span
                className="text-xs font-semibold shrink-0"
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

  if (!currentData) {
    return (
      <div className="min-h-screen bg-[#f6f8fa] flex items-center justify-center">
        <p className="text-[#656d76]">데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8fa] p-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-[#1f2328]">팀원 × 프로젝트 매트릭스</h1>
          <div className="relative">
            <select
              value={selectedWeekKey}
              onChange={(e) => setSelectedWeekKey(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-white border border-[#d0d7de] rounded-md text-sm text-[#1f2328] focus:outline-none focus:border-[#0969da] cursor-pointer"
            >
              {sortedWeekKeys.map((key) => {
                const data = allData[key];
                return (
                  <option key={key} value={key}>
                    {data.year}년 {data.month}월 {data.week}
                  </option>
                );
              })}
            </select>
            <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#656d76] pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
          <span className="text-sm text-[#656d76]">{currentData.range}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#656d76]">
            {members.length}명 × {projects.length}개 프로젝트 · {items.length}개 항목
          </span>
          <button
            onClick={() => window.close()}
            className="px-3 py-1.5 text-xs font-medium text-[#656d76] hover:text-[#1f2328] border border-[#d0d7de] rounded-md hover:bg-white transition-colors"
          >
            닫기
          </button>
        </div>
      </div>

      {/* 매트릭스 테이블 */}
      <div className="bg-white border border-[#d0d7de] rounded-md overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-140px)]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20">
              <tr className="bg-[#f6f8fa]">
                <th className="text-center text-sm font-semibold text-[#656d76] p-3 border-b border-r border-[#d0d7de] sticky left-0 bg-[#f6f8fa] z-30 min-w-[100px]">
                  팀원
                </th>
                {projects.map((project) => (
                  <th
                    key={project}
                    className="text-center text-sm font-semibold text-[#1f2328] p-3 border-b border-r border-[#d0d7de] min-w-[180px]"
                  >
                    <div>{project}</div>
                    <div className="text-xs font-normal text-[#656d76] mt-0.5">
                      평균 {projectAvgProgress[project]}%
                    </div>
                  </th>
                ))}
                <th className="text-center text-sm font-semibold text-[#656d76] p-3 border-b border-[#d0d7de] min-w-[80px]">
                  평균
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member}>
                  <td className="p-3 border-b border-r border-[#d0d7de] sticky left-0 bg-white z-10 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#f6f8fa] border border-[#d0d7de] flex items-center justify-center text-xs font-semibold text-[#656d76] shrink-0">
                        {member.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-[#1f2328]">{member}</span>
                    </div>
                  </td>
                  {projects.map((project) => {
                    const cellItems = matrix[member][project];
                    if (cellItems.length === 0) {
                      return (
                        <td
                          key={project}
                          className="p-3 border-b border-r border-[#d0d7de] text-center align-middle"
                        >
                          <span className="text-sm text-[#d0d7de]">-</span>
                        </td>
                      );
                    }

                    const avgProgress = Math.round(
                      cellItems.reduce((sum, item) => sum + item.progressPercent, 0) / cellItems.length
                    );

                    return (
                      <td
                        key={project}
                        className="p-2 border-b border-r border-[#d0d7de] align-top"
                        style={{ backgroundColor: getProgressBgColor(avgProgress) }}
                      >
                        {renderExpandedCell(cellItems)}
                      </td>
                    );
                  })}
                  <td className="p-3 border-b border-[#d0d7de] text-center align-middle">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: getProgressColor(memberAvgProgress[member]) }}
                    >
                      {memberAvgProgress[member]}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="sticky bottom-0 z-20">
              <tr className="bg-[#f6f8fa]">
                <td className="p-3 border-r border-[#d0d7de] sticky left-0 bg-[#f6f8fa] z-30 text-center">
                  <span className="text-sm font-semibold text-[#656d76]">평균</span>
                </td>
                {projects.map((project) => (
                  <td key={project} className="p-3 border-r border-[#d0d7de] text-center">
                    <span
                      className="text-sm font-semibold"
                      style={{ color: getProgressColor(projectAvgProgress[project]) }}
                    >
                      {projectAvgProgress[project]}%
                    </span>
                  </td>
                ))}
                <td className="p-3 text-center">
                  <span
                    className="text-sm font-bold"
                    style={{
                      color: getProgressColor(
                        items.length > 0
                          ? Math.round(items.reduce((sum, item) => sum + item.progressPercent, 0) / items.length)
                          : 0
                      ),
                    }}
                  >
                    {items.length > 0
                      ? Math.round(items.reduce((sum, item) => sum + item.progressPercent, 0) / items.length)
                      : 0}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 범례 */}
      <div className="mt-3 flex items-center gap-4 text-xs text-[#656d76]">
        <span className="font-medium">진행률:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#dafbe1] border border-[#1a7f37]" />
          완료 (100%)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#ddf4ff] border border-[#0969da]" />
          70%+
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#fff8c5] border border-[#9a6700]" />
          40-70%
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-[#ffebe9] border border-[#cf222e]" />
          40% 미만
        </span>
      </div>
    </div>
  );
}

