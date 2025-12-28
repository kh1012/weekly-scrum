import { Suspense } from "react";
import { EntriesFeedView } from "./_components/EntriesFeedView";
import { listSnapshotEntries } from "@/lib/data/entries";
import { listWorkspaceMembers } from "@/lib/data/members";
import { parseGnbParams } from "@/lib/ui/gnbParams";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";

const DEFAULT_WORKSPACE_ID =
  process.env.DEFAULT_WORKSPACE_ID || "00000000-0000-0000-0000-000000000001";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Entries 페이지: 워크스페이스 전체 엔트리 목록
 * - 좌측 필터 패널 (Author, Date range, Collaborator toggle)
 * - 검색 기능
 * - Keyset pagination
 */
export default async function EntriesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.set(key, value);
    }
  });
  const gnbParams = parseGnbParams(params);

  const [entriesResult, membersResult] = await Promise.all([
    listSnapshotEntries({
      workspaceId: DEFAULT_WORKSPACE_ID,
      gnbParams,
    }),
    listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
  ]);

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <div className="h-full overflow-auto">
        <div className="max-w-[1400px] mx-auto p-6">
          <EntriesFeedView
            initialEntries={entriesResult.entries || []}
            totalCount={entriesResult.totalCount || 0}
            nextCursor={entriesResult.nextCursor}
            error={entriesResult.error}
            gnbParams={gnbParams}
            workspaceMembers={membersResult || []}
            workspaceId={DEFAULT_WORKSPACE_ID}
          />
        </div>
      </div>
    </Suspense>
  );
}

function LoadingSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <LogoLoadingSpinner
        title="엔트리 목록을 불러오는 중입니다"
        description="잠시만 기다려주세요."
      />
    </div>
  );
}
