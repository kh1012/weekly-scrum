/**
 * Feedbacks List Page
 * Airbnb 스타일 + 칸반 보드 레이아웃
 */

import { listFeedbacks, getCurrentUserRole } from "@/app/actions/feedback";
import { FeedbackKanbanView } from "./_components/FeedbackKanbanView";

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
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center rounded-xl md:rounded-[2rem] overflow-hidden shadow-xl bg-white border border-gray-100">
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
    <FeedbackKanbanView
      feedbacks={feedbacks}
      isAdminOrLeader={isAdminOrLeader}
    />
  );
}
