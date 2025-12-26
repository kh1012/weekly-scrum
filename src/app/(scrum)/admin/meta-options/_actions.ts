"use server";

import { revalidatePath } from "next/cache";
import {
  listMetaOptions,
  createMetaOption,
  updateMetaOption,
  deleteMetaOption,
  toggleMetaOptionActive,
  type MetaOptionCategory,
  type CreateMetaOptionInput,
  type UpdateMetaOptionInput,
  type SnapshotMetaOption,
  type MetaOptionResult,
} from "@/lib/data/snapshotMetaOptions";

/**
 * 메타 옵션 목록 조회 액션
 */
export async function listMetaOptionsAction(
  workspaceId: string,
  category: MetaOptionCategory,
  search?: string
): Promise<SnapshotMetaOption[]> {
  return listMetaOptions(workspaceId, category, {
    search,
    includeInactive: true,
  });
}

/**
 * 메타 옵션 생성 액션
 */
export async function createMetaOptionAction(
  workspaceId: string,
  input: CreateMetaOptionInput
): Promise<MetaOptionResult<SnapshotMetaOption>> {
  const result = await createMetaOption(workspaceId, input);
  
  if (result.success) {
    revalidatePath("/admin/meta-options");
  }
  
  return result;
}

/**
 * 메타 옵션 수정 액션
 */
export async function updateMetaOptionAction(
  workspaceId: string,
  id: string,
  updates: UpdateMetaOptionInput
): Promise<MetaOptionResult<void>> {
  const result = await updateMetaOption(workspaceId, id, updates);
  
  if (result.success) {
    revalidatePath("/admin/meta-options");
  }
  
  return result;
}

/**
 * 메타 옵션 삭제 액션
 */
export async function deleteMetaOptionAction(
  workspaceId: string,
  id: string
): Promise<MetaOptionResult<void>> {
  const result = await deleteMetaOption(workspaceId, id);
  
  if (result.success) {
    revalidatePath("/admin/meta-options");
  }
  
  return result;
}

/**
 * 메타 옵션 활성화 토글 액션
 */
export async function toggleMetaOptionActiveAction(
  workspaceId: string,
  id: string,
  isActive: boolean
): Promise<MetaOptionResult<void>> {
  const result = await toggleMetaOptionActive(workspaceId, id, isActive);
  
  if (result.success) {
    revalidatePath("/admin/meta-options");
  }
  
  return result;
}

