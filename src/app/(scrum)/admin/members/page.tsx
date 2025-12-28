export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { listWorkspaceMembers } from "@/lib/data/workspaceMembers";
import { MembersManager } from "./_components/MembersManager";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

export default async function AdminMembersPage() {
  const hasAccess = await isAdminOrLeader();

  if (!hasAccess) {
    redirect("/admin");
  }

  // 멤버 목록 조회
  const members = await listWorkspaceMembers(DEFAULT_WORKSPACE_ID);

  return <MembersManager workspaceId={DEFAULT_WORKSPACE_ID} initialMembers={members} />;
}

