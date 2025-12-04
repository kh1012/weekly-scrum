import {
  getAllSharesData,
  getAvailableSharesWeeks,
  getLatestSharesWeekKey,
} from "@/lib/sharesData";
import { SharesProvider } from "@/context/SharesContext";
import { SharesHeader } from "@/components/shares";

export default function SharesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const allData = getAllSharesData();
  const weeks = getAvailableSharesWeeks();
  const initialWeekKey = getLatestSharesWeekKey(weeks);

  return (
    <SharesProvider
      allData={allData}
      weeks={weeks}
      initialWeekKey={initialWeekKey}
    >
      <div className="min-h-screen bg-[#f6f8fa]">
        <SharesHeader />
        <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </SharesProvider>
  );
}
