export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getWorkspaceRole } from "@/lib/auth/getWorkspaceRole";
import {
  getMenuUsageWeekly,
  getPageUsageWeekly,
  getUserMenuUsageWeekly,
} from "@/lib/data/menuUsage";
import { MenuUsageClient } from "./_components/MenuUsageClient";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Admin-only Menu/Page Usage Analytics Dashboard
 */
export default async function MenuUsagePage({ searchParams }: PageProps) {
  // Check admin role
  const role = await getWorkspaceRole();
  const isAdmin = role === "admin" || role === "manager";

  if (!isAdmin) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;

  // Parse filters
  const weeksParam = resolvedSearchParams.weeks;
  const weeksLimit =
    typeof weeksParam === "string" ? parseInt(weeksParam, 10) : 8;
  const menuGroup =
    typeof resolvedSearchParams.menuGroup === "string"
      ? resolvedSearchParams.menuGroup
      : undefined;
  const eventType =
    typeof resolvedSearchParams.eventType === "string"
      ? resolvedSearchParams.eventType
      : undefined;

  // Fetch data
  const [menuUsage, pageUsage, userMenuUsage] = await Promise.all([
    getMenuUsageWeekly({
      workspaceId: DEFAULT_WORKSPACE_ID,
      weeksLimit,
      menuGroup,
      eventType,
    }),
    getPageUsageWeekly({
      workspaceId: DEFAULT_WORKSPACE_ID,
      weeksLimit,
    }),
    getUserMenuUsageWeekly({
      workspaceId: DEFAULT_WORKSPACE_ID,
      weeksLimit,
    }),
  ]);

  return (
    <MenuUsageClient
      menuUsage={menuUsage}
      pageUsage={pageUsage}
      userMenuUsage={userMenuUsage}
      initialWeeks={weeksLimit}
      initialMenuGroup={menuGroup}
      initialEventType={eventType}
    />
  );
}

