import * as fs from "fs";
import * as path from "path";

// ========================================
// 타입 정의 (v2 스키마)
// ========================================

/**
 * 리스크 레벨 타입
 * 0 = 없음
 * 1 = 경미 (업무 외적 부담, 일정 영향 없음)
 * 2 = 중간 (병목 가능성 있음, 일정 영향 가능)
 * 3 = 심각 (즉각적인 논의 필요, 일정 지연 확정)
 * null = 미정 ("?" 입력 시)
 */
type RiskLevel = 0 | 1 | 2 | 3;

/**
 * 협업 관계 타입
 * pair: 실시간 공동 협업 (pair partner)
 * pre: 앞단 협업자 - 내 작업에 필요한 선행 입력 제공 (pre partner)
 * post: 후단 협업자 - 내 결과물을 받아 다음 단계 수행 (post partner)
 */
type Relation = "pair" | "pre" | "post";

/**
 * 협업자 타입
 */
interface Collaborator {
  name: string;
  relation: Relation;
}

/**
 * v2 Past Week Task 타입
 */
interface PastWeekTask {
  title: string;
  progress: number;
}

/**
 * v2 Past Week 블록 타입
 */
interface PastWeek {
  tasks: PastWeekTask[];
  risk: string[] | null;
  riskLevel: RiskLevel | null;
  collaborators: Collaborator[];
}

/**
 * v2 This Week 블록 타입
 */
interface ThisWeek {
  tasks: string[];
}

/**
 * v2 스크럼 항목 타입
 */
interface ScrumItemV2 {
  name: string;
  domain: string;
  project: string;
  module: string;
  feature: string;
  pastWeek: PastWeek;
  thisWeek: ThisWeek;
}

/**
 * v2 주간 스크럼 데이터 타입
 */
interface WeeklyScrumDataV2 {
  year: number;
  month: number;
  week: string;
  range: string;
  schemaVersion: 2;
  items: ScrumItemV2[];
}

// ========================================
// 파싱 에러 타입
// ========================================

interface ParseError {
  line: number;
  message: string;
  block?: string;
}

// ========================================
// 파싱 함수들
// ========================================

/**
 * 텍스트에서 퍼센트 숫자를 추출합니다.
 * 예: "Rich-note 편집 패널 구조 리팩토링 (50%)" → { title: "Rich-note 편집 패널 구조 리팩토링", progress: 50 }
 */
function extractTaskWithProgress(text: string): PastWeekTask {
  // (%) 또는 % 형태 매칭
  const match = text.match(/^(.+?)\s*\((\d+)%\)\s*$/);
    if (match) {
    return {
      title: match[1].trim(),
      progress: parseInt(match[2], 10),
    };
    }

  // 괄호 없이 %만 있는 경우
  const simpleMatch = text.match(/^(.+?)\s+(\d+)%\s*$/);
  if (simpleMatch) {
    return {
      title: simpleMatch[1].trim(),
      progress: parseInt(simpleMatch[2], 10),
    };
  }

  // 퍼센트가 없는 경우 기본값 0
  return {
    title: text.trim(),
    progress: 0,
  };
}

/**
 * RiskLevel 텍스트를 숫자로 변환합니다.
 * "None", "?" 또는 빈 값은 null로 처리합니다.
 */
function parseRiskLevel(riskLevelText: string): RiskLevel | null {
  const trimmed = riskLevelText.trim().toLowerCase();
  
  // "none", "?" 또는 빈 값은 null (미정)
  if (trimmed === "none" || trimmed === "?" || trimmed === "") {
    return null;
  }
  
  const level = parseInt(trimmed, 10);
  if (!isNaN(level) && level >= 0 && level <= 3) {
    return level as RiskLevel;
  }
  
  return null;
}

/**
 * 헤더 라인을 파싱합니다.
 * [Domain / Project / Module / Feature] 형식
 */
function parseHeader(headerLine: string): {
  domain: string;
  project: string;
  module: string;
  feature: string;
} | null {
  // 대괄호 내부 추출
  const bracketMatch = headerLine.match(/^\[(.+)\]$/);
  if (!bracketMatch) {
    return null;
  }

  // "/" 기준으로 split
  const parts = bracketMatch[1].split("/").map((p) => p.trim());

  if (parts.length < 4) {
    console.warn(`헤더 파싱 경고: 4개 미만의 항목 - ${headerLine}`);
    // 부족한 부분은 빈 문자열로 채움
    while (parts.length < 4) {
      parts.push("");
  }
  }

  return {
    domain: parts[0],
    project: parts[1],
    module: parts[2],
    feature: parts.slice(3).join(" / "), // 4개 이상이면 나머지는 feature에 합침
  };
}

/**
 * relation을 파싱합니다.
 */
function parseRelation(rawRelation: string): Relation | null {
  const relation = rawRelation.toLowerCase().trim();
  
  if (relation === "pair" || relation === "pre" || relation === "post") {
    return relation as Relation;
  }
  
  // 레거시 relation 마이그레이션
  if (relation === "waiting-on") {
    return "pre";
  }
  if (relation === "review" || relation === "handoff") {
    return "pre";
  }
  
  return null;
}

