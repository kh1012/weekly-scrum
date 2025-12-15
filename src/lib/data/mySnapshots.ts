/**
 * 내 스냅샷 데이터 조회 레이어
 * 
 * Supabase에서 현재 사용자의 스냅샷을 조회합니다.
 */

import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type SnapshotRow = Database["public"]["Tables"]["snapshots"]["Row"];
type SnapshotEntryRow = Database["public"]["Tables"]["snapshot_entries"]["Row"];

export interface MySnapshot extends SnapshotRow {
  entries: SnapshotEntryRow[];
  entriesCount: number;
}

export interface ListMySnapshotsByWeekParams {
  workspaceId: string;
  userId: string;
  weekStartDate: string; // YYYY-MM-DD
}

/**
 * 특정 주차의 내 스냅샷 목록 조회
 */
export async function listMySnapshotsByWeek({
  workspaceId,
  userId,
  weekStartDate,
}: ListMySnapshotsByWeekParams): Promise<MySnapshot[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("*, entries:snapshot_entries(*)")
    .eq("workspace_id", workspaceId)
    .eq("created_by", userId)
    .eq("week_start_date", weekStartDate)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("Error fetching my snapshots:", error);
    return [];
  }

  return (data || []).map((snapshot) => ({
    ...snapshot,
    entries: snapshot.entries || [],
    entriesCount: snapshot.entries?.length || 0,
  }));
}

export interface GetSnapshotParams {
  snapshotId: string;
  workspaceId: string;
  userId: string;
}

/**
 * 특정 스냅샷 상세 조회
 */
export async function getSnapshot({
  snapshotId,
  workspaceId,
  userId,
}: GetSnapshotParams): Promise<MySnapshot | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("*, entries:snapshot_entries(*)")
    .eq("id", snapshotId)
    .eq("workspace_id", workspaceId)
    .eq("created_by", userId)
    .single();

  if (error) {
    console.error("Error fetching snapshot:", error);
    return null;
  }

  return {
    ...data,
    entries: data.entries || [],
    entriesCount: data.entries?.length || 0,
  };
}

/**
 * 내가 작성한 스냅샷이 있는 주차 목록 조회
 */
export async function listMySnapshotWeeks({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}): Promise<{ year: number; week: string; weekStartDate: string; weekEndDate: string; count: number }[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select("year, week, week_start_date, week_end_date")
    .eq("workspace_id", workspaceId)
    .eq("created_by", userId)
    .order("week_start_date", { ascending: false });

  if (error) {
    console.error("Error fetching my snapshot weeks:", error);
    return [];
  }

  // 주차별로 그룹핑하여 카운트
  const weekMap = new Map<string, { year: number; week: string; weekStartDate: string; weekEndDate: string; count: number }>();
  
  for (const row of data || []) {
    const key = `${row.year}-${row.week}`;
    if (weekMap.has(key)) {
      weekMap.get(key)!.count++;
    } else {
      weekMap.set(key, {
        year: row.year,
        week: row.week,
        weekStartDate: row.week_start_date,
        weekEndDate: row.week_end_date,
        count: 1,
      });
    }
  }

  return Array.from(weekMap.values());
}

