/**
 * useWorkMapSelection Hook
 * 
 * WorkMapView 선택 로직 및 핸들러
 */

import { useCallback, useMemo } from "react";
import type { ScrumItem } from "@/types/scrum";
import type { WorkMapSelection, TreeViewMode } from "./types";

interface UseWorkMapSelectionProps {
  selection: WorkMapSelection;
  setSelection: (selection: WorkMapSelection) => void;
  personSelection: {
    person: string | null;
    domain: string | null;
    project: string | null;
    module: string | null;
    feature: string | null;
  };
  setPersonSelection: (selection: {
    person: string | null;
    domain: string | null;
    project: string | null;
    module: string | null;
    feature: string | null;
  }) => void;
  viewMode: TreeViewMode;
  getFeatureByName: (
    project: string,
    module: string,
    feature: string
  ) => { items: ScrumItem[] } | undefined;
  getModuleByName: (
    project: string,
    module: string
  ) => { items: ScrumItem[] } | undefined;
  getProjectByName: (project: string) => { items: ScrumItem[] } | undefined;
  getPersonFeatureItems: (
    person: string,
    domain: string,
    project: string,
    module: string,
    feature: string
  ) => ScrumItem[];
  onMobileDetail?: () => void;
}

export function useWorkMapSelection({
  selection,
  setSelection,
  personSelection,
  setPersonSelection,
  viewMode,
  getFeatureByName,
  getModuleByName,
  getProjectByName,
  getPersonFeatureItems,
  onMobileDetail,
}: UseWorkMapSelectionProps) {
  // 현재 선택된 레벨과 아이템 (프로젝트 뷰)
  const getSelectedItems = useCallback((): ScrumItem[] => {
    if (!selection.project) return [];

    // 피쳐 레벨 선택
    if (selection.module && selection.feature) {
      const feature = getFeatureByName(
        selection.project,
        selection.module,
        selection.feature
      );
      return feature?.items || [];
    }

    // 모듈 레벨 선택
    if (selection.module) {
      const module = getModuleByName(selection.project, selection.module);
      return module?.items || [];
    }

    // 프로젝트 레벨 선택
    const project = getProjectByName(selection.project);
    return project?.items || [];
  }, [selection, getFeatureByName, getModuleByName, getProjectByName]);

  // 현재 선택된 피쳐 아이템 (사람 뷰)
  const selectedPersonFeatureItems = useMemo(() => {
    if (
      personSelection.person &&
      personSelection.domain &&
      personSelection.project &&
      personSelection.module &&
      personSelection.feature
    ) {
      return getPersonFeatureItems(
        personSelection.person,
        personSelection.domain,
        personSelection.project,
        personSelection.module,
        personSelection.feature
      );
    }
    return [];
  }, [personSelection, getPersonFeatureItems]);

  // 현재 활성화된 피쳐 아이템 (뷰 모드에 따라)
  const activeFeatureItems = useMemo(() => {
    return viewMode === "project"
      ? getSelectedItems()
      : selectedPersonFeatureItems;
  }, [viewMode, getSelectedItems, selectedPersonFeatureItems]);

  // 선택 레벨 표시용 문자열
  const getSelectionLabel = useCallback(() => {
    if (!selection.project) return null;
    if (selection.feature)
      return `${selection.project} / ${selection.module} / ${selection.feature}`;
    if (selection.module) return `${selection.project} / ${selection.module}`;
    return selection.project;
  }, [selection]);

  // 피쳐 선택 핸들러 (프로젝트 뷰)
  const handleFeatureSelect = useCallback(
    (project: string, module: string, feature: string) => {
      setSelection({ project, module, feature });
      onMobileDetail?.();
    },
    [setSelection, onMobileDetail]
  );

  // 프로젝트 보기 핸들러
  const handleProjectView = useCallback(
    (project: string) => {
      setSelection({ project, module: null, feature: null });
      onMobileDetail?.();
    },
    [setSelection, onMobileDetail]
  );

  // 모듈 보기 핸들러
  const handleModuleView = useCallback(
    (project: string, module: string) => {
      setSelection({ project, module, feature: null });
      onMobileDetail?.();
    },
    [setSelection, onMobileDetail]
  );

  // 피쳐 선택 핸들러 (사람 뷰)
  const handlePersonFeatureSelect = useCallback(
    (
      person: string,
      domain: string,
      project: string,
      module: string,
      feature: string
    ) => {
      setPersonSelection({ person, domain, project, module, feature });
      onMobileDetail?.();
    },
    [setPersonSelection, onMobileDetail]
  );

  // 협업자 존재 여부
  const hasCollaborators = useMemo(() => {
    return activeFeatureItems.some(
      (item) => item.collaborators && item.collaborators.length > 0
    );
  }, [activeFeatureItems]);

  return {
    getSelectedItems,
    selectedPersonFeatureItems,
    activeFeatureItems,
    getSelectionLabel,
    handleFeatureSelect,
    handleProjectView,
    handleModuleView,
    handlePersonFeatureSelect,
    hasCollaborators,
  };
}