/**
 * 협업자 항목을 파싱합니다.
 * 예: "박민수 (pair)" → { name: "박민수", relation: "pair" }
 */
function parseCollaboratorItem(text: string): Collaborator | null {
  // "이름 (relation)" 형태 파싱
  const match = text.match(/^(.+?)\s*\((.+?)\)$/);
    if (match) {
      const name = match[1].trim();
      const rawRelation = match[2].trim();
    const relation = parseRelation(rawRelation);

      if (relation) {
      return { name, relation };
      } else {
      console.warn(`유효하지 않은 relation: ${rawRelation} (${text})`);
      }
    }
  return null;
}

/**
 * 블록 내에서 특정 섹션의 하위 항목들을 추출합니다.
 */
function extractSectionItems(lines: string[], sectionName: string): string[] {
  const results: string[] = [];
  let inSection = false;
  let sectionIndent = -1;

  for (const line of lines) {
    const trimmed = line.trim();

    // 섹션 시작 감지 (예: "* Tasks", "* Risk", etc.)
    const sectionMatch = trimmed.match(/^[*-]\s*(.+?)(?::(.*))?$/);
    if (sectionMatch) {
      const name = sectionMatch[1].trim();

      if (name.toLowerCase() === sectionName.toLowerCase()) {
        inSection = true;
        sectionIndent = line.search(/[^\s]/); // 현재 들여쓰기 레벨

        // 같은 줄에 값이 있는 경우 (예: "* Risk: None")
        const inlineValue = sectionMatch[2]?.trim();
        if (inlineValue && inlineValue.toLowerCase() !== "none") {
          results.push(inlineValue);
          inSection = false; // 인라인 값만 있으면 섹션 종료
        }
        continue;
      } else if (inSection) {
        // 같은 레벨의 다른 섹션 시작 → 현재 섹션 종료
        const currentIndent = line.search(/[^\s]/);
        if (currentIndent <= sectionIndent) {
          inSection = false;
        }
      }
    }

    if (inSection) {
      // 들여쓰기된 항목 추출
      const itemMatch = trimmed.match(/^[*-]\s*(.+)$/);
      if (itemMatch) {
        results.push(itemMatch[1].trim());
      }
    }
  }

  return results;
}

/**
 * 단일 라인 필드를 파싱합니다.
 * 예: "* Name: 김서연" → "김서연"
 */
function parseSingleField(lines: string[], fieldName: string): string {
  const regex = new RegExp(`^[*-]\\s*${fieldName}:\\s*(.*)$`, "i");
  for (const line of lines) {
    const match = line.trim().match(regex);
    if (match) {
      return match[1].trim();
    }
  }
  return "";
}

/**
 * Define 블록에서 필드 값을 추출합니다.
 */
function parseDefineBlock(
  lines: string[]
): { domain: string; project: string; module: string; feature: string } | null {
  let inDefine = false;
  const result = { domain: "", project: "", module: "", feature: "" };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Define 섹션 시작 감지
    if (trimmed.match(/^[*-]\s*Define\s*$/i)) {
      inDefine = true;
      continue;
    }

    if (inDefine) {
      // 다른 최상위 섹션 시작 시 종료
      if (
        trimmed.match(/^[*-]\s*(Past Week|This Week|Name)\s*$/i) ||
        trimmed.match(/^[*-]\s*(Past Week|This Week|Name):/i)
      ) {
      break;
    }

      // Define 내부 필드 파싱
      const fieldMatch = trimmed.match(/^[*-]\s*(Domain|Project|Module|Feature):\s*(.+)$/i);
      if (fieldMatch) {
        const field = fieldMatch[1].toLowerCase() as keyof typeof result;
        result[field] = fieldMatch[2].trim();
      }
    }
  }

  if (result.domain || result.project || result.module || result.feature) {
    return result;
  }
  return null;
}

/**
 * Past Week 블록을 파싱합니다.
 */
function parsePastWeekBlock(lines: string[]): PastWeek {
  // Past Week 섹션 찾기
  let pastWeekStart = -1;
  let pastWeekEnd = lines.length;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.match(/^[*-]\s*Past Week\s*$/i)) {
      pastWeekStart = i;
    } else if (pastWeekStart >= 0 && trimmed.match(/^[*-]\s*This Week\s*$/i)) {
      pastWeekEnd = i;
      break;
    }
  }
  
  if (pastWeekStart < 0) {
    return {
      tasks: [],
      risk: null,
      riskLevel: null,
      collaborators: [],
    };
}

  const pastWeekLines = lines.slice(pastWeekStart, pastWeekEnd);

  // Tasks 추출
  const taskTexts = extractSectionItems(pastWeekLines, "Tasks");
  const tasks = taskTexts.map(extractTaskWithProgress);

  // Risk 추출
  const riskTexts = extractSectionItems(pastWeekLines, "Risk");
  const filteredRisks = riskTexts.filter(
    (r) => r.toLowerCase() !== "none" && r !== "?" && r !== "-"
  );
  const risk = filteredRisks.length > 0 ? filteredRisks : null;

  // RiskLevel 추출
  const riskLevelText = parseSingleField(pastWeekLines, "RiskLevel");
  const riskLevel = parseRiskLevel(riskLevelText);

  // Collaborators 추출
  const collaboratorTexts = extractSectionItems(pastWeekLines, "Collaborators");
  const collaborators: Collaborator[] = [];
  for (const text of collaboratorTexts) {
    if (text.toLowerCase() === "none") continue;
    const collab = parseCollaboratorItem(text);
    if (collab) {
      collaborators.push(collab);
    }
  }

  return { tasks, risk, riskLevel, collaborators };
}

