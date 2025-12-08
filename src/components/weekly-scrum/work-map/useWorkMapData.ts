import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { ProjectNode, ModuleNode, FeatureNode } from "./types";

/**
 * ScrumItem 배열을 Project → Module → Feature 계층으로 변환
 */
export function buildWorkMapHierarchy(items: ScrumItem[]): ProjectNode[] {
  const projectMap = new Map<string, ProjectNode>();

  for (const item of items) {
    const projectName = item.project;
    const moduleName = item.module || "(미지정)";
    const featureName = item.topic; // v1에서 topic이 feature에 해당

    // 프로젝트 노드 생성 또는 가져오기
    let projectNode = projectMap.get(projectName);
    if (!projectNode) {
      projectNode = {
        name: projectName,
        modules: [],
        items: [],
      };
      projectMap.set(projectName, projectNode);
    }
    projectNode.items.push(item);

    // 모듈 노드 찾기 또는 생성
    let moduleNode = projectNode.modules.find((m) => m.name === moduleName);
    if (!moduleNode) {
      moduleNode = {
        name: moduleName,
        features: [],
        items: [],
      };
      projectNode.modules.push(moduleNode);
    }
    moduleNode.items.push(item);

    // 피쳐 노드 찾기 또는 생성
    let featureNode = moduleNode.features.find((f) => f.name === featureName);
    if (!featureNode) {
      featureNode = {
        name: featureName,
        items: [],
      };
      moduleNode.features.push(featureNode);
    }
    featureNode.items.push(item);
  }

  // 정렬: 프로젝트명 → 모듈명 → 피쳐명
  const projects = Array.from(projectMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  for (const project of projects) {
    project.modules.sort((a, b) => a.name.localeCompare(b.name));
    for (const module of project.modules) {
      module.features.sort((a, b) => a.name.localeCompare(b.name));
    }
  }

  return projects;
}

/**
 * Work Map 데이터 훅
 */
export function useWorkMapData(items: ScrumItem[]) {
  const hierarchy = useMemo(() => buildWorkMapHierarchy(items), [items]);

  const getProjectByName = (name: string): ProjectNode | undefined => {
    return hierarchy.find((p) => p.name === name);
  };

  const getModuleByName = (
    projectName: string,
    moduleName: string
  ): ModuleNode | undefined => {
    const project = getProjectByName(projectName);
    return project?.modules.find((m) => m.name === moduleName);
  };

  const getFeatureByName = (
    projectName: string,
    moduleName: string,
    featureName: string
  ): FeatureNode | undefined => {
    const module = getModuleByName(projectName, moduleName);
    return module?.features.find((f) => f.name === featureName);
  };

  return {
    projects: hierarchy,
    getProjectByName,
    getModuleByName,
    getFeatureByName,
  };
}

