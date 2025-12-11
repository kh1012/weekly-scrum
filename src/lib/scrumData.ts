import "server-only";
import * as fs from "fs";
import * as path from "path";
import type { 
  WeeklyScrumData, 
  WeeklyScrumDataV2, 
  WeeklyScrumDataV3,
  WeeklyScrumDataUnion,
  WeekOption, 
  ScrumItem, 
  ScrumItemV2 
} from "@/types/scrum";

/**
 * v2 ScrumItem을 v1 ScrumItem으로 변환
 */
function convertV2ToV1Item(item: ScrumItemV2): ScrumItem {
  const avgProgress =
    item.pastWeek.tasks.length > 0
      ? Math.round(
          item.pastWeek.tasks.reduce((sum, t) => sum + t.progress, 0) /
            item.pastWeek.tasks.length
        )
      : 0;

  return {
    name: item.name,
    domain: item.domain,
    project: item.project,
    module: item.module || null,
    topic: item.feature, // feature → topic 매핑
    plan: item.pastWeek.tasks.map((t) => `${t.title} (${t.progress}%)`).join(", ") || "",
    planPercent: avgProgress,
    progress: item.pastWeek.tasks.map((t) => `${t.title} (${t.progress}%)`),
    progressPercent: avgProgress,
    reason: "",
    next: item.thisWeek.tasks,
    risk: item.pastWeek.risk,
    riskLevel: item.pastWeek.riskLevel,
    collaborators: item.pastWeek.collaborators,
  };
}

/**
 * 레거시 ScrumItem을 새 스키마로 마이그레이션합니다.
 * - progress: string → string[]
 * - next: string → string[]
 * - risk: string → string[] | null (빈 문자열 또는 "?"는 null로)
 * - riskLevel: number → number | null ("?"는 null로)
 */
function migrateScrumItem(item: Record<string, unknown>): ScrumItem {
  // progress 마이그레이션: string → string[]
  let progress: string[];
  if (Array.isArray(item.progress)) {
    progress = item.progress as string[];
  } else if (typeof item.progress === "string") {
    progress = item.progress.trim() ? [item.progress] : [];
  } else {
    progress = [];
  }

  // next 마이그레이션: string → string[]
  let next: string[];
  if (Array.isArray(item.next)) {
    next = item.next as string[];
  } else if (typeof item.next === "string") {
    next = item.next.trim() ? [item.next] : [];
  } else {
    next = [];
  }

  // risk 마이그레이션: string | string[] → string[] | null
  let risk: string[] | null = null;
  if (Array.isArray(item.risk)) {
    // 이미 배열인 경우
    const filtered = (item.risk as string[]).filter(
      (r) => r && r.trim() !== "" && r.trim() !== "?" && r.trim() !== "-"
    );
    risk = filtered.length > 0 ? filtered : null;
  } else if (typeof item.risk === "string") {
    // 레거시 문자열인 경우 배열로 변환
    const trimmed = item.risk.trim();
    if (trimmed && trimmed !== "?" && trimmed !== "-") {
      risk = [trimmed];
    }
  }

  // riskLevel 마이그레이션: number | string → number | null
  let riskLevel: 0 | 1 | 2 | 3 | null = null;
  if (typeof item.riskLevel === "number") {
    if (item.riskLevel >= 0 && item.riskLevel <= 3) {
      riskLevel = item.riskLevel as 0 | 1 | 2 | 3;
    }
  } else if (typeof item.riskLevel === "string") {
    const parsed = parseInt(item.riskLevel, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 3) {
      riskLevel = parsed as 0 | 1 | 2 | 3;
    }
  }

  return {
    name: item.name as string,
    domain: item.domain as string,
    project: item.project as string,
    module: (item.module as string | null | undefined) ?? null,
    topic: item.topic as string,
    plan: item.plan as string,
    planPercent: item.planPercent as number,
    progress,
    progressPercent: item.progressPercent as number,
    reason: (item.reason as string) || "",
    next,
    risk,
    riskLevel,
    collaborators: item.collaborators as ScrumItem["collaborators"],
  };
}

/**
 * WeeklyScrumData를 마이그레이션합니다.
 * v3/v2 스키마일 경우 v1으로 변환합니다.
 */
function migrateWeeklyScrumData(data: Record<string, unknown>): WeeklyScrumData {
  // v3 스키마 감지 (ISO 주차 기준)
  if (data.schemaVersion === 3) {
    const v3Data = data as unknown as WeeklyScrumDataV3;
    const v1Items = v3Data.items.map(convertV2ToV1Item);
    
    // weekStart에서 월 추출
    const [, month] = v3Data.weekStart.split("-").map(Number);
    
    return {
      year: v3Data.year,
      month: month,
      week: v3Data.week,
      range: `${v3Data.weekStart} ~ ${v3Data.weekEnd}`,
      items: v1Items,
    };
  }
  
  // v2 스키마 감지
  if (data.schemaVersion === 2) {
    const v2Items = data.items as ScrumItemV2[];
    const v1Items = v2Items.map(convertV2ToV1Item);
    return {
      year: data.year as number,
      month: data.month as number,
      week: data.week as string,
      range: data.range as string,
      items: v1Items,
    };
  }

  // v1 또는 레거시 스키마
  const items = (data.items as Record<string, unknown>[]).map(migrateScrumItem);
  return {
    year: data.year as number,
    month: data.month as number,
    week: data.week as string,
    range: data.range as string,
    items,
  };
}

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
