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
}

/**
 * 날짜 포맷 (26.01.08 형식)
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const year = date.getFullYear().toString().slice(2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export function ChangeHistoryPopover({
  workspaceId,
  onFetchHistory,
}: ChangeHistoryPopoverProps) {
  const [groups, setGroups] = useState<ChangeHistoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
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
  }, [workspaceId, onFetchHistory]);

  if (isLoading) {
    return (
      <div className="w-96 p-4 flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>로딩 중...</span>
        </div>
      </div>
    );
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
    <div className="w-96 max-h-[32rem] overflow-y-auto">
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
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-gray-700">
            [{formatDate(group.date)}]
          </span>
          <span className="font-semibold text-gray-700">[{group.timeLabel}]</span>
          <span className="text-gray-500">changed by</span>
          <span className="font-semibold text-gray-900">
            {group.changedByName || group.changedBy}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          {group.totalCount}건의 변경사항
        </div>

        <div className="flex items-center gap-2">
          {group.createdCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-700">
              추가됨 ({group.createdCount})
            </span>
          )}
          {group.updatedCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-700">
              수정됨 ({group.updatedCount})
            </span>
          )}
        </div>

        {group.treeNodes.length > 0 && (
          <div className="pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <svg
                className={`w-3 h-3 transition-transform ${
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
              <span>변경된 항목</span>
            </button>

            {isExpanded && (
              <div className="mt-2 space-y-1 pl-4">
                {group.treeNodes.map((node, nodeIndex) => (
                  <div
                    key={nodeIndex}
                    className="flex items-center gap-2 text-xs text-gray-600"
                  >
                    <span className="text-gray-400">
                      {nodeIndex === group.treeNodes.length - 1 ? "└─" : "├─"}
                    </span>
                    <span className="flex-1 truncate">{node.path}</span>
                    <span className="text-gray-500 font-medium">
                      ({node.count})
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

