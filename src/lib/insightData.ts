import "server-only";
import * as fs from "fs";
import * as path from "path";
import type {
  WeeklyInsightData,
  InsightWeekOption,
  InsightData,
  QuadrantSummaryData,
} from "@/types/insight";

/**
 * 사용 가능한 모든 인사이트 주차 목록을 가져옵니다.
 */
export function getAvailableInsightWeeks(): InsightWeekOption[] {
  const dataDir = path.join(process.cwd(), "data", "insights");
  const weeks: InsightWeekOption[] = [];

  if (!fs.existsSync(dataDir)) {
    return weeks;
  }

  const years = fs
    .readdirSync(dataDir)
    .filter((f) => fs.statSync(path.join(dataDir, f)).isDirectory())
    .sort()
    .reverse();

  for (const year of years) {
    const yearDir = path.join(dataDir, year);
    const months = fs
      .readdirSync(yearDir)
      .filter((f) => fs.statSync(path.join(yearDir, f)).isDirectory())
      .sort()
      .reverse();

    for (const month of months) {
      const monthDir = path.join(yearDir, month);
      const files = fs
        .readdirSync(monthDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse();

      for (const file of files) {
        const filePath = path.join(monthDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content) as WeeklyInsightData;
        weeks.push({
          year: data.year,
          month: data.month,
          week: data.week,
          key: `${data.year}-${data.month}-${data.week}`,
          label: `${data.year}년 ${data.month}월 ${data.week}`,
          filePath,
        });
      }
    }
  }

  return weeks;
}

/**
 * 모든 주차 인사이트 데이터를 가져옵니다.
 */
export function getAllInsightData(): Record<string, WeeklyInsightData> {
  const dataDir = path.join(process.cwd(), "data", "insights");
  const allData: Record<string, WeeklyInsightData> = {};

  if (!fs.existsSync(dataDir)) {
    return allData;
  }

  const years = fs
    .readdirSync(dataDir)
    .filter((f) => fs.statSync(path.join(dataDir, f)).isDirectory());

  for (const year of years) {
    const yearDir = path.join(dataDir, year);
    const months = fs
      .readdirSync(yearDir)
      .filter((f) => fs.statSync(path.join(yearDir, f)).isDirectory());

    for (const month of months) {
      const monthDir = path.join(yearDir, month);
      const files = fs
        .readdirSync(monthDir)
        .filter((f) => f.endsWith(".json"));

      for (const file of files) {
        const filePath = path.join(monthDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content) as WeeklyInsightData;
        const key = `${data.year}-${data.month}-${data.week}`;
        allData[key] = data;
      }
    }
  }

  return allData;
}

/**
 * 범위 내 인사이트 데이터를 병합합니다.
 */
export function mergeInsightDataInRange(
  allData: Record<string, WeeklyInsightData>,
  sortedKeys: string[],
  startKey: string,
  endKey: string
): InsightData | null {
  const startIdx = sortedKeys.indexOf(startKey);
  const endIdx = sortedKeys.indexOf(endKey);

  if (startIdx === -1 || endIdx === -1) {
    return null;
  }

  const [fromIdx, toIdx] =
    startIdx <= endIdx ? [startIdx, endIdx] : [endIdx, startIdx];

  const keysInRange = sortedKeys.slice(fromIdx, toIdx + 1);
  const dataInRange = keysInRange
    .map((key) => allData[key]?.insight)
    .filter((d): d is InsightData => d !== undefined);

  if (dataInRange.length === 0) {
    return null;
  }

  // 병합 로직: 모든 항목을 합치되 중복 제거
  const mergedSummary: string[] = [];
  const mergedDecisionPoints: string[] = [];
  const mergedRisks: InsightData["risks"] = [];
  const mergedExecutionGap: InsightData["executionGap"] = [];
  const mergedQuadrant: QuadrantSummaryData = {
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
    explanation: [],
  };

  for (const data of dataInRange) {
    // Executive Summary 병합
    data.executiveSummary.forEach((s) => {
      if (!mergedSummary.includes(s)) {
        mergedSummary.push(s);
      }
    });

    // Decision Points 병합
    data.decisionPoints.forEach((d) => {
      if (!mergedDecisionPoints.includes(d)) {
        mergedDecisionPoints.push(d);
      }
    });

    // Risks 병합
    data.risks.forEach((r) => {
      const exists = mergedRisks.some(
        (mr) => mr.item === r.item && mr.action === r.action
      );
      if (!exists) {
        mergedRisks.push(r);
      }
    });

    // Execution Gap 병합
    data.executionGap.forEach((e) => {
      const exists = mergedExecutionGap.some(
        (me) => me.name === e.name && me.project === e.project
      );
      if (!exists) {
        mergedExecutionGap.push(e);
      }
    });

    // Quadrant 합산
    mergedQuadrant.q1 += data.quadrantSummary.q1;
    mergedQuadrant.q2 += data.quadrantSummary.q2;
    mergedQuadrant.q3 += data.quadrantSummary.q3;
    mergedQuadrant.q4 += data.quadrantSummary.q4;
    data.quadrantSummary.explanation.forEach((e) => {
      if (!mergedQuadrant.explanation.includes(e)) {
        mergedQuadrant.explanation.push(e);
      }
    });
  }

  return {
    executiveSummary: mergedSummary,
    decisionPoints: mergedDecisionPoints,
    risks: mergedRisks,
    executionGap: mergedExecutionGap,
    quadrantSummary: mergedQuadrant,
  };
}

/**
 * Mock 인사이트 데이터 생성 (실제 데이터가 없을 때 사용)
 */
export function getMockInsightData(): WeeklyInsightData {
  return {
    year: 2025,
    month: 12,
    week: "W01",
    range: "2025-12-02 ~ 2025-12-08",
    insight: {
      executiveSummary: [
        "전체 진행률은 계획 대비 평균 +2% 수준으로 안정적입니다.",
        "리스크 Level 2 이상 항목 2건 발생하여 다음 주 조치가 필요합니다.",
        "FE 셀 렌더링 개선 작업이 예정대로 완료되었습니다.",
      ],
      decisionPoints: [
        "IA v1.1 반영 일정 확정 필요",
        "OAuth 연동 테스트 범위 조정 여부 결정",
      ],
      risks: [
        {
          item: "Publish 플로우 race condition 재발 가능성",
          level: 1,
          action: "핵심 테스트 케이스 3종 추가",
        },
        {
          item: "외부 인증 서버 응답 지연",
          level: 2,
          action: "Fallback 로직 검토 및 retry 전략 정비",
        },
      ],
      executionGap: [
        {
          name: "김정빈",
          project: "권한 시스템",
          gap: -30,
          reason: "요구사항 변경으로 일부 기능을 재구현",
        },
      ],
      quadrantSummary: {
        q1: 6,
        q2: 3,
        q3: 2,
        q4: 1,
        explanation: [
          "Q1 비중이 높아 안정적인 흐름을 유지하고 있습니다.",
          "Q3의 2건은 일정 및 리스크 관리를 위한 중점 검토가 필요합니다.",
        ],
      },
    },
  };
}

/**
 * 가장 최신 인사이트 주차 키를 반환
 */
export function getLatestInsightWeekKey(weeks: InsightWeekOption[]): string {
  if (weeks.length === 0) return "";
  return weeks[0].key;
}

