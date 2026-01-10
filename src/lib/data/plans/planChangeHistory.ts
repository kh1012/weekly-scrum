import { createClient } from "@/lib/supabase/server";

/**
 * 변경 타입
 */
export type ChangeType = "created" | "updated";

/**
 * 개별 plan 변경 정보
 */
export interface ChangeHistoryItem {
  id: string;
  title: string;
  type: ChangeType;
  project: string | null;
  module: string | null;
  feature: string | null;
  changedAt: string;
  changedBy: string;
  changedByName?: string;
}

/**
 * 프로젝트/모듈/기능 트리 노드
 */
export interface TreeNode {
  path: string;
  count: number;
}

/**
 * 1시간 단위 그룹
 */
export interface ChangeHistoryGroup {
  date: string;
  hour: number;
  timeLabel: string;
  changedBy: string;
  changedByName?: string;
  totalCount: number;
  createdCount: number;
  updatedCount: number;
  treeNodes: TreeNode[];
}

/**
 * API 응답 타입
 */
export interface ChangeHistoryResponse {
  success: boolean;
  groups: ChangeHistoryGroup[];
  error?: string;
}

/**
 * Plans의 최근 1주일간 변경 이력 조회
 */
export async function getPlansChangeHistory(
  workspaceId: string
): Promise<ChangeHistoryResponse> {
  try {
    const supabase = await createClient();

    // 1주일 전 날짜 계산
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    // Plans 조회 (최근 1주일간 생성 또는 수정된 것)
    const { data: plansData, error: plansError } = await supabase
      .from("plans")
      .select(
        `
        id,
        title,
        project,
        module,
        feature,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
      )
      .eq("workspace_id", workspaceId)
      .or(`created_at.gte.${oneWeekAgoISO},updated_at.gte.${oneWeekAgoISO}`)
      .order("updated_at", { ascending: false });

    if (plansError) {
      console.error("[getPlansChangeHistory] Plans query error:", plansError);
      return { success: false, groups: [], error: "데이터 조회에 실패했습니다." };
    }

    if (!plansData || plansData.length === 0) {
      return { success: true, groups: [] };
    }

    // 사용자 ID 수집
    const userIds = new Set<string>();
    plansData.forEach((plan) => {
      if (plan.created_by) userIds.add(plan.created_by);
      if (plan.updated_by) userIds.add(plan.updated_by);
    });

    // 사용자 프로필 조회
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", Array.from(userIds));

    const profileMap = new Map<string, string>();
    profilesData?.forEach((profile) => {
      profileMap.set(profile.user_id, profile.display_name);
    });

    // ChangeHistoryItem으로 변환
    const items: ChangeHistoryItem[] = [];

    plansData.forEach((plan) => {
      const createdAt = new Date(plan.created_at);
      const updatedAt = new Date(plan.updated_at);

      // created_at이 1주일 이내인 경우 "추가됨"으로 처리
      if (createdAt.getTime() >= oneWeekAgo.getTime()) {
        items.push({
          id: plan.id,
          title: plan.title,
          type: "created",
          project: plan.project,
          module: plan.module,
          feature: plan.feature,
          changedAt: plan.created_at,
          changedBy: plan.created_by || "",
          changedByName: profileMap.get(plan.created_by || ""),
        });
      }

      // updated_at이 created_at과 다르고 1주일 이내인 경우 "수정됨"으로 처리
      if (
        updatedAt.getTime() !== createdAt.getTime() &&
        updatedAt.getTime() >= oneWeekAgo.getTime()
      ) {
        items.push({
          id: plan.id,
          title: plan.title,
          type: "updated",
          project: plan.project,
          module: plan.module,
          feature: plan.feature,
          changedAt: plan.updated_at,
          changedBy: plan.updated_by || "",
          changedByName: profileMap.get(plan.updated_by || ""),
        });
      }
    });

    // 날짜/시간/사용자 기준으로 그룹핑
    const groupMap = new Map<string, ChangeHistoryItem[]>();

    items.forEach((item) => {
      const date = new Date(item.changedAt);
      const dateKey = date.toISOString().split("T")[0]; // YYYY-MM-DD
      const hour = date.getHours();
      const groupKey = `${dateKey}:${hour}:${item.changedBy}`;

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(item);
    });

    // ChangeHistoryGroup으로 변환
    const groups: ChangeHistoryGroup[] = [];

    groupMap.forEach((groupItems, groupKey) => {
      const [dateKey, hourStr, userId] = groupKey.split(":");
      const hour = parseInt(hourStr, 10);

      // 시간 레이블 생성 (예: "PM 2")
      const period = hour >= 12 ? "PM" : "AM";
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const timeLabel = `${period} ${displayHour}`;

      // CRUD 통계
      const createdItems = groupItems.filter((item) => item.type === "created");
      const updatedItems = groupItems.filter((item) => item.type === "updated");

      // 트리 구조 생성 (project/module/feature)
      const treeMap = new Map<string, number>();

      groupItems.forEach((item) => {
        if (item.project && item.module && item.feature) {
          const path = `${item.project}/${item.module}/${item.feature}`;
          treeMap.set(path, (treeMap.get(path) || 0) + 1);
        } else if (item.project && item.module) {
          const path = `${item.project}/${item.module}`;
          treeMap.set(path, (treeMap.get(path) || 0) + 1);
        } else if (item.project) {
          treeMap.set(item.project, (treeMap.get(item.project) || 0) + 1);
        } else {
          treeMap.set(item.title, (treeMap.get(item.title) || 0) + 1);
        }
      });

      const treeNodes: TreeNode[] = Array.from(treeMap.entries()).map(
        ([path, count]) => ({
          path,
          count,
        })
      );

      groups.push({
        date: dateKey,
        hour,
        timeLabel,
        changedBy: userId,
        changedByName: groupItems[0]?.changedByName,
        totalCount: groupItems.length,
        createdCount: createdItems.length,
        updatedCount: updatedItems.length,
        treeNodes,
      });
    });

    // 최신 순으로 정렬 (날짜 내림차순, 시간 내림차순)
    groups.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.hour - a.hour;
    });

    return { success: true, groups };
  } catch (err) {
    console.error("[getPlansChangeHistory] Error:", err);
    return {
      success: false,
      groups: [],
      error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
    };
  }
}

