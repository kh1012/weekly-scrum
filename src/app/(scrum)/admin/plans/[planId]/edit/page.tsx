"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { updatePlanAction } from "@/lib/actions/plans";
import { PlanForm } from "../../_components/PlanForm";
import { createClient } from "@/lib/supabase/browser";
import type { PlanWithAssignees } from "@/lib/data/plans";
import type { CreatePlanActionInput } from "@/lib/actions/plans";

interface PlanFormData extends CreatePlanActionInput {
  id?: string;
}

const DEFAULT_WORKSPACE_ID = process.env.NEXT_PUBLIC_DEFAULT_WORKSPACE_ID || "";

/**
 * Plan 수정 페이지
 */
export default function EditPlanPage() {
  const router = useRouter();
  const params = useParams();
  const planId = params.planId as string;

  const [plan, setPlan] = useState<PlanWithAssignees | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 기존 데이터 로드
  useEffect(() => {
    async function loadPlan() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("plans")
          .select(`
            *,
            plan_assignees (
              user_id,
              role
            )
          `)
          .eq("workspace_id", DEFAULT_WORKSPACE_ID)
          .eq("id", planId)
          .single();

        if (error) throw error;

        setPlan(data as PlanWithAssignees);
      } catch (err) {
        console.error("Failed to load plan:", err);
        setError("계획을 불러올 수 없습니다.");
      } finally {
        setIsLoading(false);
      }
    }

    loadPlan();
  }, [planId]);

  const handleSubmit = async (data: PlanFormData) => {
    setIsSaving(true);
    setError(null);

    const result = await updatePlanAction({
      ...data,
      id: planId,
    });

    setIsSaving(false);

    if (result.success) {
      router.push(`/admin/plans/${planId}`);
    } else {
      setError(result.error || "수정에 실패했습니다.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div
            className="inline-block w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin"
            style={{ color: "var(--notion-text-muted)" }}
          />
          <p className="mt-2 text-sm" style={{ color: "var(--notion-text-muted)" }}>
            로딩 중...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12">
        <p style={{ color: "var(--notion-text-muted)" }}>{error || "계획을 찾을 수 없습니다."}</p>
        <Link
          href="/admin/plans"
          className="inline-block mt-4 px-4 py-2 rounded-lg text-sm"
          style={{
            background: "var(--notion-bg-secondary)",
            color: "var(--notion-text)",
          }}
        >
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/plans/${planId}`}
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-2xl">✏️</span>
        <h1 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
          계획 수정
        </h1>
      </div>

      {/* 폼 */}
      <PlanForm
        initialData={{
          id: plan.id,
          type: plan.type,
          title: plan.title,
          stage: plan.stage,
          status: plan.status,
          domain: plan.domain || undefined,
          project: plan.project || undefined,
          module: plan.module || undefined,
          feature: plan.feature || undefined,
          start_date: plan.start_date || undefined,
          end_date: plan.end_date || undefined,
          assignees: plan.assignees?.map((a) => ({
            user_id: a.user_id,
            role: a.role,
          })),
        }}
        onSubmit={handleSubmit}
        isLoading={isSaving}
        error={error}
        submitLabel="저장하기"
        cancelHref={`/admin/plans/${planId}`}
      />
    </div>
  );
}
