/**
 * My Snapshot Timeline Client (클라이언트 컴포넌트)
 * 
 * 주차 범위 선택 등 인터랙션을 관리하는 클라이언트 컴포넌트
 */

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SnapshotTimelineEntry } from "@/lib/data/mySnapshotTimeline";
import { MySnapshotTimeline } from "./MySnapshotTimeline";

interface MySnapshotTimelineClientProps {
  entries: SnapshotTimelineEntry[];
  workspaceId: string;
  userId: string;
}

export function MySnapshotTimelineClient({
  entries,
  workspaceId,
  userId,
}: MySnapshotTimelineClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [weeksRange, setWeeksRange] = useState<8 | 12 | 16>(12);

  const handleWeeksRangeChange = (range: 8 | 12 | 16) => {
    setWeeksRange(range);
    
    // URL 파라미터 업데이트 (나중에 서버 측에서 읽을 수 있도록)
    startTransition(() => {
      const url = new URL(window.location.href);
      url.searchParams.set("weeks", range.toString());
      router.push(url.pathname + url.search);
    });
  };

  return (
    <MySnapshotTimeline
      entries={entries}
      weeksRange={weeksRange}
      onWeeksRangeChange={handleWeeksRangeChange}
    />
  );
}

