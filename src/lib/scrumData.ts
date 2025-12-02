import "server-only";
import * as fs from "fs";
import * as path from "path";
import type { WeeklyScrumData, WeekOption } from "@/types/scrum";

/**
 * 사용 가능한 모든 주차 목록을 가져옵니다.
 */
export function getAvailableWeeks(): WeekOption[] {
  const dataDir = path.join(process.cwd(), "data", "scrum");
  const weeks: WeekOption[] = [];

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
        const data = JSON.parse(content) as WeeklyScrumData;
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
 * 모든 주차 데이터를 가져옵니다.
 */
export function getAllScrumData(): Record<string, WeeklyScrumData> {
  const dataDir = path.join(process.cwd(), "data", "scrum");
  const allData: Record<string, WeeklyScrumData> = {};

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
        const data = JSON.parse(content) as WeeklyScrumData;
        const key = `${data.year}-${data.month}-${data.week}`;
        allData[key] = data;
      }
    }
  }

  return allData;
}

/**
 * Mock 데이터 생성 (실제 데이터가 없을 때 사용)
 */
export function getMockData(): WeeklyScrumData {
  return {
    year: 2025,
    month: 1,
    week: "W01",
    range: "2025-01-06 ~ 2025-01-12",
    items: [
      {
        name: "김현",
        domain: "FE",
        project: "스프레드시트",
        topic: "팀프로젝트 기반 개발",
        plan: "셀 렌더링 구조 개선 100%",
        planPercent: 100,
        progress: "셀 렌더링 구조 개선 60% 완료",
        progressPercent: 60,
        reason: "긴급 버그 대응으로 인한 일정 지연",
        risk: "Publish 단계에서 race condition 재발 가능성",
        riskLevel: 2,
        next: "렌더링 최적화 마무리, Publish flow 테스트 2건 추가",
      },
      {
        name: "김현",
        domain: "FE",
        project: "워크스페이스",
        topic: "IA 개선",
        plan: "IA 구조 v1 정리 100%",
        planPercent: 100,
        progress: "IA 구조 v1 정리 및 Wordings 1차 정합성 검토 완료 100%",
        progressPercent: 100,
        reason: "",
        risk: "",
        riskLevel: 0,
        next: "IA v1.1 반영 및 기획–FE 매핑표 작성",
      },
      {
        name: "이준호",
        domain: "BE",
        project: "인증서비스",
        topic: "OAuth 연동",
        plan: "Google OAuth 연동 100%",
        planPercent: 100,
        progress: "Google OAuth 연동 80% 완료",
        progressPercent: 80,
        reason: "외부 API 문서 변경으로 인한 추가 작업 발생",
        risk: "토큰 갱신 로직에서 edge case 미처리",
        riskLevel: 1,
        next: "Apple OAuth 연동 시작, 토큰 갱신 테스트 추가",
      },
    ],
  };
}

/**
 * 가장 최신 주차 키를 반환
 */
export function getLatestWeekKey(weeks: WeekOption[]): string {
  if (weeks.length === 0) return "";
  return weeks[0].key;
}
