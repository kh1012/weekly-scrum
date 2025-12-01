import * as fs from "fs";
import * as path from "path";
import { WeeklyScrumBoard } from "@/components/weekly-scrum/WeeklyScrumBoard";
import type { WeeklyScrumData } from "@/types/scrum";

interface WeekOption {
  year: number;
  month: number;
  week: string;
  label: string;
  filePath: string;
}

/**
 * 사용 가능한 모든 주차 목록을 가져옵니다.
 */
function getAvailableWeeks(): WeekOption[] {
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
function getAllScrumData(): Record<string, WeeklyScrumData> {
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
function getMockData(): WeeklyScrumData {
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
        progress: "셀 렌더링 구조 개선 60% 완료",
        risk: "Publish 단계에서 race condition 재발 가능성",
        next: "렌더링 최적화 마무리, Publish flow 테스트 2건 추가",
        progressPercent: 60,
      },
      {
        name: "김현",
        domain: "FE",
        project: "워크스페이스",
        topic: "IA 개선",
        progress: "IA 구조 v1 정리 및 Wordings 1차 정합성 검토 완료 100%",
        risk: "API 스펙 미확정으로 컴포넌트 매핑에 일부 모호성 존재",
        next: "IA v1.1 반영 및 기획–FE 매핑표 작성",
        progressPercent: 100,
      },
      {
        name: "이준호",
        domain: "BE",
        project: "인증서비스",
        topic: "OAuth 연동",
        progress: "Google OAuth 연동 80% 완료",
        risk: "토큰 갱신 로직에서 edge case 미처리",
        next: "Apple OAuth 연동 시작, 토큰 갱신 테스트 추가",
        progressPercent: 80,
      },
      {
        name: "박서연",
        domain: "FE",
        project: "대시보드",
        topic: "차트 컴포넌트",
        progress: "D3.js 기반 라인차트 구현 45% 진행중",
        risk: "대용량 데이터셋에서 렌더링 성능 이슈 예상",
        next: "가상화 적용 검토, 범례 컴포넌트 구현",
        progressPercent: 45,
      },
      {
        name: "최민수",
        domain: "BE",
        project: "API Gateway",
        topic: "캐싱 레이어",
        progress: "Redis 캐싱 레이어 구축 완료 100%",
        risk: "캐시 무효화 전략 검증 필요",
        next: "캐시 히트율 모니터링 대시보드 구축",
        progressPercent: 100,
      },
      {
        name: "정다은",
        domain: "FE",
        project: "공통 컴포넌트",
        topic: "디자인 시스템",
        progress: "Button, Input 컴포넌트 Storybook 문서화 90% 완료",
        risk: "기존 컴포넌트와의 호환성 이슈 일부 존재",
        next: "Modal, Toast 컴포넌트 마이그레이션",
        progressPercent: 90,
      },
    ],
  };
}

export default function WeeklyScrumPage() {
  const allData = getAllScrumData();
  const weeks = getAvailableWeeks();

  // 데이터가 없으면 Mock 데이터 사용
  if (Object.keys(allData).length === 0) {
    const mockData = getMockData();
    const mockKey = `${mockData.year}-${mockData.month}-${mockData.week}`;
    return (
      <WeeklyScrumBoard
        allData={{ [mockKey]: mockData }}
        weeks={[{
          year: mockData.year,
          month: mockData.month,
          week: mockData.week,
          label: `${mockData.year}년 ${mockData.month}월 ${mockData.week}`,
          filePath: "",
        }]}
        initialWeekKey={mockKey}
      />
    );
  }

  // 가장 최신 주차를 초기값으로
  const initialWeekKey = weeks.length > 0
    ? `${weeks[0].year}-${weeks[0].month}-${weeks[0].week}`
    : "";

  return (
    <WeeklyScrumBoard
      allData={allData}
      weeks={weeks}
      initialWeekKey={initialWeekKey}
    />
  );
}
