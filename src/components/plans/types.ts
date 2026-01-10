import type {
  PlanWithAssignees,
  PlanType,
  PlanStatus,
  PlanFilters,
} from "@/lib/data/plans";
import type { WorkspaceMember } from "@/lib/data/members";

/**
 * PlansBoard 모드
 * - readonly: 조회만 가능 (업무 > Plans)
 * - admin: CRUD 가능 (관리자 > All Plans)
 */
export type PlansBoardMode = "readonly" | "admin";

/**
 * 그룹화 옵션
 */
export type GroupByOption =
  | "none"
  | "project"
  | "module"
  | "assignee"
  | "feature"
  | "stage";

/**
 * PlansBoard Props
 */
export interface PlansBoardProps {
  mode: PlansBoardMode;
  initialPlans: PlanWithAssignees[];
  undatedPlans?: PlanWithAssignees[]; // 일정 미지정 plans
  filterOptions: {
    projects: string[];
    modules: string[];
    features: string[];
    stages: string[];
  };
  members: WorkspaceMember[];
  initialMonth: string; // YYYY-MM
  initialFilters?: PlanFilters; // URL params에서 파싱된 초기 필터
}

/**
 * 필터 상태
 */
export interface FilterState {
  type?: PlanType;
  project?: string;
  module?: string;
  feature?: string;
  status?: PlanStatus;
  stage?: string;
  assigneeUserId?: string;
}

/**
 * Plan 카드 Props
 */
export interface PlanCardProps {
  plan: PlanWithAssignees;
  mode: PlansBoardMode;
  onEdit?: (plan: PlanWithAssignees) => void;
  onDelete?: (planId: string) => void;
  onStatusChange?: (planId: string, status: PlanStatus) => void;
}

/**
 * 상태 라벨 정의
 */
export const STATUS_CONFIG: Record<
  PlanStatus,
  { label: string; color: string; bg: string }
> = {
  진행중: { label: "진행중", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
  완료: { label: "완료", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
  보류: { label: "보류", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
  취소: { label: "취소", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
};

/**
 * 타입 라벨 정의
 */
export const TYPE_CONFIG: Record<
  PlanType,
  { label: string; emoji: string; color: string }
> = {
  feature: { label: "기능", emoji: "🔧", color: "#8b5cf6" },
  sprint: { label: "스프린트", emoji: "🏃", color: "#8b5cf6" },
  release: { label: "릴리즈", emoji: "🚀", color: "#ec4899" },
};

/**
 * 담당자 역할 라벨
 */
export const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  planner: { label: "기획", color: "#f59e0b" },
  fe: { label: "FE", color: "#3b82f6" },
  be: { label: "BE", color: "#10b981" },
  designer: { label: "디자인", color: "#ec4899" },
  qa: { label: "검증", color: "#6b7280" },
};

/**
 * Draft Plan 관련 타입들
 */

/** 임시 계획 타입 (새로 생성할 Plan) */
export type DraftPlanItem = {
  tempId: string;
  type: "feature" | "sprint" | "release";
  title: string;
  project?: string;
  module?: string;
  feature?: string;
  stage?: string;
  start_date?: string;
  end_date?: string;
};

/** 기존 Plan 수정 임시 저장 타입 */
export type PendingUpdate = {
  planId: string;
  changes: {
    status?: PlanStatus;
    stage?: string;
    title?: string;
    start_date?: string;
    end_date?: string;
  };
};

/** 삭제 대기 목록 타입 */
export type PendingDeleteItem = {
  planId: string;
  planTitle: string;
};

/** 임시 저장 데이터 구조 */
export type DraftData = {
  creates: DraftPlanItem[]; // 새로 생성할 Plan
  updates: PendingUpdate[]; // 수정할 Plan
  deletes: PendingDeleteItem[]; // 삭제할 Plan
  duplicates: string[]; // 복제할 Plan ID
};
