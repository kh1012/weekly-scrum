/**
 * Admin Plans 페이지 - /admin/plans/gantt로 리다이렉트
 *
 * 관리자 전용 간트 편집기로 리다이렉트됩니다.
 */

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

export default function AdminPlansPage() {
  redirect("/admin/plans/gantt");
}
