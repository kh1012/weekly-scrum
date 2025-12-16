import Link from "next/link";

/**
 * 관리자 대시보드 메인 페이지
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🏠</span>
        <div>
          <h1
            className="text-xl font-semibold"
            style={{ color: "var(--notion-text)" }}
          >
            관리자 대시보드
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--notion-text-muted)" }}
          >
            워크스페이스 전체 데이터를 관리합니다
          </p>
        </div>
      </div>

      {/* 관리 메뉴 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* All Snapshots - Coming Soon */}
        <div
          className="p-6 rounded-2xl cursor-not-allowed opacity-60"
          style={{
            background: "var(--notion-bg-elevated)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "var(--notion-bg-secondary)" }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 512 512" style={{ color: "var(--notion-text-muted)" }}>
                <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32l224 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-224 0c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32l288 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-288 0c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2
                  className="font-semibold"
                  style={{ color: "var(--notion-text-muted)" }}
                >
                  All Snapshots
                </h2>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "var(--notion-bg-secondary)",
                    color: "var(--notion-text-muted)",
                  }}
                >
                  Coming Soon
                </span>
              </div>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--notion-text-muted)" }}
              >
                전체 스냅샷 조회 및 관리
              </p>
            </div>
          </div>
        </div>

        {/* Plans */}
        <Link
          href="/admin/plans"
          className="group p-6 rounded-2xl transition-all duration-200"
          style={{
            background: "var(--notion-bg-elevated)",
            border: "1px solid var(--notion-border)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ background: "linear-gradient(135deg, rgba(247, 109, 87, 0.15), rgba(249, 235, 178, 0.1))" }}
            >
              📆
            </div>
            <div className="flex-1">
              <h2
                className="font-semibold transition-colors group-hover:text-[#F76D57]"
                style={{ color: "var(--notion-text)" }}
              >
                Plans
              </h2>
              <p
                className="text-sm mt-1"
                style={{ color: "var(--notion-text-muted)" }}
              >
                일정 계획 CRUD
              </p>
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
      </div>

      {/* 관리자 안내 */}
      <div
        className="p-4 rounded-xl text-sm"
        style={{
          background: "linear-gradient(135deg, rgba(247, 109, 87, 0.08), rgba(249, 235, 178, 0.05))",
          border: "1px solid rgba(247, 109, 87, 0.2)",
          color: "#c94a3a",
        }}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">🔒</span>
          <div>
            <p className="font-medium">관리자 전용 영역</p>
            <p className="mt-1 opacity-80">
              이 영역은 admin 또는 leader 권한을 가진 사용자만 접근할 수 있습니다.
              전체 워크스페이스 데이터를 조회하고 관리할 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

