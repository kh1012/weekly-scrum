/**
 * Feedback Kanban Card
 * 칸반 보드용 카드 컴포넌트 - 전체 내용 표시 및 액션 버튼 통합
 */

"use client";

import { useState } from "react";
import { LoadingButton } from "@/components/common/LoadingButton";
import { deleteFeedback } from "@/app/actions/feedback";
import type { FeedbackWithDetails, FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackKanbanCardProps {
  feedback: FeedbackWithDetails;
  color: string;
  isAdminOrLeader: boolean;
  currentUserId: string | null;
  isUpdating?: boolean;
  onStatusChange?: (newStatus: FeedbackStatus) => void;
  onEditClick: () => void;
  onDeleteSuccess: () => void;
}

export function FeedbackKanbanCard({
  feedback,
  color,
  isAdminOrLeader,
  currentUserId,
  isUpdating = false,
  onStatusChange,
  onEditClick,
  onDeleteSuccess,
}: FeedbackKanbanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1주일 이내 생성 여부 확인
  const isNew = () => {
    const now = Date.now();
    const created = new Date(feedback.created_at).getTime();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  // 처리 일시 포맷
  const resolvedAt = feedback.updated_at
    ? new Date(feedback.updated_at).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  // 처리 기간 계산 (생성일 ~ 업데이트일)
  const getResolutionDuration = () => {
    if (!feedback.updated_at) return null;
    const created = new Date(feedback.created_at).getTime();
    const resolved = new Date(feedback.updated_at).getTime();
    const diffMs = resolved - created;
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      const remainingHours = diffHours % 24;
      return remainingHours > 0 
        ? `${diffDays}일 ${remainingHours}시간` 
        : `${diffDays}일`;
    } else if (diffHours > 0) {
      const remainingMinutes = diffMinutes % 60;
      return remainingMinutes > 0 
        ? `${diffHours}시간 ${remainingMinutes}분` 
        : `${diffHours}시간`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}분`;
    } else {
      return "즉시";
    }
  };

  const resolutionDuration = getResolutionDuration();

  // 권한 체크
  const isOwner = currentUserId === feedback.author_user_id;
  const canEdit = isOwner;
  const canDelete = isOwner || isAdminOrLeader;

  // 삭제
  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteFeedback(feedback.id);
    setIsDeleting(false);

    if (result.success) {
      onDeleteSuccess();
    } else {
      alert(result.error || "삭제에 실패했습니다");
    }
  };

  // 상태별 액션 버튼
  const renderStatusActions = () => {
    if (!isAdminOrLeader) return null;

    switch (feedback.status) {
      case "open":
        return (
          <LoadingButton
            onClick={() => onStatusChange?.("in_progress")}
            isLoading={isUpdating}
            variant="primary"
            size="xs"
            icon={
              <svg
                className="w-2.5 h-2.5"
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
            }
            className="!rounded-md !font-medium"
          >
            진행
          </LoadingButton>
        );

      case "in_progress":
        return (
          <div className="flex items-center gap-1">
            <LoadingButton
              onClick={() => onStatusChange?.("open")}
              isLoading={isUpdating}
              variant="secondary"
              size="xs"
              icon={
                <svg
                  className="w-2.5 h-2.5"
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
              }
              className="!rounded-md !font-medium"
            >
              열기
            </LoadingButton>
            <LoadingButton
              onClick={() => onStatusChange?.("resolved")}
              isLoading={isUpdating}
              variant="success"
              size="xs"
              icon={
                <svg
                  className="w-2.5 h-2.5"
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
              }
              className="!rounded-md !font-medium"
            >
              완료
            </LoadingButton>
          </div>
        );

      case "resolved":
        return (
          <LoadingButton
            onClick={() => onStatusChange?.("in_progress")}
            isLoading={isUpdating}
            variant="secondary"
            size="xs"
            icon={
              <svg
                className="w-2.5 h-2.5"
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
            }
            className="!rounded-md !font-medium"
          >
            다시 열기
          </LoadingButton>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative rounded-xl p-4 bg-white border border-gray-200 shadow-sm">
      {/* New 태그 (1주일 이내) */}
      {isNew() && (
        <div className="absolute top-2 right-2 z-10">
          <span className="relative flex h-5 w-11">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400 opacity-75" />
            <span className="relative inline-flex items-center justify-center rounded-full h-5 w-11 bg-gradient-to-r from-rose-500 to-orange-500 text-[9px] font-bold text-white shadow-lg">
              NEW
            </span>
          </span>
        </div>
      )}

      {/* 헤더: 작성자 + 날짜 */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
            style={{ background: color }}
          >
            {feedback.author_name?.charAt(0) || "?"}
          </span>
          <div>
            <span className="text-sm font-medium text-gray-700">
              {feedback.author_name}
            </span>
            <span className="text-xs text-gray-400 ml-2">{createdAt}</span>
          </div>
        </div>

        {/* 수정/삭제 버튼 */}
        <div className="flex items-center gap-1">
          {canEdit && (
            <button
              onClick={onEditClick}
              className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title="수정"
            >
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
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="삭제"
            >
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
            </button>
          )}
        </div>
      </div>

      {/* 제목 */}
      {feedback.title && (
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {feedback.title}
        </h3>
      )}

      {/* 내용 전체 */}
      <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mb-4">
        {feedback.content}
      </div>

      {/* resolved 상태일 때 해결 내용 표시 */}
      {feedback.status === "resolved" && feedback.resolution_note && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-100">
          <div className="flex items-start gap-2">
            <svg
              className="w-4 h-4 text-green-600 mt-0.5 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-green-800 mb-1">해결 내용</p>
              <p className="text-sm text-green-700 whitespace-pre-wrap">
                {feedback.resolution_note}
              </p>
              {/* 처리자 및 처리 정보 */}
              <div className="mt-2 pt-2 border-t border-green-100 space-y-1">
                {feedback.resolved_by_name && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    처리자: {feedback.resolved_by_name}
                  </p>
                )}
                {resolvedAt && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    처리 일시: {resolvedAt}
                  </p>
                )}
                {resolutionDuration && (
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    처리 기간: {resolutionDuration}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 하단: 상태 액션 버튼 */}
      <div className="flex items-center justify-end pt-3 border-t border-gray-100">
        {renderStatusActions()}
      </div>

      {/* 삭제 확인 오버레이 */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="text-center px-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-red-600"
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
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              삭제하시겠습니까?
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              이 작업은 취소할 수 없습니다.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <LoadingButton
                onClick={handleDelete}
                isLoading={isDeleting}
                variant="danger"
                size="xs"
                className="!rounded-lg"
              >
                삭제
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
