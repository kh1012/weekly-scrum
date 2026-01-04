/**
 * Menu-specific statistics for badge counts
 */

import { createClient } from "@/lib/supabase/server";

export interface MenuStats {
  feedbacks_count: number;
  total_entries_count: number;
  plans_count: number;
  features_count: number;
  collaborations_count: number;
  my_entries_count: number;
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

    const uniqueFeatures = new Set(
      featuresData?.map((d) => d.feature) || []
    ).size;

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

    return {
      feedbacks_count: feedbacksCount || 0,
      total_entries_count: totalEntriesCount || 0,
      plans_count: plansCount || 0,
      features_count: uniqueFeatures,
      collaborations_count: totalCollaborations,
      my_entries_count: myEntriesCount,
    };
  } catch (error) {
    console.error("[menuStats] Error fetching menu stats:", error);
    return {
      feedbacks_count: 0,
      total_entries_count: 0,
      plans_count: 0,
      features_count: 0,
      collaborations_count: 0,
      my_entries_count: 0,
    };
  }
}

