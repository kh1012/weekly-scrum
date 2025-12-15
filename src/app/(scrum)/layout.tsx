import {
  getAllScrumData,
  getAvailableWeeks,
  getMockData,
  getLatestWeekKey,
} from "@/lib/scrumData";
import { getDataSource } from "@/lib/data/supabaseSnapshots";
import { ScrumProvider } from "@/context/ScrumContext";
import { LayoutWrapper, MainContent } from "@/components/weekly-scrum/common";
import type { WeekOption, WeeklyScrumData } from "@/types/scrum";

// 환경변수로 데이터 소스 선택 (기본값: static)
const USE_SUPABASE = process.env.USE_SUPABASE_DATA === "true";
const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

export default async function ScrumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let allData: Record<string, WeeklyScrumData>;
  let weeks: WeekOption[];
  let dataSource: "supabase" | "static" = "static";

  // 데이터 소스 결정
  if (USE_SUPABASE && DEFAULT_WORKSPACE_ID) {
    try {
      const result = await getDataSource(DEFAULT_WORKSPACE_ID);
      allData = result.allData;
      weeks = result.weeks;
      dataSource = result.source;
      console.log(`[ScrumLayout] Data source: ${dataSource}`);
    } catch (error) {
      console.error("[ScrumLayout] Failed to fetch from Supabase:", error);
      allData = getAllScrumData();
      weeks = getAvailableWeeks() as WeekOption[];
    }
  } else {
    // 정적 파일 사용
    allData = getAllScrumData();
    weeks = getAvailableWeeks() as WeekOption[];
  }

  // 데이터가 없으면 Mock 데이터 사용
  if (Object.keys(allData).length === 0) {
    const mockData = getMockData();
    const mockKey = `${mockData.year}-${mockData.week}`;
    const mockWeeks: WeekOption[] = [
      {
        year: mockData.year,
        week: mockData.week,
        weekStart: mockData.range.split(" ~ ")[0],
        weekEnd: mockData.range.split(" ~ ")[1],
        key: mockKey,
        label: `${mockData.year}년 ${mockData.week}`,
        filePath: "",
      },
    ];

    return (
      <ScrumProvider
        allData={{ [mockKey]: mockData }}
        weeks={mockWeeks}
        initialWeekKey={mockKey}
      >
        <LayoutWrapper>
          <MainContent>{children}</MainContent>
        </LayoutWrapper>
      </ScrumProvider>
    );
  }

  const initialWeekKey = getLatestWeekKey(weeks);

  return (
    <ScrumProvider
      allData={allData}
      weeks={weeks}
      initialWeekKey={initialWeekKey}
    >
      <LayoutWrapper>
        <MainContent>{children}</MainContent>
      </LayoutWrapper>
    </ScrumProvider>
  );
}
