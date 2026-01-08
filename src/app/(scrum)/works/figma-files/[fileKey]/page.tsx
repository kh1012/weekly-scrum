/**
 * Figma 파일 상세 페이지 (Server Component)
 * - 파일 정보
 * - 댓글 목록 (GitHub PR 스타일)
 */

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FileDetailClient } from "./FileDetailClient";

export default async function FigmaFileDetailPage({
  params,
}: {
  params: Promise<{ fileKey: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { fileKey } = await params;

  return <FileDetailClient fileKey={fileKey} userId={user.id} />;
}

