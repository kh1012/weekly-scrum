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
    <article className="py-4 border-b border-[#d0d7de] last:border-0">
      {/* Person Header - GitHub 스타일 */}
      <div className="flex items-start gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-[#0969da] flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
          {data.personName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#24292f]">{data.personName}</h3>
          {data.personRole && (
            <p className="text-xs text-[#57606a] mt-0.5">{data.personRole}</p>
          )}
        </div>
      </div>

      {/* Weekly Highlight Preview (3줄 고정) - GitHub 스타일 */}
      <div className="space-y-2 mb-3 pl-11">
        <div className="text-xs text-[#57606a] leading-relaxed">
          {data.highlight.progress ? (
            <p>
              <span className="font-semibold text-[#24292f]">Progress:</span>{" "}
              {data.highlight.progress}
            </p>
          ) : (
            <p className="text-[#8c959f]">
              <span className="font-semibold">Progress:</span> 없음
            </p>
          )}
        </div>
        <div className="text-xs text-[#57606a] leading-relaxed">
          {data.highlight.next ? (
            <p>
              <span className="font-semibold text-[#24292f]">Next:</span>{" "}
              {data.highlight.next}
            </p>
          ) : (
            <p className="text-[#8c959f]">
              <span className="font-semibold">Next:</span> 없음
            </p>
          )}
        </div>
        <div className="text-xs text-[#57606a] leading-relaxed">
          <p>
            <span className="font-semibold text-[#24292f]">Risk:</span>{" "}
            {data.highlight.risk}
          </p>
        </div>
      </div>

      {/* Snapshot Entry Drawer - GitHub 스타일 */}
      <div className="pl-11">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-xs text-[#57606a] hover:text-[#0969da] transition-colors"
        >
          <span className="font-medium">
            Entries · Progress {progressCount} · Next {nextCount} · Risk {riskCount}
          </span>
          <ChevronDownIcon
            size={14}
            className={`transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExpanded && (
          <div className="mt-4 space-y-4 border-l-2 border-[#d0d7de] pl-3">
            {data.entries.map((entry) => (
              <div key={entry.id} className="space-y-2">
                {/* Entry Header */}
                <div className="flex items-baseline gap-2">
                  <h4 className="text-xs font-semibold text-[#24292f]">{entry.name}</h4>
                  <span className="text-[11px] text-[#57606a]">
                    {entry.domain} / {entry.project}
                  </span>
                </div>

                {/* Progress (This Week) */}
                {entry.thisWeek.tasks && entry.thisWeek.tasks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#24292f] mb-1">
                      Progress
                    </p>
                    <ul className="space-y-0.5 text-[#57606a]">
                      {entry.thisWeek.tasks.map((task, idx) => (
                        <li key={idx} className="text-xs leading-relaxed">
                          • {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next (Past Week) */}
                {entry.pastWeek.tasks && entry.pastWeek.tasks.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-[#24292f] mb-1">Next</p>
                    <ul className="space-y-0.5 text-[#57606a]">
                      {entry.pastWeek.tasks.map((task, idx) => (
                        <li key={idx} className="text-xs leading-relaxed">
                          • {task.title}
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
                    <p className="text-[11px] font-semibold text-[#24292f] mb-1">Risk</p>
                    <ul className="space-y-0.5 text-[#57606a]">
                      {entry.risks.map((risk, idx) => (
                        <li key={idx} className="text-xs leading-relaxed">
                          • {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collaborators */}
                {entry.collaborators.length > 0 && (
                  <div className="text-xs text-[#57606a]">
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

