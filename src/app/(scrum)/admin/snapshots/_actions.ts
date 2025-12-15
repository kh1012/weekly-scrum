"use server";

import { deleteSnapshotsBulk } from "@/lib/data/adminSnapshots";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TempSnapshot } from "@/components/weekly-scrum/manage/types";

/**
 * 스냅샷 일괄 삭제 Server Action
 */
export async function deleteSnapshotsBulkAction({
  snapshotIds,
  workspaceId,
}: {
  snapshotIds: string[];
  workspaceId: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await deleteSnapshotsBulk({ snapshotIds, workspaceId });
  
  if (result.success) {
    revalidatePath("/admin/snapshots");
  }
  
  return result;
}

interface SnapshotEntryPayload {
  id?: string;
  name: string;
  domain: string;
  project: string;
  module: string | null;
  feature: string | null;
  past_week_tasks: { title: string; progress: number }[];
  this_week_tasks: string[];
  risk: string[] | null;
  risk_level: number | null;
  collaborators: { name: string; relation?: string; relations?: string[] }[];
}

function convertTempSnapshotToEntry(temp: TempSnapshot): SnapshotEntryPayload {
  return {
    id: temp.isOriginal ? temp.tempId : undefined,
    name: temp.name,
    domain: temp.domain,
    project: temp.project,
    module: temp.module || null,
    feature: temp.feature || null,
    past_week_tasks: temp.pastWeek.tasks,
    this_week_tasks: temp.thisWeek.tasks,
    risk: temp.pastWeek.risk,
    risk_level: temp.pastWeek.riskLevel,
    collaborators: temp.pastWeek.collaborators.map((c) => ({
      name: c.name,
      relation: c.relations?.[0] || c.relation || "pair",
      relations: c.relations,
    })),
  };
}

/**
 * 관리자용 스냅샷 업데이트 Server Action
 */
export async function updateAdminSnapshotAction({
  snapshotId,
  entries,
  deletedEntryIds,
}: {
  snapshotId: string;
  entries: TempSnapshot[];
  deletedEntryIds: string[];
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  try {
    // 1. 삭제할 엔트리 삭제
    if (deletedEntryIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("snapshot_entries")
        .delete()
        .in("id", deletedEntryIds);

      if (deleteError) {
        return { success: false, error: "엔트리 삭제 실패: " + deleteError.message };
      }
    }

    // 2. 기존 엔트리 업데이트 + 새 엔트리 삽입
    for (const temp of entries) {
      const entryData = convertTempSnapshotToEntry(temp);

      if (temp.isOriginal) {
        // 기존 엔트리 업데이트
        const { error: updateError } = await supabase
          .from("snapshot_entries")
          .update({
            name: entryData.name,
            domain: entryData.domain,
            project: entryData.project,
            module: entryData.module,
            feature: entryData.feature,
            past_week_tasks: entryData.past_week_tasks,
            this_week_tasks: entryData.this_week_tasks,
            risk: entryData.risk,
            risk_level: entryData.risk_level,
            collaborators: entryData.collaborators,
            updated_at: new Date().toISOString(),
          })
          .eq("id", temp.tempId);

        if (updateError) {
          return { success: false, error: "엔트리 업데이트 실패: " + updateError.message };
        }
      } else {
        // 새 엔트리 삽입
        const { error: insertError } = await supabase
          .from("snapshot_entries")
          .insert({
            snapshot_id: snapshotId,
            name: entryData.name,
            domain: entryData.domain,
            project: entryData.project,
            module: entryData.module,
            feature: entryData.feature,
            past_week_tasks: entryData.past_week_tasks,
            this_week_tasks: entryData.this_week_tasks,
            risk: entryData.risk,
            risk_level: entryData.risk_level,
            collaborators: entryData.collaborators,
          });

        if (insertError) {
          return { success: false, error: "엔트리 삽입 실패: " + insertError.message };
        }
      }
    }

    // 3. 스냅샷 updated_at 갱신
    const { error: snapshotUpdateError } = await supabase
      .from("snapshots")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", snapshotId);

    if (snapshotUpdateError) {
      return { success: false, error: "스냅샷 업데이트 실패: " + snapshotUpdateError.message };
    }

    revalidatePath(`/admin/snapshots/${snapshotId}`);
    revalidatePath("/admin/snapshots");

    return { success: true };
  } catch (err) {
    return { success: false, error: "예기치 않은 오류가 발생했습니다." };
  }
}

