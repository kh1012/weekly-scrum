import { CollaboratorGraphView } from "@/components/weekly-scrum/collaborator-graph/CollaboratorGraphView";

import { getDefaultWorkspaceId } from "@/lib/supabase/mode";

export const dynamic = "force-dynamic";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

export default async function CollaboratorGraphPage() {
  return <CollaboratorGraphView workspaceId={DEFAULT_WORKSPACE_ID} />;
}

