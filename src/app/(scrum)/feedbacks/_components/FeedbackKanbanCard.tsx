/**
 * Feedback Kanban Card
 * 칸반 보드용 심플 카드 컴포넌트
 */

"use client";

import { SmallLoadingSpinner } from "@/components/common/LoadingButton";
import type { FeedbackWithDetails, FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackKanbanCardProps {
  feedback: FeedbackWithDetails;
  color: string;
  isAdminOrLeader: boolean;
  isUpdating?: boolean;
  onClick: () => void;
  onStatusChange?: (newStatus: FeedbackStatus) => void;
}

export function FeedbackKanbanCard({
  feedback,
  color,
  isAdminOrLeader,
  isUpdating = false,
  onClick,
  onStatusChange,
}: FeedbackKanbanCardProps) {
  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  // 상태 버튼 클릭
  const handleStatusClick = (
    e: React.MouseEvent,
    newStatus: FeedbackStatus
  ) => {
    e.stopPropagation();
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
  };

  // 상태별 버튼 렌더링
  const renderStatusButtons = () => {
    if (!isAdminOrLeader || isUpdating) {
      if (isUpdating) {
        return (
          <div className="absolute top-2 right-2">
            <SmallLoadingSpinner size="xs" />
          </div>
        );
      }
      return null;
    }

    switch (feedback.status) {
      case "open":
        // Open: 진행 버튼만
        return (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => handleStatusClick(e, "in_progress")}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-95"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
              </svg>
              진행
            </button>
          </div>
        );

      case "in_progress":
        // In Progress: 열기(좌) + 완료(우)
        return (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <button
              onClick={(e) => handleStatusClick(e, "open")}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
              title="Open으로 되돌리기"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              열기
            </button>
            <button
              onClick={(e) => handleStatusClick(e, "resolved")}
              className="flex items-center gap-0.5 px-1.5 py-1 rounded-md text-[10px] font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-all active:scale-95"
              title="해결 완료"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
              완료
            </button>
          </div>
        );

      case "resolved":
        // Resolved: 다시 열기 버튼
        return (
          <div className="absolute top-2 right-2">
            <button
              onClick={(e) => handleStatusClick(e, "in_progress")}
              className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              다시 열기
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] rounded-xl"
    >
      {/* 심플 카드 */}
      <div
        className="relative rounded-xl p-4 bg-white"
        style={{
          border: `1px solid ${color}50`,
          boxShadow: `0 1px 3px ${color}10`,
        }}
      >
        {/* 상태 버튼들 */}
        {renderStatusButtons()}

        {/* 콘텐츠 */}
        <div className="pl-3">
          {/* 제목 */}
          <h4 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 pr-20 group-hover:text-blue-600 transition-colors">
            {feedback.title || feedback.content.substring(0, 40) + "..."}
          </h4>

          {/* 내용 미리보기 */}
          {feedback.title && (
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">
              {feedback.content.substring(0, 60)}...
            </p>
          )}

          {/* 하단: 작성자 + 날짜 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                style={{ background: color }}
              >
                {feedback.author_name?.charAt(0) || "?"}
              </span>
              <span className="text-xs text-gray-600">
                {feedback.author_name}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">{createdAt}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
