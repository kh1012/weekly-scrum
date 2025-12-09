"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { TreeViewMode } from "../types";
import {
  loadFilterState,
  saveFilterState,
  parseQueryString,
  updateQueryString,
  type WorkMapFilterState,
} from "./index";

interface ExpandedState {
  projects: Set<string>;
  modules: Set<string>;
}

interface PersonExpandedState {
  persons: Set<string>;
  domains: Set<string>;
  projects: Set<string>;
  modules: Set<string>;
}

interface UseWorkMapPersistenceOptions {
  initialProjects?: string[];
  initialPersons?: string[];
}

interface UseWorkMapPersistenceReturn {
  // 기본 필터 상태
  hideCompleted: boolean;
  setHideCompleted: (value: boolean) => void;
  viewMode: TreeViewMode;
  setViewMode: (value: TreeViewMode) => void;

  // 프로젝트 트리 펼침 상태
  expanded: ExpandedState;
  toggleProject: (projectName: string) => void;
  toggleModule: (moduleKey: string) => void;
  expandProjectPath: (projectName: string, moduleKey?: string) => void;

  // 사람 트리 펼침 상태
  personExpanded: PersonExpandedState;
  togglePerson: (personName: string) => void;
  toggleDomain: (domainKey: string) => void;
  togglePersonProject: (projectKey: string) => void;
  togglePersonModule: (moduleKey: string) => void;
  expandPersonPath: (
    personName: string,
    domainKey?: string,
    projectKey?: string,
    moduleKey?: string
  ) => void;

  // 상태 초기화 여부
  isInitialized: boolean;
}

/**
 * WorkMap 필터 상태 지속성 Hook
 *
 * - LocalStorage에서 상태 복원
 * - QueryString 우선 적용
 * - 상태 변경 시 자동 저장
 */
