import type { ScrumItem } from "@/types/scrum";

/**
 * 프로젝트 노드 타입
 */
export interface ProjectNode {
  name: string;
  modules: ModuleNode[];
  items: ScrumItem[];
}

/**
 * 모듈 노드 타입
 */
export interface ModuleNode {
  name: string;
  features: FeatureNode[];
  items: ScrumItem[];
}

/**
 * 피쳐 노드 타입
 */
export interface FeatureNode {
  name: string;
  items: ScrumItem[];
}

/**
 * Work Map 선택 상태 타입
 */
export interface WorkMapSelection {
  project: string | null;
  module: string | null;
  feature: string | null;
}

