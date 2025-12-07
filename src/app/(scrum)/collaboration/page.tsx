"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { CollaborationView } from "@/components/weekly-scrum/collaboration";

export default function CollaborationPage() {
  const { filteredItems } = useScrumContext();

  return <CollaborationView items={filteredItems} />;
}

