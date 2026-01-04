"use server";

/**
 * Server actions for menu visit tracking
 */

import { updateMenuVisit } from "@/lib/data/menuNotifications";

export async function updateMenuVisitAction(params: {
  workspaceId: string;
  userId: string;
  menuKey: string;
}) {
  return await updateMenuVisit(params);
}

