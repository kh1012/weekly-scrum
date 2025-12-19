/**
 * Feedback Detail Actions
 * 관리자 액션 (상태 변경, 해결 처리)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateFeedbackStatus } from "@/app/actions/feedback";
import { ResolvePanel } from "@/components/feedback/ResolvePanel";
import type { FeedbackWithDetails, FeedbackStatus, Release } from "@/lib/data/feedback";

interface FeedbackDetailActionsProps {
  feedback: FeedbackWithDetails;
  releases: Release[];
  isAdminOrLeader: boolean;
}

export function FeedbackDetailActions({
  feedback,
  releases,
  isAdminOrLeader,
}: FeedbackDetailActionsProps) {
  const router = useRouter();
  const [currentStatus, setCurrentStatus] = useState(feedback.status);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    if (newStatus === currentStatus) return;

    // resolved 상태는 ResolvePanel로만 변경
    if (newStatus === "resolved") {
      alert("해결 완료는 아래 'Mark as Resolved' 패널을 사용해주세요");
      return;
    }

    const confirmed = confirm("상태를 변경하시겠습니까?");
    if (!confirmed) return;

    setIsUpdating(true);
    setError(null);

    const result = await updateFeedbackStatus(feedback.id, newStatus);

    setIsUpdating(false);

    if (result.success) {
      setCurrentStatus(newStatus);
      router.refresh();
    } else {
      setError(result.error || "상태 변경에 실패했습니다");
    }
  };

  return (
    <div className="space-y-6">
      {/* 상태 선택 */}
      <div
        className="rounded-xl p-6"
        style={{
          background: "white",
          border: "1px solid rgba(0, 0, 0, 0.08)",
        }}
      >
        <h3 className="text-base font-semibold text-gray-900 mb-4">
          Change Status
        </h3>

        <div className="space-y-4">
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value as FeedbackStatus)}
            disabled={isUpdating}
            className="w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-150 outline-none"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              color: "#1e293b",
            }}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>

          {error && (
            <div
              className="px-4 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                color: "#dc2626",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Resolve Panel (status가 resolved가 아닐 때만 표시) */}
      {currentStatus !== "resolved" && (
        <ResolvePanel
          feedbackId={feedback.id}
          releases={releases}
          onResolved={() => {
            setCurrentStatus("resolved");
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

