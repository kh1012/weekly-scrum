"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deletePlan } from "@/lib/actions/plans";

interface DeletePlanButtonProps {
  planId: string;
}

export function DeletePlanButton({ planId }: DeletePlanButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deletePlan(planId);
    setIsLoading(false);

    if (result.success) {
      router.push("/admin/plans");
    } else {
      alert(result.error || "삭제에 실패했습니다.");
      setIsConfirming(false);
    }
  };

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleDelete}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: "rgb(239, 68, 68)",
            color: "white",
          }}
        >
          {isLoading ? "삭제 중..." : "삭제 확인"}
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            background: "var(--notion-bg-secondary)",
            color: "var(--notion-text-muted)",
          }}
        >
          취소
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="px-4 py-2 rounded-xl text-sm font-medium transition-colors hover:bg-red-50"
      style={{
        color: "rgb(239, 68, 68)",
      }}
    >
      삭제
    </button>
  );
}

