import { useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { 
  ProjectNode, 
  ModuleNode, 
  FeatureNode,
  PersonNode,
  PersonDomainNode,
  PersonProjectNode,
  PersonModuleNode,
  PersonFeatureNode,
} from "./types";

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

  // 정렬: 프로젝트명 → 모듈명 → 피쳐명 (일관된 정렬을 위해 단순 비교 사용)
  const sortByName = (a: { name: string }, b: { name: string }) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  };

  const projects = Array.from(projectMap.values()).sort(sortByName);

  for (const project of projects) {
    project.modules.sort(sortByName);
    for (const module of project.modules) {
      module.features.sort(sortByName);
    }
  }

  return projects;
}

/**
 * ScrumItem 배열을 Person → Domain → Project → Module → Feature 계층으로 변환
 */
export function buildPersonHierarchy(items: ScrumItem[]): PersonNode[] {
  const personMap = new Map<string, PersonNode>();
  const sortByName = (a: { name: string }, b: { name: string }) => {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  };

  for (const item of items) {
    const personName = item.name;
    const domainName = item.domain;
    const projectName = item.project;
    const moduleName = item.module || "(미지정)";
    const featureName = item.topic;

    // Person 노드 생성 또는 가져오기
    let personNode = personMap.get(personName);
    if (!personNode) {
      personNode = {
        name: personName,
        domains: [],
        items: [],
      };
      personMap.set(personName, personNode);
    }
    personNode.items.push(item);

    // Domain 노드 찾기 또는 생성
    let domainNode = personNode.domains.find((d) => d.name === domainName);
    if (!domainNode) {
      domainNode = {
        name: domainName,
        projects: [],
        items: [],
      };
      personNode.domains.push(domainNode);
    }
    domainNode.items.push(item);

    // Project 노드 찾기 또는 생성
    let projectNode = domainNode.projects.find((p) => p.name === projectName);
    if (!projectNode) {
      projectNode = {
        name: projectName,
        modules: [],
        items: [],
      };
      domainNode.projects.push(projectNode);
    }
    projectNode.items.push(item);

    // Module 노드 찾기 또는 생성
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

    // Feature 노드 찾기 또는 생성
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

  // 정렬
  const persons = Array.from(personMap.values()).sort(sortByName);

  for (const person of persons) {
    person.domains.sort(sortByName);
    for (const domain of person.domains) {
      domain.projects.sort(sortByName);
      for (const project of domain.projects) {
        project.modules.sort(sortByName);
        for (const module of project.modules) {
          module.features.sort(sortByName);
        }
      }
    }
  }

  return persons;
}

/**
 * Work Map 데이터 훅
 */
export function useWorkMapData(items: ScrumItem[]) {
  const projectHierarchy = useMemo(() => buildWorkMapHierarchy(items), [items]);
  const personHierarchy = useMemo(() => buildPersonHierarchy(items), [items]);

  const getProjectByName = (name: string): ProjectNode | undefined => {
    return projectHierarchy.find((p) => p.name === name);
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

  // Person 계층에서 Feature 가져오기
  const getPersonFeatureItems = (
    personName: string,
    domainName: string,
    projectName: string,
    moduleName: string,
    featureName: string
  ): ScrumItem[] => {
    const person = personHierarchy.find((p) => p.name === personName);
    const domain = person?.domains.find((d) => d.name === domainName);
    const project = domain?.projects.find((p) => p.name === projectName);
    const module = project?.modules.find((m) => m.name === moduleName);
    const feature = module?.features.find((f) => f.name === featureName);
    return feature?.items || [];
  };

  return {
    projects: projectHierarchy,
    persons: personHierarchy,
    getProjectByName,
    getModuleByName,
    getFeatureByName,
    getPersonFeatureItems,
  };
}

