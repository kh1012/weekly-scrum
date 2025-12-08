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

interface ScrumItem {
  name: string;
  domain: string;
  project: string;
  module?: string | null;
  topic: string;
  plan: string;
  planPercent: number;
  progress: string[]; // 멀티라인 지원 (배열)
  progressPercent: number;
  reason: string;
  next: string[]; // 멀티라인 지원 (배열)
  risk: string | null; // null = 미정 ("?" 입력 시)
  riskLevel: RiskLevel | null; // null = 미정 ("?" 입력 시)
  collaborators?: Collaborator[];
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
 * 배열인 경우 첫 번째 요소 또는 전체에서 가장 높은 퍼센트를 추출합니다.
 * 예: "셀 렌더링 구조 개선 60% 완료" → 60
 */
function extractPercent(textOrArray: string | string[]): number {
  const texts = Array.isArray(textOrArray) ? textOrArray : [textOrArray];
  
  for (const text of texts) {
    const match = text.match(/(\d+)\s*%/);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  // 퍼센트가 없는 경우 기본값 0
  return 0;
}

/**
 * RiskLevel 텍스트를 숫자로 변환합니다.
 * "?" 또는 빈 값은 null로 처리합니다.
 */
function parseRiskLevel(riskLevelText: string): RiskLevel | null {
  const trimmed = riskLevelText.trim();
  
  // "?" 또는 빈 값은 null (미정)
  if (trimmed === "?" || trimmed === "") {
    return null;
  }
  
  const level = parseInt(trimmed, 10);
  if (!isNaN(level) && level >= 0 && level <= 3) {
    return level as RiskLevel;
  }
  
  return null;
}

/**
 * Risk 텍스트를 파싱합니다.
 * "?" 또는 빈 값은 null로 처리합니다.
 */
function parseRisk(riskText: string): string | null {
  const trimmed = riskText.trim();
  
  // "?" 또는 빈 값은 null (미정)
  if (trimmed === "?" || trimmed === "" || trimmed === "-") {
    return null;
  }
  
  return trimmed;
}

/**
 * 헤더 라인을 파싱합니다.
 * 3개: [Domain / Project / Topic]
 * 4개 이상: [Domain / Project / Module / Topic]
 */
function parseHeader(headerLine: string): {
  domain: string;
  project: string;
  module: string | null;
  topic: string;
} | null {
  // 대괄호 내부 추출
  const bracketMatch = headerLine.match(/^\[(.+)\]$/);
  if (!bracketMatch) {
    return null;
  }

  // "/" 기준으로 split
  const parts = bracketMatch[1].split("/").map((p) => p.trim());

  if (parts.length < 3) {
    return null;
  }

  if (parts.length === 3) {
    // 3개: domain, project, topic
    return {
      domain: parts[0],
      project: parts[1],
      module: null,
      topic: parts[2],
    };
  }

  // 4개 이상: domain, project, module, topic (나머지는 topic에 합침)
  return {
    domain: parts[0],
    project: parts[1],
    module: parts[2],
    topic: parts.slice(3).join(" / "),
  };
}

/**
 * 레거시 relation을 새 스키마로 매핑합니다.
 * waiting-on → pre (선행 협업자)
 * review, handoff → pre (유사한 의미로 매핑)
 */
function migrateRelation(rawRelation: string): Relation | null {
  const relation = rawRelation.toLowerCase().trim();
  
  // 새 스키마 relation
  if (relation === "pair" || relation === "pre" || relation === "post") {
    return relation as Relation;
  }
  
  // 레거시 relation 마이그레이션
  if (relation === "waiting-on") {
    return "pre"; // waiting-on은 선행 협업자를 기다리는 것이므로 pre로 매핑
  }
  if (relation === "review" || relation === "handoff") {
    return "pre"; // review, handoff도 pre로 매핑
  }
  
  return null;
}

/**
 * 협업자 목록을 파싱합니다.
 * 예: "김정빈(pair), 조해용(pre)" → [{ name: "김정빈", relation: "pair" }, ...]
 * 레거시 형식(waiting-on)도 pre로 자동 마이그레이션합니다.
 */
function parseCollaborators(text: string): Collaborator[] {
  if (!text || text.trim() === "") {
    return [];
  }

  const collaborators: Collaborator[] = [];

  // 쉼표로 분리
  const parts = text.split(",").map((p) => p.trim());

  for (const part of parts) {
    // "이름(relation)" 형태 파싱
    const match = part.match(/^(.+?)\((.+?)\)$/);
    if (match) {
      const name = match[1].trim();
      const rawRelation = match[2].trim();
      const relation = migrateRelation(rawRelation);

      if (relation) {
        collaborators.push({ name, relation });
      } else {
        console.warn(`유효하지 않은 relation: ${rawRelation} (${part})`);
      }
    }
  }

  return collaborators;
}

/**
 * 멀티라인 필드를 파싱합니다 (Progress, Next).
 * 
 * 케이스 1: "- Progress: 단일 라인 내용" → ["단일 라인 내용"]
 * 케이스 2: "- Progress" (콜론 없이 끝남)
 *           "  - 항목1"
 *           "  - 항목2" → ["항목1", "항목2"]
 */
function parseMultilineField(rawLines: string[], fieldName: string): string[] {
  const result: string[] = [];
  
  // 필드 시작 위치 찾기
  let fieldStartIndex = -1;
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();
    
    // "- FieldName:" 형태 (단일 라인)
    const singleLineMatch = trimmed.match(new RegExp(`^-\\s*${fieldName}:\\s*(.+)$`, 'i'));
    if (singleLineMatch) {
      const content = singleLineMatch[1].trim();
      if (content) {
        result.push(content);
      }
      return result;
    }
    
    // "- FieldName" 형태 (멀티라인 시작, 콜론 없음 또는 콜론 뒤 내용 없음)
    const multiLineMatch = trimmed.match(new RegExp(`^-\\s*${fieldName}:?\\s*$`, 'i'));
    if (multiLineMatch) {
      fieldStartIndex = i;
      break;
    }
  }
  
  if (fieldStartIndex === -1) {
    return result;
  }
  
  // 멀티라인 항목 수집
  for (let i = fieldStartIndex + 1; i < rawLines.length; i++) {
    const line = rawLines[i];
    
    // 들여쓰기된 항목인지 확인 (공백 또는 탭으로 시작하고 "-" 또는 "*"가 있음)
    const itemMatch = line.match(/^[\s\t]+[-*]\s*(.+)$/);
    if (itemMatch) {
      const content = itemMatch[1].trim();
      if (content) {
        result.push(content);
      }
    } else if (line.trim().startsWith("- ") && !line.match(/^\s/)) {
      // 들여쓰기 없는 새로운 필드 시작 → 멀티라인 종료
      break;
    }
  }
  
  return result;
}

/**
 * 단일 라인 필드를 파싱합니다.
 */
function parseSingleField(lines: string[], fieldName: string): string {
  const fieldPrefix = `- ${fieldName}:`;
  const line = lines.find((l) =>
    l.trim().toLowerCase().startsWith(fieldPrefix.toLowerCase())
  );
  if (line) {
    return line.substring(line.indexOf(':') + 1).trim();
  }
  return "";
}

/**
 * 텍스트 블록 하나를 ScrumItem으로 파싱합니다.
 */
function parseBlock(block: string): ScrumItem | null {
  const rawLines = block.split("\n");
  const lines = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);

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
  const name = parseSingleField(lines, "Name");
  const plan = parseSingleField(lines, "Plan");
  
