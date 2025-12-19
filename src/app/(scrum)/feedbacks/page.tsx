/**
 * Feedbacks List Page
 * Airbnb 스타일의 피드백 목록
 */

import { listFeedbacks, getCurrentUserRole } from "@/app/actions/feedback";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import Link from "next/link";
import { PlusIcon } from "@/components/common/Icons";

export default async function FeedbacksPage() {
  const [feedbacksResult, roleResult] = await Promise.all([
    listFeedbacks(),
    getCurrentUserRole(),
  ]);

  const feedbacks = feedbacksResult.feedbacks || [];
  const userRole = roleResult.role || "member";
  const isAdminOrLeader = ["admin", "leader"].includes(userRole);

  if (!feedbacksResult.success && feedbacksResult.error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div
          className="rounded-xl p-6 max-w-md"
          style={{
            background: "white",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <p className="text-red-600 text-sm">{feedbacksResult.error}</p>
        </div>
      </div>
    );
  }

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Feedbacks</h1>
              <p className="mt-1 text-sm text-gray-500">
                {isAdminOrLeader
                  ? "모든 피드백을 관리할 수 있습니다"
                  : "내 피드백 목록"}
              </p>
            </div>
            <Link
              href="/feedbacks/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95 text-white shadow-md hover:shadow-lg"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
              }}
            >
              <PlusIcon className="w-4 h-4" />
              New Feedback
            </Link>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {feedbacks.length === 0 ? (
          <div
            className="rounded-xl p-12 text-center"
            style={{
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.08)",
            }}
          >
            <p className="text-gray-500 text-sm">아직 피드백이 없습니다</p>
            <Link
              href="/feedbacks/new"
              className="inline-block mt-4 text-blue-600 hover:underline text-sm font-medium"
            >
              첫 피드백 작성하기 →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {feedbacks.map((feedback) => (
              <FeedbackCard key={feedback.id} feedback={feedback} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

