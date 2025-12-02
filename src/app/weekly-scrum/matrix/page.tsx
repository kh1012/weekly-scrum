"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useScrumContext } from "@/context/ScrumContext";
import { MatrixView } from "@/components/weekly-scrum/matrix/MatrixView";

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

  return <MatrixView items={filteredItems} />;
}

export default function MatrixPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center text-[#656d76]">로딩 중...</div>}>
      <MatrixContent />
    </Suspense>
  );
}
