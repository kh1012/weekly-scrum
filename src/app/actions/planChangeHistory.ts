"use server";

import {
  getPlansChangeHistory,
  type ChangeHistoryResponse,
} from "@/lib/data/planChangeHistory";

export async function getPlansChangeHistoryAction(
  workspaceId: string
): Promise<ChangeHistoryResponse> {
  return await getPlansChangeHistory(workspaceId);
}
