import * as fs from "fs";
import * as path from "path";

// ========================================
// 타입 정의
// ========================================

type InsightRiskLevel = 0 | 1 | 2 | 3;

interface RiskItem {
  item: string;
  level: InsightRiskLevel;
  action: string;
}

interface ExecutionGapItem {
  name: string;
  project: string;
  gap: number;
  reason: string;
}

interface QuadrantSummaryData {
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  explanation: string[];
}

interface InsightData {
  executiveSummary: string[];
  decisionPoints: string[];
  risks: RiskItem[];
  executionGap: ExecutionGapItem[];
  quadrantSummary: QuadrantSummaryData;
}

interface WeeklyInsightData {
  year: number;
  month: number;
  week: string;
  range: string;
  insight: InsightData;
}

// ========================================
// 파싱 함수들
// ========================================

/**
 * 인사이트 입력 텍스트를 파싱합니다.
 * 
 * 지원 형식 1 (마크다운 - AI 에이전트 출력 형식):
 * ## Weekly Executive Summary
 * - 요약 문장 1
 * 
 * ## Decision Points
 * - 의사결정 항목 1
 * 
 * ## Risks & Required Actions
 * | Risk / Reason | Level | Required Action |
 * |---------------|-------|-----------------|
 * | 리스크 내용 | 2 | 조치 내용 |
 * 
 * ## Execution Gap Analysis
 * - name: 이름 | project: 프로젝트 | gap: -30 | reason: 사유
 * 
 * ## Quadrant Summary
 * q1: 6, q2: 3, q3: 2, q4: 1
 * - 해석 문장 1
 * 
 * 지원 형식 2 (레거시):
 * === EXECUTIVE_SUMMARY ===
 * - 요약 문장 1
 */
function parseInsightText(content: string): InsightData {
  // 마크다운 형식인지 레거시 형식인지 감지
  const isMarkdownFormat = content.includes("## Weekly Executive Summary") || 
                           content.includes("## Decision Points") ||
                           content.includes("## Risks");

  if (isMarkdownFormat) {
    return parseMarkdownFormat(content);
  }

  return parseLegacyFormat(content);
}

/**
 * 마크다운 형식 파싱 (AI 에이전트 출력 형식)
 */
function parseMarkdownFormat(content: string): InsightData {
  const result: InsightData = {
    executiveSummary: [],
    decisionPoints: [],
    risks: [],
    executionGap: [],
    quadrantSummary: {
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
      explanation: [],
    },
  };

  // 섹션별로 분리 (## 헤더 기준)
  const sections = content.split(/^##\s+/m).filter((s) => s.trim());

  for (const section of sections) {
    const lines = section.split("\n");
    const headerLine = lines[0].trim().toLowerCase();
    const sectionContent = lines.slice(1).join("\n").trim();

    if (headerLine.includes("executive summary") || headerLine.includes("weekly executive summary")) {
      result.executiveSummary = parseListItems(sectionContent);
    } else if (headerLine.includes("decision point")) {
      result.decisionPoints = parseListItems(sectionContent);
    } else if (headerLine.includes("risk") && headerLine.includes("action")) {
      result.risks = parseMarkdownRiskTable(sectionContent);
    } else if (headerLine.includes("execution gap")) {
      result.executionGap = parseMarkdownExecutionGap(sectionContent);
    } else if (headerLine.includes("quadrant")) {
      result.quadrantSummary = parseQuadrantSummary(sectionContent);
    }
  }

  return result;
}

/**
 * 마크다운 테이블에서 리스크 항목을 파싱합니다.
 * | Risk / Reason | Level | Required Action |
 * |---------------|-------|-----------------|
 * | 리스크 내용 | 2 | 조치 내용 |
 */
function parseMarkdownRiskTable(content: string): RiskItem[] {
  const lines = content.split("\n").map((l) => l.trim());
  const risks: RiskItem[] = [];

  for (const line of lines) {
    // 테이블 데이터 행 (|로 시작하고 | 로 구분)
    if (line.startsWith("|") && !line.includes("---") && !line.toLowerCase().includes("risk / reason")) {
      const cells = line.split("|").map((c) => c.trim()).filter((c) => c);
      if (cells.length >= 3) {
        const item = cells[0];
        const levelStr = cells[1].replace(/[^\d]/g, ""); // 숫자만 추출
        const action = cells[2];

        const level = parseInt(levelStr, 10);
        const validLevel = (
          level >= 0 && level <= 3 ? level : 0
        ) as InsightRiskLevel;

        if (item && item !== "Risk / Reason") {
          risks.push({ item, level: validLevel, action });
        }
      }
    } else if (line.startsWith("-")) {
      // 리스트 형식도 지원 (레거시 호환)
      const cleanLine = line.substring(1).trim();
      const parts = cleanLine.split("|").map((p) => p.trim());

      const item = extractField(parts, "item") || cleanLine;
      const levelStr = extractField(parts, "level") || "0";
      const action = extractField(parts, "action") || "";

      const level = parseInt(levelStr, 10);
      const validLevel = (
        level >= 0 && level <= 3 ? level : 0
      ) as InsightRiskLevel;

      risks.push({ item, level: validLevel, action });
    }
  }

  return risks;
}

/**
 * 마크다운에서 Execution Gap 항목을 파싱합니다.
 */
function parseMarkdownExecutionGap(content: string): ExecutionGapItem[] {
  const lines = content.split("\n").map((l) => l.trim());
  const gaps: ExecutionGapItem[] = [];

  for (const line of lines) {
    // 테이블 형식 지원
    if (line.startsWith("|") && !line.includes("---")) {
      const cells = line.split("|").map((c) => c.trim()).filter((c) => c);
      // | name | project | gap | reason | 형식
      if (cells.length >= 4 && !cells[0].toLowerCase().includes("name")) {
        const name = cells[0];
        const project = cells[1];
        const gapStr = cells[2].replace(/[^\d-]/g, "");
        const reason = cells[3];

        const gap = parseInt(gapStr, 10) || 0;

        if (name) {
          gaps.push({ name, project, gap, reason });
        }
      }
    } else if (line.startsWith("-")) {
      // 리스트 형식 지원
      const cleanLine = line.substring(1).trim();
      const parts = cleanLine.split("|").map((p) => p.trim());

      const name = extractField(parts, "name") || "";
      const project = extractField(parts, "project") || "";
      const gapStr = extractField(parts, "gap") || "0";
      const reason = extractField(parts, "reason") || "";

      const gap = parseInt(gapStr, 10);

      if (name) {
        gaps.push({ name, project, gap, reason });
      }
    }
  }

  return gaps;
}

/**
 * 레거시 형식 파싱 (=== SECTION_NAME === 형식)
 */
function parseLegacyFormat(content: string): InsightData {
  const sections = content.split(/===\s*(\w+)\s*===/);
  
  const result: InsightData = {
    executiveSummary: [],
    decisionPoints: [],
    risks: [],
    executionGap: [],
    quadrantSummary: {
      q1: 0,
      q2: 0,
      q3: 0,
      q4: 0,
      explanation: [],
    },
  };

  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i].trim().toUpperCase();
    const sectionContent = sections[i + 1]?.trim() || "";

    switch (sectionName) {
      case "EXECUTIVE_SUMMARY":
        result.executiveSummary = parseListItems(sectionContent);
        break;

      case "DECISION_POINTS":
        result.decisionPoints = parseListItems(sectionContent);
        break;

      case "RISKS":
        result.risks = parseRisks(sectionContent);
        break;

      case "EXECUTION_GAP":
        result.executionGap = parseExecutionGap(sectionContent);
        break;

      case "QUADRANT_SUMMARY":
        result.quadrantSummary = parseQuadrantSummary(sectionContent);
        break;
    }
  }

  return result;
}

