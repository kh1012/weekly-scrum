/**
 * Feedback Detail Modal
 * 피드백 상세 보기 + 수정/삭제 모달
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { FeedbackStatusBadge } from "@/components/feedback/FeedbackStatusBadge";
import { SmallLoadingSpinner } from "@/components/common/LoadingButton";
import {
  updateFeedback,
  deleteFeedback,
  updateFeedbackStatus,
} from "@/app/actions/feedback";
import type { FeedbackWithDetails, FeedbackStatus } from "@/lib/data/feedback";

interface FeedbackDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  feedback: FeedbackWithDetails;
  isAdminOrLeader: boolean;
  currentUserId: string | null;
  onSuccess: () => void;
}

export function FeedbackDetailModal({
  isOpen,
  onClose,
  feedback,
  isAdminOrLeader,
  currentUserId,
  onSuccess,
}: FeedbackDetailModalProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(feedback.title || "");
  const [content, setContent] = useState(feedback.content);
  const [currentStatus, setCurrentStatus] = useState<FeedbackStatus>(feedback.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // 본인 글인지 확인
  const isOwner = currentUserId === feedback.author_user_id;
  const canEdit = isOwner;
  const canDelete = isOwner || isAdminOrLeader;

  // 모달 열릴 때 상태 초기화
  useEffect(() => {
    if (isOpen) {
      setTitle(feedback.title || "");
      setContent(feedback.content);
      setCurrentStatus(feedback.status);
      setIsEditing(false);
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, feedback]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else if (isEditing) {
          setIsEditing(false);
          setTitle(feedback.title || "");
          setContent(feedback.content);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isOpen, isEditing, showDeleteConfirm, onClose, feedback]);

  // 편집 모드로 전환 시 제목 포커스
  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  if (!isOpen) return null;

  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 수정 저장
  const handleSave = async () => {
    if (!content.trim()) {
      setError("내용을 입력해주세요");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateFeedback(feedback.id, {
      title: title.trim() || undefined,
      content: content.trim(),
    });

    setIsSubmitting(false);

    if (result.success) {
      setIsEditing(false);
      onSuccess();
    } else {
      setError(result.error || "수정에 실패했습니다");
    }
  };

  // 삭제
  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deleteFeedback(feedback.id);

    setIsDeleting(false);

    if (result.success) {
      onClose();
      onSuccess();
    } else {
      setError(result.error || "삭제에 실패했습니다");
    }
  };

  // 상태 변경
  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    setIsStatusUpdating(true);
    setError(null);

    const result = await updateFeedbackStatus(feedback.id, newStatus);

    setIsStatusUpdating(false);

    if (result.success) {
      setCurrentStatus(newStatus);
      onSuccess();
    } else {
      setError(result.error || "상태 변경에 실패했습니다");
    }
  };

  // 상태별 버튼 렌더링
  const renderStatusButtons = () => {
    if (!isAdminOrLeader) return null;

    switch (currentStatus) {
      case "open":
        return (
          <button
            onClick={() => handleStatusChange("in_progress")}
            disabled={isStatusUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {isStatusUpdating ? (
              <SmallLoadingSpinner size="xs" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
            )}
            진행하기
          </button>
        );

      case "in_progress":
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStatusChange("open")}
              disabled={isStatusUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
            >
              {isStatusUpdating ? (
                <SmallLoadingSpinner size="xs" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              )}
              열기
            </button>
            <button
              onClick={() => handleStatusChange("resolved")}
              disabled={isStatusUpdating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-all active:scale-95 disabled:opacity-50"
            >
              {isStatusUpdating ? (
                <SmallLoadingSpinner size="xs" />
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              완료
            </button>
          </div>
        );

      case "resolved":
        return (
          <button
            onClick={() => handleStatusChange("in_progress")}
            disabled={isStatusUpdating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {isStatusUpdating ? (
              <SmallLoadingSpinner size="xs" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            다시 열기
          </button>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isEditing && !showDeleteConfirm) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="shrink-0 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FeedbackStatusBadge status={currentStatus} />
          </div>
          <div className="flex items-center gap-2">
            {/* 상태 변경 버튼들 */}
            {renderStatusButtons()}

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 콘텐츠 영역 - 스크롤 */}
        <div className="flex-1 overflow-y-auto p-6">
          {isEditing ? (
            /* 수정 모드 */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  ref={titleInputRef}
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목 (선택사항)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">내용 *</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="피드백 내용을 입력하세요"
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>
            </div>
          ) : (
            /* 보기 모드 */
            <div className="space-y-6">
              {/* 제목 */}
              {feedback.title && (
                <h2 className="text-xl font-bold text-gray-900">{feedback.title}</h2>
              )}

              {/* 내용 */}
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {feedback.content}
              </div>

              {/* 작성자 및 날짜 */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-gray-600">
                        {feedback.author_name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <span className="font-medium text-gray-700">{feedback.author_name}</span>
                  </div>
                  <span className="text-xs">{createdAt}</span>
                </div>
              </div>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <div className="mt-4 px-4 py-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* 하단 액션 버튼 */}
        {(canEdit || canDelete) && (
          <div className="shrink-0 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              {canDelete && !isEditing && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  삭제
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setTitle(feedback.title || "");
                      setContent(feedback.content);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting && <SmallLoadingSpinner size="xs" className="text-white" />}
                    저장
                  </button>
                </>
              ) : (
                canEdit && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    수정
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* 삭제 확인 오버레이 */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="text-center max-w-sm px-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">피드백을 삭제하시겠습니까?</h3>
              <p className="text-sm text-gray-500 mb-6">이 작업은 취소할 수 없습니다.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeleting && <SmallLoadingSpinner size="xs" className="text-white" />}
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
