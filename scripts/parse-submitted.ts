import * as fs from "fs";
import * as path from "path";

// ========================================
// 타입 정의
// ========================================

/**
 * 리스크 레벨 타입
 * 0 = 없음
 * 1 = 경미 (업무 외적 부담, 일정 영향 없음)
 * 2 = 중간 (병목 가능성 있음, 일정 영향 가능)
 * 3 = 심각 (즉각적인 논의 필요, 일정 지연 확정)
 */
type RiskLevel = 0 | 1 | 2 | 3;

interface ScrumItem {
  name: string;
  domain: string;
  project: string;
  topic: string;
  plan: string;
  planPercent: number;
  progress: string;
  progressPercent: number;
  reason: string; // 계획 대비 실행 미비 시 부연 설명
  next: string;
  risk: string;
  riskLevel: RiskLevel;
}

interface WeeklyScrumData {
  year: number;
  month: number;
  week: string;
  range: string;
  items: ScrumItem[];
}

// ========================================
// 파싱 함수들
// ========================================

/**
 * 텍스트에서 퍼센트 숫자를 추출합니다.
 * 예: "셀 렌더링 구조 개선 60% 완료" → 60
 */
function extractPercent(text: string): number {
  const match = text.match(/(\d+)\s*%/);
  if (match) {
    return parseInt(match[1], 10);
  }
  // 퍼센트가 없는 경우 기본값 0
  return 0;
}

/**
 * RiskLevel 텍스트를 숫자로 변환합니다.
 * 예: "2" → 2
 */
function parseRiskLevel(riskLevelText: string): RiskLevel {
  const level = parseInt(riskLevelText, 10);
  if (level >= 0 && level <= 3) {
    return level as RiskLevel;
  }
  return 0;
}

/**
 * 헤더 라인을 파싱합니다.
 * 예: "[FE / 스프레드시트 / 팀프로젝트 기반 개발]"
 */
function parseHeader(headerLine: string): {
  domain: string;
  project: string;
  topic: string;
} | null {
  const match = headerLine.match(/^\[(.+?)\s*\/\s*(.+?)\s*\/\s*(.+?)\]$/);
  if (!match) {
    return null;
  }
  return {
    domain: match[1].trim(),
    project: match[2].trim(),
    topic: match[3].trim(),
  };
}

/**
 * 블록의 필드를 파싱합니다.
 */
function parseField(lines: string[], fieldName: string): string {
  const fieldPrefix = `- ${fieldName}:`;
  const line = lines.find((l) =>
    l.toLowerCase().startsWith(fieldPrefix.toLowerCase())
  );
  if (line) {
    return line.substring(fieldPrefix.length).trim();
  }
  return "";
}

/**
 * 텍스트 블록 하나를 ScrumItem으로 파싱합니다.
 */
function parseBlock(block: string): ScrumItem | null {
  const lines = block
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return null;
  }

  // 첫 줄은 헤더
  const header = parseHeader(lines[0]);
  if (!header) {
    console.warn(`헤더 파싱 실패: ${lines[0]}`);
    return null;
  }

  // 필드 파싱 (required)
  const name = parseField(lines, "Name");
  const plan = parseField(lines, "Plan");
  const progress = parseField(lines, "Progress");
  const next = parseField(lines, "Next");

  // 필드 파싱 (optional)
  const reason = parseField(lines, "reason"); // 계획 대비 실행 미비 시 부연 설명
  const risk = parseField(lines, "Risk");
  const riskLevelText = parseField(lines, "RiskLevel");

  // 필수 필드 검증
  if (!name) {
    console.warn(`Name 필드 누락: ${block}`);
    return null;
  }
  if (!plan) {
    console.warn(`Plan 필드 누락: ${block}`);
    return null;
  }
  if (!progress) {
    console.warn(`Progress 필드 누락: ${block}`);
    return null;
  }
  if (!next) {
    console.warn(`Next 필드 누락: ${block}`);
    return null;
  }

  const planPercent = extractPercent(plan);
  const progressPercent = extractPercent(progress);
  const riskLevel = parseRiskLevel(riskLevelText);

  return {
    name,
    domain: header.domain,
    project: header.project,
    topic: header.topic,
    plan,
    planPercent,
    progress,
    progressPercent,
    reason,
    next,
    risk,
    riskLevel,
  };
}

/**
 * submitted.txt 전체를 파싱하여 ScrumItem 배열로 변환합니다.
 */
function parseSubmittedText(content: string): ScrumItem[] {
  // 빈 줄로 블록 구분
  const blocks = content.split(/\n\s*\n/).filter((block) => block.trim());

  const items: ScrumItem[] = [];
  for (const block of blocks) {
    const item = parseBlock(block);
    if (item) {
      items.push(item);
    }
  }

  return items;
}

// ========================================
// 메인 실행
// ========================================

function main(): void {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error("사용법: yarn scrum:parse <year> <month> <week> <range>");
    console.error(
      '예시: yarn scrum:parse 2025 01 W01 "2025-01-06 ~ 2025-01-12"'
    );
    process.exit(1);
  }

  const [yearStr, monthStr, week, range] = args;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // 월을 2자리로 패딩
  const monthPadded = month.toString().padStart(2, "0");

  // submitted-scrum.txt 읽기
  const submittedPath = path.join(process.cwd(), "data", "submitted-scrum.txt");

  if (!fs.existsSync(submittedPath)) {
    console.error(`파일을 찾을 수 없습니다: ${submittedPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(submittedPath, "utf-8");
  const items = parseSubmittedText(content);

  if (items.length === 0) {
    console.warn("파싱된 항목이 없습니다.");
  }

  // 결과 JSON 생성
  const result: WeeklyScrumData = {
    year,
    month,
    week,
    range,
    items,
  };

  // 저장 경로 생성
  const outputDir = path.join(
    process.cwd(),
    "data",
    "scrum",
    year.toString(),
    monthPadded
  );

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputFileName = `${year}-${monthPadded}-${week}.json`;
  const outputPath = path.join(outputDir, outputFileName);

  // JSON 파일 저장
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(`✅ 파싱 완료: ${items.length}개 항목`);
  console.log(`📁 저장 위치: ${outputPath}`);
}

main();
