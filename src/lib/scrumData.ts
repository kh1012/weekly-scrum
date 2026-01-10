import "server-only";
import * as fs from "fs";
import * as path from "path";
import type { 
  WeeklyScrumData, 
  WeeklyScrumDataUnion,
  WeekOption, 
} from "@/types/scrum";
import { migrateWeeklyScrumData } from "@/lib/transforms/scrumData";

/**
 * @deprecated 변환 함수들은 @/lib/transforms/scrumData로 이동되었습니다.
 * 이 파일에서는 더 이상 변환 로직을 포함하지 않습니다.
 */

/**
 * 사용 가능한 모든 주차 목록을 가져옵니다.
 * v3 (ISO 주차) 및 v2 (월 내 주차) 폴더 구조 모두 지원
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
    const entries = fs.readdirSync(yearDir);
    
    for (const entry of entries) {
      const entryPath = path.join(yearDir, entry);
      const stat = fs.statSync(entryPath);
      
      if (stat.isFile() && entry.endsWith(".json")) {
        // v3 형식: YYYY/YYYY-WXX.json (ISO 주차)
        const content = fs.readFileSync(entryPath, "utf-8");
        const data = JSON.parse(content) as WeeklyScrumDataUnion;
        
        if (data.schemaVersion === 3) {
          const v3Data = data as WeeklyScrumDataV3;
          weeks.push({
            year: v3Data.year,
            week: v3Data.week,
            weekStart: v3Data.weekStart,
            weekEnd: v3Data.weekEnd,
            key: `${v3Data.year}-${v3Data.week}`,
            label: `${v3Data.year}년 ${v3Data.week}`,
            filePath: entryPath,
          });
        }
      } else if (stat.isDirectory()) {
        // v2 형식: YYYY/MM/YYYY-MM-WXX.json (월 내 주차)
        const monthDir = entryPath;
        const files = fs
          .readdirSync(monthDir)
          .filter((f) => f.endsWith(".json"))
          .sort()
          .reverse();

        for (const file of files) {
          const filePath = path.join(monthDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const data = JSON.parse(content) as WeeklyScrumDataUnion;
          
          if (data.schemaVersion === 2 || !data.schemaVersion) {
            // v2 또는 v1 레거시 데이터를 v3 형식 WeekOption으로 변환
            const v2Data = data as WeeklyScrumDataV2;
            
            // range에서 날짜 추출
            const rangeParts = v2Data.range.split(/\s*~\s*|\s+/);
            const weekStart = rangeParts[0] || "";
            const weekEnd = rangeParts[rangeParts.length - 1] || "";
            
            weeks.push({
              year: v2Data.year,
              week: v2Data.week,
              weekStart,
              weekEnd,
              key: `${v2Data.year}-${v2Data.month}-${v2Data.week}`,
              label: `${v2Data.year}년 ${v2Data.month}월 ${v2Data.week}`,
              filePath,
            });
          }
        }
      }
    }
  }

  // 키 기준 정렬 (최신순)
  weeks.sort((a, b) => {
    // weekStart로 정렬 (최신이 먼저)
    if (a.weekStart && b.weekStart) {
      return b.weekStart.localeCompare(a.weekStart);
    }
    return b.key.localeCompare(a.key);
  });

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
    const entries = fs.readdirSync(yearDir);

    for (const entry of entries) {
      const entryPath = path.join(yearDir, entry);
      const stat = fs.statSync(entryPath);
      
      if (stat.isFile() && entry.endsWith(".json")) {
        // v3 형식: YYYY/YYYY-WXX.json
        const content = fs.readFileSync(entryPath, "utf-8");
        const rawData = JSON.parse(content) as Record<string, unknown>;
        const data = migrateWeeklyScrumData(rawData);
        
        // v3는 year-week 키 사용
        const key = `${data.year}-${data.week}`;
        allData[key] = data;
      } else if (stat.isDirectory()) {
        // v2 형식: YYYY/MM/YYYY-MM-WXX.json
        const monthDir = entryPath;
        const files = fs
          .readdirSync(monthDir)
          .filter((f) => f.endsWith(".json"));

        for (const file of files) {
          const filePath = path.join(monthDir, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const rawData = JSON.parse(content) as Record<string, unknown>;
          const data = migrateWeeklyScrumData(rawData);
          
          // v2/v1은 year-month-week 키 사용
          const key = `${data.year}-${data.month}-${data.week}`;
          allData[key] = data;
        }
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
        progress: ["셀 렌더링 구조 개선 60% 완료"],
        progressPercent: 60,
        reason: "긴급 버그 대응으로 인한 일정 지연",
        risk: ["Publish 단계에서 race condition 재발 가능성"],
        riskLevel: 2,
        next: ["렌더링 최적화 마무리", "Publish flow 테스트 2건 추가"],
      },
      {
        name: "김현",
        domain: "FE",
        project: "워크스페이스",
        topic: "IA 개선",
        plan: "IA 구조 v1 정리 100%",
        planPercent: 100,
        progress: ["IA 구조 v1 정리 및 Wordings 1차 정합성 검토 완료 100%"],
        progressPercent: 100,
        reason: "",
        risk: null,
        riskLevel: 0,
        next: ["IA v1.1 반영 및 기획–FE 매핑표 작성"],
      },
      {
        name: "이준호",
        domain: "BE",
        project: "인증서비스",
        topic: "OAuth 연동",
        plan: "Google OAuth 연동 100%",
        planPercent: 100,
        progress: ["Google OAuth 연동 80% 완료"],
        progressPercent: 80,
        reason: "외부 API 문서 변경으로 인한 추가 작업 발생",
        risk: ["토큰 갱신 로직에서 edge case 미처리"],
        riskLevel: 1,
        next: ["Apple OAuth 연동 시작", "토큰 갱신 테스트 추가"],
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
