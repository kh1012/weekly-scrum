"use server";

/**
 * 스냅샷 관리 Server Actions
 * 
 * - updateSnapshotAndEntries: 기존 스냅샷 업데이트
 * - createSnapshotAndEntries: 신규 스냅샷 생성
 */

import { createClient } from "@/lib/supabase/server";
import { getWeekStartDateString, getWeekEndDateString } from "@/lib/date/isoWeek";
import type { PastWeekTask, Collaborator } from "@/lib/supabase/types";
import { revalidatePath } from "next/cache";

const DEFAULT_WORKSPACE_ID = "00000000-0000-0000-0000-000000000001";

export interface SnapshotEntryPayload {
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

export interface UpdateSnapshotPayload {
  entries: SnapshotEntryPayload[];
  deletedEntryIds?: string[];
}

/**
 * 기존 스냅샷 업데이트 (업데이트하기)
 */
export async function updateSnapshotAndEntries(
  snapshotId: string,
  payload: UpdateSnapshotPayload
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();

  // 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 사용자 프로필에서 display_name 가져오기 (name 필드가 비어있을 때 사용)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  
  const defaultName = profile?.display_name || user.email?.split("@")[0] || "익명";

  // 스냅샷 소유권 확인
  const { data: snapshot, error: snapshotError } = await supabase
    .from("snapshots")
    .select("id, author_id")
    .eq("id", snapshotId)
    .eq("workspace_id", DEFAULT_WORKSPACE_ID)
    .single();

  if (snapshotError || !snapshot) {
    return { success: false, error: "스냅샷을 찾을 수 없습니다." };
  }

  if (snapshot.author_id !== user.id) {
    return { success: false, error: "수정 권한이 없습니다." };
  }

  // 스냅샷 updated_at 업데이트
  const { error: updateError } = await supabase
    .from("snapshots")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", snapshotId);

  if (updateError) {
    return { success: false, error: "스냅샷 업데이트 실패: " + updateError.message };
  }

  // 삭제할 엔트리 처리
  if (payload.deletedEntryIds && payload.deletedEntryIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("snapshot_entries")
      .delete()
      .in("id", payload.deletedEntryIds);

    if (deleteError) {
      return { success: false, error: "엔트리 삭제 실패: " + deleteError.message };
    }
  }

  // 엔트리 upsert (실제 DB 스키마에 맞춤)
  if (payload.entries.length > 0) {
    const upsertData = payload.entries.map((entry) => ({
      id: entry.id || crypto.randomUUID(),
      snapshot_id: snapshotId,
      workspace_id: DEFAULT_WORKSPACE_ID,
      author_id: user.id,
      // name이 비어있으면 사용자 프로필에서 가져온 display_name 사용
      name: entry.name?.trim() || defaultName,
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
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertError } = await supabase
      .from("snapshot_entries")
      .upsert(upsertData, { onConflict: "id" });

    if (upsertError) {
      return { success: false, error: "엔트리 저장 실패: " + upsertError.message };
    }
  }

  revalidatePath("/manage/snapshots");
  return { success: true };
}

export interface CreateSnapshotPayload {
  entries: SnapshotEntryPayload[];
}

/**
 * 신규 스냅샷 생성 (신규 등록하기)
 */
export async function createSnapshotAndEntries(
  year: number,
  week: number,
  payload: CreateSnapshotPayload
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
  const supabase = await createClient();

  // 사용자 인증 확인
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 사용자 프로필에서 display_name 가져오기 (name 필드가 비어있을 때 사용)
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();
  
  const defaultName = profile?.display_name || user.email?.split("@")[0] || "익명";

  const weekStartDate = getWeekStartDateString(year, week);
  const weekEndDate = getWeekEndDateString(year, week);
  const weekLabel = `W${week.toString().padStart(2, "0")}`;

  // 스냅샷 생성
  const snapshotId = crypto.randomUUID();
  const { error: snapshotError } = await supabase
    .from("snapshots")
    .insert({
      id: snapshotId,
      workspace_id: DEFAULT_WORKSPACE_ID,
      week_start_date: weekStartDate,
      week_end_date: weekEndDate,
      year: year,
      week: weekLabel,
      author_id: user.id,
    });

  if (snapshotError) {
    return { success: false, error: "스냅샷 생성 실패: " + snapshotError.message };
  }

  // 엔트리 생성 (새 DB 스키마에 맞춤: risks, collaborators 별도 컬럼)
  if (payload.entries.length > 0) {
    const entriesData = payload.entries.map((entry) => ({
      id: crypto.randomUUID(),
      snapshot_id: snapshotId,
      workspace_id: DEFAULT_WORKSPACE_ID,
      author_id: user.id,
      // name이 비어있으면 사용자 프로필에서 가져온 display_name 사용
      name: entry.name?.trim() || defaultName,
      domain: entry.domain || "",
      project: entry.project || "",
      module: entry.module || "",
      feature: entry.feature || "",
      // past_week: tasks만 jsonb로 저장
      past_week: {
        tasks: entry.past_week_tasks || [],
      },
      // this_week: tasks를 jsonb로 저장
      this_week: {
        tasks: entry.this_week_tasks || [],
      },
      // risks: 별도 컬럼 (문자열 배열)
      risks: entry.risk || [],
      risk_level: entry.risk_level || 0,
      // collaborators: 별도 컬럼 ({ name, relation } 객체 배열)
      collaborators: entry.collaborators || [],
    }));

    const { error: entriesError } = await supabase
      .from("snapshot_entries")
      .insert(entriesData);

    if (entriesError) {
      // 롤백: 스냅샷 삭제
      await supabase.from("snapshots").delete().eq("id", snapshotId);
      return { success: false, error: "엔트리 생성 실패: " + entriesError.message };
    }
  }

  revalidatePath("/manage/snapshots");
  return { success: true, snapshotId };
}

/**
 * 데이터 불러오기 → 신규 스냅샷 생성
 */
export async function importToNewSnapshot(
  year: number,
  week: number,
  importedEntries: SnapshotEntryPayload[]
): Promise<{ success: boolean; snapshotId?: string; error?: string }> {
  return createSnapshotAndEntries(year, week, {
    entries: importedEntries,
  });
}