export function useWorkMapPersistence(
  options: UseWorkMapPersistenceOptions = {}
): UseWorkMapPersistenceReturn {
  const { initialProjects = [], initialPersons = [] } = options;
  const [isInitialized, setIsInitialized] = useState(false);

  // 기본 필터 상태
  const [hideCompleted, setHideCompletedState] = useState(false);
  const [viewMode, setViewModeState] = useState<TreeViewMode>("project");

  // 프로젝트 트리 펼침 상태
  const [expanded, setExpanded] = useState<ExpandedState>({
    projects: new Set<string>(),
    modules: new Set<string>(),
  });

  // 사람 트리 펼침 상태
  const [personExpanded, setPersonExpanded] = useState<PersonExpandedState>({
    persons: new Set<string>(),
    domains: new Set<string>(),
    projects: new Set<string>(),
    modules: new Set<string>(),
  });

  // 초기화 완료 후 저장 활성화 플래그
  const shouldSave = useRef(false);

  // 초기 상태 로드 (LocalStorage + QueryString)
  useEffect(() => {
    const storedState = loadFilterState();
    const queryState = parseQueryString();

    // QueryString이 우선
    const mergedState: WorkMapFilterState = {
      ...storedState,
      ...queryState,
    };

    // 상태 적용
    setHideCompletedState(mergedState.hideCompleted);
    setViewModeState(mergedState.viewMode);

    // 프로젝트 트리 펼침 상태
    // 저장된 상태가 없으면 모든 프로젝트를 기본 펼침
    const projectsToExpand =
      mergedState.expandedProjects.length > 0
        ? mergedState.expandedProjects
        : initialProjects;

    setExpanded({
      projects: new Set(projectsToExpand),
      modules: new Set(mergedState.expandedModules),
    });

    // 사람 트리 펼침 상태
    const personsToExpand =
      mergedState.expandedPersons.length > 0
        ? mergedState.expandedPersons
        : initialPersons;

    setPersonExpanded({
      persons: new Set(personsToExpand),
      domains: new Set(mergedState.expandedDomains),
      projects: new Set(mergedState.expandedPersonProjects),
      modules: new Set(mergedState.expandedPersonModules),
    });

    setIsInitialized(true);
    shouldSave.current = true;
  }, [initialProjects, initialPersons]);

  // 상태 변경 시 저장
  useEffect(() => {
    if (!shouldSave.current) return;

    saveFilterState({
      hideCompleted,
      viewMode,
      expandedProjects: Array.from(expanded.projects),
      expandedModules: Array.from(expanded.modules),
      expandedPersons: Array.from(personExpanded.persons),
      expandedDomains: Array.from(personExpanded.domains),
      expandedPersonProjects: Array.from(personExpanded.projects),
      expandedPersonModules: Array.from(personExpanded.modules),
    });

    // QueryString 업데이트
    updateQueryString({ hideCompleted, viewMode });
  }, [hideCompleted, viewMode, expanded, personExpanded]);

  // hideCompleted setter
  const setHideCompleted = useCallback((value: boolean) => {
    setHideCompletedState(value);
  }, []);

  // viewMode setter
  const setViewMode = useCallback((value: TreeViewMode) => {
    setViewModeState(value);
  }, []);

  // 프로젝트 토글
  const toggleProject = useCallback((projectName: string) => {
    setExpanded((prev) => {
      const newProjects = new Set(prev.projects);
      if (newProjects.has(projectName)) {
        newProjects.delete(projectName);
      } else {
        newProjects.add(projectName);
      }
      return { ...prev, projects: newProjects };
    });
  }, []);

  // 모듈 토글
  const toggleModule = useCallback((moduleKey: string) => {
    setExpanded((prev) => {
      const newModules = new Set(prev.modules);
      if (newModules.has(moduleKey)) {
        newModules.delete(moduleKey);
      } else {
        newModules.add(moduleKey);
      }
      return { ...prev, modules: newModules };
    });
  }, []);

  // 프로젝트 경로 펼침 (선택 시 자동 펼침용)
  const expandProjectPath = useCallback(
    (projectName: string, moduleKey?: string) => {
      setExpanded((prev) => {
        const newProjects = new Set(prev.projects);
        const newModules = new Set(prev.modules);

        newProjects.add(projectName);
        if (moduleKey) {
          newModules.add(moduleKey);
        }

        return { projects: newProjects, modules: newModules };
      });
    },
    []
  );

  // 사람 토글
  const togglePerson = useCallback((personName: string) => {
    setPersonExpanded((prev) => {
      const newPersons = new Set(prev.persons);
      if (newPersons.has(personName)) {
        newPersons.delete(personName);
      } else {
        newPersons.add(personName);
      }
      return { ...prev, persons: newPersons };
    });
  }, []);

  // 도메인 토글
  const toggleDomain = useCallback((domainKey: string) => {
    setPersonExpanded((prev) => {
      const newDomains = new Set(prev.domains);
      if (newDomains.has(domainKey)) {
        newDomains.delete(domainKey);
      } else {
        newDomains.add(domainKey);
      }
      return { ...prev, domains: newDomains };
    });
  }, []);

  // 사람-프로젝트 토글
  const togglePersonProject = useCallback((projectKey: string) => {
    setPersonExpanded((prev) => {
      const newProjects = new Set(prev.projects);
      if (newProjects.has(projectKey)) {
        newProjects.delete(projectKey);
      } else {
        newProjects.add(projectKey);
      }
      return { ...prev, projects: newProjects };
    });
  }, []);

  // 사람-모듈 토글
  const togglePersonModule = useCallback((moduleKey: string) => {
    setPersonExpanded((prev) => {
      const newModules = new Set(prev.modules);
      if (newModules.has(moduleKey)) {
        newModules.delete(moduleKey);
      } else {
        newModules.add(moduleKey);
      }
      return { ...prev, modules: newModules };
    });
  }, []);

  // 사람 경로 펼침 (선택 시 자동 펼침용)
  const expandPersonPath = useCallback(
    (
      personName: string,
      domainKey?: string,
      projectKey?: string,
      moduleKey?: string
    ) => {
      setPersonExpanded((prev) => {
        const newPersons = new Set(prev.persons);
        const newDomains = new Set(prev.domains);
        const newProjects = new Set(prev.projects);
        const newModules = new Set(prev.modules);

        newPersons.add(personName);
        if (domainKey) newDomains.add(domainKey);
        if (projectKey) newProjects.add(projectKey);
        if (moduleKey) newModules.add(moduleKey);

        return {
          persons: newPersons,
          domains: newDomains,
          projects: newProjects,
          modules: newModules,
        };
      });
    },
    []
  );

  return {
    hideCompleted,
    setHideCompleted,
    viewMode,
    setViewMode,
    expanded,
    toggleProject,
    toggleModule,
    expandProjectPath,
    personExpanded,
    togglePerson,
    toggleDomain,
    togglePersonProject,
    togglePersonModule,
    expandPersonPath,
    isInitialized,
  };
}

