import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

/**
 * 전체 스냅샷 목록 페이지 (관리자 전용)
 */
export default async function AdminSnapshotsPage() {
  const supabase = await createClient();

  // 전체 스냅샷 목록 조회 (워크스페이스 기준)
  const { data: snapshots, error } = await supabase
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
      profiles:created_by (
        display_name,
        email
      )
    `
    )
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .order("year", { ascending: false })
    .order("week", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[AdminSnapshots] Failed to fetch snapshots:", error);
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
          <span className="text-2xl">📋</span>
          <div>
            <h1 className="text-xl font-semibold" style={{ color: "var(--notion-text)" }}>
              All Snapshots
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--notion-text-muted)" }}>
              워크스페이스 전체 스냅샷 ({snapshots?.length || 0}개)
            </p>
          </div>
        </div>
      </div>

      {/* 에러 표시 */}
      {error && (
        <div
          className="p-4 rounded-xl text-sm"
          style={{
            background: "rgba(239, 68, 68, 0.05)",
            border: "1px solid rgba(239, 68, 68, 0.15)",
            color: "rgb(185, 28, 28)",
          }}
        >
          <p className="font-medium">데이터 조회 실패</p>
          <p className="mt-1 opacity-80">{error.message}</p>
          <p className="mt-2 text-xs opacity-60">
            RLS 정책 확인이 필요할 수 있습니다.
          </p>
        </div>
      )}

      {/* 스냅샷 목록 */}
      {snapshots && snapshots.length > 0 ? (
        <div className="space-y-2">
          {snapshots.map((snapshot) => {
            const profileData = snapshot.profiles;
            const profile = Array.isArray(profileData) ? profileData[0] : profileData;
            return (
              <Link
                key={snapshot.id}
                href={`/admin/snapshots/${snapshot.id}`}
                className="block p-4 rounded-xl transition-all duration-200 group"
                style={{
                  background: "var(--notion-bg-elevated)",
                  border: "1px solid var(--notion-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium"
                      style={{
                        background: "rgba(59, 130, 246, 0.1)",
                        color: "#3b82f6",
                      }}
                    >
                      {snapshot.week}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="font-medium"
                          style={{ color: "var(--notion-text)" }}
                        >
                          {snapshot.year}년 {snapshot.week}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            background: "var(--notion-bg-secondary)",
                            color: "var(--notion-text-muted)",
                          }}
                        >
                          {snapshot.week_start_date} ~ {snapshot.week_end_date}
                        </span>
                      </div>
                      <div
                        className="text-sm mt-1"
                        style={{ color: "var(--notion-text-muted)" }}
                      >
                        작성자: {profile?.display_name || profile?.email || "알 수 없음"}
                      </div>
                    </div>
                  </div>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform"
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
            <p className="text-lg">📋</p>
            <p className="mt-2">스냅샷이 없습니다</p>
          </div>
        )
      )}
    </div>
  );
}

