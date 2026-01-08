/**
 * Change History Popover
 * Plans 변경 이력을 시간대별로 보여주는 팝오버
 * GitHub 스타일의 컴팩트한 UI
 */

"use client";

import { useEffect, useState } from "react";
import type {
  ChangeHistoryGroup,
  ChangeHistoryResponse,
} from "@/lib/data/planChangeHistory";

interface ChangeHistoryPopoverProps {
  workspaceId: string;
  onFetchHistory: (
    workspaceId: string
  ) => Promise<ChangeHistoryResponse>;
  isInitialLoad?: boolean;
}

/**
 * 상대 시간 포맷 (몇분전, 몇시간전, 몇일전)
 */
function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const target = new Date(dateStr);
  const diffMs = now.getTime() - target.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}분전`;
  } else if (diffHours < 24) {
    return `${diffHours}시간전`;
  } else {
    return `${diffDays}일전`;
  }
}

function SkeletonLoader() {
  return (
    <div className="w-[420px] max-h-[480px]">
      <div className="divide-y divide-gray-100">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="px-4 py-3">
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-3 bg-gray-200 rounded w-16 animate-pulse" />
              </div>
              <div className="h-3 bg-gray-200 rounded w-40 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChangeHistoryPopover({
  workspaceId,
  onFetchHistory,
  isInitialLoad = false,
}: ChangeHistoryPopoverProps) {
  const [groups, setGroups] = useState<ChangeHistoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      if (!isInitialLoad) {
        setIsLoading(true);
      }
      setError(null);
      try {
        const result = await onFetchHistory(workspaceId);
        if (result.success) {
          setGroups(result.groups);
        } else {
          setError(result.error || "데이터를 불러올 수 없습니다.");
        }
      } catch (err) {
        setError("데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchHistory();
  }, [workspaceId, onFetchHistory, isInitialLoad]);

  if (isLoading) {
    return <SkeletonLoader />;
  }

  if (error) {
    return (
      <div className="w-96 p-4">
        <div className="text-sm text-red-600 text-center">{error}</div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="w-96 p-4">
        <div className="text-sm text-gray-500 text-center">
          최근 1주일간 변경 이력이 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="w-[420px] max-h-[480px] overflow-y-auto">
      <div className="divide-y divide-gray-100">
        {groups.map((group, groupIndex) => (
          <ChangeHistoryGroupItem key={groupIndex} group={group} />
        ))}
      </div>
    </div>
  );
}

/**
 * 개별 그룹 아이템
 */
function ChangeHistoryGroupItem({ group }: { group: ChangeHistoryGroup }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const buildChangesSummary = () => {
    const parts = [];
    if (group.createdCount > 0) parts.push(`added ${group.createdCount}`);
    if (group.updatedCount > 0) parts.push(`modified ${group.updatedCount}`);
    return `${group.totalCount} change${group.totalCount !== 1 ? "s" : ""}, ${parts.join(", ")}`;
  };

  return (
    <div className="px-4 py-3 hover:bg-gray-50/50 transition-colors">
      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="font-semibold text-gray-900 text-sm">
            {group.changedByName || group.changedBy}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatRelativeTime(`${group.date}T${group.hour.toString().padStart(2, "0")}:00:00Z`)}
          </span>
        </div>

        <div className="text-xs text-gray-600">
          {buildChangesSummary()}
        </div>

        {group.treeNodes.length > 0 && (
          <div className="pt-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors group"
            >
              <svg
                className={`w-3.5 h-3.5 transition-transform ${
                  isExpanded ? "rotate-90" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              <span className="group-hover:underline">
                {isExpanded ? "Hide" : "Show"} changed items
              </span>
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-1 pl-1 border-l-2 border-gray-200">
                {group.treeNodes.map((node, nodeIndex) => (
                  <div
                    key={nodeIndex}
                    className="flex items-center gap-2 text-xs text-gray-700 pl-3 py-1 hover:bg-gray-100/50 rounded transition-colors"
                  >
                    <svg className="w-3 h-3 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="flex-1 truncate font-mono text-[11px]">
                      {node.path}
                    </span>
                    <span className="text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                      {node.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

