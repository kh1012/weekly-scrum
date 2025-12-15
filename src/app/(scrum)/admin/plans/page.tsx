import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

// 상태 라벨 매핑
const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: "계획됨", color: "#6b7280", bg: "rgba(107, 114, 128, 0.1)" },
  in_progress: { label: "진행 중", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
  completed: { label: "완료", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
  cancelled: { label: "취소", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
};

/**
 * Plans 목록 페이지 (관리자 전용)
 */
export default async function AdminPlansPage() {
  const supabase = await createClient();

  // Plans 목록 조회
  const { data: plans, error } = await supabase
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
      profiles:created_by (
        display_name,
        email
      ),
      plan_assignees (
        user_id,
        profiles:user_id (
          display_name
        )
      )
    `
    )
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .order("priority", { ascending: true })
    .order("start_date", { ascending: true })
    .limit(50);

  if (error) {
    console.error("[AdminPlans] Failed to fetch plans:", error);
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-lg transition-colors hover:bg-gray-100"
            style={{ color: "var(--notion-text-muted)" }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-2xl">📆</span>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
              Plans
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--notion-text-muted)" }}>
              일정 계획 관리 ({plans?.length || 0}개)
            </p>
          </div>
        </div>

        {/* 새 계획 생성 버튼 */}
        <Link
          href="/admin/plans/new"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#F76D57]/20"
          style={{
            background: "linear-gradient(135deg, #F76D57, #f9a88b)",
            color: "white",
          }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 계획
        </Link>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{
            background: "linear-gradient(135deg, rgba(247, 109, 87, 0.08), rgba(249, 235, 178, 0.05))",
            border: "1px solid rgba(247, 109, 87, 0.2)",
            color: "#c94a3a",
          }}
        >
          <p className="font-medium">데이터 조회 실패</p>
          <p className="mt-1 opacity-80">{error.message}</p>
          <p className="mt-2 text-xs opacity-60">
            RLS 정책 확인이 필요할 수 있습니다.
          </p>
        </div>
      )}

      {/* Plans 목록 */}
      {plans && plans.length > 0 ? (
        <div className="space-y-2">
          {plans.map((plan) => {
            const statusInfo = STATUS_LABELS[plan.status] || STATUS_LABELS.planned;
            const assignees = plan.plan_assignees as Array<{
              user_id: string;
              profiles: { display_name: string } | { display_name: string }[] | null;
            }>;

            return (
              <Link
                key={plan.id}
                href={`/admin/plans/${plan.id}`}
                className="block p-4 rounded-xl transition-all duration-200 group"
                style={{
                  background: "var(--notion-bg-elevated)",
                  border: "1px solid var(--notion-border)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="font-medium truncate"
                        style={{ color: "var(--notion-text)" }}
                      >
                        {plan.title}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{
                          background: statusInfo.bg,
                          color: statusInfo.color,
                        }}
                      >
                        {statusInfo.label}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "var(--notion-bg-secondary)",
                          color: "var(--notion-text-muted)",
                        }}
                      >
                        우선순위 {plan.priority}
                      </span>
                    </div>
                    {plan.description && (
                      <p
                        className="text-sm mt-1 truncate"
                        style={{ color: "var(--notion-text-muted)" }}
                      >
                        {plan.description}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-3 mt-2 text-xs"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      <span>📅 {plan.start_date} ~ {plan.end_date}</span>
                      {assignees && assignees.length > 0 && (
                        <span>
                          👥 {assignees.map((a) => {
                            const profile = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
                            return profile?.display_name || "?";
                          }).join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    style={{ color: "var(--notion-text-muted)" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        !error && (
          <div
            className="text-center py-12 rounded-xl"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            <p className="text-lg">📆</p>
            <p className="mt-2">계획이 없습니다</p>
            <Link
              href="/admin/plans/new"
              className="inline-block mt-4 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#F76D57]/20"
              style={{
                background: "linear-gradient(135deg, #F76D57, #f9a88b)",
                color: "white",
              }}
            >
              첫 번째 계획 생성하기
            </Link>
          </div>
        )
      )}
    </div>
  );
}

