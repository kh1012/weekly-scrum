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
  isAdminOrManager: boolean;
  currentUserId: string | null;
  isUpdating?: boolean;
  onStatusChange?: (newStatus: FeedbackStatus) => void;
  onEditClick: () => void;
  onDeleteSuccess: () => void;
}

export function FeedbackKanbanCard({
  feedback,
  color,
  isAdminOrManager,
  currentUserId,
  isUpdating = false,
  onStatusChange,
  onEditClick,
  onDeleteSuccess,
}: FeedbackKanbanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 날짜 축약 포맷: 25.12.19 PM07:06
  const formatCreatedAt = () => {
    const date = new Date(feedback.created_at);
    const year = String(date.getFullYear()).slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = String(hours % 12 || 12).padStart(2, '0');
    
    return `${year}.${month}.${day} ${ampm}${hour12}:${minutes}`;
  };

  const createdAt = formatCreatedAt();

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
  const canDelete = isOwner || isAdminOrManager;

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

  // 상태별 액션 버튼 - GitHub 스타일
  const renderStatusActions = () => {
    if (!isAdminOrManager) return null;

    switch (feedback.status) {
      case "open":
        return (
          <LoadingButton
            onClick={() => onStatusChange?.("in_progress")}
            isLoading={isUpdating}
            variant="secondary"
            size="xs"
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
                  className="w-3.5 h-3.5"
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
                  className="w-3.5 h-3.5"
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
                className="w-3.5 h-3.5"
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
          >
            다시 열기
          </LoadingButton>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative bg-white border border-[#d0d7de] hover:border-[#0969da] transition-colors rounded-md overflow-hidden">
      {/* 로딩 오버레이 */}
      {isUpdating && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-20 rounded-md">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-8 h-8 text-[#0969da] animate-spin"
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
            <span className="text-xs text-[#57606a] font-medium">처리 중...</span>
          </div>
        </div>
      )}
      
      {/* 헤더: 작성자 + 날짜 - GitHub 스타일 */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#d0d7de] bg-[#f6f8fa] rounded-t-md">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold text-white shrink-0"
            style={{ background: color }}
          >
            {feedback.author_name?.charAt(0) || "?"}
          </span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-medium text-[#24292f] truncate">
              {feedback.author_name}
            </span>
            <span className="text-[11px] text-[#57606a] shrink-0">{createdAt}</span>
            {/* 1주일 이내 N 뱃지 */}
            {isNew() && (
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#cf222e] text-[8px] font-bold text-white shrink-0">
                N
              </span>
            )}
          </div>
        </div>

        {/* 수정/삭제 버튼 */}
        <div className="flex items-center gap-0.5 shrink-0">
          {canEdit && (
            <button
              onClick={onEditClick}
              className="p-1 text-[#57606a] hover:text-[#0969da] hover:bg-white transition-colors"
              title="수정"
            >
              <svg
                className="w-3.5 h-3.5"
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
              className="p-1 text-[#57606a] hover:text-[#cf222e] hover:bg-white transition-colors"
              title="삭제"
            >
              <svg
                className="w-3.5 h-3.5"
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

      {/* 본문 */}
      <div className="px-3 py-2">
        {/* 제목 */}
        {feedback.title && (
          <h3 className="text-sm font-semibold text-[#24292f] mb-1.5">
            {feedback.title}
          </h3>
        )}

        {/* 내용 전체 */}
        <div className="text-xs text-[#57606a] whitespace-pre-wrap leading-relaxed">
          {feedback.content}
        </div>
      </div>


      {/* resolved 상태일 때 해결 내용 표시 - GitHub 스타일 */}
      {feedback.status === "resolved" && feedback.resolution_note && (
        <div className="px-3 pb-2">
          <div className="p-2 bg-[#dafbe1] border border-[#1f883d]/20 rounded-md">
            <div className="flex items-start gap-2">
              <svg
                className="w-3.5 h-3.5 text-[#1f883d] mt-0.5 shrink-0"
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
                <p className="text-[11px] font-semibold text-[#1f883d] mb-1">해결 내용</p>
                <p className="text-xs text-[#24292f] whitespace-pre-wrap">
                  {feedback.resolution_note}
                </p>
                {/* 처리자 및 처리 정보 */}
                <div className="mt-2 pt-2 border-t border-[#1f883d]/10 space-y-0.5">
                  {feedback.resolved_by_name && (
                    <p className="text-[11px] text-[#57606a] flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      처리자: {feedback.resolved_by_name}
                    </p>
                  )}
                  {resolvedAt && (
                    <p className="text-[11px] text-[#57606a] flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      처리 일시: {resolvedAt}
                    </p>
                  )}
                  {resolutionDuration && (
                    <p className="text-[11px] text-[#57606a] flex items-center gap-1">
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
        </div>
      )}

      {/* 하단: 상태 액션 버튼 - GitHub 스타일 */}
      <div className="flex items-center justify-end px-3 py-2 border-t border-[#d0d7de] bg-[#f6f8fa] rounded-b-md">
        {renderStatusActions()}
      </div>

      {/* 삭제 확인 오버레이 - GitHub 스타일 */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-white/98 flex items-center justify-center z-10 rounded-md overflow-hidden">
          <div className="text-center px-4">
            <svg
              className="w-10 h-10 mx-auto mb-2 text-[#cf222e]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <h3 className="text-sm font-semibold text-[#24292f] mb-1">
              삭제하시겠습니까?
            </h3>
            <p className="text-xs text-[#57606a] mb-3">
              이 작업은 취소할 수 없습니다.
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#24292f] bg-white border border-[#d0d7de] hover:bg-[#f6f8fa] transition-colors rounded-md"
              >
                취소
              </button>
              <LoadingButton
                onClick={handleDelete}
                isLoading={isDeleting}
                variant="danger"
                size="xs"
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
