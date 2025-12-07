"use client";

import { useMemo, useState, useCallback } from "react";
import { useScrumContext } from "@/context/ScrumContext";
import { getAchievementRate } from "@/lib/colorDefines";
import type { TrendPeriod } from "../utils/dashboardUtils";
import { getWeekCount, getEndDateLabel, calculateMemberStats } from "../utils/dashboardUtils";
import { calculateCollaborationStatus } from "../components/MyCollaborationStatus";
import { calculateCollaborationIntensity } from "../components/CollaborationIntensity";

export function useMyDashboard() {
  const { currentData, members, allData, sortedWeekKeys, selectMode } = useScrumContext();
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>("1month");
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());

  // 멤버가 선택되지 않으면 첫 번째 멤버 선택
  const activeMember = selectedMember || members[0] || "";

  // 멤버 변경 시 도메인/프로젝트 필터 초기화
  const handleMemberChange = useCallback((member: string) => {
    setSelectedMember(member);
    setSelectedDomains(new Set());
    setSelectedProjects(new Set());
  }, []);

  // 선택된 멤버의 전체 항목들 (필터 옵션용)
  const allMemberItems = useMemo(() => {
    if (!currentData || !activeMember) return [];
    return currentData.items.filter((item) => item.name === activeMember);
  }, [currentData, activeMember]);

  // 멤버의 도메인/프로젝트 목록
  const availableDomains = useMemo(() => {
    const set = new Set(allMemberItems.map((item) => item.domain));
    return Array.from(set).sort();
  }, [allMemberItems]);

  const availableProjects = useMemo(() => {
    const filteredItems =
      selectedDomains.size > 0
        ? allMemberItems.filter((item) => selectedDomains.has(item.domain))
        : allMemberItems;
    const set = new Set(filteredItems.map((item) => item.project));
    return Array.from(set).sort();
  }, [allMemberItems, selectedDomains]);

  // 최종 필터링된 항목
  const memberItems = useMemo(() => {
    let items = allMemberItems;
    if (selectedDomains.size > 0) {
      items = items.filter((item) => selectedDomains.has(item.domain));
    }
    if (selectedProjects.size > 0) {
      items = items.filter((item) => selectedProjects.has(item.project));
    }
    return items;
  }, [allMemberItems, selectedDomains, selectedProjects]);

  // 주차별 트렌드 데이터
  const weeklyTrend = useMemo(() => {
    if (!activeMember) return [];

    const weekCount = getWeekCount(trendPeriod);
    const recentWeeks = sortedWeekKeys.slice(-weekCount);

    return recentWeeks
      .map((weekKey) => {
        const weekData = allData[weekKey];
        if (!weekData) return null;

        let items = weekData.items.filter((item) => item.name === activeMember);

        if (selectedDomains.size > 0) {
          items = items.filter((item) => selectedDomains.has(item.domain));
        }
        if (selectedProjects.size > 0) {
          items = items.filter((item) => selectedProjects.has(item.project));
        }

        if (items.length === 0) return null;

        const avgProgress = Math.round(
          items.reduce((sum, i) => sum + i.progressPercent, 0) / items.length
        );
        const avgPlan = Math.round(
          items.reduce((sum, i) => sum + (i.planPercent ?? i.progressPercent), 0) / items.length
        );
        const achievement = getAchievementRate(avgProgress, avgPlan);
        const endDateLabel = getEndDateLabel(weekData.range);

        return {
          week: weekData.week,
          label:
            trendPeriod === "year"
              ? `${weekData.month}월`
              : endDateLabel || `${weekData.month}/${weekData.week.replace("W", "")}`,
          progress: avgProgress,
          plan: avgPlan,
          achievement,
          count: items.length,
        };
      })
      .filter(Boolean);
  }, [activeMember, allData, sortedWeekKeys, trendPeriod, selectedDomains, selectedProjects]);

  // 멤버 통계
  const stats = useMemo(() => calculateMemberStats(memberItems), [memberItems]);

  // 협업 상태 (내가 기다리는 사람, 나를 기다리는 사람)
  const collaborationStatus = useMemo(() => {
    if (!currentData || !activeMember) {
      return { waitingForMe: [], iAmWaitingFor: [], myCollaborators: [] };
    }
    return calculateCollaborationStatus(memberItems, currentData.items, activeMember);
  }, [currentData, memberItems, activeMember]);

  // 협업 강도 (주차별 협업 빈도)
  const collaborationIntensity = useMemo(() => {
    if (!activeMember) return [];
    const weekCount = getWeekCount(trendPeriod);
    return calculateCollaborationIntensity(allData, sortedWeekKeys, activeMember, weekCount);
  }, [activeMember, allData, sortedWeekKeys, trendPeriod]);

  // 도메인 토글
  const toggleDomain = useCallback((domain: string) => {
    setSelectedDomains((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(domain)) {
        newSet.delete(domain);
      } else {
        newSet.add(domain);
      }
      return newSet;
    });
    setSelectedProjects(new Set());
  }, []);

  // 프로젝트 토글
  const toggleProject = useCallback((project: string) => {
    setSelectedProjects((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(project)) {
        newSet.delete(project);
      } else {
        newSet.add(project);
      }
      return newSet;
    });
  }, []);

  // 도메인 전체 선택/해제
  const toggleAllDomains = useCallback(() => {
    setSelectedDomains((prev) => {
      if (prev.size === availableDomains.length) {
        return new Set();
      }
      return new Set(availableDomains);
    });
    setSelectedProjects(new Set());
  }, [availableDomains]);

  // 프로젝트 전체 선택/해제
  const toggleAllProjects = useCallback(() => {
    setSelectedProjects((prev) => {
      if (prev.size === availableProjects.length) {
        return new Set();
      }
      return new Set(availableProjects);
    });
  }, [availableProjects]);

  // 필터 초기화
  const resetFilters = useCallback(() => {
    setSelectedDomains(new Set());
    setSelectedProjects(new Set());
  }, []);

  return {
    // Data
    currentData,
    members,
    activeMember,
    memberItems,
    stats,
    weeklyTrend,
    selectMode,

    // Collaboration data
    collaborationStatus,
    collaborationIntensity,

    // Filter state
    selectedDomains,
    selectedProjects,
    availableDomains,
    availableProjects,

    // Trend period
    trendPeriod,
    setTrendPeriod,

    // Actions
    handleMemberChange,
    toggleDomain,
    toggleProject,
    toggleAllDomains,
    toggleAllProjects,
    resetFilters,
  };
}

