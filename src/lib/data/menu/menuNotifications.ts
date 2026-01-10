/**
 * Menu notifications system
 * Tracks new data in menus and shows "N" badge
 */

import { createClient } from "@/lib/supabase/server";

export interface MenuNewCount {
  menu_key: string;
  new_count: number;
}

/**
 * 메뉴별 새 데이터 개수 가져오기
 */
export async function getMenuNewCounts(params: {
  workspaceId: string;
  userId: string;
}): Promise<MenuNewCount[]> {
  const { workspaceId, userId } = params;
  const supabase = await createClient();

  try {
    // 1. 사용자의 메뉴 방문 기록 가져오기
    const { data: visits } = await supabase
      .from("user_menu_visits")
      .select("menu_key, last_visited_at")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId);

    const visitsMap = new Map(
      visits?.map((v) => [v.menu_key, v.last_visited_at]) || []
    );

    const results: MenuNewCount[] = [];

    // 2. Feedbacks - 마지막 방문 이후 새 피드백
    const feedbacksLastVisit = visitsMap.get("feedbacks");
    if (feedbacksLastVisit) {
      const { count: feedbacksCount } = await supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gt("created_at", feedbacksLastVisit);

      if (feedbacksCount && feedbacksCount > 0) {
        results.push({ menu_key: "feedbacks", new_count: feedbacksCount });
      }
    } else {
      // 첫 방문이면 전체 개수 표시
      const { count: feedbacksCount } = await supabase
        .from("feedbacks")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);

      if (feedbacksCount && feedbacksCount > 0) {
        results.push({ menu_key: "feedbacks", new_count: feedbacksCount });
      }
    }

    // 3. Team Feed - 마지막 방문 이후 새 스냅샷 (최근 24시간 데이터 가져오기)
    // 브라우저 시간대 기준 필터링은 클라이언트에서 수행
    const teamFeedLastVisit = visitsMap.get("team-feed");
    if (teamFeedLastVisit) {
      const { data: newSnapshots } = await supabase
        .from("snapshots")
        .select("id, created_at")
        .eq("workspace_id", workspaceId)
        .gt("created_at", teamFeedLastVisit);

      const newCount = newSnapshots?.length || 0;
      if (newCount > 0) {
        // created_at 정보를 포함하여 전달 (클라이언트에서 브라우저 시간대 기준 필터링)
        results.push({ 
          menu_key: "team-feed", 
          new_count: newCount,
          // 추가 정보: created_at 배열 (클라이언트 필터링용)
          _snapshotDates: newSnapshots?.map(s => s.created_at) || []
        } as any);
      }
    } else {
      // 첫 방문이면 최근 24시간 스냅샷 가져오기 (브라우저 시간대 기준 필터링은 클라이언트에서)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const { data: recentSnapshots } = await supabase
        .from("snapshots")
        .select("id, created_at")
        .eq("workspace_id", workspaceId)
        .gt("created_at", oneDayAgo.toISOString());

      const newCount = recentSnapshots?.length || 0;
      if (newCount > 0) {
        results.push({ 
          menu_key: "team-feed", 
          new_count: newCount,
          _snapshotDates: recentSnapshots?.map(s => s.created_at) || []
        } as any);
      }
    }

    // 4. Plans - 마지막 방문 이후 새 계획
    const plansLastVisit = visitsMap.get("plans");
    if (plansLastVisit) {
      const { count: plansCount } = await supabase
        .from("plans")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gt("created_at", plansLastVisit);

      if (plansCount && plansCount > 0) {
        results.push({ menu_key: "plans", new_count: plansCount });
      }
    }

    // 5. Snapshots - 마지막 방문 이후 새 엔트리
    const snapshotsLastVisit = visitsMap.get("snapshots");
    if (snapshotsLastVisit) {
      const { count: entriesCount } = await supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gt("created_at", snapshotsLastVisit);

      if (entriesCount && entriesCount > 0) {
        results.push({ menu_key: "snapshots", new_count: entriesCount });
      }
    }

    // 6. Work Map - 마지막 방문 이후 새 기능
    const workMapLastVisit = visitsMap.get("work-map");
    if (workMapLastVisit) {
      const { data: newFeatures } = await supabase
        .from("snapshot_entries")
        .select("feature")
        .eq("workspace_id", workspaceId)
        .gt("created_at", workMapLastVisit)
        .not("feature", "is", null);

      const uniqueFeatures = new Set(
        newFeatures?.map((f) => f.feature) || []
      ).size;

      if (uniqueFeatures > 0) {
        results.push({ menu_key: "work-map", new_count: uniqueFeatures });
      }
    }

    // 7. Collaborator Graph - 마지막 방문 이후 새 협업 설정
    const collaboratorGraphLastVisit = visitsMap.get("collaborator-graph");
    if (collaboratorGraphLastVisit) {
      const { data: newEntries } = await supabase
        .from("snapshot_entries")
        .select("collaborators")
        .eq("workspace_id", workspaceId)
        .gt("created_at", collaboratorGraphLastVisit)
        .not("collaborators", "is", null);

      let newCollaborations = 0;
      newEntries?.forEach((entry) => {
        if (Array.isArray(entry.collaborators)) {
          newCollaborations += entry.collaborators.length;
        }
      });

      if (newCollaborations > 0) {
        results.push({
          menu_key: "collaborator-graph",
          new_count: newCollaborations,
        });
      }
    }

    // 8. Alignment - 마지막 방문 이후 새 Plans 또는 Snapshot Entries
    const alignmentLastVisit = visitsMap.get("alignment");
    if (alignmentLastVisit) {
      const { count: newPlansCount } = await supabase
        .from("plans")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gt("created_at", alignmentLastVisit);

      const { count: newEntriesCount } = await supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .gt("created_at", alignmentLastVisit);

      const totalNewCount = (newPlansCount || 0) + (newEntriesCount || 0);
      if (totalNewCount > 0) {
        results.push({ menu_key: "alignment", new_count: totalNewCount });
      }
    }

    // 9. My Dashboard - 마지막 방문 이후 새 데이터 (사용자 본인 관련)
    const myDashboardLastVisit = visitsMap.get("my-dashboard");
    if (myDashboardLastVisit) {
      const { count: myNewEntriesCount } = await supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .gt("created_at", myDashboardLastVisit);

      if (myNewEntriesCount && myNewEntriesCount > 0) {
        results.push({ menu_key: "my-dashboard", new_count: myNewEntriesCount });
      }
    }

    // 10. My Alignment - 마지막 방문 이후 새 할당된 Plans 또는 현재 주차 Snapshot Entries
    const myAlignmentLastVisit = visitsMap.get("my-alignment");
    if (myAlignmentLastVisit) {
      // 할당된 Plans 중 새로운 것
      const { data: planAssignees } = await supabase
        .from("plan_assignees")
        .select("plan_id")
        .eq("user_id", userId);

      const assignedPlanIds = planAssignees?.map((pa) => pa.plan_id) || [];
      let newAssignedPlansCount = 0;

      if (assignedPlanIds.length > 0) {
        const { count } = await supabase
          .from("plans")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .in("id", assignedPlanIds)
          .gt("created_at", myAlignmentLastVisit);

        newAssignedPlansCount = count || 0;
      }

      // 현재 주차 Snapshot Entries 중 새로운 것
      const { count: myNewEntriesCount } = await supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .gt("created_at", myAlignmentLastVisit);

      const totalMyAlignmentNew = newAssignedPlansCount + (myNewEntriesCount || 0);
      if (totalMyAlignmentNew > 0) {
        results.push({ menu_key: "my-alignment", new_count: totalMyAlignmentNew });
      }
    }

    // 11. My Snapshots - 마지막 방문 이후 새 Snapshot Entries (작성자 기준)
    const mySnapshotsLastVisit = visitsMap.get("my-snapshots");
    if (mySnapshotsLastVisit) {
      const { count: myNewEntriesCount } = await supabase
        .from("snapshot_entries")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId)
        .eq("author_id", userId)
        .gt("created_at", mySnapshotsLastVisit);

      if (myNewEntriesCount && myNewEntriesCount > 0) {
        results.push({ menu_key: "my-snapshots", new_count: myNewEntriesCount });
      }
    }

    return results;
  } catch (error) {
    console.error("[menuNotifications] Error fetching new counts:", error);
    return [];
  }
}

/**
 * 메뉴 방문 기록 업데이트 (클라이언트에서 호출)
 */
export async function updateMenuVisit(params: {
  workspaceId: string;
  userId: string;
  menuKey: string;
}): Promise<{ success: boolean; error?: string }> {
  const { workspaceId, userId, menuKey } = params;

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("user_menu_visits").upsert(
      {
        workspace_id: workspaceId,
        user_id: userId,
        menu_key: menuKey,
        last_visited_at: new Date().toISOString(),
      },
      {
        onConflict: "workspace_id,user_id,menu_key",
      }
    );

    if (error) {
      console.error("[menuNotifications] Error updating visit:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[menuNotifications] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

