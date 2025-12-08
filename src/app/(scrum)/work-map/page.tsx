"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { WorkMapView } from "@/components/weekly-scrum/work-map";

export default function WorkMapPage() {
  const { filteredItems } = useScrumContext();

  return <WorkMapView items={filteredItems} />;
}

