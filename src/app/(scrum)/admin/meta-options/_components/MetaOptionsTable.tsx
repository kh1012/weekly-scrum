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
  isLoading: boolean;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[#d0d7de] animate-pulse">
      <td className="py-3 px-4">
        <div className="h-4 bg-[#f6f8fa] rounded w-24"></div>
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-[#f6f8fa] rounded w-32"></div>
      </td>
      <td className="py-3 px-4">
        <div className="h-4 bg-[#f6f8fa] rounded w-48"></div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="h-4 bg-[#f6f8fa] rounded w-8 mx-auto"></div>
      </td>
      <td className="py-3 px-4 text-center">
        <div className="h-6 bg-[#f6f8fa] rounded-full w-11 mx-auto"></div>
      </td>
      <td className="py-3 px-4">
        <div className="h-3 bg-[#f6f8fa] rounded w-16"></div>
      </td>
      <td className="py-3 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="h-8 bg-[#f6f8fa] rounded-md w-16"></div>
          <div className="h-8 bg-[#f6f8fa] rounded-md w-16"></div>
        </div>
      </td>
    </tr>
  );
}

export function MetaOptionsTable({
  options,
  onEdit,
  onDelete,
  onToggleActive,
  isLoading,
}: MetaOptionsTableProps) {
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(
    new Set()
  );
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

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

  const handleToggleActive = async (
    option: SnapshotMetaOption,
    isActive: boolean
  ) => {
    setProcessingIds((prev) => new Set(prev).add(option.id));
    await onToggleActive(option, isActive);
    setProcessingIds((prev) => {
      const next = new Set(prev);
      next.delete(option.id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#d0d7de] bg-[#f6f8fa]">
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                Value
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                Label
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                Description
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                Order
              </th>
              <th className="text-center py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                Active
              </th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                Updated
              </th>
              <th className="text-right py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div className="text-center py-16 text-[#57606a]">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#f6f8fa] flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#8c959f]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#24292f] mb-1">등록된 옵션이 없습니다</p>
        <p className="text-sm">새로운 옵션을 추가해보세요</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[#d0d7de] bg-[#f6f8fa]">
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
              Value
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
              Label
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
              Description
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
              Order
            </th>
            <th className="text-center py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
              Active
            </th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
              Updated
            </th>
            <th className="text-right py-3 px-4 text-xs font-semibold text-[#57606a] uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {options.map((option, index) => {
            const isProcessing = processingIds.has(option.id);
            const isExpanded = expandedDescriptions.has(option.id);
            const hasDescription = option.description && option.description.length > 0;
            const shouldTruncate = hasDescription && option.description!.length > 50;

            return (
              <tr
                key={option.id}
                className={`border-b border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors ${
                  !option.is_active ? "opacity-50" : ""
                } ${isProcessing ? "animate-pulse" : ""}`}
              >
                {/* Value */}
                <td className="py-3 px-4">
                  <span className="font-mono text-sm font-medium text-[#24292f]">
                    {option.value}
                  </span>
                </td>

                {/* Label */}
                <td className="py-3 px-4">
                  <span className="text-sm text-[#57606a]">
                    {option.label || "-"}
                  </span>
                </td>

                {/* Description */}
                <td className="py-3 px-4 max-w-xs">
                  {hasDescription ? (
                    <div>
                      <p className="text-sm text-[#57606a]">
                        {shouldTruncate && !isExpanded
                          ? `${option.description!.slice(0, 50)}...`
                          : option.description}
                      </p>
                      {shouldTruncate && (
                        <button
                          onClick={() => toggleDescription(option.id)}
                          className="text-xs text-[#0969da] hover:text-[#0860ca] mt-1"
                        >
                          {isExpanded ? "접기" : "더보기"}
                        </button>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-[#8c959f]">-</span>
                  )}
                </td>

                {/* Order */}
                <td className="py-3 px-4 text-center">
                  <span className="text-sm text-[#57606a]">
                    {option.order_index}
                  </span>
                </td>

                {/* Active Toggle - GitHub 스타일 */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleToggleActive(option, !option.is_active)}
                    disabled={isProcessing}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      option.is_active
                        ? "bg-[#0969da]"
                        : "bg-[#d0d7de]"
                    } ${isProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  <span className="text-xs text-[#57606a]">
                    {formatRelativeTime(new Date(option.updated_at))}
                  </span>
                </td>

                {/* Actions - GitHub 스타일 */}
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(option)}
                      className="px-3 py-1.5 text-sm font-medium text-[#0969da] hover:bg-[#ddf4ff] rounded-md transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        편집
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(option)}
                      className="px-3 py-1.5 text-sm font-medium text-[#cf222e] hover:bg-[#ffebe9] rounded-md transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        삭제
                      </span>
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

