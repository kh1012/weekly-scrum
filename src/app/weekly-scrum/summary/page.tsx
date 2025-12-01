"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { SummaryView } from "@/components/weekly-scrum/summary/SummaryView";

export default function SummaryPage() {
  const { filteredItems } = useScrumContext();

  return <SummaryView items={filteredItems} />;
}

