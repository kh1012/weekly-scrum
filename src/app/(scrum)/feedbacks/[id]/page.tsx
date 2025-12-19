/**
 * Feedback Detail Page
 * 피드백 상세 및 상태 관리 - Airbnb 스타일
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getFeedback,
  getCurrentUserRole,
  listReleases,
} from "@/app/actions/feedback";
import { FeedbackStatusBadge } from "@/components/feedback/FeedbackStatusBadge";
import { FeedbackTimeline } from "@/components/feedback/FeedbackTimeline";
import { FeedbackDetailActions } from "./FeedbackDetailActions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FeedbackDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [feedbackResult, roleResult, releasesResult] = await Promise.all([
    getFeedback(id),
    getCurrentUserRole(),
    listReleases(),
  ]);

  if (!feedbackResult.success || !feedbackResult.feedback) {
    notFound();
  }

  const feedback = feedbackResult.feedback;
  const userRole = roleResult.role || "member";
  const isAdminOrLeader = ["admin", "leader"].includes(userRole);
  const releases = releasesResult.releases || [];

  const createdAt = new Date(feedback.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col rounded-xl md:rounded-[2rem] overflow-hidden shadow-xl bg-white border border-gray-100">
      {/* 헤더 영역 */}
      <div className="shrink-0 px-4 md:px-6 py-4 md:py-5 bg-gradient-to-r from-white via-white to-slate-50/50 border-b border-gray-100">
        <div className="flex items-center gap-3 md:gap-4">
          {/* 뒤로가기 */}
          <Link
            href="/feedbacks"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* 타이틀 아이콘 */}
          <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 640 512">
              <path d="M208 352c114.9 0 208-78.8 208-176S322.9 0 208 0S0 78.8 0 176c0 38.6 14.7 74.3 39.6 103.4c-3.5 9.4-8.7 17.7-14.2 24.7c-4.8 6.2-9.7 11-13.3 14.3c-1.8 1.6-3.3 2.9-4.3 3.7c-.5 .4-.9 .7-1.1 .8l-.2 .2s0 0 0 0s0 0 0 0C1 327.2-1.4 334.4 .8 340.9S9.1 352 16 352c21.8 0 43.8-5.6 62.1-12.5c9.2-3.5 17.8-7.4 25.2-11.4C134.1 343.3 169.8 352 208 352zM448 176c0 112.3-99.1 196.9-216.5 207C255.8 457.4 336.4 512 432 512c38.2 0 73.9-8.7 104.7-23.9c7.5 4 16 7.9 25.2 11.4c18.3 6.9 40.3 12.5 62.1 12.5c6.9 0 13.1-4.5 15.2-11.1c2.1-6.6-.2-13.8-5.8-17.9c0 0 0 0 0 0s0 0 0 0l-.2-.2c-.2-.2-.6-.4-1.1-.8c-1-.8-2.5-2-4.3-3.7c-3.6-3.3-8.5-8.1-13.3-14.3c-5.5-7-10.7-15.4-14.2-24.7c24.9-29 39.6-64.7 39.6-103.4c0-92.8-84.9-168.9-192.6-175.5c.4 5.1 .6 10.3 .6 15.5z" />
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Feedback Detail</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <FeedbackStatusBadge status={feedback.status} />
              {feedback.status === "resolved" && feedback.release_version && (
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
            <FeedbackTimeline currentStatus={feedback.status} />
          </div>

          {/* 관리 패널 (admin/leader만) */}
          {isAdminOrLeader && (
            <FeedbackDetailActions
              feedback={feedback}
              releases={releases}
              isAdminOrLeader={isAdminOrLeader}
            />
          )}
        </div>
      </div>
    </div>
  );
}
