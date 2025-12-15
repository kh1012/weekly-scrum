"use client";

import Link from "next/link";
import { STATUS_CONFIG, TYPE_CONFIG, ROLE_LABELS } from "./types";
import type { PlanCardProps } from "./types";
import type { PlanStatus } from "@/lib/data/plans";

/**
 * Plan 카드 컴포넌트
 */
export function PlanCard({ plan, mode, onStatusChange }: PlanCardProps) {
  const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG["진행중"];
  const typeConfig = TYPE_CONFIG[plan.type] || TYPE_CONFIG.feature;

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
    });
  };

  // 담당자 표시 (role별로 그룹핑)
  const assigneesByRole = plan.assignees?.reduce(
    (acc, a) => {
      if (!acc[a.role]) acc[a.role] = [];
      const name = a.profiles?.display_name || a.profiles?.email || "?";
      acc[a.role].push(name);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const isAdmin = mode === "admin";

  const cardContent = (
    <div className="flex items-start gap-3">
      {/* 타입 아이콘 */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${typeConfig.color}15`, color: typeConfig.color }}
      >
        <span className="text-sm">{typeConfig.emoji}</span>
      </div>

      {/* 내용 */}
      <div className="flex-1 min-w-0">
        {/* 제목 & 상태 */}
        <div className="flex items-start justify-between gap-2">
          <h3
            className="font-medium truncate"
            style={{ color: "var(--notion-text)" }}
          >
            {plan.title}
          </h3>

          {/* 상태 뱃지 (admin 모드에서 클릭 가능) */}
          {isAdmin && onStatusChange ? (
            <select
              value={plan.status}
              onChange={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStatusChange(plan.id, e.target.value as PlanStatus);
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-xs px-2 py-0.5 rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                background: statusConfig.bg,
                color: statusConfig.color,
              }}
            >
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          ) : (
            <span
              className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0"
              style={{
                background: statusConfig.bg,
                color: statusConfig.color,
              }}
            >
              {statusConfig.label}
            </span>
          )}
        </div>

        {/* feature type 정보 */}
        {plan.type === "feature" && (
          <div
            className="flex flex-wrap gap-1 mt-1.5"
            style={{ color: "var(--notion-text-muted)" }}
          >
            {plan.domain && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100">
                {plan.domain}
              </span>
            )}
            {plan.project && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100">
                {plan.project}
              </span>
            )}
            {plan.module && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                {plan.module}
              </span>
            )}
            {plan.feature && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-600">
                {plan.feature}
              </span>
            )}
          </div>
        )}

        {/* 단계 */}
        {plan.stage && (
          <div
            className="text-xs mt-1.5"
            style={{ color: "var(--notion-text-muted)" }}
          >
            단계: {plan.stage}
          </div>
        )}

        {/* 날짜 & 담당자 */}
        <div
          className="flex flex-wrap items-center gap-3 mt-2 text-xs"
          style={{ color: "var(--notion-text-muted)" }}
        >
          {/* 날짜 */}
          <span className="flex items-center gap-1">
            📅 {formatDate(plan.start_date)} ~ {formatDate(plan.end_date)}
          </span>

          {/* 담당자 */}
          {assigneesByRole && Object.keys(assigneesByRole).length > 0 && (
            <span className="flex items-center gap-1">
              👥
              {Object.entries(assigneesByRole).map(([role, names]) => (
                <span key={role} className="flex items-center gap-0.5">
                  <span
                    className="px-1 py-0.5 rounded text-[10px]"
                    style={{
                      background: `${ROLE_LABELS[role]?.color}15`,
                      color: ROLE_LABELS[role]?.color,
                    }}
                  >
                    {ROLE_LABELS[role]?.label}
                  </span>
                  <span>{names.join(", ")}</span>
                </span>
              ))}
            </span>
          )}
        </div>
      </div>

      {/* 화살표 (admin 모드) */}
      {isAdmin && (
        <svg
          className="w-5 h-5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      )}
    </div>
  );

  const cardClassName = "block p-4 rounded-xl transition-all duration-200 group hover:shadow-md";
  const cardStyle = {
    background: "var(--notion-bg-elevated)",
    border: "1px solid var(--notion-border)",
  };

  if (isAdmin) {
    return (
      <Link
        href={`/admin/plans/${plan.id}`}
        className={cardClassName}
        style={cardStyle}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={cardClassName} style={cardStyle}>
      {cardContent}
    </div>
  );
}
