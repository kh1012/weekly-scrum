import { CollaboratorGraphView } from "@/components/weekly-scrum/collaborator-graph/CollaboratorGraphView";

export const dynamic = "force-dynamic";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

export default async function CollaboratorGraphPage() {
  return <CollaboratorGraphView workspaceId={DEFAULT_WORKSPACE_ID} />;
}

