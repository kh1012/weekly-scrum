/**
 * Feedbacks List Page
 * Airbnb 스타일 + 칸반 보드 레이아웃
 */

import { createClient } from "@/lib/supabase/server";
import { listFeedbacks, listReleases, getCurrentUserRole } from "@/app/actions/feedback";
import { FeedbackKanbanView } from "./_components/FeedbackKanbanView";

export default async function FeedbacksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [feedbacksResult, releasesResult, roleResult] = await Promise.all([
    listFeedbacks(),
    listReleases(),
    getCurrentUserRole(),
  ]);

  const feedbacks = feedbacksResult.feedbacks || [];
  const releases = releasesResult.releases || [];
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
      releases={releases}
      isAdminOrLeader={isAdminOrLeader}
      currentUserId={user?.id || null}
    />
  );
}
