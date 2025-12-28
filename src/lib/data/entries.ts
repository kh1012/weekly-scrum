/**
 * Entries 페이지 전용 데이터 조회
 * 워크스페이스 전체 snapshot_entries 조회, 필터, 검색, keyset 페이지네이션 지원
 */

import { createClient } from "@/lib/supabase/server";
import type { GnbParams } from "@/lib/ui/gnbParams";

export interface SnapshotEntryListItem {
  id: string;
  snapshot_id: string;
  name: string;
  description: string | null;
  status: string;
  collaborators: string[] | null;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name?: string;
}

export interface ListSnapshotEntriesResult {
  success: boolean;
  entries?: SnapshotEntryListItem[];
  totalCount?: number;
  nextCursor?: string | null;
  error?: string;
}

interface ListEntriesParams {
  workspaceId: string;
  gnbParams: GnbParams;
  limit?: number;
}

/**
 * 워크스페이스 전체 엔트리 조회
 * - Author 필터 (gnbParams.author)
 * - Date range 필터 (gnbParams.dateRangeStart, gnbParams.dateRangeEnd)
 * - Collaborator toggle (gnbParams.hasCollaborators)
 * - 검색 (gnbParams.query) - name, description 검색
 * - Keyset pagination (gnbParams.cursor)
 */
export async function listSnapshotEntries({
  workspaceId,
  gnbParams,
  limit = 50,
}: ListEntriesParams): Promise<ListSnapshotEntriesResult> {
  try {
    const supabase = await createClient();

    // 1) Base query: snapshot_entries에서 workspace_id로 필터
    let query = supabase
      .from("snapshot_entries")
      .select(
        `
        id,
        snapshot_id,
        name,
        description,
        status,
        collaborators,
        tags,
        created_at,
        updated_at,
        author_id,
        snapshots!inner(workspace_id)
      `,
        { count: "exact" }
      )
      .eq("snapshots.workspace_id", workspaceId);

    // 2) Author filter
    if (gnbParams.author) {
      query = query.eq("author_id", gnbParams.author);
    }

    // 3) Date range filter (created_at 기준)
    if (gnbParams.dateRangeStart) {
      query = query.gte("created_at", gnbParams.dateRangeStart);
    }
    if (gnbParams.dateRangeEnd) {
      // dateRangeEnd는 해당일 23:59:59까지 포함하도록 +1일
      const endDate = new Date(gnbParams.dateRangeEnd);
      endDate.setDate(endDate.getDate() + 1);
      query = query.lt("created_at", endDate.toISOString());
    }

    // 4) Collaborator toggle (collaborators IS NOT NULL AND jsonb_array_length(collaborators) > 0)
    if (gnbParams.hasCollaborators) {
      query = query.not("collaborators", "is", null);
      // jsonb_array_length > 0 체크는 Supabase PostgREST에서 직접 지원하지 않으므로,
      // 클라이언트 측에서 필터링하거나, 빈 배열이 아닌지 확인
      // 여기서는 간단히 not null만 체크하고, 빈 배열은 클라이언트에서 필터링 가능
    }

    // 5) Search: name, description에서 검색 (ilike)
    if (gnbParams.query) {
      const searchTerm = `%${gnbParams.query}%`;
      query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
    }

    // 6) Keyset pagination (created_at desc)
    query = query.order("created_at", { ascending: false });

    if (gnbParams.cursor) {
      // cursor는 created_at timestamp
      query = query.lt("created_at", gnbParams.cursor);
    }

    query = query.limit(limit);

    const { data, error, count } = await query;

    if (error) {
      console.error("[listSnapshotEntries] Supabase error:", error);
      return {
        success: false,
        error: `엔트리 조회 실패: ${error.message}`,
      };
    }

    if (!data) {
      return {
        success: true,
        entries: [],
        totalCount: count || 0,
        nextCursor: null,
      };
    }

    // 7) 결과 변환 (snapshots.workspace_id 제거)
    const entries: SnapshotEntryListItem[] = data.map((row: any) => ({
      id: row.id,
      snapshot_id: row.snapshot_id,
      name: row.name,
      description: row.description,
      status: row.status,
      collaborators: row.collaborators,
      tags: row.tags,
      created_at: row.created_at,
      updated_at: row.updated_at,
      author_id: row.author_id,
    }));

    // 8) hasCollaborators 추가 필터링 (빈 배열 제외)
    let filteredEntries = entries;
    if (gnbParams.hasCollaborators) {
      filteredEntries = entries.filter(
        (e) => e.collaborators && Array.isArray(e.collaborators) && e.collaborators.length > 0
      );
    }

    // 9) Next cursor: 마지막 엔트리의 created_at
    const nextCursor =
      filteredEntries.length === limit
        ? filteredEntries[filteredEntries.length - 1].created_at
        : null;

    // 10) Author 이름 조회 (profiles 테이블에서)
    const authorIds = [...new Set(filteredEntries.map((e) => e.author_id))];
    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", authorIds);

      const profileMap = new Map(
        profiles?.map((p) => [p.user_id, p.display_name]) || []
      );

      filteredEntries = filteredEntries.map((e) => ({
        ...e,
        author_name: profileMap.get(e.author_id),
      }));
    }

    return {
      success: true,
      entries: filteredEntries,
      totalCount: count || 0,
      nextCursor,
    };
  } catch (err) {
    console.error("[listSnapshotEntries] Unexpected error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

