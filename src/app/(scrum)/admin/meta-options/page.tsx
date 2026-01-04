export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";
import { MetaOptionsManager } from "./_components/MetaOptionsManager";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

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
