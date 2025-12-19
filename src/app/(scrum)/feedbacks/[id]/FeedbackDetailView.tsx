/**
 * Feedback Detail View
 * 클라이언트 컴포넌트 - 피드백 상세 뷰
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedbackStatusBadge } from "@/components/feedback/FeedbackStatusBadge";
import { FeedbackTimeline } from "@/components/feedback/FeedbackTimeline";
import { ResolvePanel } from "@/components/feedback/ResolvePanel";
import { EditFeedbackModal } from "./EditFeedbackModal";
import { navigationProgress } from "@/components/weekly-scrum/common/NavigationProgress";
import { updateFeedbackStatus } from "@/app/actions/feedback";
import type { FeedbackWithDetails, Release } from "@/lib/data/feedback";

interface FeedbackDetailViewProps {
  feedback: FeedbackWithDetails;
  releases: Release[];
  isAdminOrLeader: boolean;
}

export function FeedbackDetailView({
  feedback,
  releases,
  isAdminOrLeader,
}: FeedbackDetailViewProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(feedback.status);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleBack = () => {
    navigationProgress.start();
    router.push("/feedbacks");
  };

  // 상태 토글: Open <-> In Progress
  const handleToggleStatus = async () => {
    const newStatus = currentStatus === "open" ? "in_progress" : "open";

    setIsStatusUpdating(true);
    setStatusError(null);

    const result = await updateFeedbackStatus(feedback.id, newStatus);

    setIsStatusUpdating(false);

    if (result.success) {
      setCurrentStatus(newStatus);
      router.refresh();
    } else {
      setStatusError(result.error || "상태 변경에 실패했습니다");
    }
  };

  const handleResolved = () => {
    setCurrentStatus("resolved");
    router.refresh();
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    router.refresh();
  };

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col rounded-xl md:rounded-[2rem] overflow-hidden shadow-xl bg-white border border-gray-100">
      {/* 헤더 영역 */}
      <div className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-white via-white to-slate-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3 md:gap-4">
          {/* 뒤로가기 */}
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 타이틀 아이콘 */}
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 640 512">
              <path d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9c0 0 0 0 0 0s0 0 0 0l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Feedback Detail</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <FeedbackStatusBadge status={currentStatus} />
              {currentStatus === "resolved" && feedback.release_version && (
                <span
                  className="px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    background: "rgba(99, 102, 241, 0.1)",
                    color: "#4f46e5",
                  }}
                >
                  {feedback.release_version}
                </span>
              )}
            </div>
          </div>

          {/* 수정 버튼 */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="hidden sm:inline">수정</span>
          </button>
        </div>
      </div>

      {/* 메인 콘텐츠 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* 피드백 내용 */}
          <div
            className="rounded-xl p-6"
            style={{
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            {/* 제목 */}
            {feedback.title && (
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {feedback.title}
              </h2>
            )}

            {/* 내용 */}
            <div className="prose prose-sm max-w-none mb-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {feedback.content}
              </p>
            </div>

            {/* 작성자 및 날짜 */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span>
                    <strong className="text-gray-700">{feedback.author_name}</strong>
                  </span>
                </div>
                <span>{createdAt}</span>
              </div>
            </div>
          </div>

          {/* 타임라인 */}
          <div
            className="rounded-xl p-6"
            style={{
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.08)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Status Timeline
            </h3>
            <FeedbackTimeline currentStatus={currentStatus} />
          </div>

          {/* 관리 패널 (admin/leader만) */}
          {isAdminOrLeader && currentStatus !== "resolved" && (
            <div className="space-y-6">
              {/* 상태 토글 버튼 */}
              <div
                className="rounded-xl p-6"
                style={{
                  background: "white",
                  border: "1px solid rgba(0, 0, 0, 0.08)",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
              >
                <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                  Change Status
                </h3>

                <button
                  onClick={handleToggleStatus}
                  disabled={isStatusUpdating}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: currentStatus === "open"
                      ? "linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)"
                      : "linear-gradient(135deg, rgba(100, 116, 139, 0.1) 0%, rgba(100, 116, 139, 0.05) 100%)",
                    border: `1px solid ${currentStatus === "open" ? "rgba(59, 130, 246, 0.3)" : "rgba(100, 116, 139, 0.3)"}`,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{
                        background: currentStatus === "open"
                          ? "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)"
                          : "linear-gradient(135deg, #64748b 0%, #475569 100%)",
                      }}
                    >
                      {currentStatus === "open" ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      )}
                    </span>
                    <div className="text-left">
                      <div className="text-gray-900 font-semibold">
                        {currentStatus === "open" ? "진행 중으로 변경" : "다시 열기"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {currentStatus === "open"
                          ? "피드백 검토를 시작합니다"
                          : "피드백을 Open 상태로 되돌립니다"}
                      </div>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {statusError && (
                  <div
                    className="mt-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2"
                    style={{
                      background: "rgba(239, 68, 68, 0.1)",
                      color: "#dc2626",
                    }}
                  >
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {statusError}
                  </div>
                )}
              </div>

              {/* Resolve Panel */}
              <ResolvePanel
                feedbackId={feedback.id}
                releases={releases}
                onResolved={handleResolved}
              />
            </div>
          )}

          {/* Resolved 상태일 때 릴리즈 정보 표시 */}
          {currentStatus === "resolved" && feedback.release_version && (
            <div
              className="rounded-xl p-6"
              style={{
                background: "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
                border: "1px solid rgba(34, 197, 94, 0.2)",
              }}
            >
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Resolved
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-white">
                <span
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: "rgba(99, 102, 241, 0.1)" }}
                >
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </span>
                <div>
                  <div className="font-semibold text-gray-900">{feedback.release_version}</div>
                  <div className="text-sm text-gray-500">{feedback.release_title || "릴리즈"}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 수정 모달 */}
      <EditFeedbackModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        feedback={feedback}
      />
    </div>
  );
}

