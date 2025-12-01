"use client";

import { useState } from "react";
import type { ScrumItem } from "@/types/scrum";
import { CircularProgress } from "./CircularProgress";
import { 
  getDomainColor, 
  getProgressBgColor,
  PROGRESS_COLORS,
  UI_COLORS 
} from "@/lib/colorDefines";

interface ProjectGroupViewProps {
  items: ScrumItem[];
}

interface ProjectTreeItemProps {
  project: string;
  items: ScrumItem[];
  defaultExpanded?: boolean;
}

function ProjectTreeItem({ project, items, defaultExpanded = false }: ProjectTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // 프로젝트 평균 진행률
  const avgProgress = Math.round(
    items.reduce((sum, item) => sum + item.progressPercent, 0) / items.length
  );

  // 완료된 항목 수
  const completedCount = items.filter((item) => item.progressPercent >= 100).length;

  // 도메인 목록 (고유값)
  const domains = Array.from(new Set(items.map((item) => item.domain))).sort();

  return (
    <div className="bg-white border border-[#d0d7de] rounded-md overflow-hidden">
      {/* 프로젝트 헤더 (클릭하여 펼치기/접기) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left relative hover:brightness-[0.98] transition-all"
        style={{
          background: `linear-gradient(to right, #e5e9ed ${avgProgress}%, #ffffff ${avgProgress}%)`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* 펼침/접힘 아이콘 */}
          <svg
            className={`w-4 h-4 text-[#656d76] transition-transform duration-200 ${
              isExpanded ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>

          <div>
            <h3 className="text-sm font-semibold text-[#1f2328]">{project}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {/* 도메인 배지들 */}
              {domains.map((domain) => {
                const color = getDomainColor(domain);
                return (
                  <span
                    key={domain}
                    className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold"
                    style={{ background: color.bg, color: color.text }}
                  >
                    {domain}
                  </span>
                );
              })}
              <span className="text-xs text-[#656d76]">
                {items.length}개 항목 · {completedCount}개 완료
              </span>
            </div>
          </div>
        </div>

        {/* 진행률 게이지 */}
        <div className="flex items-center gap-3">
          <CircularProgress percent={avgProgress} size={44} strokeWidth={5} />
        </div>
      </button>

      {/* 토픽 목록 (펼쳤을 때만 표시) */}
      {isExpanded && (
        <div className="border-t border-[#d0d7de] p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {items.map((item, index) => {
              const domainColor = getDomainColor(item.domain);
              const isCompleted = item.progressPercent >= 100;

              return (
                <div
                  key={`${item.topic}-${index}`}
                  className={`bg-[#f6f8fa] border border-[#d0d7de] rounded-md p-3 ${
                    isCompleted ? "opacity-60" : ""
                  }`}
                >
                  {/* 토픽 헤더 */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold shrink-0"
                          style={{ background: domainColor.bg, color: domainColor.text }}
                        >
                          {item.domain}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-[#1f2328] leading-tight">
                        {item.topic}
                      </h4>
                      <p className="text-[10px] text-[#656d76] mt-0.5">{item.name}</p>
                    </div>
                    <CircularProgress
                      percent={item.progressPercent}
                      size={36}
                      strokeWidth={4}
                      isCompleted={isCompleted}
                    />
                  </div>

                  {/* Progress / Risk / Next */}
                  <div className="space-y-1 text-[10px]">
                    <div className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[#0969da] mt-1 shrink-0" />
                      <span className="text-[#1f2328] line-clamp-2">{item.progress || "-"}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[#9a6700] mt-1 shrink-0" />
                      <span className="text-[#1f2328] line-clamp-2">{item.risk || "-"}</span>
                    </div>
                    <div className="flex items-start gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-[#1a7f37] mt-1 shrink-0" />
                      <span className="text-[#1f2328] line-clamp-2">{item.next || "-"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProjectGroupView({ items }: ProjectGroupViewProps) {
  // 프로젝트별로 그룹화
  const groupedByProject = items.reduce<Record<string, ScrumItem[]>>((acc, item) => {
    const key = item.project;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(item);
    return acc;
  }, {});

  // 프로젝트별 평균 진행률로 정렬 (낮은 순)
  const projects = Object.keys(groupedByProject).sort((a, b) => {
    const avgA =
      groupedByProject[a].reduce((sum, item) => sum + item.progressPercent, 0) /
      groupedByProject[a].length;
    const avgB =
      groupedByProject[b].reduce((sum, item) => sum + item.progressPercent, 0) /
      groupedByProject[b].length;
    return avgA - avgB;
  });

  if (projects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-md border border-[#d0d7de]">
        <p className="text-[#656d76]">데이터가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {projects.map((project) => (
        <ProjectTreeItem
          key={project}
          project={project}
          items={groupedByProject[project]}
          defaultExpanded={false}
        />
      ))}
    </div>
  );
}
