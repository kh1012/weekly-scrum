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
  const isAdminOrManager = ["admin", "manager"].includes(userRole);

  if (!feedbacksResult.success && feedbacksResult.error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white border border-[#d0d7de] rounded-md">
        <div className="p-4 max-w-md bg-[#fff8c5] border border-[#d0d7de] rounded-md">
          <p className="text-sm text-[#24292f]">{feedbacksResult.error}</p>
        </div>
      </div>
    );
  }

  return (
    <FeedbackKanbanView
      feedbacks={feedbacks}
      isAdminOrManager={isAdminOrManager}
      currentUserId={user?.id || null}
    />
  );
}
