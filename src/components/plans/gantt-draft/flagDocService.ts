/**
 * Flag Doc Service
 * - Flag 기간에 해당하는 계획 데이터를 가져와 Release Doc 형식으로 변환
 */

import { createClient } from "@/lib/supabase/browser";
import type { ReleaseDocRow, ReadyInfo } from "./types";

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
    // Step 1: Flag 기간과 겹치는 feature plans 조회 (feature 키 수집용)
    const { data: overlappingPlans, error: overlappingError } = await supabase
      .from("plans")
      .select("project, module, feature")
      .eq("workspace_id", workspaceId)
      .eq("type", "feature")
      .lte("start_date", flagEnd)
      .gte("end_date", flagStart);

    if (overlappingError) {
      console.error("Failed to fetch overlapping plans:", overlappingError);
      return { rows: [], error: overlappingError.message };
    }

    if (!overlappingPlans || overlappingPlans.length === 0) {
      return { rows: [] };
    }

    // 겹치는 feature 키 집합
    const featureKeys = new Set<string>();
    for (const p of overlappingPlans) {
      if (p.project && p.module && p.feature) {
        featureKeys.add(`${p.project}::${p.module}::${p.feature}`);
      }
    }

    // Step 2: 해당 feature의 모든 plans 조회 (기획이 Flag 이전에 끝나도 포함)
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
      .order("project", { ascending: true })
      .order("module", { ascending: true })
      .order("feature", { ascending: true });

    if (plansError) {
      console.error("Failed to fetch all plans for release doc:", plansError);
      return { rows: [], error: plansError.message };
    }

    if (!plans || plans.length === 0) {
      return { rows: [] };
    }

    // featureKeys에 해당하는 plans만 필터링
    const relevantPlans = plans.filter((p: typeof plans[number]) => {
      if (p.project && p.module && p.feature) {
        const key = `${p.project}::${p.module}::${p.feature}`;
        return featureKeys.has(key);
      }
      return false;
    });

    if (relevantPlans.length === 0) {
      return { rows: [] };
    }

    // Plan 타입 정의
    type PlanRecord = (typeof relevantPlans)[number];

    // Step 2: Epic 단위로 그룹화
    // Epic key: project::module::feature (또는 title fallback)
    const epicGroups = new Map<
      string,
      {
        epic: string;
        plans: PlanRecord[];
        planners: Set<string>; // 중복 제거를 위해 Set 사용
      }
    >();

    for (const plan of relevantPlans) {
      const epicKey =
        plan.project && plan.module && plan.feature
          ? `${plan.project}::${plan.module}::${plan.feature}`
          : plan.title;

      const epicLabel =
        plan.project && plan.module && plan.feature
          ? `${plan.project} > ${plan.module} > ${plan.feature}`
          : plan.title;

      if (!epicGroups.has(epicKey)) {
        epicGroups.set(epicKey, {
          epic: epicLabel,
          plans: [],
          planners: new Set<string>(),
        });
      }

      const group = epicGroups.get(epicKey)!;
      group.plans.push(plan);

      // 기획 관련 stage에서 기획자 수집
      const isSpecStage = plan.stage?.includes("기획") || plan.stage?.toLowerCase().includes("spec");
      if (isSpecStage) {
        const assignees = plan.plan_assignees as Array<{
          role: string;
          users: { display_name: string } | null;
        }>;

        if (assignees && assignees.length > 0) {
          for (const a of assignees) {
            const role = a.role?.toLowerCase() ?? "";
            if (["기획", "planning", "pm", "planner"].includes(role) && a.users?.display_name) {
              group.planners.add(a.users.display_name);
            }
          }
        }
      }
    }

    // Step 3: 각 Epic에 대해 Spec Ready / Design Ready 계산
    const rows: ReleaseDocRow[] = [];

    for (const [epicKey, group] of epicGroups) {
      // Spec Ready: '기획' 또는 'spec'이 포함된 stage
      const specPlans = group.plans.filter((p) => 
        p.stage?.includes("기획") || p.stage?.toLowerCase().includes("spec")
      );
      const specReadyList: ReadyInfo[] = specPlans.map((p) => ({
        value: p.progress === 100 || p.status === "완료" ? "READY" : p.end_date ?? "-",
        title: p.title,
        endDate: p.end_date ?? undefined,
      }));

      // Design Ready: '디자인' 또는 'design'이 포함된 stage
      const designPlans = group.plans.filter((p) => 
        p.stage?.includes("디자인") || p.stage?.toLowerCase().includes("design")
      );
      const designReadyList: ReadyInfo[] = designPlans.map((p) => ({
        value: p.progress === 100 || p.status === "완료" ? "READY" : p.end_date ?? "-",
        title: p.title,
        endDate: p.end_date ?? undefined,
      }));

      // 날짜 범위 계산
      const allDates = group.plans.flatMap((p) => [p.start_date, p.end_date].filter(Boolean) as string[]);
      const sortedDates = allDates.sort((a, b) => a.localeCompare(b));
      const minStartDate = sortedDates[0] || "";
      const maxEndDate = sortedDates[sortedDates.length - 1] || "";

      rows.push({
        planId: group.plans[0]?.id ?? "",
        rowId: epicKey,
        epic: group.epic,
        planners: Array.from(group.planners),
        specReadyList: specReadyList.length > 0 ? specReadyList : [{ value: "데이터 없음" }],
        designReadyList: designReadyList.length > 0 ? designReadyList : [{ value: "데이터 없음" }],
        minStartDate,
        maxEndDate,
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

