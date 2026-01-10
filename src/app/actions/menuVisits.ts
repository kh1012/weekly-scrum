"use server";

/**
 * Server actions for menu visit tracking
 */

import { updateMenuVisit } from "@/lib/data/menu";

export async function updateMenuVisitAction(params: {
  workspaceId: string;
  userId: string;
  menuKey: string;
}) {
  return await updateMenuVisit(params);
}

