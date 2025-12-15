import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlan } from "@/lib/data/plans";
import { DeletePlanButton } from "./DeletePlanButton";
import { STATUS_CONFIG, TYPE_CONFIG, ROLE_LABELS } from "@/components/plans/types";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PageProps {
  params: Promise<{ planId: string }>;
}

/**
 * Plan 상세 페이지 (관리자 전용)
 */
export default async function PlanDetailPage({ params }: PageProps) {
  const { planId } = await params;

  const plan = await getPlan({
    workspaceId: DEFAULT_WORKSPACE_ID,
    planId,
  });

  if (!plan) {
    notFound();
  }

  const statusConfig = STATUS_CONFIG[plan.status] || STATUS_CONFIG["진행중"];
  const typeConfig = TYPE_CONFIG[plan.type] || TYPE_CONFIG.feature;

  // 담당자 그룹화
  const assigneesByRole = plan.assignees?.reduce(
    (acc, a) => {
      if (!acc[a.role]) acc[a.role] = [];
      const name = a.profiles?.display_name || a.profiles?.email || "?";
      acc[a.role].push(name);
      return acc;
    },
    {} as Record<string, string[]>
  );

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
          <span className="text-2xl">{typeConfig.emoji}</span>
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
        {/* 제목 & 상태 & 타입 */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
              {plan.title}
            </h2>
            <span
              className="text-sm px-3 py-1 rounded-full"
              style={{ background: statusConfig.bg, color: statusConfig.color }}
            >
              {statusConfig.label}
            </span>
            <span
              className="text-sm px-3 py-1 rounded-full"
              style={{ background: `${typeConfig.color}15`, color: typeConfig.color }}
            >
              {typeConfig.emoji} {typeConfig.label}
            </span>
          </div>
        </div>

        {/* Feature 정보 */}
        {plan.type === "feature" && (
          <div className="flex flex-wrap gap-2">
            {plan.domain && (
              <span
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text)" }}
              >
                도메인: {plan.domain}
              </span>
            )}
            {plan.project && (
              <span
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "var(--notion-bg-secondary)", color: "var(--notion-text)" }}
              >
                프로젝트: {plan.project}
              </span>
            )}
            {plan.module && (
              <span
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}
              >
                모듈: {plan.module}
              </span>
            )}
            {plan.feature && (
              <span
                className="text-sm px-3 py-1 rounded-lg"
                style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}
              >
                기능: {plan.feature}
              </span>
            )}
          </div>
        )}

        {/* 정보 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
              단계
            </div>
            <div style={{ color: "var(--notion-text)" }}>{plan.stage}</div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
              시작일
            </div>
            <div style={{ color: "var(--notion-text)" }}>{formatDate(plan.start_date)}</div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1" style={{ color: "var(--notion-text-muted)" }}>
              종료일
            </div>
            <div style={{ color: "var(--notion-text)" }}>{formatDate(plan.end_date)}</div>
          </div>
        </div>

        {/* 담당자 */}
        {assigneesByRole && Object.keys(assigneesByRole).length > 0 && (
          <div>
            <div className="text-xs font-medium mb-2" style={{ color: "var(--notion-text-muted)" }}>
              담당자
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(assigneesByRole).map(([role, names]) => (
                <div key={role} className="flex items-center gap-1">
                  <span
                    className="text-xs px-2 py-1 rounded-full"
                    style={{
                      background: `${ROLE_LABELS[role]?.color}15`,
                      color: ROLE_LABELS[role]?.color,
                    }}
                  >
                    {ROLE_LABELS[role]?.label}
                  </span>
                  {names.map((name, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        background: "var(--notion-bg-secondary)",
                        color: "var(--notion-text)",
                      }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              ))}
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
          {plan.creator && (
            <div>
              생성자: {plan.creator.display_name || plan.creator.email || "알 수 없음"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
