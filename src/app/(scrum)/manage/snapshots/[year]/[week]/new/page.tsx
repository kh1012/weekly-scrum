import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { NewSnapshotView } from "./_components/NewSnapshotView";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

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

  const displayName = profile?.display_name || user.email?.split("@")[0] || "사용자";

  return (
    <NewSnapshotView 
      year={year} 
      week={week} 
      userId={user.id}
      workspaceId={DEFAULT_WORKSPACE_ID}
      displayName={displayName}
    />
  );
}

