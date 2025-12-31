"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/common/Icons";
import type { FeedItemData, TeamFeedEntry } from "@/types/teamFeed";

interface FeedItemProps {
  data: FeedItemData;
  searchQuery?: string;
}

/**
 * 텍스트에서 검색어를 강조 표시하는 함수
 */
function highlightText(text: string, query: string) {
  if (!query.trim()) return text;

  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={index} className="bg-[#fff8c5] text-[#24292f] px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

/**
 * 피드 아이템 컴포넌트 - GitHub Feed 스타일
 * - Person Header (간소화, 작성시간 표시)
 * - Hierarchy (모든 엔트리 태그)
 * - Progress, Next, Risk 섹션별로 묶어서 표시
 * - Expandable Details (상세 정보는 접기/펴기)
 * - 검색어 강조 표시
 */
export function FeedItem({ data, searchQuery = "" }: FeedItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 시간 포맷팅 함수 (예: "2 hours ago", "3 days ago")
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    // 7일 이상이면 날짜 표시
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  // Progress, Next, Risk 항목 수집
  const progressItems: Array<{ entry: TeamFeedEntry; content: string }> = [];
  const nextItems: Array<{ entry: TeamFeedEntry; content: string }> = [];
  const riskItems: Array<{ entry: TeamFeedEntry; content: string }> = [];

  data.entries.forEach((entry) => {
    // Progress (저번 주 계획했던 작업들 - 진행률 포함)
    if (entry.pastWeek.tasks && entry.pastWeek.tasks.length > 0) {
      entry.pastWeek.tasks.forEach((task) => {
        progressItems.push({
          entry,
          content: `${task.title}${task.progress > 0 ? ` (${task.progress}%)` : ""}`,
        });
      });
    }

    // Next (이번 주 새로 계획하는 작업들 - 진행률 없음)
    if (entry.thisWeek.tasks && entry.thisWeek.tasks.length > 0) {
      entry.thisWeek.tasks.forEach((task) => {
        nextItems.push({ entry, content: task });
      });
    }

    // Risk
    if (entry.risks.length > 0) {
      entry.risks.forEach((risk) => {
        riskItems.push({ entry, content: risk });
      });
    }
  });

  const progressCount = data.entries.filter(
    (e) => e.pastWeek.tasks && e.pastWeek.tasks.length > 0
  ).length;
  const nextCount = data.entries.filter(
    (e) => e.thisWeek.tasks && e.thisWeek.tasks.length > 0
  ).length;
  const riskCount = data.entries.filter((e) => e.risks.length > 0).length;

  return (
    <article 
      className="mb-3 p-4 bg-white border border-[#d0d7de] rounded-md hover:border-[#8c959f] transition-colors"
      data-feed-week={`${data.year}-${data.week}`}
    >
      {/* Person Header - 간소화 + 연도/주차 태그 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#0969da] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {data.personName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-[#24292f]">{data.personName}</h3>
            <span className="inline-flex items-center px-2 py-0.5 bg-[#ddf4ff] border border-[#0969da]/30 rounded-md text-xs font-medium text-[#0969da]">
              {data.year} {data.week}
            </span>
            <span className="text-xs text-[#57606a]">
              updated {data.entries.length} {data.entries.length > 1 ? "entries" : "entry"}
            </span>
            <span className="text-xs text-[#57606a]">·</span>
            <time className="text-xs text-[#57606a]">{formatTimeAgo(data.latestActivityDate)}</time>
          </div>
          {data.personRole && (
            <p className="text-xs text-[#57606a] mt-0.5">{data.personRole}</p>
          )}
        </div>
      </div>

      {/* Hierarchy - 모든 엔트리 태그 */}
      {data.entries.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {data.entries.map((entry) => (
              <span
                key={entry.id}
                className="inline-flex items-center px-2 py-1 bg-[#f6f8fa] border border-[#d0d7de] rounded-md text-xs text-[#57606a]"
              >
                {highlightText(`${entry.project} / ${entry.module} / ${entry.feature}`, searchQuery)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Progress Section */}
      {progressItems.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-[#24292f] mb-2">Progress</h4>
          <ul className="space-y-1.5">
            {progressItems.map((item, idx) => (
              <li key={idx} className="text-xs text-[#57606a] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                {highlightText(item.content, searchQuery)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next Section */}
      {nextItems.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-[#24292f] mb-2">Next</h4>
          <ul className="space-y-1.5">
            {nextItems.map((item, idx) => (
              <li key={idx} className="text-xs text-[#57606a] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                {highlightText(item.content, searchQuery)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Section */}
      {riskItems.length > 0 && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-[#24292f] mb-2">Risk</h4>
          <ul className="space-y-1.5">
            {riskItems.map((item, idx) => (
              <li key={idx} className="text-xs text-[#57606a] leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                {highlightText(item.content, searchQuery)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Show Details Button */}
      {data.entries.length > 0 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#57606a] hover:bg-[#f6f8fa] rounded-md transition-colors border border-[#d0d7de]"
        >
          <span>
            {isExpanded ? "숨기기" : "상세 보기"} · {data.entries.length} entries
          </span>
          <ChevronDownIcon
            size={14}
            className={`transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      {/* Expanded Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#d0d7de] space-y-3">
          {data.entries.map((entry) => (
            <div key={entry.id} className="p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md space-y-2">
              {/* Entry Header */}
              <div className="flex items-center gap-2 pb-2 border-b border-[#d0d7de]">
                <h4 className="text-xs font-semibold text-[#24292f]">{highlightText(entry.name, searchQuery)}</h4>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-[#d0d7de] text-[#57606a] rounded-md">
                  {highlightText(`${entry.project} / ${entry.module}`, searchQuery)}
                </span>
              </div>

              {/* Progress (저번 주 계획했던 작업들 - 진행률 포함) */}
              {entry.pastWeek.tasks && entry.pastWeek.tasks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#24292f] mb-1.5">
                    Progress
                  </p>
                  <ul className="space-y-1 text-[#57606a]">
                    {entry.pastWeek.tasks.map((task, idx) => (
                      <li key={idx} className="text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                        {highlightText(task.title, searchQuery)}
                        {task.progress > 0 && (
                          <span className="ml-1 text-[11px] text-[#8c959f]">
                            ({task.progress}%)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next (이번 주 새로 계획하는 작업들 - 진행률 없음) */}
              {entry.thisWeek.tasks && entry.thisWeek.tasks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#24292f] mb-1.5">Next</p>
                  <ul className="space-y-1 text-[#57606a]">
                    {entry.thisWeek.tasks.map((task, idx) => (
                      <li key={idx} className="text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                        {highlightText(task, searchQuery)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk */}
              {entry.risks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#24292f] mb-1.5">Risk</p>
                  <ul className="space-y-1 text-[#57606a]">
                    {entry.risks.map((risk, idx) => (
                      <li key={idx} className="text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                        {highlightText(risk, searchQuery)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Collaborators */}
              {entry.collaborators.length > 0 && (
                <div className="pt-2 border-t border-[#d0d7de] text-xs text-[#57606a]">
                  <span className="font-semibold">Collaborators:</span>{" "}
                  {entry.collaborators.map((c) => c.name).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
