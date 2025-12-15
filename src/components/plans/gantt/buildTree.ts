import type { PlanWithAssignees } from "@/lib/data/plans";
import type { TreeNode, FlatRow } from "./types";

/**
 * Plans 데이터로 트리 구조 생성
 * - type='feature' plans: project > module > feature 계층
 * - type='sprint' plans: 스프린트 그룹
 * - type='release' plans: 릴리즈 그룹
 */
export function buildTreeFromPlans(plans: PlanWithAssignees[]): TreeNode[] {
  const featurePlans = plans.filter((p) => p.type === "feature");
  const sprintPlans = plans.filter((p) => p.type === "sprint");
  const releasePlans = plans.filter((p) => p.type === "release");

  // Project Map 구조: project -> module -> feature -> plans
  const projectMap = new Map<
    string,
    Map<string, Map<string, PlanWithAssignees[]>>
  >();

  for (const plan of featurePlans) {
    const project = plan.project || "기타";
    const module = plan.module || "기타";
    const feature = plan.feature || "기타";

    if (!projectMap.has(project)) {
      projectMap.set(project, new Map());
    }
    const moduleMap = projectMap.get(project)!;

    if (!moduleMap.has(module)) {
      moduleMap.set(module, new Map());
    }
    const featureMap = moduleMap.get(module)!;

    if (!featureMap.has(feature)) {
      featureMap.set(feature, []);
    }
    featureMap.get(feature)!.push(plan);
  }

  // Tree 생성
  const tree: TreeNode[] = [];

  // Feature Plans Tree
  const sortedProjects = Array.from(projectMap.keys()).sort();
  for (const project of sortedProjects) {
    const moduleMap = projectMap.get(project)!;
    const projectNode: TreeNode = {
      id: `project-${project}`,
      type: "project",
      label: project,
      project,
      children: [],
      expanded: true,
      level: 0,
    };

    const sortedModules = Array.from(moduleMap.keys()).sort();
    for (const module of sortedModules) {
      const featureMap = moduleMap.get(module)!;
      const moduleNode: TreeNode = {
        id: `module-${project}-${module}`,
        type: "module",
        label: module,
        project,
        module,
        children: [],
        expanded: true,
        level: 1,
      };

      const sortedFeatures = Array.from(featureMap.keys()).sort();
      for (const feature of sortedFeatures) {
        const plans = featureMap.get(feature)!;
        const featureNode: TreeNode = {
          id: `feature-${project}-${module}-${feature}`,
          type: "feature",
          label: feature,
          project,
          module,
          feature,
          plans,
          level: 2,
        };
        moduleNode.children!.push(featureNode);
      }

      projectNode.children!.push(moduleNode);
    }

    tree.push(projectNode);
  }

  // Release Group (type = 'release') - 최상단
  if (releasePlans.length > 0) {
    const releaseNode: TreeNode = {
      id: "release-group",
      type: "events",
      label: "🚀 릴리즈",
      children: releasePlans.map((plan) => ({
        id: `release-${plan.id}`,
        type: "feature" as const,
        label: plan.title,
        plans: [plan],
        level: 1,
      })),
      expanded: true,
      level: 0,
    };
    tree.unshift(releaseNode);
  }

  // Sprint Group (type = 'sprint') - 릴리즈 다음
  if (sprintPlans.length > 0) {
    const sprintNode: TreeNode = {
      id: "sprint-group",
      type: "events",
      label: "🏃 스프린트",
      children: sprintPlans.map((plan) => ({
        id: `sprint-${plan.id}`,
        type: "feature" as const,
        label: plan.title,
        plans: [plan],
        level: 1,
      })),
      expanded: true,
      level: 0,
    };
    // 릴리즈 그룹이 있으면 그 다음에, 없으면 맨 앞에
    if (releasePlans.length > 0) {
      tree.splice(1, 0, sprintNode);
    } else {
      tree.unshift(sprintNode);
    }
  }

  return tree;
}

/**
 * Tree를 Flat Row 배열로 변환 (렌더링용)
 * - 접힌 노드의 자식은 제외
 */
export function flattenTree(
  nodes: TreeNode[],
  expandedIds: Set<string>
): FlatRow[] {
  const rows: FlatRow[] = [];

  function traverse(node: TreeNode, indent: number) {
    const isExpanded = expandedIds.has(node.id);
    const isLeaf = !node.children || node.children.length === 0;

    // Feature context 생성 (leaf 노드용)
    let context: FlatRow["context"] = undefined;
    if (node.type === "feature" && node.project && node.module && node.feature) {
      context = {
        domain: node.project, // domain = project로 가정 (필요시 수정)
        project: node.project,
        module: node.module,
        feature: node.feature,
      };
    }

    rows.push({
      id: node.id,
      node,
      indent,
      isLeaf,
      context,
    });

    // 자식 노드 처리 (확장된 경우만)
    if (node.children && isExpanded) {
      for (const child of node.children) {
        traverse(child, indent + 1);
      }
    }
  }

  for (const node of nodes) {
    traverse(node, 0);
  }

  return rows;
}

/**
 * 모든 노드 ID 추출 (기본 확장 상태용)
 */
export function getAllNodeIds(nodes: TreeNode[]): string[] {
  const ids: string[] = [];

  function traverse(node: TreeNode) {
    ids.push(node.id);
    if (node.children) {
      for (const child of node.children) {
        traverse(child);
      }
    }
  }

  for (const node of nodes) {
    traverse(node);
  }

  return ids;
}

