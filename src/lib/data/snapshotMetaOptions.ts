import { createClient } from "@/lib/supabase/server";
import { isAdminOrLeader } from "@/lib/auth/getWorkspaceRole";

/**
 * 메타 옵션 카테고리 상수
 */
export const META_OPTION_CATEGORIES = [
  "domain",
  "project",
  "module",
  "feature",
  "name",
] as const;

export type MetaOptionCategory = (typeof META_OPTION_CATEGORIES)[number];

/**
 * 카테고리 표시명
 */
export const CATEGORY_LABELS: Record<MetaOptionCategory, string> = {
  domain: "Domain",
  project: "Project",
  module: "Module",
  feature: "Feature",
  name: "Name",
};

/**
 * 스냅샷 메타 옵션 타입
 */
export type SnapshotMetaOption = {
  id: string;
  workspace_id: string;
  category: MetaOptionCategory;
  value: string;
  label?: string | null;
  description?: string | null;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/**
 * 메타 옵션 생성 입력
 */
export type CreateMetaOptionInput = {
  category: MetaOptionCategory;
  value: string;
  label?: string;
  description?: string;
  order_index?: number;
  is_active?: boolean;
};

/**
 * 메타 옵션 업데이트 입력
 */
export type UpdateMetaOptionInput = Partial<
  Pick<
    SnapshotMetaOption,
    "value" | "label" | "description" | "order_index" | "is_active"
  >
>;

/**
 * 에러 결과
 */
export type MetaOptionError = {
  code: string;
  message: string;
};

/**
 * CRUD 결과
 */
export type MetaOptionResult<T> =
  | { success: true; data: T }
  | { success: false; error: MetaOptionError };

/**
 * 메타 옵션 목록 조회 (검색/정렬 지원)
 */
export async function listMetaOptions(
  workspaceId: string,
  category: MetaOptionCategory,
  options?: {
    search?: string;
    includeInactive?: boolean;
  }
): Promise<SnapshotMetaOption[]> {
  const supabase = await createClient();

  let query = supabase
    .from("snapshot_meta_options")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("category", category);

  if (!options?.includeInactive) {
    query = query.eq("is_active", true);
  }

  if (options?.search) {
    const searchTerm = options.search.toLowerCase();
    query = query.or(`value.ilike.%${searchTerm}%,label.ilike.%${searchTerm}%`);
  }

  query = query
    .order("order_index", { ascending: true })
    .order("value", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error(
      `Error fetching meta options for category ${category}:`,
      error
    );
    return [];
  }

  return data || [];
}

/**
 * 카테고리별 메타 옵션 value 목록 조회 (기존 호환)
 */
export async function getMetaOptionsByCategory(
  workspaceId: string,
  category: MetaOptionCategory
): Promise<string[]> {
  const options = await listMetaOptions(workspaceId, category);
  return options.map((item) => item.value);
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
 * 메타 옵션 생성 (admin/leader 전용)
 */
export async function createMetaOption(
  workspaceId: string,
  input: CreateMetaOptionInput
): Promise<MetaOptionResult<SnapshotMetaOption>> {
  // 권한 확인
  const hasAccess = await isAdminOrLeader(workspaceId);
  if (!hasAccess) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "권한이 없습니다. 관리자만 생성할 수 있습니다.",
      },
    };
  }

  // value trim
  const trimmedValue = input.value.trim();
  if (!trimmedValue) {
    return {
      success: false,
      error: {
        code: "INVALID_VALUE",
        message: "value는 필수 항목입니다.",
      },
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("snapshot_meta_options")
    .insert({
      workspace_id: workspaceId,
      category: input.category,
      value: trimmedValue,
      label: input.label || null,
      description: input.description || null,
      order_index: input.order_index ?? 0,
      is_active: input.is_active ?? true,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating meta option:", error);

    // Unique violation
    if (error.code === "23505") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_VALUE",
          message: `이미 존재하는 value입니다: ${trimmedValue}`,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "CREATE_FAILED",
        message: "생성에 실패했습니다.",
      },
    };
  }

  return { success: true, data };
}

/**
 * 메타 옵션 업데이트 (admin/leader 전용)
 */
export async function updateMetaOption(
  workspaceId: string,
  id: string,
  updates: UpdateMetaOptionInput
): Promise<MetaOptionResult<void>> {
  // 권한 확인
  const hasAccess = await isAdminOrLeader(workspaceId);
  if (!hasAccess) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "권한이 없습니다. 관리자만 수정할 수 있습니다.",
      },
    };
  }

  // value trim
  if (updates.value !== undefined) {
    const trimmedValue = updates.value.trim();
    if (!trimmedValue) {
      return {
        success: false,
        error: {
          code: "INVALID_VALUE",
          message: "value는 필수 항목입니다.",
        },
      };
    }
    updates.value = trimmedValue;
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("snapshot_meta_options")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Error updating meta option:", error);

    // Unique violation
    if (error.code === "23505") {
      return {
        success: false,
        error: {
          code: "DUPLICATE_VALUE",
          message: `이미 존재하는 value입니다: ${updates.value}`,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "UPDATE_FAILED",
        message: "수정에 실패했습니다.",
      },
    };
  }

  return { success: true, data: undefined };
}

/**
 * 메타 옵션 삭제 (실제 삭제, admin/leader 전용)
 */
export async function deleteMetaOption(
  workspaceId: string,
  id: string
): Promise<MetaOptionResult<void>> {
  // 권한 확인
  const hasAccess = await isAdminOrLeader(workspaceId);
  if (!hasAccess) {
    return {
      success: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "권한이 없습니다. 관리자만 삭제할 수 있습니다.",
      },
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("snapshot_meta_options")
    .delete()
    .eq("id", id)
    .eq("workspace_id", workspaceId);

  if (error) {
    console.error("Error deleting meta option:", error);
    return {
      success: false,
      error: {
        code: "DELETE_FAILED",
        message: "삭제에 실패했습니다.",
      },
    };
  }

  return { success: true, data: undefined };
}

/**
 * 메타 옵션 활성화 토글 (admin/leader 전용)
 */
export async function toggleMetaOptionActive(
  workspaceId: string,
  id: string,
  isActive: boolean
): Promise<MetaOptionResult<void>> {
  return updateMetaOption(workspaceId, id, { is_active: isActive });
}
