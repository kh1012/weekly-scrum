import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getWeekStartDateString } from "@/lib/date/isoWeek";
import { getMemberNames } from "@/lib/data/profiles";
import { EditSnapshotsView } from "./_components/EditSnapshotsView";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

interface EditPageProps {
  params: Promise<{
    year: string;
    week: string;
  }>;
}

export default async function EditSnapshotsPage({ params }: EditPageProps) {
  const { year: yearStr, week: weekStr } = await params;
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  if (isNaN(year) || isNaN(week) || week < 1 || week > 53) {
    notFound();
  }

  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }

  // 사용자 프로필에서 display_name 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  
  const displayName = profile?.display_name || user.email?.split("@")[0] || "익명";

  const weekStartDate = getWeekStartDateString(year, week);

  // 해당 주차의 스냅샷 목록 조회 (workload 필드 포함)
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("snapshots")
    .select(`
      id,
      created_at,
      updated_at,
      workload_level,
      workload_note,
      entries:snapshot_entries(*)
    `)
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .eq("author_id", user.id)
    .eq("week_start_date", weekStartDate)
    .order("updated_at", { ascending: false });

  if (snapshotsError) {
    console.error("Error fetching snapshots:", snapshotsError);
    notFound();
  }

  // 워크스페이스 멤버 이름 목록 조회
  const memberNames = await getMemberNames();

  // 스냅샷이 없어도 빈 배열로 전달 (EditSnapshotsView에서 임시 카드 초기화)
  return (
    <EditSnapshotsView
      year={year}
      week={week}
      snapshots={snapshots || []}
      userId={user.id}
      workspaceId={DEFAULT_WORKSPACE_ID}
      displayName={displayName}
      memberNames={memberNames}
    />
  );
}

