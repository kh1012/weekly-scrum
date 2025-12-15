import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeletePlanButton } from "./DeletePlanButton";

// 상태 라벨 매핑
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: "계획됨", color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)" },
  in_progress: { label: "진행 중", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
  completed: { label: "완료", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
  cancelled: { label: "취소", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
};

interface PageProps {
  params: Promise<{ planId: string }>;
}

/**
 * Plan 상세 페이지 (관리자 전용)
 */
export default async function PlanDetailPage({ params }: PageProps) {
  const { planId } = await params;
  const supabase = await createClient();

  // Plan 조회
  const { data: plan, error } = await supabase
    .from("plans")
    .select(
      `
      id,
      title,
      description,
      start_date,
      end_date,
      status,
      priority,
      created_by,
      created_at,
      updated_at,
      profiles:created_by (
        display_name,
        email
      ),
      plan_assignees (
        user_id,
        profiles:user_id (
          display_name,
          email
        )
      )
    `
    )
    .eq("id", planId)
    .single();

  if (error || !plan) {
    notFound();
  }

  const statusInfo = STATUS_LABELS[plan.status] || STATUS_LABELS.planned;
  // profiles는 단일 객체 또는 배열일 수 있음
  const profileData = plan.profiles;
  const creator = Array.isArray(profileData) ? profileData[0] : profileData;
  const assignees = plan.plan_assignees as Array<{
    user_id: string;
    profiles: { display_name: string; email: string } | { display_name: string; email: string }[] | null;
  }>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
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
            계획 상세
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/plans/${planId}/edit`}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text)",
            }}
          >
            수정
          </Link>
          <DeletePlanButton planId={planId} />
        </div>
      </div>

      {/* 내용 */}
      <div
        className="p-6 rounded-2xl space-y-6"
        style={{
          background: "var(--notion-bg-elevated)",
          border: "1px solid var(--notion-border)",
        }}
      >
        {/* 제목 & 상태 */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
              {plan.title}
            </h2>
            <span
              className="text-sm px-3 py-1 rounded-full"
              style={{ background: statusInfo.bg, color: statusInfo.color }}
            >
              {statusInfo.label}
            </span>
          </div>
          {plan.description && (
            <p className="mt-3 text-sm" style={{ color: "var(--notion-text-secondary)" }}>
              {plan.description}
            </p>
          )}
        </div>

        {/* 정보 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
              시작일
            </div>
            <div style={{ color: "var(--notion-text)" }}>{plan.start_date}</div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
              종료일
            </div>
            <div style={{ color: "var(--notion-text)" }}>{plan.end_date}</div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
              우선순위
            </div>
            <div style={{ color: "var(--notion-text)" }}>{plan.priority}</div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
              생성자
            </div>
            <div style={{ color: "var(--notion-text)" }}>
              {creator?.display_name || creator?.email || "알 수 없음"}
            </div>
          </div>
        </div>

        {/* 담당자 */}
        {assignees && assignees.length > 0 && (
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-text-muted)" }}>
              담당자
            </div>
            <div className="flex flex-wrap gap-2">
              {assignees.map((a) => {
                const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
                return (
                  <span
                    key={a.user_id}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{
                      background: "var(--notion-bg-secondary)",
                      color: "var(--notion-text)",
                    }}
                  >
                    {profile?.display_name || profile?.email || "?"}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* 메타 정보 */}
        <div
          className="pt-4 border-t text-xs"
          style={{
            borderColor: "var(--notion-border)",
            color: "var(--notion-text-muted)",
          }}
        >
          <div>생성: {new Date(plan.created_at).toLocaleString("ko-KR")}</div>
          <div>수정: {new Date(plan.updated_at).toLocaleString("ko-KR")}</div>
        </div>
      </div>
    </div>
  );
}

