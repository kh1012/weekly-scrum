/**
 * Feedback Detail Page
 * 피드백 상세 및 상태 관리
 */

import { notFound } from "next/navigation";
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div
        className="sticky top-0 z-10"
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Feedback Detail</h1>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* 피드백 내용 */}
        <div
          className="rounded-xl p-6"
          style={{
            background: "white",
            border: "1px solid rgba(0, 0, 0, 0.08)",
          }}
        >
          {/* 상단: 메타 정보 */}
          <div className="flex items-center gap-3 mb-4">
            <FeedbackStatusBadge status={feedback.status} />
            {feedback.status === "resolved" && feedback.release_version && (
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  color: "#4f46e5",
                }}
              >
                {feedback.release_version}
              </span>
            )}
          </div>

          {/* 제목 */}
          {feedback.title && (
            <h2 className="text-xl font-bold text-gray-900 mb-3">
              {feedback.title}
            </h2>
          )}

          {/* 내용 */}
          <div className="prose prose-sm max-w-none mb-4">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {feedback.content}
            </p>
          </div>

          {/* 작성자 및 날짜 */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                작성자: <strong>{feedback.author_name}</strong>
              </span>
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
          }}
        >
          <h3 className="text-base font-semibold text-gray-900 mb-4">
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
  );
}

