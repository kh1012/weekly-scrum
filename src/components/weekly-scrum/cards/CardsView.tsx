"use client";

import type { ScrumItem } from "@/types/scrum";
import { ScrumCard } from "./ScrumCard";
import { EmptyState } from "../common/EmptyState";

interface CardsViewProps {
  items: ScrumItem[];
}

export function CardsView({ items }: CardsViewProps) {
  if (items.length === 0) {
    return <EmptyState message="검색 결과가 없습니다" submessage="필터 조건을 변경해보세요" />;
  }

  const inProgressItems = items
    .filter((item) => item.progressPercent < 100)
    .sort((a, b) => b.progressPercent - a.progressPercent);

  const completedItems = items.filter((item) => item.progressPercent >= 100);

  return (
    <div className="space-y-6">
      {/* 진행 중인 항목 */}
      {inProgressItems.length > 0 && (
        <section>
          <SectionHeader color="bg-[#0969da]" title="진행 중" count={inProgressItems.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {inProgressItems.map((item, index) => (
              <ScrumCard
                key={`progress-${item.name}-${item.project}-${item.topic}-${index}`}
                item={item}
                isCompleted={false}
              />
            ))}
          </div>
        </section>
      )}

      {/* 완료된 항목 */}
      {completedItems.length > 0 && (
        <section>
          <SectionHeader color="bg-[#1a7f37]" title="완료" count={completedItems.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {completedItems.map((item, index) => (
              <ScrumCard
                key={`completed-${item.name}-${item.project}-${item.topic}-${index}`}
                item={item}
                isCompleted={true}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SectionHeader({ color, title, count }: { color: string; title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <h2 className="text-sm font-semibold text-[#1f2328]">{title}</h2>
      <span className="text-xs text-[#656d76]">{count}개</span>
    </div>
  );
}

