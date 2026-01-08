/**
 * Figma Files 대시보드 (Server Component)
 * - 등록된 Figma 파일 목록
 * - 댓글 요약 및 읽지 않은 댓글 표시
 */

import { createClient } from "@/lib/supabase/server";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { redirect } from "next/navigation";
import { FigmaFilesDashboard } from "./FigmaFilesDashboard";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

export default async function FigmaFilesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <FigmaFilesDashboard workspaceId={DEFAULT_WORKSPACE_ID} userId={user.id} />;
}

