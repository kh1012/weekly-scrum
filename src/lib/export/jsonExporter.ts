/**
 * JSON Export 기능
 */

import type { ExportMetadata, JSONExportData, ExportOptions } from "./types";
import { downloadFile, generateDefaultFilename, sanitizeFilename } from "./utils";

/**
 * JSON 데이터를 파일로 export
 */
export async function exportJSON<T = unknown>(
  data: T,
  metadata: Partial<ExportMetadata>,
  options?: ExportOptions
): Promise<void> {
  // 메타데이터 완성
  const fullMetadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    exportType: "json",
    pageInfo: {
      title: metadata.pageInfo?.title || document.title,
      url: metadata.pageInfo?.url || window.location.href,
    },
    ...metadata,
  };

  // Export 데이터 구조
  const exportData: JSONExportData = {
    metadata: fullMetadata,
    data,
  };

  // JSON 문자열 생성 (들여쓰기 포함)
  const jsonString = JSON.stringify(exportData, null, 2);

  // 파일명 결정
  const filename = options?.filename
    ? sanitizeFilename(options.filename)
    : generateDefaultFilename("export", "json");

  // 다운로드
  downloadFile(jsonString, filename, "application/json");
}

/**
 * JSON 데이터를 클립보드에 복사
 */
export async function copyJSONToClipboard<T = unknown>(
  data: T,
  metadata: Partial<ExportMetadata>
): Promise<void> {
  const fullMetadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    exportType: "json",
    pageInfo: {
      title: metadata.pageInfo?.title || document.title,
      url: metadata.pageInfo?.url || window.location.href,
    },
    ...metadata,
  };

  const exportData: JSONExportData = {
    metadata: fullMetadata,
    data,
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  await navigator.clipboard.writeText(jsonString);
}

