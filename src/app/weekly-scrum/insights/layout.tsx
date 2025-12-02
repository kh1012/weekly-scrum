import {
  getAllInsightData,
  getAvailableInsightWeeks,
  getMockInsightData,
  getLatestInsightWeekKey,
} from "@/lib/insightData";
import { InsightProvider } from "@/context/InsightContext";
import { InsightHeader } from "@/components/insights";
import type { InsightWeekOption } from "@/types/insight";

export default function InsightLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allData = getAllInsightData();
  const weeks = getAvailableInsightWeeks() as InsightWeekOption[];

  // 데이터가 없으면 Mock 데이터 사용
  if (Object.keys(allData).length === 0) {
    const mockData = getMockInsightData();
    const mockKey = `${mockData.year}-${mockData.month}-${mockData.week}`;
    const mockWeeks: InsightWeekOption[] = [
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
      <InsightProvider
        allData={{ [mockKey]: mockData }}
        weeks={mockWeeks}
        initialWeekKey={mockKey}
      >
        <div className="min-h-screen bg-[#f6f8fa]">
          <InsightHeader />
          <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </InsightProvider>
    );
  }

  const initialWeekKey = getLatestInsightWeekKey(weeks);

  return (
    <InsightProvider
      allData={allData}
      weeks={weeks}
      initialWeekKey={initialWeekKey}
    >
      <div className="min-h-screen bg-[#f6f8fa]">
        <InsightHeader />
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </InsightProvider>
  );
}

