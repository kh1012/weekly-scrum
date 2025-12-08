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

/**
 * 트리 뷰 모드 타입
 */
export type TreeViewMode = "project" | "person";

// ========================================
// 사람 단위 계층 구조 타입
// ========================================

/**
 * 사람 노드 타입 (Person → Domain → Project → Module → Feature)
 */
export interface PersonNode {
  name: string;
  domains: PersonDomainNode[];
  items: ScrumItem[];
}

/**
 * 사람 도메인 노드 타입
 */
export interface PersonDomainNode {
  name: string;
  projects: PersonProjectNode[];
  items: ScrumItem[];
}

/**
 * 사람 프로젝트 노드 타입
 */
export interface PersonProjectNode {
  name: string;
  modules: PersonModuleNode[];
  items: ScrumItem[];
}

/**
 * 사람 모듈 노드 타입
 */
export interface PersonModuleNode {
  name: string;
  features: PersonFeatureNode[];
  items: ScrumItem[];
}

/**
 * 사람 피쳐 노드 타입
 */
export interface PersonFeatureNode {
  name: string;
  items: ScrumItem[];
}

