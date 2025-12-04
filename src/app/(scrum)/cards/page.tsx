"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { CardsView } from "@/components/weekly-scrum/cards/CardsView";

export default function CardsPage() {
  const { filteredItems } = useScrumContext();

  return <CardsView items={filteredItems} />;
}

