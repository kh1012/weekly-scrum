export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { MetaOptionsManager } from "./_components/MetaOptionsManager";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

export default async function AdminMetaOptionsPage() {
  const hasAccess = await isAdminOrLeader();

  if (!hasAccess) {
    redirect("/admin");
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <MetaOptionsManager workspaceId={DEFAULT_WORKSPACE_ID} />;
}