  // 멀티라인 필드 파싱
  const progress = parseMultilineField(rawLines, "Progress");
  const next = parseMultilineField(rawLines, "Next");
  
  // 필드 파싱 (optional)
  const reason = parseSingleField(lines, "reason");
  const riskText = parseSingleField(lines, "Risk");
  const riskLevelText = parseSingleField(lines, "RiskLevel");
  const collaboratorsText = parseSingleField(lines, "Collaborators");

  // 필수 필드 검증
  if (!name) {
    console.warn(`Name 필드 누락: ${block}`);
    return null;
  }
  if (!plan) {
    console.warn(`Plan 필드 누락: ${block}`);
    return null;
  }
  if (progress.length === 0) {
    console.warn(`Progress 필드 누락: ${block}`);
    return null;
  }
  if (next.length === 0) {
    console.warn(`Next 필드 누락: ${block}`);
    return null;
  }

  const planPercent = extractPercent(plan);
  const progressPercent = extractPercent(progress);
  const risk = parseRisk(riskText);
  const riskLevel = parseRiskLevel(riskLevelText);
  const collaborators = parseCollaborators(collaboratorsText);

  const item: ScrumItem = {
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

  // optional 필드는 값이 있을 때만 추가
  if (header.module) {
    item.module = header.module;
  }
  if (collaborators.length > 0) {
    item.collaborators = collaborators;
  }

  return item;
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
