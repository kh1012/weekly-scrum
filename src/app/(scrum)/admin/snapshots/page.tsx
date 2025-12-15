import { Suspense } from "react";
import { AdminSnapshotsView } from "./_components/AdminSnapshotsView";
import { listAdminSnapshots } from "@/lib/data/adminSnapshots";
import { parseGnbParams } from "@/lib/ui/gnbParams";

const DEFAULT_WORKSPACE_ID = process.env.DEFAULT_WORKSPACE_ID || "";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * 전체 스냅샷 목록 페이지 (관리자 전용)
 */
export default async function AdminSnapshotsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  
  // URL searchParams를 GnbParams로 변환
  const params = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.set(key, value);
    }
  });
  const gnbParams = parseGnbParams(params);

  // 데이터 조회
  const { snapshots, error } = await listAdminSnapshots({
    workspaceId: DEFAULT_WORKSPACE_ID,
    gnbParams,
  });

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <AdminSnapshotsView
        snapshots={snapshots}
        error={error}
        gnbParams={gnbParams}
        workspaceId={DEFAULT_WORKSPACE_ID}
      />
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-16 bg-gray-100 rounded-xl" />
      <div className="h-12 bg-gray-100 rounded-xl" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
