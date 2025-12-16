import type { PlanWithAssignees, PlanType } from "@/lib/data/plans";

/**
 * Gantt View Mode
 */
export type GanttMode = "readonly" | "admin";

/**
 * 임시 계획 (클라이언트에서만 관리)
 * 간트 영역에서 + 버튼으로 실제 생성 전까지 임시로 표시
 */
export interface DraftPlan {
  /** 임시 ID (uuid) */
  tempId: string;
  /** 계획 타입 */
  type: PlanType;
  /** 제목 (기본값: "새 [타입]") */
  title: string;
  /** 프로젝트 (feature 타입만) */
  project?: string;
  /** 모듈 (feature 타입만) */
  module?: string;
  /** 기능명 (feature 타입만) */
  feature?: string;
  /** 단계 (feature 타입만) */
  stage?: string;
  /** 시작일 */
  start_date?: string;
  /** 종료일 */
  end_date?: string;
}

/**
 * Tree Node 타입
 */
export interface TreeNode {
  id: string;
  type: "project" | "module" | "feature" | "events";
  label: string;
  // 계층 정보
  project?: string;
  module?: string;
  feature?: string;
  // 자식 노드
  children?: TreeNode[];
  // Feature 노드일 경우 해당 plans
  plans?: PlanWithAssignees[];
  // 확장 상태
  expanded?: boolean;
  // depth level
  level: number;
}

/**
 * Flat Row (렌더링용)
 */
export interface FlatRow {
  id: string;
  node: TreeNode;
  indent: number;
  isLeaf: boolean;
  // Feature context (plans 생성 시 사용)
  context?: {
    project: string;
    module: string;
    feature: string;
  };
}

/**
 * Hover Cell 정보
 */
export interface HoverCell {
  rowId: string;
  date: Date;
  x: number;
  y: number;
}

/**
 * Selected Plan
 */
export interface SelectedPlan {
  planId: string;
  plan: PlanWithAssignees;
}

/**
 * Drag State
 */
export type DragType = "move" | "resize-left" | "resize-right" | null;

export interface DragState {
  type: DragType;
  planId: string;
  originalStart: string;
  originalEnd: string;
  currentStart: string;
  currentEnd: string;
}

/**
 * Gantt View Props
 */
export interface PlansGanttViewProps {
  mode: GanttMode;
  rangeStart: Date;
  rangeEnd: Date;
  plans: PlanWithAssignees[];
  /** 기존 Draft 생성 (셀 클릭 - fallback) */
  onCreateDraftAtCell?: (context: {
    project: string;
    module: string;
    feature: string;
    date: Date;
  }) => Promise<void>;
  /** Airbnb 스타일 Quick Create (팝오버에서 title 입력) */
  onQuickCreate?: (context: {
    project: string;
    module: string;
    feature: string;
    date: Date;
    title: string;
  }) => Promise<void>;
  /** 리사이즈 (시작/종료일 조정) */
  onResizePlan?: (planId: string, startDate: string, endDate: string) => Promise<void>;
  /** 드래그 이동 (날짜 범위 유지하며 이동) */
  onMovePlan?: (planId: string, startDate: string, endDate: string) => void;
  /** 인라인 타이틀 수정 */
  onTitleUpdate?: (planId: string, newTitle: string) => Promise<void>;
  onOpenPlan?: (planId: string) => void;
  onRefresh?: () => void;
  /** 선택된 Plan ID (외부에서 제어) */
  selectedPlanId?: string;
  /** Plan 선택 핸들러 (외부로 전달) */
  onSelectPlan?: (planId: string) => void;
  /** 임시 계획 목록 */
  draftPlans?: DraftPlan[];
  /** 임시 계획 추가 핸들러 */
  onAddDraftPlan?: (type: PlanType, defaultValues?: Partial<DraftPlan>) => void;
  /** 임시 계획 -> 실제 생성 핸들러 */
  onCreateFromDraft?: (draft: DraftPlan, startDate: string, endDate: string) => Promise<void>;
  /** 임시 계획 삭제 핸들러 */
  onRemoveDraftPlan?: (tempId: string) => void;
  /** 임시 계획 수정 핸들러 */
  onUpdateDraftPlan?: (tempId: string, updates: Partial<DraftPlan>) => void;
}

