"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

interface PastWeekTask {
  title: string;
  progress: number;
}

interface Collaborator {
  name: string;
  relation: "pair" | "pre" | "post";
  relations?: ("pair" | "pre" | "post")[];
}

interface SnapshotEntryInput {
  name: string;
  domain: string;
  project: string;
  module?: string | null;
  feature?: string | null;
  pastWeekTasks: PastWeekTask[];
  thisWeekTasks: string[];
  risk?: string[] | null;
  riskLevel?: number | null;
  collaborators?: Collaborator[];
}

interface CreateSnapshotInput {
  year: number;
  week: string;
  weekStart: string;
  weekEnd: string;
  entries: SnapshotEntryInput[];
}

/**
 * 새 스냅샷 생성 (Server Action)
 */
export async function createSnapshotAction(input: CreateSnapshotInput) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 스냅샷 생성
  const { data: snapshot, error: snapshotError } = await supabase
    .from("snapshots")
    .insert({
      workspace_id: DEFAULT_WORKSPACE_ID,
      year: input.year,
      week: input.week,
      week_start_date: input.weekStart,
      week_end_date: input.weekEnd,
      author_id: user.id,
    })
    .select("id")
    .single();

  if (snapshotError) {
    console.error("Error creating snapshot:", snapshotError);
    return { success: false, error: snapshotError.message };
  }

  // 엔트리 생성
  if (input.entries.length > 0) {
    const entries = input.entries.map((entry) => ({
      snapshot_id: snapshot.id,
      name: entry.name,
      domain: entry.domain,
      project: entry.project,
      module: entry.module || null,
      feature: entry.feature || null,
      past_week_tasks: entry.pastWeekTasks,
      this_week_tasks: entry.thisWeekTasks,
      risk: entry.risk || null,
      risk_level: entry.riskLevel ?? null,
      collaborators: entry.collaborators || [],
    }));

    const { error: entriesError } = await supabase
      .from("snapshot_entries")
      .insert(entries);

    if (entriesError) {
      console.error("Error creating entries:", entriesError);
      return { success: false, error: entriesError.message };
    }
  }

  revalidatePath("/");
  return { success: true, snapshotId: snapshot.id };
}

/**
 * 스냅샷 엔트리 업데이트 (Server Action)
 */
export async function updateSnapshotEntryAction(
  entryId: string,
  updates: Partial<SnapshotEntryInput>
) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // 업데이트할 데이터 변환
  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.domain !== undefined) updateData.domain = updates.domain;
  if (updates.project !== undefined) updateData.project = updates.project;
  if (updates.module !== undefined) updateData.module = updates.module;
  if (updates.feature !== undefined) updateData.feature = updates.feature;
  if (updates.pastWeekTasks !== undefined)
    updateData.past_week_tasks = updates.pastWeekTasks;
  if (updates.thisWeekTasks !== undefined)
    updateData.this_week_tasks = updates.thisWeekTasks;
  if (updates.risk !== undefined) updateData.risk = updates.risk;
  if (updates.riskLevel !== undefined) updateData.risk_level = updates.riskLevel;
  if (updates.collaborators !== undefined)
    updateData.collaborators = updates.collaborators;

  const { error } = await supabase
    .from("snapshot_entries")
    .update(updateData)
    .eq("id", entryId);

  if (error) {
    console.error("Error updating entry:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * 스냅샷 엔트리 추가 (Server Action)
 */
export async function addSnapshotEntryAction(
  snapshotId: string,
  entry: SnapshotEntryInput
) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const { data, error } = await supabase
    .from("snapshot_entries")
    .insert({
      snapshot_id: snapshotId,
      name: entry.name,
      domain: entry.domain,
      project: entry.project,
      module: entry.module || null,
      feature: entry.feature || null,
      past_week_tasks: entry.pastWeekTasks,
      this_week_tasks: entry.thisWeekTasks,
      risk: entry.risk || null,
      risk_level: entry.riskLevel ?? null,
      collaborators: entry.collaborators || [],
    })
    .select("id")
    .single();

  if (error) {
    console.error("Error adding entry:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true, entryId: data.id };
}

/**
 * 스냅샷 엔트리 삭제 (Server Action)
 */
export async function deleteSnapshotEntryAction(entryId: string) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  const { error } = await supabase
    .from("snapshot_entries")
    .delete()
    .eq("id", entryId);

  if (error) {
    console.error("Error deleting entry:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * 스냅샷 삭제 (Server Action)
 */
export async function deleteSnapshotAction(snapshotId: string) {
  const supabase = await createClient();

  // 인증 확인
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "인증이 필요합니다." };
  }

  // CASCADE 설정으로 엔트리도 자동 삭제됨
  const { error } = await supabase
    .from("snapshots")
    .delete()
    .eq("id", snapshotId);

  if (error) {
    console.error("Error deleting snapshot:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/");
  return { success: true };
}

/**
 * 현재 사용자 정보 조회
 */
export async function getCurrentUserAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null };
  }

  return { user: { id: user.id, email: user.email } };
}

/**
 * 로그아웃
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/");
  return { success: true };
}