/**
 * 리스트 항목을 파싱합니다.
 */
function parseListItems(content: string): string[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"))
    .map((line) => line.substring(1).trim())
    .filter((line) => line.length > 0);
}

/**
 * 리스크 항목을 파싱합니다.
 */
function parseRisks(content: string): RiskItem[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"));

  const risks: RiskItem[] = [];

  for (const line of lines) {
    const cleanLine = line.substring(1).trim();
    const parts = cleanLine.split("|").map((p) => p.trim());

    const item = extractField(parts, "item") || cleanLine;
    const levelStr = extractField(parts, "level") || "0";
    const action = extractField(parts, "action") || "";

    const level = parseInt(levelStr, 10);
    const validLevel = (
      level >= 0 && level <= 3 ? level : 0
    ) as InsightRiskLevel;

    risks.push({ item, level: validLevel, action });
  }

  return risks;
}

/**
 * 실행 갭 항목을 파싱합니다.
 */
function parseExecutionGap(content: string): ExecutionGapItem[] {
  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"));

  const gaps: ExecutionGapItem[] = [];

  for (const line of lines) {
    const cleanLine = line.substring(1).trim();
    const parts = cleanLine.split("|").map((p) => p.trim());

    const name = extractField(parts, "name") || "";
    const project = extractField(parts, "project") || "";
    const gapStr = extractField(parts, "gap") || "0";
    const reason = extractField(parts, "reason") || "";

    const gap = parseInt(gapStr, 10);

    if (name) {
      gaps.push({ name, project, gap, reason });
    }
  }

  return gaps;
}

/**
 * 사분면 요약을 파싱합니다.
 */
function parseQuadrantSummary(content: string): QuadrantSummaryData {
  const lines = content.split("\n").map((line) => line.trim());
  
  const result: QuadrantSummaryData = {
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    explanation: [],
  };

  for (const line of lines) {
    if (line.startsWith("-")) {
      result.explanation.push(line.substring(1).trim());
    } else if (line.includes("q1") || line.includes("Q1")) {
      // q1: 6, q2: 3, q3: 2, q4: 1 형식 파싱
      const q1Match = line.match(/q1\s*:\s*(\d+)/i);
      const q2Match = line.match(/q2\s*:\s*(\d+)/i);
      const q3Match = line.match(/q3\s*:\s*(\d+)/i);
      const q4Match = line.match(/q4\s*:\s*(\d+)/i);

      if (q1Match) result.q1 = parseInt(q1Match[1], 10);
      if (q2Match) result.q2 = parseInt(q2Match[1], 10);
      if (q3Match) result.q3 = parseInt(q3Match[1], 10);
      if (q4Match) result.q4 = parseInt(q4Match[1], 10);
    }
  }

  return result;
}

