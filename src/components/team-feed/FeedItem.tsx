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
    (e) => e.thisWeek.tasks.length > 0
  ).length;
  const nextCount = data.entries.filter((e) => e.pastWeek.tasks.length > 0).length;
  const riskCount = data.entries.filter((e) => e.risks.length > 0).length;

  return (
    <article className="py-8 border-b border-gray-100 last:border-0">
      {/* Person Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg flex-shrink-0">
          {data.personName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-semibold text-gray-900">{data.personName}</h3>
          {data.personRole && (
            <p className="text-sm text-gray-500 mt-0.5">{data.personRole}</p>
          )}
        </div>
      </div>

      {/* Weekly Highlight Preview (3줄 고정) */}
      <div className="space-y-3 mb-6 pl-16">
        <div className="text-gray-700 leading-relaxed">
          {data.highlight.progress ? (
            <p>
              <span className="font-medium text-gray-900">Progress:</span>{" "}
              {data.highlight.progress}
            </p>
          ) : (
            <p className="text-gray-400">
              <span className="font-medium">Progress:</span> 없음
            </p>
          )}
        </div>
        <div className="text-gray-700 leading-relaxed">
          {data.highlight.next ? (
            <p>
              <span className="font-medium text-gray-900">Next:</span>{" "}
              {data.highlight.next}
            </p>
          ) : (
            <p className="text-gray-400">
              <span className="font-medium">Next:</span> 없음
            </p>
          )}
        </div>
        <div className="text-gray-700 leading-relaxed">
          <p>
            <span className="font-medium text-gray-900">Risk:</span>{" "}
            {data.highlight.risk}
          </p>
        </div>
      </div>

      {/* Snapshot Entry Drawer */}
      <div className="pl-16">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <span className="font-medium">
            Entries · Progress {progressCount} · Next {nextCount} · Risk {riskCount}
          </span>
          <ChevronDownIcon
            size={16}
            className={`transition-transform ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {isExpanded && (
          <div className="mt-6 space-y-8">
            {data.entries.map((entry) => (
              <div key={entry.id} className="space-y-4">
                {/* Entry Header */}
                <div className="flex items-baseline gap-2">
                  <h4 className="font-semibold text-gray-900">{entry.name}</h4>
                  <span className="text-sm text-gray-500">
                    {entry.domain} / {entry.project}
                  </span>
                </div>

                {/* Progress (This Week) */}
                {entry.thisWeek.tasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Progress
                    </p>
                    <ul className="space-y-1 text-gray-600">
                      {entry.thisWeek.tasks.map((task, idx) => (
                        <li key={idx} className="text-sm leading-relaxed">
                          • {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Next (Past Week) */}
                {entry.pastWeek.tasks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Next</p>
                    <ul className="space-y-1 text-gray-600">
                      {entry.pastWeek.tasks.map((task, idx) => (
                        <li key={idx} className="text-sm leading-relaxed">
                          • {task}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risk */}
                {entry.risks.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Risk</p>
                    <ul className="space-y-1 text-gray-600">
                      {entry.risks.map((risk, idx) => (
                        <li key={idx} className="text-sm leading-relaxed">
                          • {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Collaborators */}
                {entry.collaborators.length > 0 && (
                  <div className="text-sm text-gray-500">
                    <span className="font-medium">Collaborators:</span>{" "}
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

