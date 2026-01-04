export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { listWorkspaceMembers } from "@/lib/data/workspaceMembers";
import { MembersManager } from "./_components/MembersManager";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

export default async function AdminMembersPage() {
  const hasAccess = await isAdminOrLeader();

  if (!hasAccess) {
    redirect("/admin");
  }

  // 멤버 목록 조회
  const members = await listWorkspaceMembers(DEFAULT_WORKSPACE_ID);

  return <MembersManager workspaceId={DEFAULT_WORKSPACE_ID} initialMembers={members} />;
}

