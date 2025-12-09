"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { SnapshotViewer } from "@/components/weekly-scrum/snapshots";

export default function SnapshotsPage() {
  const { currentData } = useScrumContext();

  if (!currentData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p style={{ color: "var(--notion-text-muted)" }}>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return <SnapshotViewer />;
}

