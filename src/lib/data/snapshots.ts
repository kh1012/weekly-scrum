import { createClient } from "@/lib/supabase/server";

// 간소화된 타입 정의 (Supabase 스키마와 동기화 필요)
export interface PastWeekTask {
  title: string;
  progress: number;
}

export interface Collaborator {
  name: string;
  relation: "pair" | "pre" | "post";
  relations?: ("pair" | "pre" | "post")[];
}

export interface SnapshotEntry {
  id: string;
  snapshot_id: string;
  name: string;
  domain: string;
  project: string;
  module: string | null;
  feature: string | null;
  past_week_tasks: PastWeekTask[];
  this_week_tasks: string[];
  risk: string[] | null;
  risk_level: number | null;
  collaborators: Collaborator[];
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: string;
  workspace_id: string;
  week_start_date: string;
  week_end_date: string;
  year: number;
  week: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SnapshotWithEntries extends Snapshot {
  entries: SnapshotEntry[];
}

export interface SnapshotInsert {
  workspace_id: string;
  week_start_date: string;
  week_end_date: string;
  year: number;
  week: string;
  created_by?: string | null;
}

export interface SnapshotEntryInsert {
  snapshot_id: string;
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
 * 특정 주차의 스냅샷 조회
 */
export async function getSnapshotByWeek(
  workspaceId: string,
  year: number,
  week: string
): Promise<SnapshotWithEntries | null> {
  const supabase = await createClient();

  const { data: snapshot, error } = await supabase
    .from("snapshots")
    .select("*, entries:snapshot_entries(*)")
    .eq("workspace_id", workspaceId)
    .eq("year", year)
    .eq("week", week)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    console.error("Error fetching snapshot:", error);
    throw error;
  }

  return snapshot as SnapshotWithEntries;
}

/**
 * 최근 N주간 스냅샷 목록 조회
 */
export async function getRecentSnapshots(
  workspaceId: string,
  limit: number = 52
): Promise<SnapshotWithEntries[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("*, entries:snapshot_entries(*)")
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching snapshots:", error);
    throw error;
  }

  return (data || []) as SnapshotWithEntries[];
}

/**
 * 모든 스냅샷 조회 (연도별)
 */
export async function getAllSnapshots(
  workspaceId: string
): Promise<SnapshotWithEntries[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("*, entries:snapshot_entries(*)")
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching all snapshots:", error);
    throw error;
  }

  return (data || []) as SnapshotWithEntries[];
}

/**
 * 스냅샷 생성
 */
export async function createSnapshot(
  snapshot: SnapshotInsert,
  entries: Omit<SnapshotEntryInsert, "snapshot_id">[]
): Promise<SnapshotWithEntries> {
  const supabase = await createClient();

  // 스냅샷 생성
  const { data: createdSnapshot, error: snapshotError } = await supabase
    .from("snapshots")
    .insert(snapshot)
    .select()
    .single();

  if (snapshotError) {
    console.error("Error creating snapshot:", snapshotError);
    throw snapshotError;
  }

  // 엔트리 생성
  const entriesWithSnapshotId = entries.map((entry) => ({
    ...entry,
    snapshot_id: createdSnapshot.id,
  }));

  const { data: createdEntries, error: entriesError } = await supabase
    .from("snapshot_entries")
    .insert(entriesWithSnapshotId)
    .select();

  if (entriesError) {
    console.error("Error creating entries:", entriesError);
    throw entriesError;
  }

  return {
    ...createdSnapshot,
    entries: createdEntries || [],
  };
}

/**
 * 스냅샷 엔트리 업데이트
 */
export async function updateSnapshotEntry(
  entryId: string,
  updates: Partial<SnapshotEntryInsert>
): Promise<SnapshotEntry> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshot_entries")
    .update(updates)
    .eq("id", entryId)
    .select()
    .single();

  if (error) {
    console.error("Error updating entry:", error);
    throw error;
  }

  return data;
}

/**
 * 스냅샷 엔트리 삭제
 */
export async function deleteSnapshotEntry(entryId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("snapshot_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("Error deleting entry:", error);
    throw error;
  }
}

/**
 * 스냅샷 삭제 (엔트리도 cascade 삭제됨)
 */
export async function deleteSnapshot(snapshotId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("snapshots")
    .delete()
    .eq("id", snapshotId);

  if (error) {
    console.error("Error deleting snapshot:", error);
    throw error;
  }
}

/**
 * 사용 가능한 주차 목록 조회
 */
export async function getAvailableWeeks(
  workspaceId: string
): Promise<{ year: number; week: string; weekStart: string; weekEnd: string; key: string }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("year, week, week_start_date, week_end_date")
    .eq("workspace_id", workspaceId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching available weeks:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    year: row.year,
    week: row.week,
    weekStart: row.week_start_date,
    weekEnd: row.week_end_date,
    key: `${row.year}-${row.week}`,
  }));
}

