import {
  getAllSharesData,
  getAvailableSharesWeeks,
  getLatestSharesWeekKey,
} from "@/lib/sharesData";
import { SharesProvider } from "@/context/SharesContext";
import { SharesLayoutWrapper } from "@/components/shares";

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
      <SharesLayoutWrapper>
        {children}
      </SharesLayoutWrapper>
    </SharesProvider>
  );
}
