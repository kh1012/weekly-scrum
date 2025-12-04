"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { RiskFocusView } from "@/components/weekly-scrum/risks/RiskFocusView";

export default function RisksPage() {
  const { filteredItems } = useScrumContext();

  return <RiskFocusView items={filteredItems} />;
}

