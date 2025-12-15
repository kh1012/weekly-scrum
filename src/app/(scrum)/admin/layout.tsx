import { redirect } from "next/navigation";
import { isAdminOrOwner } from "@/lib/auth/getWorkspaceRole";

/**
 * 관리자 전용 레이아웃
 * - admin 또는 owner role만 접근 가능
 * - 권한 없으면 메인 페이지로 리다이렉트
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 관리자 권한 확인
  const hasAdminAccess = await isAdminOrOwner();

  if (!hasAdminAccess) {
    // 권한 없으면 메인 페이지로 리다이렉트
    redirect("/work-map");
  }

  return <>{children}</>;
}

