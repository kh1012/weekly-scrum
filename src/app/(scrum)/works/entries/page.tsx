/**
 * Works Entries Page
 * snapshot_entries 전체 조회 + 필터/검색/페이지네이션
 */

import { createClient } from "@/lib/supabase/server";
import { EntriesFeedView } from "./_components/EntriesFeedView";
import { listWorkspaceMembers } from "@/lib/data/members";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WorksEntriesPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  
  // 필터 파라미터 추출
  const authorId = typeof resolvedParams.author === "string" ? resolvedParams.author : undefined;
  const startDate = typeof resolvedParams.start_date === "string" ? resolvedParams.start_date : undefined;
  const endDate = typeof resolvedParams.end_date === "string" ? resolvedParams.end_date : undefined;
  const hasCollaborators = resolvedParams.has_collaborators === "true";
  const searchQuery = typeof resolvedParams.q === "string" ? resolvedParams.q : undefined;
  const cursor = typeof resolvedParams.cursor === "string" ? resolvedParams.cursor : undefined;
  
  const supabase = await createClient();
  
  // 워크스페이스 멤버 목록 조회 (필터용)
  const members = await listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID });
  
  // 기본 쿼리 (페이지네이션 적용)
  const LIMIT = 20;
  let query = supabase
    .from("snapshot_entries")
    .select(`
      id,
      snapshot_id,
      author_id,
      created_at,
      name,
      domain,
      project,
      module,
      feature,
      past_week_tasks,
      this_week_tasks,
      collaborators
    `)
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .order("created_at", { ascending: false })
    .limit(LIMIT + 1); // +1 to check if there are more results
  
  // 커서 기반 페이지네이션
  if (cursor) {
    query = query.lt("created_at", cursor);
  }
  
  // Author 필터
  if (authorId) {
    query = query.eq("author_id", authorId);
  }
  
  // Date range 필터
  if (startDate) {
    query = query.gte("created_at", startDate);
  }
  if (endDate) {
    // endDate는 해당 날짜의 끝까지 포함
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    query = query.lte("created_at", endDateTime.toISOString());
  }
  
  const { data: entries, error } = await query;
  
  // 협업자 필터 (클라이언트 사이드)
  let filteredEntries = entries || [];
  if (hasCollaborators) {
    filteredEntries = filteredEntries.filter((entry) => {
      const collabs = entry.collaborators as { name: string }[] || [];
      return collabs.length > 0;
    });
  }
  
  // 검색 필터 (클라이언트 사이드)
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredEntries = filteredEntries.filter((entry) => {
      return (
        entry.name?.toLowerCase().includes(lowerQuery) ||
        entry.project?.toLowerCase().includes(lowerQuery) ||
        entry.module?.toLowerCase().includes(lowerQuery) ||
        entry.feature?.toLowerCase().includes(lowerQuery) ||
        entry.domain?.toLowerCase().includes(lowerQuery)
      );
    });
  }
  
  // 페이지네이션 처리
  const hasMore = filteredEntries.length > LIMIT;
  const displayEntries = hasMore ? filteredEntries.slice(0, LIMIT) : filteredEntries;
  const nextCursor = hasMore && displayEntries.length > 0 
    ? displayEntries[displayEntries.length - 1].created_at 
    : null;
  
  // author_id로 프로필 조회
  const authorIds = Array.from(new Set(displayEntries.map(e => e.author_id).filter(Boolean)));
  const { data: profiles } = authorIds.length > 0 
    ? await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", authorIds)
    : { data: [] };
  
  const profileMap = new Map(profiles?.map(p => [p.user_id, p.display_name]) || []);
  
  return (
    <EntriesFeedView
      entries={displayEntries}
      profileMap={profileMap}
      members={members}
      filters={{
        authorId,
        startDate,
        endDate,
        hasCollaborators,
        searchQuery,
      }}
      pagination={{
        hasMore,
        nextCursor,
      }}
      error={error?.message}
    />
  );
}

