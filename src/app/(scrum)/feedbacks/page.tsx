/**
 * Feedbacks List Page
 * Airbnb 스타일 + 칸반 보드 레이아웃
 */

import { createClient } from "@/lib/supabase/server";
import { listFeedbacks, getCurrentUserRole } from "@/app/actions/feedback";
import { FeedbackKanbanView } from "./_components/FeedbackKanbanView";

export default async function FeedbacksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [feedbacksResult, roleResult] = await Promise.all([
    listFeedbacks(),
    getCurrentUserRole(),
  ]);

  const feedbacks = feedbacksResult.feedbacks || [];
  const userRole = roleResult.role || "member";
  const isAdminOrLeader = ["admin", "leader"].includes(userRole);

  if (!feedbacksResult.success && feedbacksResult.error) {
    return (
      <div className="h-[calc(100vh-7rem)] flex items-center justify-center bg-white border border-[#d0d7de] rounded-md">
        <div className="p-4 max-w-md bg-[#fff8c5] border border-[#d0d7de] rounded-md">
          <p className="text-sm text-[#24292f]">{feedbacksResult.error}</p>
        </div>
      </div>
    );
  }

  return (
    <FeedbackKanbanView
      feedbacks={feedbacks}
      isAdminOrLeader={isAdminOrLeader}
      currentUserId={user?.id || null}
    />
  );
}
