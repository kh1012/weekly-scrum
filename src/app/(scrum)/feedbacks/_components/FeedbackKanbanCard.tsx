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
  onToggleStatus?: (newStatus: FeedbackStatus) => void;
}

export function FeedbackKanbanCard({
  feedback,
  color,
  isAdminOrLeader,
  isUpdating = false,
  onClick,
  onToggleStatus,
}: FeedbackKanbanCardProps) {
  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  // 상태 토글 버튼 클릭
  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStatus) {
      const newStatus: FeedbackStatus = feedback.status === "open" ? "in_progress" : "open";
      onToggleStatus(newStatus);
    }
  };

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
    >
      {/* 심플 카드 */}
      <div
        className="relative rounded-xl p-4 bg-white"
        style={{
          border: `1px solid ${color}25`,
          boxShadow: `0 1px 3px ${color}10`,
        }}
      >
        {/* 좌측 컬러 바 */}
        <div
          className="absolute left-0 top-3 bottom-3 w-1 rounded-full"
          style={{ background: color }}
        />

        {/* 상단: 진행하기/다시열기 토글 버튼 (admin/leader만, resolved 제외) */}
        {isAdminOrLeader && feedback.status !== "resolved" && (
          <div className="absolute top-2 right-2">
            <button
              onClick={handleToggleClick}
              disabled={isUpdating}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all active:scale-95 disabled:opacity-50 ${
                feedback.status === "open"
                  ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {isUpdating ? (
                <SmallLoadingSpinner size="xs" />
              ) : feedback.status === "open" ? (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                  진행
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  열기
                </>
              )}
            </button>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className="pl-3">
          {/* 제목 */}
          <h4 className="text-sm font-semibold text-gray-900 mb-1.5 line-clamp-2 pr-16 group-hover:text-blue-600 transition-colors">
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

          {/* 릴리즈 버전 (resolved인 경우) */}
          {feedback.status === "resolved" && feedback.release_version && (
            <div className="mt-2.5 pt-2.5 border-t border-gray-100">
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium"
                style={{
                  background: `${color}10`,
                  color: color,
                }}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                {feedback.release_version}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
