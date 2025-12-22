import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSnapshotEditView } from "./_components/AdminSnapshotEditView";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PageProps {
  params: Promise<{ snapshotId: string }>;
}

export const dynamic = "force-dynamic";

/**
 * 스냅샷 편집 페이지 (관리자 전용)
 */
export default async function AdminSnapshotEditPage({ params }: PageProps) {
  const { snapshotId } = await params;
  const supabase = await createClient();

  // 스냅샷 조회
  const { data: snapshot, error } = await supabase
    .from("snapshots")
    .select(`
      id,
      year,
      week,
      week_start_date,
      week_end_date,
      created_by,
      created_at,
      updated_at,
      title
    `)
    .eq("id", snapshotId)
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
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

  // 작성자 정보 조회
  let authorName: string | undefined;
  if (snapshot.created_by) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", snapshot.created_by)
      .single();
    authorName = profile?.display_name;
  }

  return (
    <AdminSnapshotEditView
      snapshot={{
        ...snapshot,
        entries: entries || [],
        authorName,
      }}
    />
  );
}














