"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { QuadrantView } from "@/components/weekly-scrum/quadrant";

export default function QuadrantPage() {
  const { filteredItems } = useScrumContext();

  return <QuadrantView items={filteredItems} />;
}

