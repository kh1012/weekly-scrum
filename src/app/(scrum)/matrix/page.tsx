"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useScrumContext } from "@/context/ScrumContext";
import { MatrixView } from "@/components/weekly-scrum/matrix/MatrixView";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

function MatrixContent() {
  const searchParams = useSearchParams();
  const isFullscreen = searchParams.get("fullscreen") === "true";
  const { filteredItems } = useScrumContext();

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-white z-50 p-12">
        <MatrixView items={filteredItems} isFullscreen={true} />
      </div>
    );
  }

  return (
    <div className="flex justify-center px-4">
      <MatrixView items={filteredItems} />
    </div>
  );
}

export default function MatrixPage() {
  return (
    <Suspense fallback={<LogoLoadingSpinner className="py-8" />}>
      <MatrixContent />
    </Suspense>
  );
}
