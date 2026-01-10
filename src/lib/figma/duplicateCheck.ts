/**
 * 중복 파일 체크 유틸리티
 */

import { createClient } from "@/lib/supabase/browser";

export type DuplicateCheckResult = {
  isDuplicate: boolean;
  existingFile?: {
    id: string;
    file_name: string;
    file_url: string;
  };
};

/**
 * 파일 키로 중복 여부 확인
 */
export async function checkDuplicateFile(
  fileKey: string,
  workspaceId: string
): Promise<DuplicateCheckResult> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("figma_tracked_files")
      .select("id, file_name, file_url")
      .eq("file_key", fileKey)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (error) {
      console.error("[Duplicate Check] Error:", error);
      return { isDuplicate: false };
    }

    if (data) {
      return {
        isDuplicate: true,
        existingFile: data,
      };
    }

    return { isDuplicate: false };
  } catch (error) {
    console.error("[Duplicate Check] Exception:", error);
    return { isDuplicate: false };
  }
}

/**
 * Debounce 유틸리티
 */
export function debounce<T extends unknown[]>(
  func: (...args: T) => void,
  wait: number
): (...args: T) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: T) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}
