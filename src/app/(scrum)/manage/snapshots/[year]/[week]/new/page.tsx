import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { getMemberNames } from "@/lib/data/members";
import { getAllMetaOptions } from "@/lib/data/snapshots";
import { NewSnapshotView } from "./_components/NewSnapshotView";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

interface NewPageProps {
  params: Promise<{
    year: string;
    week: string;
  }>;
}

export default async function NewSnapshotPage({ params }: NewPageProps) {
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

  // 현재 로그인한 사용자의 display_name 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", user.id)
    .single();

  const displayName = profile?.display_name?.trim() || "사용자";

  // 워크스페이스 멤버 이름 목록 조회
  const memberNames = await getMemberNames();

  // 메타 옵션 조회
  const metaOptions = await getAllMetaOptions(DEFAULT_WORKSPACE_ID);

  return (
    <NewSnapshotView 
      year={year} 
      week={week} 
      userId={user.id}
      workspaceId={DEFAULT_WORKSPACE_ID}
      displayName={displayName}
      memberNames={memberNames}
      domainOptions={metaOptions.domain}
      projectOptions={metaOptions.project}
      moduleOptions={metaOptions.module}
      featureOptions={metaOptions.feature}
    />
  );
}

