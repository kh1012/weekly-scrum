"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPlanAction } from "@/lib/actions/plans";
import { PlanForm } from "../_components/PlanForm";
import type { CreatePlanActionInput } from "@/lib/actions/plans";

interface PlanFormData extends CreatePlanActionInput {
  id?: string;
}

/**
 * 새 Plan 생성 페이지
 */
export default function NewPlanPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: PlanFormData) => {
    setIsLoading(true);
    setError(null);

    const result = await createPlanAction(data);

    setIsLoading(false);

    if (result.success) {
      router.push("/admin/plans");
    } else {
      setError(result.error || "생성에 실패했습니다.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/plans"
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-2xl">📆</span>
        <h1 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
          새 계획 생성
        </h1>
      </div>

      {/* 폼 */}
      <PlanForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        error={error}
        submitLabel="생성하기"
        cancelHref="/admin/plans"
      />
    </div>
  );
}
