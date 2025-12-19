/**
 * Resolve Panel
 * leader/admin 전용 해결 패널
 */

"use client";

import { useState } from "react";
import { updateFeedbackStatus } from "@/app/actions/feedback";
import type { Release } from "@/lib/data/feedback";

interface ResolvePanelProps {
  feedbackId: string;
  releases: Release[];
  onResolved: () => void;
}

export function ResolvePanel({
  feedbackId,
  releases,
  onResolved,
}: ResolvePanelProps) {
  const [selectedReleaseId, setSelectedReleaseId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async () => {
    if (!selectedReleaseId) {
      setError("릴리즈를 선택해주세요");
      return;
    }

    const confirmed = confirm("이 피드백을 해결 완료로 표시하시겠습니까?");
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);

    const result = await updateFeedbackStatus(
      feedbackId,
      "resolved",
      selectedReleaseId
    );

    setIsSubmitting(false);

    if (result.success) {
      onResolved();
    } else {
      setError(result.error || "상태 변경에 실패했습니다");
    }
  };

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)",
        border: "1px solid rgba(34, 197, 94, 0.2)",
      }}
    >
      <h3 className="text-base font-semibold text-gray-900 mb-4">
        Mark as Resolved
      </h3>

      <div className="space-y-4">
        {/* 릴리즈 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Resolved in Release <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedReleaseId}
            onChange={(e) => setSelectedReleaseId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-150 outline-none"
            style={{
              background: "white",
              border: "1px solid #e2e8f0",
              color: "#1e293b",
            }}
            disabled={isSubmitting}
          >
            <option value="">Select a release</option>
            {releases.map((release) => (
              <option key={release.id} value={release.id}>
                {release.version} - {release.title}
              </option>
            ))}
          </select>
        </div>

        {/* 에러 메시지 */}
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

        {/* 버튼 */}
        <button
          onClick={handleResolve}
          disabled={isSubmitting || !selectedReleaseId}
          className="w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-150 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md hover:shadow-lg"
          style={{
            background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
          }}
        >
          {isSubmitting ? "처리 중..." : "Mark as Resolved"}
        </button>
      </div>
    </div>
  );
}

