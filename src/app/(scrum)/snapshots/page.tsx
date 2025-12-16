"use client";

import { useScrumContext } from "@/context/ScrumContext";
import { SnapshotViewer } from "@/components/weekly-scrum/snapshots";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

export default function SnapshotsPage() {
  const { currentData } = useScrumContext();

  if (!currentData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LogoLoadingSpinner title="스냅샷을 불러오는 중" />
      </div>
    );
  }

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 lg:-mx-8 px-4 py-6 sm:px-6 lg:px-8 min-h-screen bg-gray-50/80">
      <SnapshotViewer />
    </div>
  );
}

