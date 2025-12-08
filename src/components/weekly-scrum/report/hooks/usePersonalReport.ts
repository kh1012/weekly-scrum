"use client";

import { useMemo, useState, useCallback } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import type { ScrumItem, Collaborator } from "@/types/scrum";

export interface DomainSummary {
  name: string;
  count: number;
  avgProgress: number;
  projects: string[];
}

export interface ProjectSummary {
  name: string;
  domain: string;
  count: number;
  avgProgress: number;
  modules: string[];
  features: string[];
}

export interface ModuleSummary {
  name: string;
  project: string;
  count: number;
  avgProgress: number;
  features: string[];
}

export interface CollaboratorSummary {
  name: string;
  count: number;
  relations: {
    pair: number;
    pre: number;
    post: number;
  };
}

export interface PersonalReportData {
  memberName: string;
  totalSnapshots: number;
  avgProgress: number;
  completedCount: number;
  inProgressCount: number;
  atRiskCount: number;
  domains: DomainSummary[];
  projects: ProjectSummary[];
  modules: ModuleSummary[];
  collaborators: CollaboratorSummary[];
  snapshots: ScrumItem[];
}

export function usePersonalReport() {
  const { currentData, members } = useScrumContext();
  const [selectedMember, setSelectedMember] = useState<string>("");

  // 멤버가 선택되지 않으면 첫 번째 멤버 선택
  const activeMember = selectedMember || members[0] || "";

  // 멤버 변경 핸들러
  const handleMemberChange = useCallback((member: string) => {
    setSelectedMember(member);
  }, []);

  // 선택된 멤버의 항목들
  const memberItems = useMemo(() => {
    if (!currentData || !activeMember) return [];
    return currentData.items.filter((item) => item.name === activeMember);
  }, [currentData, activeMember]);

  // 도메인 요약 데이터
  const domainSummary = useMemo((): DomainSummary[] => {
    const domainMap = new Map<string, { items: ScrumItem[]; projects: Set<string> }>();

    memberItems.forEach((item) => {
      const existing = domainMap.get(item.domain);
      if (existing) {
        existing.items.push(item);
        existing.projects.add(item.project);
      } else {
        domainMap.set(item.domain, {
          items: [item],
          projects: new Set([item.project]),
        });
      }
    });

    return Array.from(domainMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.items.length,
        avgProgress: Math.round(
          data.items.reduce((sum, i) => sum + i.progressPercent, 0) / data.items.length
        ),
        projects: Array.from(data.projects).sort(),
      }))
      .sort((a, b) => b.count - a.count);
  }, [memberItems]);

  // 프로젝트 요약 데이터
  const projectSummary = useMemo((): ProjectSummary[] => {
    const projectMap = new Map<
      string,
      { domain: string; items: ScrumItem[]; modules: Set<string>; features: Set<string> }
    >();

    memberItems.forEach((item) => {
      const existing = projectMap.get(item.project);
      if (existing) {
        existing.items.push(item);
        if (item.module) existing.modules.add(item.module);
        existing.features.add(item.topic);
      } else {
        projectMap.set(item.project, {
          domain: item.domain,
          items: [item],
          modules: item.module ? new Set([item.module]) : new Set(),
          features: new Set([item.topic]),
        });
      }
    });

    return Array.from(projectMap.entries())
      .map(([name, data]) => ({
        name,
        domain: data.domain,
        count: data.items.length,
        avgProgress: Math.round(
          data.items.reduce((sum, i) => sum + i.progressPercent, 0) / data.items.length
        ),
        modules: Array.from(data.modules).sort(),
        features: Array.from(data.features).sort(),
      }))
      .sort((a, b) => b.count - a.count);
  }, [memberItems]);

  // 모듈 요약 데이터
  const moduleSummary = useMemo((): ModuleSummary[] => {
    const moduleMap = new Map<
      string,
      { project: string; items: ScrumItem[]; features: Set<string> }
    >();

    memberItems.forEach((item) => {
      const moduleName = item.module || "(미지정)";
      const key = `${item.project}/${moduleName}`;
      const existing = moduleMap.get(key);
      if (existing) {
        existing.items.push(item);
        existing.features.add(item.topic);
      } else {
        moduleMap.set(key, {
          project: item.project,
          items: [item],
          features: new Set([item.topic]),
        });
      }
    });

    return Array.from(moduleMap.entries())
      .map(([key, data]) => {
        const parts = key.split("/");
        return {
          name: parts.slice(1).join("/"),
          project: data.project,
          count: data.items.length,
          avgProgress: Math.round(
            data.items.reduce((sum, i) => sum + i.progressPercent, 0) / data.items.length
          ),
          features: Array.from(data.features).sort(),
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [memberItems]);

  // 협업자 요약 데이터
  const collaboratorSummary = useMemo((): CollaboratorSummary[] => {
    const collabMap = new Map<
      string,
      { count: number; relations: { pair: number; pre: number; post: number } }
    >();

    memberItems.forEach((item) => {
      if (!item.collaborators) return;
      item.collaborators.forEach((collab: Collaborator) => {
        const existing = collabMap.get(collab.name);
        if (existing) {
          existing.count++;
          existing.relations[collab.relation]++;
        } else {
          collabMap.set(collab.name, {
            count: 1,
            relations: {
              pair: collab.relation === "pair" ? 1 : 0,
              pre: collab.relation === "pre" ? 1 : 0,
              post: collab.relation === "post" ? 1 : 0,
            },
          });
        }
      });
    });

    return Array.from(collabMap.entries())
      .map(([name, data]) => ({
        name,
        count: data.count,
        relations: data.relations,
      }))
      .sort((a, b) => b.count - a.count);
  }, [memberItems]);

  // 전체 통계
  const stats = useMemo(() => {
    if (memberItems.length === 0) return null;

    const avgProgress = Math.round(
      memberItems.reduce((sum, i) => sum + i.progressPercent, 0) / memberItems.length
    );
    const completedCount = memberItems.filter((i) => i.progressPercent >= 100).length;
    const inProgressCount = memberItems.filter(
      (i) => i.progressPercent > 0 && i.progressPercent < 100
    ).length;
    const atRiskCount = memberItems.filter(
      (i) => i.riskLevel !== null && i.riskLevel >= 2
    ).length;

    return {
      totalSnapshots: memberItems.length,
      avgProgress,
      completedCount,
      inProgressCount,
      atRiskCount,
    };
  }, [memberItems]);

  // Personal Report 데이터
  const reportData = useMemo((): PersonalReportData | null => {
    if (!stats || !activeMember) return null;

    return {
      memberName: activeMember,
      ...stats,
      domains: domainSummary,
      projects: projectSummary,
      modules: moduleSummary,
      collaborators: collaboratorSummary,
      snapshots: memberItems,
    };
  }, [activeMember, stats, domainSummary, projectSummary, moduleSummary, collaboratorSummary, memberItems]);

  return {
    currentData,
    members,
    activeMember,
    memberItems,
    reportData,
    handleMemberChange,
  };
}

