import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ snapshotId: string }>;
}

/**
 * 스냅샷 상세 페이지 (관리자 전용)
 */
export default async function SnapshotDetailPage({ params }: PageProps) {
  const { snapshotId } = await params;
  const supabase = await createClient();

  // 스냅샷 조회
  const { data: snapshot, error } = await supabase
    .from("snapshots")
    .select(
      `
      id,
      year,
      week,
      week_start_date,
      week_end_date,
      created_by,
      created_at,
      updated_at,
      profiles:created_by (
        display_name,
        email
      )
    `
    )
    .eq("id", snapshotId)
    .single();

  if (error || !snapshot) {
    notFound();
  }

  // 스냅샷 엔트리 조회
  const { data: entries } = await supabase
    .from("snapshot_entries")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .order("created_at", { ascending: true });

  const profileData = snapshot.profiles;
  const creator = Array.isArray(profileData) ? profileData[0] : profileData;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/snapshots"
          className="p-2 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "var(--notion-text-muted)" }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <span className="text-2xl">📋</span>
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
            {snapshot.year}년 {snapshot.week} 스냅샷
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--notion-text-muted)" }}>
            {snapshot.week_start_date} ~ {snapshot.week_end_date}
          </p>
        </div>
      </div>

      {/* 메타 정보 */}
      <div
        className="p-4 rounded-xl"
        style={{
          background: "var(--notion-bg-secondary)",
          border: "1px solid var(--notion-border)",
        }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
              작성자
            </div>
            <div style={{ color: "var(--notion-text)" }}>
              {creator?.display_name || creator?.email || "알 수 없음"}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
              엔트리 수
            </div>
            <div style={{ color: "var(--notion-text)" }}>{entries?.length || 0}개</div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
              생성일
            </div>
            <div style={{ color: "var(--notion-text)" }}>
              {new Date(snapshot.created_at).toLocaleDateString("ko-KR")}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: "var(--notion-text-muted)" }}>
              수정일
            </div>
            <div style={{ color: "var(--notion-text)" }}>
              {new Date(snapshot.updated_at).toLocaleDateString("ko-KR")}
            </div>
          </div>
        </div>
      </div>

      {/* 엔트리 목록 */}
      <div>
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--notion-text)" }}>
          엔트리 ({entries?.length || 0})
        </h2>

        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-4 rounded-xl"
                style={{
                  background: "var(--notion-bg-elevated)",
                  border: "1px solid var(--notion-border)",
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium" style={{ color: "var(--notion-text)" }}>
                        {entry.name}
                      </span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: "rgba(59, 130, 246, 0.1)",
                          color: "#3b82f6",
                        }}
                      >
                        {entry.domain}
                      </span>
                    </div>
                    <div
                      className="text-sm mt-1"
                      style={{ color: "var(--notion-text-muted)" }}
                    >
                      {entry.project}
                      {entry.module && ` > ${entry.module}`}
                      {entry.feature && ` > ${entry.feature}`}
                    </div>

                    {/* 지난주 작업 */}
                    {entry.past_week_tasks && entry.past_week_tasks.length > 0 && (
                      <div className="mt-3">
                        <div
                          className="text-xs font-medium mb-1"
                          style={{ color: "var(--notion-text-muted)" }}
                        >
                          지난주 작업
                        </div>
                        <ul className="space-y-1">
                          {(entry.past_week_tasks as Array<{ title: string; progress: number }>).map(
                            (task, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-sm"
                                style={{ color: "var(--notion-text-secondary)" }}
                              >
                                <span
                                  className="w-10 text-right text-xs"
                                  style={{ color: "#10b981" }}
                                >
                                  {task.progress}%
                                </span>
                                <span>{task.title}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                    {/* 이번주 계획 */}
                    {entry.this_week_tasks && entry.this_week_tasks.length > 0 && (
                      <div className="mt-3">
                        <div
                          className="text-xs font-medium mb-1"
                          style={{ color: "var(--notion-text-muted)" }}
                        >
                          이번주 계획
                        </div>
                        <ul className="space-y-1">
                          {(entry.this_week_tasks as string[]).map((task, i) => (
                            <li
                              key={i}
                              className="text-sm"
                              style={{ color: "var(--notion-text-secondary)" }}
                            >
                              • {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 리스크 */}
                    {entry.risk && entry.risk.length > 0 && (
                      <div className="mt-3">
                        <div
                          className="text-xs font-medium mb-1"
                          style={{ color: "rgb(239, 68, 68)" }}
                        >
                          리스크 (레벨: {entry.risk_level || 0})
                        </div>
                        <ul className="space-y-1">
                          {(entry.risk as string[]).map((r, i) => (
                            <li
                              key={i}
                              className="text-sm"
                              style={{ color: "rgb(185, 28, 28)" }}
                            >
                              ⚠️ {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            className="text-center py-8 rounded-xl"
            style={{
              background: "var(--notion-bg-secondary)",
              color: "var(--notion-text-muted)",
            }}
          >
            엔트리가 없습니다
          </div>
        )}
      </div>
    </div>
  );
}