/**
 * 필드를 추출합니다.
 */
function extractField(parts: string[], fieldName: string): string | null {
  for (const part of parts) {
    const match = part.match(new RegExp(`^${fieldName}\\s*:\\s*(.+)$`, "i"));
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

// ========================================
// JSON 직접 입력 지원
// ========================================

/**
 * JSON 파일을 직접 인사이트 데이터로 변환합니다.
 */
function parseInsightJson(content: string): InsightData {
  try {
    const parsed = JSON.parse(content) as InsightData;
    return {
      executiveSummary: parsed.executiveSummary || [],
      decisionPoints: parsed.decisionPoints || [],
      risks: (parsed.risks || []).map((r) => ({
        item: r.item || "",
        level: (r.level >= 0 && r.level <= 3 ? r.level : 0) as InsightRiskLevel,
        action: r.action || "",
      })),
      executionGap: (parsed.executionGap || []).map((e) => ({
        name: e.name || "",
        project: e.project || "",
        gap: e.gap || 0,
        reason: e.reason || "",
      })),
      quadrantSummary: {
        q1: parsed.quadrantSummary?.q1 || 0,
        q2: parsed.quadrantSummary?.q2 || 0,
        q3: parsed.quadrantSummary?.q3 || 0,
        q4: parsed.quadrantSummary?.q4 || 0,
        explanation: parsed.quadrantSummary?.explanation || [],
      },
    };
  } catch {
    throw new Error("유효하지 않은 JSON 형식입니다.");
  }
}

// ========================================
// 메인 실행
// ========================================

function main(): void {
  const args = process.argv.slice(2);

  if (args.length < 4) {
    console.error("사용법: yarn insight:parse <year> <month> <week> <range> [input_file]");
    console.error(
      '예시: yarn insight:parse 2025 12 W01 "2025-12-02 ~ 2025-12-08"'
    );
    console.error(
      '      yarn insight:parse 2025 12 W01 "2025-12-02 ~ 2025-12-08" insight-input.json'
    );
    process.exit(1);
  }

  const [yearStr, monthStr, week, range, inputFile] = args;
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // 월을 2자리로 패딩
  const monthPadded = month.toString().padStart(2, "0");

  let insight: InsightData;

  if (inputFile) {
    // 입력 파일에서 읽기
    const inputPath = path.isAbsolute(inputFile)
      ? inputFile
      : path.join(process.cwd(), inputFile);

    if (!fs.existsSync(inputPath)) {
      console.error(`파일을 찾을 수 없습니다: ${inputPath}`);
      process.exit(1);
    }

    const content = fs.readFileSync(inputPath, "utf-8");

    // JSON인지 텍스트인지 판단
    if (inputFile.endsWith(".json")) {
      insight = parseInsightJson(content);
    } else {
      insight = parseInsightText(content);
    }
  } else {
    // 기본 입력 파일 (data/submitted-insight.txt 또는 data/submitted-insight.json)
    const txtPath = path.join(process.cwd(), "data", "submitted-insight.txt");
    const jsonPath = path.join(process.cwd(), "data", "submitted-insight.json");

    if (fs.existsSync(jsonPath)) {
      const content = fs.readFileSync(jsonPath, "utf-8");
      insight = parseInsightJson(content);
    } else if (fs.existsSync(txtPath)) {
      const content = fs.readFileSync(txtPath, "utf-8");
      insight = parseInsightText(content);
    } else {
      console.error(
        "입력 파일을 찾을 수 없습니다. data/submitted-insight.json 또는 data/submitted-insight.txt를 생성해주세요."
      );
      process.exit(1);
    }
  }

  // 결과 JSON 생성
  const result: WeeklyInsightData = {
    year,
    month,
    week,
    range,
    insight,
  };

  // 저장 경로 생성
  const outputDir = path.join(
    process.cwd(),
    "data",
    "insights",
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

  console.log(`✅ 인사이트 파싱 완료`);
  console.log(`   - Executive Summary: ${insight.executiveSummary.length}개`);
  console.log(`   - Decision Points: ${insight.decisionPoints.length}개`);
  console.log(`   - Risks: ${insight.risks.length}개`);
  console.log(`   - Execution Gap: ${insight.executionGap.length}개`);
  console.log(`   - Quadrant: Q1=${insight.quadrantSummary.q1}, Q2=${insight.quadrantSummary.q2}, Q3=${insight.quadrantSummary.q3}, Q4=${insight.quadrantSummary.q4}`);
  console.log(`📁 저장 위치: ${outputPath}`);
}

main();