/**
 * This Week 블록을 파싱합니다.
 */
function parseThisWeekBlock(lines: string[]): ThisWeek {
  // This Week 섹션 찾기
  let thisWeekStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.match(/^[*-]\s*This Week\s*$/i)) {
      thisWeekStart = i;
      break;
    }
  }

  if (thisWeekStart < 0) {
    return { tasks: [] };
  }

  const thisWeekLines = lines.slice(thisWeekStart);

  // Tasks 추출
  const taskTexts = extractSectionItems(thisWeekLines, "Tasks");

  return { tasks: taskTexts };
}

/**
 * 텍스트 블록 하나를 ScrumItemV2로 파싱합니다.
 */
function parseBlockV2(block: string, startLine: number): { item: ScrumItemV2 | null; errors: ParseError[] } {
  const errors: ParseError[] = [];
  const rawLines = block.split("\n");
  const lines = rawLines.filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    return { item: null, errors: [] };
  }

  // 첫 줄은 헤더
  const headerLine = lines[0].trim();
  const header = parseHeader(headerLine);
  if (!header) {
    errors.push({
      line: startLine,
      message: `헤더 파싱 실패: ${headerLine}`,
      block: block.substring(0, 100),
    });
    return { item: null, errors };
  }

  // Define 블록 파싱 (있으면 헤더보다 우선)
  const defineBlock = parseDefineBlock(lines);
  const domain = defineBlock?.domain || header.domain;
  const project = defineBlock?.project || header.project;
  const module = defineBlock?.module || header.module;
  const feature = defineBlock?.feature || header.feature;

  // Name 필드 파싱
  const name = parseSingleField(lines, "Name");
  if (!name) {
    errors.push({
      line: startLine,
      message: `Name 필드 누락`,
      block: block.substring(0, 100),
    });
    // 일부 필드 누락되어도 계속 파싱 시도
  }

  // Past Week 블록 파싱
  const pastWeek = parsePastWeekBlock(lines);

  // This Week 블록 파싱
  const thisWeek = parseThisWeekBlock(lines);

  // 필수 필드 검증 (경고만, 계속 진행)
  if (pastWeek.tasks.length === 0) {
    errors.push({
      line: startLine,
      message: `Past Week Tasks가 비어있음`,
      block: block.substring(0, 100),
    });
  }

  if (thisWeek.tasks.length === 0) {
    errors.push({
      line: startLine,
      message: `This Week Tasks가 비어있음`,
      block: block.substring(0, 100),
    });
  }

  const item: ScrumItemV2 = {
    name: name || "Unknown",
    domain,
    project,
    module,
    feature,
    pastWeek,
    thisWeek,
  };

  return { item, errors };
}

/**
 * submitted.txt 전체를 파싱하여 ScrumItemV2 배열로 변환합니다.
 */
function parseSubmittedTextV2(content: string): { items: ScrumItemV2[]; errors: ParseError[] } {
  // 빈 줄로 블록 구분
  const blocks = content.split(/\n\s*\n/).filter((block) => block.trim());

  const items: ScrumItemV2[] = [];
  const allErrors: ParseError[] = [];
  let currentLine = 1;

  for (const block of blocks) {
    const { item, errors } = parseBlockV2(block, currentLine);
    if (item) {
      items.push(item);
    }
    allErrors.push(...errors);

    // 다음 블록의 시작 라인 계산
    currentLine += block.split("\n").length + 1; // +1 for empty line
  }

  return { items, errors: allErrors };
}

// ========================================
// 메인 실행
// ========================================

function main(): void {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error("사용법: yarn scrum:parse <year> <month> <week> <range>");
    console.error('예시: yarn scrum:parse 2025 01 W01 "2025-01-06 ~ 2025-01-12"');
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
  const { items, errors } = parseSubmittedTextV2(content);

  // 파싱 에러 출력
  if (errors.length > 0) {
    console.warn("\n⚠️  파싱 경고/에러:");
    for (const error of errors) {
      console.warn(`  [Line ${error.line}] ${error.message}`);
      if (error.block) {
        console.warn(`    → ${error.block}...`);
      }
    }
    console.warn("");
  }

  if (items.length === 0) {
    console.warn("파싱된 항목이 없습니다.");
  }

  // 결과 JSON 생성 (v2 스키마)
  const result: WeeklyScrumDataV2 = {
    year,
    month,
    week,
    range,
    schemaVersion: 2,
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
  console.log(`📋 스키마 버전: v2`);

  if (errors.length > 0) {
    console.log(`⚠️  경고: ${errors.length}개`);
  }
}

main();
