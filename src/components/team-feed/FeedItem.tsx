"use client";

import { useState } from "react";
import { ChevronDownIcon } from "@/components/common/Icons";
import type { FeedItemData } from "@/types/teamFeed";

interface FeedItemProps {
  data: FeedItemData;
}

/**
 * 피드 아이템 컴포넌트
 * - Person Header
 * - Weekly Highlight Preview (3줄 고정)
 * - Snapshot Entry Drawer (접을 수 있음)
 */
export function FeedItem({ data }: FeedItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const progressCount = data.entries.filter(
    (e) => e.thisWeek.tasks && e.thisWeek.tasks.length > 0
  ).length;
  const nextCount = data.entries.filter(
    (e) => e.pastWeek.tasks && e.pastWeek.tasks.length > 0
  ).length;
  const riskCount = data.entries.filter((e) => e.risks.length > 0).length;

  return (
    <article className="mb-4 border border-[#d0d7de] rounded-md bg-white hover:border-[#0969da]/50 transition-colors">
      {/* Person Header - GitHub 카드 스타일 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#d0d7de] bg-[#f6f8fa]">
        <div className="w-8 h-8 rounded-full bg-[#0969da] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {data.personName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#24292f]">{data.personName}</h3>
            {data.personRole && (
              <span className="text-xs text-[#57606a]">· {data.personRole}</span>
            )}
          </div>
          <p className="text-xs text-[#57606a] mt-0.5">
            updated snapshots for {data.year} {data.week}
          </p>
        </div>
      </div>

      {/* Weekly Highlight - GitHub 카드 컨텐츠 스타일 */}
      <div className="p-4 space-y-3">
        {data.highlight.progress && (
          <div className="p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md">
            <p className="text-xs font-semibold text-[#24292f] mb-1.5">Progress</p>
            <p className="text-xs text-[#57606a] leading-relaxed">
              {data.highlight.progress}
            </p>
          </div>
        )}

        {data.highlight.next && (
          <div className="p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md">
            <p className="text-xs font-semibold text-[#24292f] mb-1.5">Next</p>
            <p className="text-xs text-[#57606a] leading-relaxed">
              {data.highlight.next}
            </p>
          </div>
        )}

        {data.highlight.risk && (
          <div className="p-3 bg-[#fff8c5] border border-[#d4a72c]/20 rounded-md">
            <p className="text-xs font-semibold text-[#24292f] mb-1.5">Risk</p>
            <p className="text-xs text-[#57606a] leading-relaxed">
              {data.highlight.risk}
            </p>
          </div>
        )}
      </div>

      {/* Snapshot Entry Drawer - GitHub 스타일 */}
      <div className="px-4 pb-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-3 py-2 text-xs text-[#57606a] hover:bg-[#f6f8fa] rounded-md transition-colors border border-[#d0d7de]"
        >
          <span className="font-medium">
            {data.entries.length} entries · Progress {progressCount} · Next {nextCount} · Risk {riskCount}
          </span>
          <ChevronDownIcon
            size={14}
            className={`transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-3">
            {data.entries.map((entry) => (
              <div key={entry.id} className="p-3 bg-[#f6f8fa] border border-[#d0d7de] rounded-md space-y-2">
                {/* Entry Header */}
                <div className="flex items-center gap-2 pb-2 border-b border-[#d0d7de]">
                  <h4 className="text-xs font-semibold text-[#24292f]">{entry.name}</h4>
                  <span className="text-[10px] px-2 py-0.5 bg-white border border-[#d0d7de] text-[#57606a] rounded-md">
                    {entry.domain} / {entry.project}
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
      </div>
    </article>
  );
}

