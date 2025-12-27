"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/common/Icons";
import type { FeedItemData } from "@/types/teamFeed";

interface FeedItemProps {
  data: FeedItemData;
}

/**
 * 피드 아이템 컴포넌트 - GitHub Feed 스타일
 * - Person Header (간소화, 작성시간 표시)
 * - All Entries List (한눈에 모든 활동 보기)
 * - Expandable Details (상세 정보는 접기/펴기)
 */
export function FeedItem({ data }: FeedItemProps) {
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

  // 모든 엔트리의 모든 활동을 리스트로 변환
  const allActivities = data.entries.flatMap((entry) => {
    const activities: Array<{
      type: "progress" | "next" | "risk";
      entry: typeof entry;
      content: string;
    }> = [];
    
    // Progress 활동
    if (entry.thisWeek.tasks && entry.thisWeek.tasks.length > 0) {
      entry.thisWeek.tasks.forEach((task) => {
        activities.push({
          type: "progress" as const,
          entry,
          content: task,
        });
      });
    }

    // Next 활동
    if (entry.pastWeek.tasks && entry.pastWeek.tasks.length > 0) {
      entry.pastWeek.tasks.forEach((task) => {
        activities.push({
          type: "next" as const,
          entry,
          content: `${task.title}${task.progress > 0 ? ` (${task.progress}%)` : ""}`,
        });
      });
    }

    // Risk 활동
    if (entry.risks.length > 0) {
      entry.risks.forEach((risk) => {
        activities.push({
          type: "risk" as const,
          entry,
          content: risk,
        });
      });
    }

    return activities;
  });

  const progressCount = data.entries.filter(
    (e) => e.thisWeek.tasks && e.thisWeek.tasks.length > 0
  ).length;
  const nextCount = data.entries.filter(
    (e) => e.pastWeek.tasks && e.pastWeek.tasks.length > 0
  ).length;
  const riskCount = data.entries.filter((e) => e.risks.length > 0).length;

  return (
    <article className="mb-3 p-4 bg-white border border-[#d0d7de] rounded-md hover:border-[#8c959f] transition-colors">
      {/* Person Header - 간소화 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#0969da] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {data.personName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="text-sm font-semibold text-[#24292f]">{data.personName}</h3>
            <span className="text-xs text-[#57606a]">
              updated {data.entries.length} snapshot{data.entries.length > 1 ? "s" : ""}
            </span>
            <span className="text-xs text-[#57606a]">·</span>
            <time className="text-xs text-[#57606a]">{formatTimeAgo(data.latestActivityDate)}</time>
          </div>
          {data.personRole && (
            <p className="text-xs text-[#57606a] mt-0.5">{data.personRole}</p>
          )}
        </div>
      </div>

      {/* All Activities List - 한눈에 보기 */}
      {allActivities.length > 0 && (
        <div className="space-y-2 mb-3">
          {allActivities.map((activity, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm">
              {/* Type Badge */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium shrink-0 ${
                  activity.type === "progress"
                    ? "bg-[#ddf4ff] text-[#0969da]"
                    : activity.type === "next"
                    ? "bg-[#f6f8fa] text-[#57606a] border border-[#d0d7de]"
                    : "bg-[#fff8c5] text-[#9a6700] border border-[#d4a72c]/20"
                }`}
              >
                {activity.type === "progress"
                  ? "Progress"
                  : activity.type === "next"
                  ? "Next"
                  : "Risk"}
              </span>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#24292f] leading-relaxed">
                  <span className="font-medium text-[#57606a]">
                    {activity.entry.project} / {activity.entry.module} / {activity.entry.feature}
                  </span>
                  {" · "}
                  <span>{activity.content}</span>
                </p>
              </div>
            </div>
          ))}
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
                <h4 className="text-xs font-semibold text-[#24292f]">{entry.name}</h4>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-[#d0d7de] text-[#57606a] rounded-md">
                  {entry.project} / {entry.module}
                </span>
              </div>

              {/* Progress (This Week) */}
              {entry.thisWeek.tasks && entry.thisWeek.tasks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#24292f] mb-1.5">
                    Progress
                  </p>
                  <ul className="space-y-1 text-[#57606a]">
                    {entry.thisWeek.tasks.map((task, idx) => (
                      <li key={idx} className="text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next (Past Week) */}
              {entry.pastWeek.tasks && entry.pastWeek.tasks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#24292f] mb-1.5">Next</p>
                  <ul className="space-y-1 text-[#57606a]">
                    {entry.pastWeek.tasks.map((task, idx) => (
                      <li key={idx} className="text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                        {task.title}
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

              {/* Risk */}
              {entry.risks.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-[#24292f] mb-1.5">Risk</p>
                  <ul className="space-y-1 text-[#57606a]">
                    {entry.risks.map((risk, idx) => (
                      <li key={idx} className="text-xs leading-relaxed pl-3 relative before:content-['•'] before:absolute before:left-0">
                        {risk}
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
