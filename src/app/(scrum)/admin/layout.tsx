import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { AccessDenied } from "@/components/weekly-scrum/common";

/**
 * 관리자 전용 레이아웃
 * - admin 또는 leader role만 접근 가능
 * - 권한 없으면 "권한이 없습니다" 메시지 표시
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 권한 확인
  const hasAdminAccess = await isAdminOrLeader();

  if (!hasAdminAccess) {
    // 권한 없으면 AccessDenied 컴포넌트 렌더링
    return (
      <AccessDenied
        requiredRole="관리자(Admin) 또는 리더(Leader)"
        backHref="/work-map"
        backLabel="Work Map으로 돌아가기"
      />
    );
  }

  return <>{children}</>;
}

