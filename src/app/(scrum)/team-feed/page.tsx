export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { getTeamFeedData } from "@/lib/data/teamFeed";
import { listWorkspaceMembers } from "@/lib/data/members";
import { TeamFeedClient } from "@/components/team-feed/TeamFeedClient";
import { parseGnbParams } from "@/lib/ui/gnbParams";
import { LogoLoadingSpinner } from "@/components/weekly-scrum/common/LoadingSpinner";
import { getDefaultWorkspaceId } from "@/lib/supabase/mode";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_WORKSPACE_ID = getDefaultWorkspaceId();

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/**
 * Team Feed 페이지
 * - 팀원들의 스냅샷 엔트리를 확인
 * - 읽기 전용, 사람 중심 피드
 * - 좌측 필터 패널 (Author, Date range, Collaborator toggle)
 * - 검색 기능
 */
export default async function TeamFeedPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const params = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (typeof value === "string") {
      params.set(key, value);
    }
  });
  const gnbParams = parseGnbParams(params);

  const supabase = await createClient();

  const [feedResult, membersResult, { count: totalEntriesCount }] = await Promise.all([
    getTeamFeedData(DEFAULT_WORKSPACE_ID, 8, gnbParams),
    listWorkspaceMembers({ workspaceId: DEFAULT_WORKSPACE_ID }),
    supabase
      .from("snapshot_entries")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", DEFAULT_WORKSPACE_ID),
  ]);

  const { feedItems, projectOptions, moduleOptions, featureOptions, error: feedError } = feedResult;


  if (feedError) {
    return (
      <div className="h-full flex items-center justify-center bg-white px-4">
        <div className="text-center p-6 bg-white border border-[#d0d7de] rounded-md max-w-md">
          <h2 className="text-base font-semibold text-[#24292f] mb-2">
            데이터를 불러올 수 없습니다
          </h2>
          <p className="text-sm text-[#57606a]">{feedError}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <TeamFeedClient
        initialFeedItems={feedItems}
        gnbParams={gnbParams}
        workspaceMembers={membersResult || []}
        projectOptions={projectOptions || []}
        moduleOptions={moduleOptions || []}
        featureOptions={featureOptions || []}
        totalEntriesCount={totalEntriesCount || 0}
      />
    </Suspense>
  );
}

function LoadingSkeleton() {
    return (
    <div className="h-full flex items-center justify-center">
      <LogoLoadingSpinner
        title="팀 피드를 불러오는 중입니다"
        description="잠시만 기다려주세요."
      />
      </div>
    );
}

