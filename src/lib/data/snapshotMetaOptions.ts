import { createClient } from "@/lib/supabase/server";

/**
 * 스냅샷 메타 옵션 타입
 */
export type SnapshotMetaOption = {
  id: string;
  workspace_id: string;
  category: "domain" | "project" | "module" | "feature" | "name";
  value: string;
  label?: string;
  description?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * 카테고리별 메타 옵션 조회
 */
export async function getMetaOptionsByCategory(
  workspaceId: string,
  category: SnapshotMetaOption["category"]
): Promise<string[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshot_meta_options")
    .select("value")
    .eq("workspace_id", workspaceId)
    .eq("category", category)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error(
      `Error fetching meta options for category ${category}:`,
      error
    );
    return [];
  }

  return data?.map((item) => item.value) || [];
}

/**
 * 모든 카테고리의 메타 옵션 조회
 */
export async function getAllMetaOptions(workspaceId: string): Promise<{
  domain: string[];
  project: string[];
  module: string[];
  feature: string[];
  name: string[];
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshot_meta_options")
    .select("category, value, order_index")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching all meta options:", error);
    return {
      domain: [],
      project: [],
      module: [],
      feature: [],
      name: [],
    };
  }

  const grouped = {
    domain: [] as string[],
    project: [] as string[],
    module: [] as string[],
    feature: [] as string[],
    name: [] as string[],
  };

  data?.forEach((item) => {
    if (item.category in grouped) {
      grouped[item.category as keyof typeof grouped].push(item.value);
    }
  });

  return grouped;
}

/**
 * 메타 옵션 생성
 */
export async function createMetaOption(
  workspaceId: string,
  category: SnapshotMetaOption["category"],
  value: string,
  label?: string,
  description?: string,
  orderIndex?: number
): Promise<SnapshotMetaOption | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshot_meta_options")
    .insert({
      workspace_id: workspaceId,
      category,
      value,
      label,
      description,
      order_index: orderIndex ?? 0,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating meta option:", error);
    return null;
  }

  return data;
}

/**
 * 메타 옵션 업데이트
 */
export async function updateMetaOption(
  id: string,
  updates: Partial<
    Pick<
      SnapshotMetaOption,
      "value" | "label" | "description" | "order_index" | "is_active"
    >
  >
): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("snapshot_meta_options")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating meta option:", error);
    return false;
  }

  return true;
}

/**
 * 메타 옵션 삭제 (비활성화)
 */
export async function deleteMetaOption(id: string): Promise<boolean> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("snapshot_meta_options")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("Error deleting meta option:", error);
    return false;
  }

  return true;
}

