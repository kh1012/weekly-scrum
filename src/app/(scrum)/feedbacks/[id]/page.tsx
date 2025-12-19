/**
 * Feedback Detail Page
 * 피드백 상세 및 상태 관리 - Airbnb 스타일
 */

import { notFound } from "next/navigation";
import {
  getFeedback,
  getCurrentUserRole,
  listReleases,
} from "@/app/actions/feedback";
import { FeedbackDetailView } from "./FeedbackDetailView";

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

  return (
    <FeedbackDetailView
      feedback={feedback}
      releases={releases}
      isAdminOrLeader={isAdminOrLeader}
    />
  );
}
