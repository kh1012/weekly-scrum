"use client";

import { useState } from "react";
import type { SnapshotMetaOption } from "@/lib/data/snapshotMetaOptions";

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "방금 전";
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  if (days < 30) return `${Math.floor(days / 7)}주 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

interface MetaOptionsTableProps {
  options: SnapshotMetaOption[];
  onEdit: (option: SnapshotMetaOption) => void;
  onDelete: (option: SnapshotMetaOption) => void;
  onToggleActive: (option: SnapshotMetaOption, isActive: boolean) => void;
}

export function MetaOptionsTable({
  options,
  onEdit,
  onDelete,
  onToggleActive,
}: MetaOptionsTableProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );

  const toggleDescription = (id: string) => {
    setExpandedDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  if (options.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">등록된 옵션이 없습니다</p>
        <p className="text-sm">새로운 옵션을 추가해보세요</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Value
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Label
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Description
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
              Order
            </th>
            <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">
              Active
            </th>
            <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
              Updated
            </th>
            <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((option) => {
            const isExpanded = expandedDescriptions.has(option.id);
            const hasDescription = option.description && option.description.length > 0;
            const shouldTruncate = hasDescription && option.description!.length > 50;

            return (
              <tr
                key={option.id}
                className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  !option.is_active ? "opacity-50" : ""
                }`}
              >
                {/* Value */}
                <td className="py-3 px-4">
                  <span className="font-mono text-sm font-medium text-gray-900">
                    {option.value}
                  </span>
                </td>

                {/* Label */}
                <td className="py-3 px-4">
                  <span className="text-sm text-gray-600">
                    {option.label || "-"}
                  </span>
                </td>

                {/* Description */}
                <td className="py-3 px-4 max-w-xs">
                  {hasDescription ? (
                    <div>
                      <p className="text-sm text-gray-600">
                        {shouldTruncate && !isExpanded
                          ? `${option.description!.slice(0, 50)}...`
                          : option.description}
                      </p>
                      {shouldTruncate && (
                        <button
                          onClick={() => toggleDescription(option.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                        >
                          {isExpanded ? "접기" : "더보기"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </td>

                {/* Order */}
                <td className="py-3 px-4 text-center">
                  <span className="text-sm text-gray-600">
                    {option.order_index}
                  </span>
                </td>

                {/* Active Toggle */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onToggleActive(option, !option.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      option.is_active ? "bg-blue-600" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        option.is_active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </td>

                {/* Updated */}
                <td className="py-3 px-4">
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(new Date(option.updated_at))}
                  </span>
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(option)}
                      className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      편집
                    </button>
                    <button
                      onClick={() => onDelete(option)}
                      className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

