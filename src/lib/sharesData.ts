import "server-only";
import * as fs from "fs";
import * as path from "path";
import type { SharesWeekOption, WeeklySharesData } from "@/types/shares";

/**
 * 파일명에서 연도, 월, 주차를 파싱합니다.
 * 예: "2025-12-W01.md" → { year: 2025, month: 12, week: "W01" }
 */
function parseFileName(fileName: string): {
  year: number;
  month: number;
  week: string;
} | null {
  const match = fileName.match(/^(\d{4})-(\d{2})-(W\d{2})\.md$/);
  if (!match) return null;

  return {
    year: parseInt(match[1], 10),
    month: parseInt(match[2], 10),
    week: match[3],
  };
}

/**
 * 사용 가능한 모든 Shares 주차 목록을 가져옵니다.
 */
export function getAvailableSharesWeeks(): SharesWeekOption[] {
  const dataDir = path.join(process.cwd(), "data", "shares");
  const weeks: SharesWeekOption[] = [];

  if (!fs.existsSync(dataDir)) {
    return weeks;
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();

  for (const file of files) {
    const parsed = parseFileName(file);
    if (!parsed) continue;

    const filePath = path.join(dataDir, file);
    const key = `${parsed.year}-${parsed.month}-${parsed.week}`;

    weeks.push({
      year: parsed.year,
      month: parsed.month,
      week: parsed.week,
      key,
      label: `${parsed.year}년 ${parsed.month}월 ${parsed.week}`,
      filePath,
    });
  }

  return weeks;
}

/**
 * 모든 주차 Shares 데이터를 가져옵니다.
 */
export function getAllSharesData(): Record<string, WeeklySharesData> {
  const dataDir = path.join(process.cwd(), "data", "shares");
  const allData: Record<string, WeeklySharesData> = {};

  if (!fs.existsSync(dataDir)) {
    return allData;
  }

  const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".md"));

  for (const file of files) {
    const parsed = parseFileName(file);
    if (!parsed) continue;

    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const key = `${parsed.year}-${parsed.month}-${parsed.week}`;

    allData[key] = {
      year: parsed.year,
      month: parsed.month,
      week: parsed.week,
      key,
      content,
    };
  }

  return allData;
}

/**
 * 범위 내 Shares 데이터를 병합합니다.
 */
export function mergeSharesDataInRange(
  allData: Record<string, WeeklySharesData>,
  sortedKeys: string[],
  startKey: string,
  endKey: string
): string | null {
  const startIdx = sortedKeys.indexOf(startKey);
  const endIdx = sortedKeys.indexOf(endKey);

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const [fromIdx, toIdx] =
    startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

  const keysInRange = sortedKeys.slice(fromIdx, toIdx + 1);
  const dataInRange = keysInRange
    .map((key) => allData[key])
    .filter((d): d is WeeklySharesData => d !== undefined);

  if (dataInRange.length === 0) {
    return null;
  }

  // 범위 내 모든 마크다운 내용을 합침 (주차별 구분자 포함)
  const mergedContent = dataInRange
    .map((data) => {
      const header = `## ${data.year}년 ${data.month}월 ${data.week}\n\n`;
      return header + data.content;
    })
    .join("\n\n---\n\n");

  return mergedContent;
}

/**
 * 가장 최신 Shares 주차 키를 반환
 */
export function getLatestSharesWeekKey(weeks: SharesWeekOption[]): string {
  if (weeks.length === 0) return "";
  return weeks[0].key;
}
