/**
 * Menu-specific statistics for badge counts
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentISOWeek } from "@/lib/utils/date";

export interface MenuStats {
  feedbacks_count: number;
  snapshots_count: number;
  total_entries_count: number;
  plans_count: number;
  features_count: number;
  collaborations_count: number;
  my_entries_count: number;
  alignment_count: number;
  workspace_alignment_count: number;
}

/**
 * Get statistics for menu badges
 */
export async function getMenuStats(params: {
  workspaceId: string;
  userId?: string;
}): Promise<MenuStats> {
  const { workspaceId, userId } = params;
  const supabase = await createClient();

  try {
    // 병렬로 실행할 쿼리들
    const baseQueries = [
      // Feedbacks count
      supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      
      // Distinct snapshots (snapshot_id만 조회)
      supabase
        .from("snapshot_entries")
        .select("snapshot_id")
        .eq("workspace_id", workspaceId),
      
      // Total snapshot entries count
      supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      
      // Plans count
      supabase
        .from("plans")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId),
      
      // Distinct features (feature만 조회)
      supabase
        .from("snapshot_entries")
        .select("feature")
        .eq("workspace_id", workspaceId)
        .not("feature", "is", null),
      
      // Collaborations (collaborators만 조회)
      supabase
        .from("snapshot_entries")
        .select("collaborators")
        .eq("workspace_id", workspaceId)
        .not("collaborators", "is", null),
    ];

    // userId가 있을 때만 추가 쿼리
    if (userId) {
      baseQueries.push(
        // User's own entries count
        supabase
          .from("snapshot_entries")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("author_id", userId),
        
        // Plan assignees
        supabase
          .from("plan_assignees")
          .select("plan_id")
          .eq("user_id", userId)
      );
    }

    const results = await Promise.allSettled(baseQueries);

    // 결과 추출
    const feedbacksCount =
      results[0].status === "fulfilled" ? results[0].value.count || 0 : 0;
    
    const snapshotsData =
      results[1].status === "fulfilled" ? results[1].value.data : null;
    const uniqueSnapshots = new Set(
      snapshotsData?.map((d) => d.snapshot_id) || []
    ).size;
    
    const totalEntriesCount =
      results[2].status === "fulfilled" ? results[2].value.count || 0 : 0;
    
    const plansCount =
      results[3].status === "fulfilled" ? results[3].value.count || 0 : 0;
    
    const featuresData =
      results[4].status === "fulfilled" ? results[4].value.data : null;
    const uniqueFeatures = new Set(featuresData?.map((d) => d.feature) || [])
      .size;
    
    const entriesWithCollaborators =
      results[5].status === "fulfilled" ? results[5].value.data : null;
    let totalCollaborations = 0;
    entriesWithCollaborators?.forEach((entry) => {
      if (Array.isArray(entry.collaborators)) {
        totalCollaborations += entry.collaborators.length;
      }
    });

    let myEntriesCount = 0;
    let alignmentCount = 0;

    if (userId) {
      myEntriesCount =
        results[6].status === "fulfilled" ? results[6].value.count || 0 : 0;
      
      const planAssignees =
        results[7].status === "fulfilled" ? results[7].value.data : null;
      const assignedPlanIds = planAssignees?.map((pa) => pa.plan_id) || [];

      // 추가 쿼리가 필요한 경우 병렬로 실행
      const currentWeekInfo = getCurrentISOWeek();
      const currentYear = currentWeekInfo.year;
      const currentWeekLabel = `W${currentWeekInfo.week.toString().padStart(2, "0")}`;

      // Plans와 현재 주차 스냅샷을 병렬로 조회
      const [assignedPlansCountResult, currentWeekSnapshotsResult] =
        await Promise.allSettled([
          assignedPlanIds.length > 0
            ? supabase
                .from("plans")
                .select("*", { count: "exact", head: true })
                .eq("workspace_id", workspaceId)
                .in("id", assignedPlanIds)
                .then((res) => res.count || 0)
            : Promise.resolve(0),
          supabase
            .from("snapshots")
            .select("id")
            .eq("workspace_id", workspaceId)
            .eq("author_id", userId)
            .eq("year", currentYear)
            .eq("week", currentWeekLabel),
        ]);

      // Plans 카운트 추가
      if (assignedPlansCountResult.status === "fulfilled") {
        alignmentCount += assignedPlansCountResult.value;
      }

      // 현재 주차 스냅샷 엔트리 추가
      if (
        currentWeekSnapshotsResult.status === "fulfilled" &&
        currentWeekSnapshotsResult.value.data &&
        currentWeekSnapshotsResult.value.data.length > 0
      ) {
        const snapshotIds = currentWeekSnapshotsResult.value.data.map(
          (s) => s.id
        );

        const { count: entriesCount } = await supabase
          .from("snapshot_entries")
          .select("*", { count: "exact", head: true })
          .in("snapshot_id", snapshotIds);

        alignmentCount += entriesCount || 0;
      }
    }

    // Workspace-wide alignment count
    const workspaceAlignmentCount = plansCount + totalEntriesCount;

    return {
      feedbacks_count: feedbacksCount || 0,
      snapshots_count: uniqueSnapshots,
      total_entries_count: totalEntriesCount || 0,
      plans_count: plansCount || 0,
      features_count: uniqueFeatures,
      collaborations_count: totalCollaborations,
      my_entries_count: myEntriesCount,
      alignment_count: alignmentCount,
      workspace_alignment_count: workspaceAlignmentCount,
    };
  } catch (error) {
    console.error("[menuStats] Error fetching menu stats:", error);
    return {
      feedbacks_count: 0,
      snapshots_count: 0,
      total_entries_count: 0,
      plans_count: 0,
      features_count: 0,
      collaborations_count: 0,
      my_entries_count: 0,
      alignment_count: 0,
      workspace_alignment_count: 0,
    };
  }
}
