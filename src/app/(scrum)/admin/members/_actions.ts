"use server";

/**
 * Workspace Members Server Actions
 */

import {
  listWorkspaceMembers,
  updateMemberRole,
  updateMemberProfile,
  removeMember,
  type WorkspaceMember,
} from "@/lib/data/workspaceMembers";
import { revalidatePath } from "next/cache";

/**
 * 멤버 목록 조회
 */
export async function listMembersAction(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  try {
    return await listWorkspaceMembers(workspaceId);
  } catch (error) {
    console.error("[MembersAction] List error:", error);
    return [];
  }
}

/**
 * 멤버 정보 업데이트 (role + display_name)
 */
export async function updateMemberAction(
  workspaceId: string,
  userId: string,
  data: {
    role?: string;
    displayName?: string;
  }
): Promise<{
  success: boolean;
  error?: { message: string };
}> {
  try {
    // Role 업데이트
    if (data.role) {
      const roleResult = await updateMemberRole(workspaceId, userId, data.role);
      if (!roleResult.success) {
        return {
          success: false,
          error: { message: roleResult.error || "Role 업데이트 실패" },
        };
      }
    }

    // Display name 업데이트
    if (data.displayName !== undefined) {
      const profileResult = await updateMemberProfile(userId, data.displayName);
      if (!profileResult.success) {
        return {
          success: false,
          error: { message: profileResult.error || "프로필 업데이트 실패" },
        };
      }
    }

    revalidatePath("/admin/members");
    return { success: true };
  } catch (error) {
    console.error("[MembersAction] Update error:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "업데이트 실패",
      },
    };
  }
}

/**
 * 멤버 삭제
 */
export async function deleteMemberAction(
  workspaceId: string,
  userId: string
): Promise<{
  success: boolean;
  error?: { message: string };
}> {
  try {
    const result = await removeMember(workspaceId, userId);
    
    if (!result.success) {
      return {
        success: false,
        error: { message: result.error || "멤버 삭제 실패" },
      };
    }

    revalidatePath("/admin/members");
    return { success: true };
  } catch (error) {
    console.error("[MembersAction] Delete error:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "삭제 실패",
      },
    };
  }
}

