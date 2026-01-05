/**
 * Menu-specific statistics for badge counts
 */

import { createClient } from "@/lib/supabase/server";
import { getCurrentISOWeek } from "@/lib/date/isoWeek";

export interface MenuStats {
  feedbacks_count: number;
  snapshots_count: number;
  total_entries_count: number;
  plans_count: number;
  features_count: number;
  collaborations_count: number;
  my_entries_count: number;
  alignment_count: number;
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
    // Feedbacks count
    const { count: feedbacksCount } = await supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    // Distinct snapshots count
    const { data: snapshotsData } = await supabase
      .from("snapshot_entries")
      .select("snapshot_id")
      .eq("workspace_id", workspaceId);

    const uniqueSnapshots = new Set(
      snapshotsData?.map((d) => d.snapshot_id) || []
    ).size;

    // Total snapshot entries count
    const { count: totalEntriesCount } = await supabase
      .from("snapshot_entries")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    // Plans count
    const { count: plansCount } = await supabase
      .from("plans")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

    // Distinct features count (for work map)
    const { data: featuresData } = await supabase
      .from("snapshot_entries")
      .select("feature")
      .eq("workspace_id", workspaceId)
      .not("feature", "is", null);

    const uniqueFeatures = new Set(featuresData?.map((d) => d.feature) || [])
      .size;

    // Collaborations count (total collaborators in all entries)
    const { data: entriesWithCollaborators } = await supabase
      .from("snapshot_entries")
      .select("collaborators")
      .eq("workspace_id", workspaceId)
      .not("collaborators", "is", null);

    let totalCollaborations = 0;
    entriesWithCollaborators?.forEach((entry) => {
      if (Array.isArray(entry.collaborators)) {
        totalCollaborations += entry.collaborators.length;
      }
    });

    // User's own entries count
    let myEntriesCount = 0;
    if (userId) {
      const { count } = await supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId);
      myEntriesCount = count || 0;
    }

    // Alignment count (assigned Plans + current week Snapshot Entries)
    let alignmentCount = 0;
    if (userId) {
      // 1. 할당된 Plans 수
      const { data: planAssignees } = await supabase
        .from("plan_assignees")
        .select("plan_id")
        .eq("user_id", userId);

      const assignedPlanIds = planAssignees?.map((pa) => pa.plan_id) || [];

      if (assignedPlanIds.length > 0) {
        const { count: assignedPlansCount } = await supabase
          .from("plans")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("id", assignedPlanIds);

        alignmentCount += assignedPlansCount || 0;
      }

      // 2. 현재 주차 Snapshot Entries 수
      const currentWeekInfo = getCurrentISOWeek();
      const currentYear = currentWeekInfo.year;
      const currentWeekLabel = `W${currentWeekInfo.week.toString().padStart(2, "0")}`;

      const { data: currentWeekSnapshots } = await supabase
        .from("snapshots")
        .select("id")
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .eq("year", currentYear)
        .eq("week", currentWeekLabel);

      if (currentWeekSnapshots && currentWeekSnapshots.length > 0) {
        const snapshotIds = currentWeekSnapshots.map((s) => s.id);

        const { count: entriesCount } = await supabase
          .from("snapshot_entries")
          .select("*", { count: "exact", head: true })
          .in("snapshot_id", snapshotIds);

        alignmentCount += entriesCount || 0;
      }
    }

    return {
      feedbacks_count: feedbacksCount || 0,
      snapshots_count: uniqueSnapshots,
      total_entries_count: totalEntriesCount || 0,
      plans_count: plansCount || 0,
      features_count: uniqueFeatures,
      collaborations_count: totalCollaborations,
      my_entries_count: myEntriesCount,
      alignment_count: alignmentCount,
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
    };
  }
}
