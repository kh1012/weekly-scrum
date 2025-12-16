"use client";

import Link from "next/link";

interface AccessDeniedProps {
  /**
   * 권한이 필요한 역할 설명
   */
  requiredRole?: string;
  /**
   * 돌아갈 경로
   */
  backHref?: string;
  /**
   * 돌아가기 버튼 텍스트
   */
  backLabel?: string;
}

/**
 * 권한 없음 표시 컴포넌트
 * - admin/leader 권한이 필요한 페이지에서 member가 접근 시 표시
 */
export function AccessDenied({
  requiredRole = "관리자 또는 리더",
  backHref = "/",
  backLabel = "홈으로 돌아가기",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      {/* 아이콘 */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(247, 109, 87, 0.1), rgba(249, 235, 178, 0.1))",
          border: "1px solid rgba(247, 109, 87, 0.2)",
        }}
      >
        <svg
          className="w-10 h-10"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "#F76D57" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>

      {/* 메시지 */}
      <h1
        className="text-2xl font-semibold mb-2"
        style={{ color: "var(--notion-text)" }}
      >
        권한이 없습니다
      </h1>
      <p
        className="text-base mb-1"
        style={{ color: "var(--notion-text-muted)" }}
      >
        이 페이지에 접근하려면 <span className="font-medium">{requiredRole}</span> 권한이
        필요합니다.
      </p>
      <p
        className="text-sm mb-8"
        style={{ color: "var(--notion-text-muted)" }}
      >
        권한이 필요하신 경우 워크스페이스 관리자에게 문의해 주세요.
      </p>

      {/* 돌아가기 버튼 */}
      <Link
        href={backHref}
        className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#F76D57]/20"
        style={{
          background: "linear-gradient(135deg, #F76D57, #f9a88b)",
          color: "white",
        }}
      >
        {backLabel}
      </Link>
    </div>
  );
}

