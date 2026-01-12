import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SnapshotsMainView } from "./_components/SnapshotsMainView";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

export default async function ManageSnapshotsPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <SnapshotsMainView userId={user.id} workspaceId={DEFAULT_WORKSPACE_ID} />
  );
}
