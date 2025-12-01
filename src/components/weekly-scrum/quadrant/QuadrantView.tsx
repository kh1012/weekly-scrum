"use client";

import type { ScrumItem } from "@/types/scrum";
import { QuadrantChart } from "./QuadrantChart";
import { EmptyState } from "../common/EmptyState";

interface QuadrantViewProps {
  items: ScrumItem[];
}

export function QuadrantView({ items }: QuadrantViewProps) {
  if (items.length === 0) {
    return <EmptyState message="데이터가 없습니다" />;
  }

  return <QuadrantChart data={items} />;
}
