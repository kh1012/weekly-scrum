/**
 * Feedback Status Badge
 * Airbnb 스타일의 상태 뱃지
 */

"use client";

import type { FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackStatusBadgeProps {
  status: FeedbackStatus;
}

const STATUS_CONFIG: Record<
  FeedbackStatus,
  { label: string; bgColor: string; textColor: string }
> = {
  open: {
    label: "Open",
    bgColor: "bg-blue-100",
    textColor: "text-blue-700",
  },
  in_progress: {
    label: "In Progress",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-700",
  },
  resolved: {
    label: "Resolved",
    bgColor: "bg-green-100",
    textColor: "text-green-700",
  },
};

export function FeedbackStatusBadge({ status }: FeedbackStatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}
    >
      {config.label}
    </span>
  );
}

