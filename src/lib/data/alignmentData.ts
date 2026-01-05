/**
 * Alignment 데이터 조회
 * 
 * Plans와 Snapshots를 조합하여 Alignment View용 데이터 제공
 */

import { createClient } from "@/lib/supabase/server";
import { fetchFeaturePlans } from "@/components/plans/gantt-draft/commitService";
import { listWorkspaceMembers } from "./members";

export interface AlignmentPlan {
  id: string;
  clientUid: string;
  domain?: string;
  project: string;
  module: string;
  feature: string;
  title: string;
  stage: string;
  status: string;
  startDate: string;
  endDate: string;
  description?: string;
  links?: { url: string; label?: string }[];
  orderIndex?: number;
  laneHint?: number;
  assignees?: Array<{
    userId: string;
    role: string;
    displayName?: string;
  }>;
}

export interface AlignmentSnapshotEntry {
  id: string;
  snapshotId: string;
  name: string;
  entryType: string;
  createdAt: string;
  updatedAt: string;
  // Meta 정보
  domain?: string;
  project: string;
  module: string;
  feature: string;
  // Past Week 정보
  pastWeek?: {
    tasks?: Array<{ title: string; progress: number }>;
    risk?: string[];
    riskLevel?: number;
  };
  // This Week 정보
  thisWeek?: {
    tasks?: string[];
  };
  // Plan과의 연결 (있는 경우)
  planId?: string;
}

export interface GetAlignmentDataParams {
  workspaceId: string;
  userId: string;
  year: number;
  week: string; // W01, W02, ...
}

/**
 * Alignment View용 데이터 조회
 * - Plans: 사용자와 관련된 계획만 필터링
 * - Snapshots: 특정 주차의 엔트리만 조회
 */
export async function getAlignmentData({
  workspaceId,
  userId,
  year,
  week,
}: GetAlignmentDataParams): Promise<{
  plans: AlignmentPlan[];
  snapshots: AlignmentSnapshotEntry[];
  members: Array<{
    userId: string;
    displayName: string;
    email?: string;
    basicRole?: string;
  }>;
}> {
  const supabase = await createClient();

  // 1. 모든 Plans 조회
  const plansResult = await fetchFeaturePlans({ workspaceId });
  const allPlans = plansResult.success ? plansResult.plans || [] : [];

  // 2. 사용자와 관련된 Plans만 필터링
  // - Assignee로 지정된 경우
  // - TODO: 추후 다른 연관 조건 추가 가능 (collaborator 등)
  const userPlans = allPlans.filter((plan) =>
    plan.assignees?.some((assignee) => assignee.userId === userId)
  );

  // 3. 특정 주차의 Snapshot Entries 조회
  // 먼저 해당 주차의 스냅샷 조회
  const { data: snapshots, error: snapshotsError } = await supabase
    .from("snapshots")
    .select("id, year, week")
    .eq("workspace_id", workspaceId)
    .eq("author_id", userId)
    .eq("year", year)
    .eq("week", week);

  if (snapshotsError) {
    console.error("Error fetching snapshots:", snapshotsError);
  }

  let snapshotEntries: AlignmentSnapshotEntry[] = [];

  if (snapshots && snapshots.length > 0) {
    const snapshotIds = snapshots.map((s) => s.id);

    const { data: entries, error: entriesError } = await supabase
      .from("snapshot_entries")
      .select("*")
      .in("snapshot_id", snapshotIds)
      .order("created_at", { ascending: false });

    if (entriesError) {
      console.error("Error fetching snapshot entries:", entriesError);
    }

    if (entries) {
      snapshotEntries = entries.map((entry) => {
        // past_week와 this_week 파싱
        let pastWeek: AlignmentSnapshotEntry["pastWeek"];
        let thisWeek: AlignmentSnapshotEntry["thisWeek"];

        try {
          if (entry.past_week) {
            const parsed =
              typeof entry.past_week === "string"
                ? JSON.parse(entry.past_week)
                : entry.past_week;
            pastWeek = {
              tasks: parsed.tasks || [],
              risk: parsed.risk || [],
              riskLevel: parsed.riskLevel,
            };
          }
          if (entry.this_week) {
            const parsed =
              typeof entry.this_week === "string"
                ? JSON.parse(entry.this_week)
                : entry.this_week;
            thisWeek = {
              tasks: parsed.tasks || [],
            };
          }
        } catch (err) {
          console.warn("Error parsing entry data:", err);
        }

        return {
          id: entry.id,
          snapshotId: entry.snapshot_id,
          name: entry.name,
          entryType: entry.entry_type,
          createdAt: entry.created_at,
          updatedAt: entry.updated_at,
          domain: entry.domain,
          project: entry.project,
          module: entry.module,
          feature: entry.feature,
          pastWeek,
          thisWeek,
          planId: entry.plan_id,
        };
      });
    }
  }

  // 4. 워크스페이스 멤버 조회
  const workspaceMembers = await listWorkspaceMembers({ workspaceId });
  const members = workspaceMembers.map((m) => ({
    userId: m.user_id,
    displayName: m.display_name || m.email || m.user_id,
    email: m.email || undefined,
    basicRole: m.basic_role || undefined,
  }));

  return {
    plans: userPlans,
    snapshots: snapshotEntries,
    members,
  };
}

