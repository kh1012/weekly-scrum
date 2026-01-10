/**
 * 내 스냅샷 엔트리 데이터 레이어
 * 
 * Supabase에서 스냅샷 엔트리를 조회/수정합니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { Database, PastWeekTask, Collaborator } from "@/lib/supabase/types";

type SnapshotEntryRow = Database["public"]["Tables"]["snapshot_entries"]["Row"];
type SnapshotEntryInsert = Database["public"]["Tables"]["snapshot_entries"]["Insert"];

export interface ListEntriesParams {
  snapshotId: string;
  workspaceId: string;
  userId: string;
}

/**
 * 특정 스냅샷의 엔트리 목록 조회
 */
export async function listEntries({
  snapshotId,
}: ListEntriesParams): Promise<SnapshotEntryRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshot_entries")
    .select("*")
    .eq("snapshot_id", snapshotId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching entries:", error);
    return [];
  }

  return data || [];
}

export interface UpsertEntryData {
  id?: string;
  name: string;
  domain: string;
  project: string;
  module?: string | null;
  feature?: string | null;
  past_week_tasks?: PastWeekTask[];
  this_week_tasks?: string[];
  risk?: string[] | null;
  risk_level?: number | null;
  collaborators?: Collaborator[];
}

/**
 * 스냅샷 엔트리 일괄 upsert
 * 새 DB 스키마: risks, collaborators 별도 컬럼
 */
export async function upsertEntries(
  snapshotId: string,
  workspaceId: string,
  authorId: string,
  entries: UpsertEntryData[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  const upsertData: SnapshotEntryInsert[] = entries.map((entry) => ({
    id: entry.id,
    snapshot_id: snapshotId,
    workspace_id: workspaceId,
    author_id: authorId,
    name: entry.name,
    domain: entry.domain,
    project: entry.project,
    module: entry.module || "",
    feature: entry.feature || "",
    past_week: {
      tasks: entry.past_week_tasks || [],
    },
    this_week: {
      tasks: entry.this_week_tasks || [],
    },
    risks: entry.risk || [],
    risk_level: entry.risk_level || 0,
    collaborators: entry.collaborators || [],
  }));

  const { error } = await supabase
    .from("snapshot_entries")
    .upsert(upsertData, { onConflict: "id" });

  if (error) {
    console.error("Error upserting entries:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 스냅샷 엔트리 삭제
 */
export async function deleteEntriesByIds(
  entryIds: string[]
): Promise<{ success: boolean; error?: string }> {
  if (entryIds.length === 0) {
    return { success: true };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("snapshot_entries")
    .delete()
    .in("id", entryIds);

  if (error) {
    console.error("Error deleting entries:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * 특정 주차의 모든 엔트리 조회 (메타데이터 집계용)
 */
export async function listEntriesByWeek({
  workspaceId,
  userId,
  weekStartDate,
}: {
  workspaceId: string;
  userId: string;
  weekStartDate: string;
}): Promise<SnapshotEntryRow[]> {
  const supabase = await createClient();

  // 먼저 해당 주차의 스냅샷 ID 조회
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("snapshots")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId)
    .eq("week_start_date", weekStartDate);

  if (snapshotsError || !snapshots || snapshots.length === 0) {
    return [];
  }

  const snapshotIds = snapshots.map((s) => s.id);

  // 해당 스냅샷들의 엔트리 조회
  const { data: entries, error: entriesError } = await supabase
    .from("snapshot_entries")
    .select("*")
    .in("snapshot_id", snapshotIds);

  if (entriesError) {
    console.error("Error fetching entries by week:", entriesError);
    return [];
  }

  return entries || [];
}

