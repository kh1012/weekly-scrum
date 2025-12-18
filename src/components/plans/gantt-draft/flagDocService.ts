/**
 * Flag Doc Service
 * - Flag 기간에 해당하는 계획 데이터를 가져와 Release Doc 형식으로 변환
 */

import { createClient } from "@/lib/supabase/browser";
import type { ReleaseDocRow } from "./types";

interface BuildReleaseDocArgs {
  workspaceId: string;
  flagStart: string; // YYYY-MM-DD
  flagEnd: string; // YYYY-MM-DD
}

interface BuildReleaseDocResult {
  rows: ReleaseDocRow[];
  error?: string;
}

/**
 * Flag 기간에 해당하는 계획들을 가져와 Release Doc 형식으로 변환
 */
export async function buildReleaseDoc(
  args: BuildReleaseDocArgs
): Promise<BuildReleaseDocResult> {
  const { workspaceId, flagStart, flagEnd } = args;
  const supabase = createClient();

  try {
    // Step 1: Flag 기간과 겹치는 feature plans 조회
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select(
        `
        id,
        title,
        project,
        module,
        feature,
        stage,
        status,
        start_date,
        end_date,
        progress,
        plan_assignees (
          id,
          user_id,
          role,
          users:user_id (
            display_name
          )
        )
      `
      )
      .eq("workspace_id", workspaceId)
      .eq("type", "feature")
      .lte("start_date", flagEnd)
      .gte("end_date", flagStart)
      .order("project", { ascending: true })
      .order("module", { ascending: true })
      .order("feature", { ascending: true });

    if (plansError) {
      console.error("Failed to fetch plans for release doc:", plansError);
      return { rows: [], error: plansError.message };
    }

    if (!plans || plans.length === 0) {
      return { rows: [] };
    }

    // Plan 타입 정의
    type PlanRecord = (typeof plans)[number];

    // Step 2: Epic 단위로 그룹화
    // Epic key: project::module::feature (또는 title fallback)
    const epicGroups = new Map<
      string,
      {
        epic: string;
        plans: PlanRecord[];
        planner: string;
      }
    >();

    for (const plan of plans) {
      const epicKey =
        plan.project && plan.module && plan.feature
          ? `${plan.project}::${plan.module}::${plan.feature}`
          : plan.title;

      const epicLabel =
        plan.project && plan.module && plan.feature
          ? `${plan.project} > ${plan.module} > ${plan.feature}`
          : plan.title;

      if (!epicGroups.has(epicKey)) {
        // 기획자 찾기 (role이 '기획', 'planning', 'pm' 중 하나인 담당자)
        let planner = "-";
        const assignees = plan.plan_assignees as Array<{
          role: string;
          users: { display_name: string } | null;
        }>;

        if (assignees && assignees.length > 0) {
          const plannerAssignee = assignees.find((a) =>
            ["기획", "planning", "pm"].includes(a.role?.toLowerCase() ?? "")
          );
          if (plannerAssignee?.users?.display_name) {
            planner = plannerAssignee.users.display_name;
          }
        }

        epicGroups.set(epicKey, {
          epic: epicLabel,
          plans: [],
          planner,
        });
      }

      epicGroups.get(epicKey)!.plans.push(plan);
    }

    // Step 3: 각 Epic에 대해 Spec Ready / Design Ready 계산
    const rows: ReleaseDocRow[] = [];

    for (const [, group] of epicGroups) {
      // Spec Ready: stage === '상세 기획' 이고 완료된 계획
      const specPlan = group.plans.find(
        (p) =>
          p.stage === "상세 기획" &&
          (p.progress === 100 || p.status === "완료")
      );

      // Design Ready: stage === 'UI 디자인' 이고 완료된 계획
      const designPlan = group.plans.find(
        (p) =>
          p.stage === "UI 디자인" &&
          (p.progress === 100 || p.status === "완료")
      );

      rows.push({
        planId: group.plans[0]?.id ?? "",
        epic: group.epic,
        planner: group.planner,
        specReady: specPlan?.end_date ?? "-",
        designReady: designPlan?.end_date ?? "-",
      });
    }

    // Step 4: Epic 이름으로 정렬
    rows.sort((a, b) => a.epic.localeCompare(b.epic));

    return { rows };
  } catch (err) {
    console.error("Error building release doc:", err);
    return {
      rows: [],
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

