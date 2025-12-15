import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SnapshotsMainView } from "./_components/SnapshotsMainView";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export default async function ManageSnapshotsPage() {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect("/login");
  }

  return (
    <SnapshotsMainView 
      userId={user.id} 
      workspaceId={DEFAULT_WORKSPACE_ID}
    />
  );
}

