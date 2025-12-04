import { getAllScrumData, getAvailableWeeks, getMockData, getLatestWeekKey } from "@/lib/scrumData";
import { ScrumProvider } from "@/context/ScrumContext";
import { Header, LayoutWrapper } from "@/components/weekly-scrum/common";
import type { WeekOption } from "@/types/scrum";

export default function ScrumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allData = getAllScrumData();
  const weeks = getAvailableWeeks() as WeekOption[];

  // 데이터가 없으면 Mock 데이터 사용
  if (Object.keys(allData).length === 0) {
    const mockData = getMockData();
    const mockKey = `${mockData.year}-${mockData.month}-${mockData.week}`;
    const mockWeeks: WeekOption[] = [
      {
        year: mockData.year,
        month: mockData.month,
        week: mockData.week,
        key: mockKey,
        label: `${mockData.year}년 ${mockData.month}월 ${mockData.week}`,
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
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </LayoutWrapper>
      </ScrumProvider>
    );
  }

  const initialWeekKey = getLatestWeekKey(weeks);

  return (
    <ScrumProvider allData={allData} weeks={weeks} initialWeekKey={initialWeekKey}>
      <LayoutWrapper>
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </LayoutWrapper>
    </ScrumProvider>
  );
}

