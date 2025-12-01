"use client";

import { useSearchParams } from "next/navigation";
import { useScrumContext } from "@/context/ScrumContext";
import { MatrixView } from "@/components/weekly-scrum/matrix/MatrixView";

export default function MatrixPage() {
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
