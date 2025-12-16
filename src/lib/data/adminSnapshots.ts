/**
 * Admin Snapshots 데이터 레이어
 * 
 * 관리자 전용 스냅샷 CRUD 함수
 */

import { createClient } from "@/lib/supabase/server";
import type { GnbParams } from "@/lib/ui/gnbParams";
import { getWeekStartDateString, getWeekEndDateString } from "@/lib/date/isoWeek";

export interface AdminSnapshotListItem {
  id: string;
  year: number;
  week: string;
  week_start_date: string;
  week_end_date: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  authorName?: string;
  entriesCount: number;
}

/**
 * 관리자용 스냅샷 목록 조회
 */
export async function listAdminSnapshots({
  workspaceId,
  gnbParams,
  limit = 50,
}: {
  workspaceId: string;
  gnbParams: GnbParams;
  limit?: number;
}): Promise<{ snapshots: AdminSnapshotListItem[]; error?: string }> {
  const supabase = await createClient();

  // 기본 쿼리
  let query = supabase
    .from("snapshots")
    .select(`
      id,
      year,
      week,
      week_start_date,
      week_end_date,
      created_by,
      created_at,
      updated_at
    `)
    .eq("workspace_id", workspaceId)
    .order("year", { ascending: false })
    .order("week", { ascending: false })
    .limit(limit);

  // 주차 필터
  if (gnbParams.year && gnbParams.week) {
    const weekStartDate = getWeekStartDateString(gnbParams.year, gnbParams.week);
    query = query.eq("week_start_date", weekStartDate);
  }

  // 범위 필터
  if (gnbParams.rangeStart && gnbParams.rangeEnd) {
    query = query
      .gte("week_start_date", gnbParams.rangeStart)
      .lte("week_start_date", gnbParams.rangeEnd);
  }

  const { data: snapshots, error } = await query;

  if (error) {
    console.error("[AdminSnapshots] Query error:", error);
    return { snapshots: [], error: error.message };
  }

  // 작성자 ID 목록 추출
  const authorIds = Array.from(
    new Set((snapshots || []).map((s) => s.created_by).filter(Boolean))
  ) as string[];

  // profiles에서 작성자 정보 조회
  let profilesMap: Record<string, string> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", authorIds);

    if (profiles) {
      profilesMap = Object.fromEntries(
        profiles.map((p) => [p.user_id, p.display_name])
      );
    }
  }

  // 스냅샷별 엔트리 수 조회
  const snapshotIds = (snapshots || []).map((s) => s.id);
  let entriesCountMap: Record<string, number> = {};
  if (snapshotIds.length > 0) {
    const { data: entriesCounts } = await supabase
      .from("snapshot_entries")
      .select("snapshot_id")
      .in("snapshot_id", snapshotIds);

    if (entriesCounts) {
      entriesCountMap = entriesCounts.reduce((acc, e) => {
        acc[e.snapshot_id] = (acc[e.snapshot_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }
  }

  // 스냅샷에 작성자 이름과 엔트리 수 추가
  const snapshotsWithAuthor: AdminSnapshotListItem[] = (snapshots || []).map((s) => ({
    ...s,
    authorName: s.created_by ? profilesMap[s.created_by] : undefined,
    entriesCount: entriesCountMap[s.id] || 0,
  }));

  // 검색어 필터 (클라이언트 사이드)
  let filteredSnapshots = snapshotsWithAuthor;
  if (gnbParams.query) {
    const lowerQuery = gnbParams.query.toLowerCase();
    filteredSnapshots = filteredSnapshots.filter(
      (s) =>
        s.week.toLowerCase().includes(lowerQuery) ||
        s.authorName?.toLowerCase().includes(lowerQuery)
    );
  }

  // 작성자 필터
  if (gnbParams.author) {
    filteredSnapshots = filteredSnapshots.filter(
      (s) => s.authorName === gnbParams.author || s.created_by === gnbParams.author
    );
  }

  return { snapshots: filteredSnapshots };
}

/**
 * 스냅샷 상세 조회
 */
export async function getAdminSnapshotDetail({
  snapshotId,
  workspaceId,
}: {
  snapshotId: string;
  workspaceId: string;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshots")
    .select(`
      *,
      entries:snapshot_entries(*)
    `)
    .eq("id", snapshotId)
    .eq("workspace_id", workspaceId)
    .single();

  if (error) {
    return { snapshot: null, error: error.message };
  }

  return { snapshot: data, error: null };
}

/**
 * 스냅샷 일괄 삭제
 */
export async function deleteSnapshotsBulk({
  snapshotIds,
  workspaceId,
}: {
  snapshotIds: string[];
  workspaceId: string;
}): Promise<{ success: boolean; error?: string }> {
  if (snapshotIds.length === 0) {
    return { success: true };
  }

  const supabase = await createClient();

  // 먼저 엔트리 삭제
  const { error: entriesError } = await supabase
    .from("snapshot_entries")
    .delete()
    .in("snapshot_id", snapshotIds);

  if (entriesError) {
    return { success: false, error: "엔트리 삭제 실패: " + entriesError.message };
  }

  // 스냅샷 삭제
  const { error: snapshotsError } = await supabase
    .from("snapshots")
    .delete()
    .in("id", snapshotIds)
    .eq("workspace_id", workspaceId);

  if (snapshotsError) {
    return { success: false, error: "스냅샷 삭제 실패: " + snapshotsError.message };
  }

  return { success: true };
}




