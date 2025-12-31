/**
 * 스냅샷 데이터 추출 유틸리티
 * - CSV 및 JSON 형식으로 변환
 */

import type { ScrumItem } from "@/types/scrum";

/**
 * 스냅샷 데이터를 CSV 형식으로 변환
 */
export function exportSnapshotsToCSV(
  items: ScrumItem[],
  year: number,
  week: string
): string {
  // CSV 헤더
  const headers = [
    "이름",
    "도메인",
    "프로젝트",
    "모듈",
    "주제",
    "계획",
    "계획 진척도(%)",
    "진행",
    "진행 진척도(%)",
    "사유",
    "다음 주",
    "리스크",
    "리스크 레벨",
    "협업자",
  ];

  // CSV 행 생성
  const rows = items.map((item) => {
    // 배열 필드를 줄바꿈으로 연결
    const progress = item.progress.join("\n");
    const next = item.next.join("\n");
    const risk = item.risk ? item.risk.join("\n") : "";

    // 협업자 정보 포맷팅
    const collaborators = item.collaborators
      ? item.collaborators
          .map((c) => {
            const relations = c.relations || (c.relation ? [c.relation] : []);
            const relLabels = relations
              .map((r) => {
                if (r === "pair") return "동시";
                if (r === "pre") return "선행";
                if (r === "post") return "후행";
                return r;
              })
              .join(",");
            return `${c.name}(${relLabels})`;
          })
          .join("; ")
      : "";

    // 리스크 레벨 라벨
    const riskLevelLabel = (() => {
      if (item.riskLevel === null) return "미정";
      if (item.riskLevel === 0) return "없음";
      if (item.riskLevel === 1) return "경미";
      if (item.riskLevel === 2) return "중간";
      if (item.riskLevel === 3) return "심각";
      return "";
    })();

    return [
      item.name,
      item.domain,
      item.project,
      item.module || "",
      item.topic,
      item.plan,
      item.planPercent,
      progress,
      item.progressPercent,
      item.reason || "",
      next,
      risk,
      riskLevelLabel,
      collaborators,
    ];
  });

  // CSV 문자열 생성 (RFC 4180 준수)
  const csvContent = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => {
          const cellStr = String(cell ?? "");
          // 쉼표, 따옴표, 줄바꿈이 있으면 따옴표로 감싸고, 내부 따옴표는 이스케이프
          if (
            cellStr.includes(",") ||
            cellStr.includes('"') ||
            cellStr.includes("\n")
          ) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        })
        .join(",")
    )
    .join("\n");

  // BOM 추가 (Excel에서 한글 제대로 표시)
  return "\uFEFF" + csvContent;
}

/**
 * 스냅샷 데이터를 JSON 형식으로 변환
 */
export function exportSnapshotsToJSON(
  items: ScrumItem[],
  year: number,
  week: string
): string {
  const data = {
    metadata: {
      year,
      week,
      exportedAt: new Date().toISOString(),
      totalCount: items.length,
    },
    items,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * 타임스탬프 파일명 생성 (YYMMDDHHmmss 형식)
 */
function generateTimestampFilename(extension: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  
  return `${yy}${MM}${dd}${HH}${mm}${ss}_snapshots.${extension}`;
}

/**
 * 파일 다운로드
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * 스냅샷 데이터 CSV 다운로드
 */
export function downloadSnapshotsAsCSV(
  items: ScrumItem[],
  year: number,
  week: string
) {
  const csv = exportSnapshotsToCSV(items, year, week);
  const filename = generateTimestampFilename("csv");
  downloadFile(csv, filename, "text/csv;charset=utf-8;");
}

/**
 * 스냅샷 데이터 JSON 다운로드
 */
export function downloadSnapshotsAsJSON(
  items: ScrumItem[],
  year: number,
  week: string
) {
  const json = exportSnapshotsToJSON(items, year, week);
  const filename = generateTimestampFilename("json");
  downloadFile(json, filename, "application/json;charset=utf-8;");
}

