/**
 * 협업 분석을 위한 타입 정의
 */

import type { Relation } from "@/types/scrum";

/**
 * 협업 엣지 (네트워크 그래프용)
 */
export interface CollaborationEdge {
  source: string; // 작업자
  target: string; // 협업자
  relation: Relation;
  count: number;
}

/**
 * 협업 노드 (네트워크 그래프용)
 */
export interface CollaborationNode {
  id: string;
  name: string;
  domain: string;
  degree: number; // 연결된 엣지 수
  pairCount: number;
  preCount: number; // 내가 선행 협업자로 지정한 수 (나를 기다리는 수)
  postCount: number; // 내가 후행 협업자로 지정한 수 (내가 기다리는 수)
}

/**
 * 멤버별 협업 통계
 */
export interface MemberCollaborationSummary {
  name: string;
  domain: string;
  pairCount: number;
  preCount: number; // 내가 선행 협업자로 지정한 수 (pre 관계)
  postCount: number; // 내가 후행 협업자로 지정한 수 (post 관계)
  preInbound: number; // 다른 사람이 나를 pre로 지정한 수 (나를 기다리는 수)
  crossDomainScore: number; // 다른 도메인과의 협업 비율
  crossModuleScore: number; // 다른 모듈과의 협업 비율
  totalCollaborations: number;
  collaborators: Array<{
    name: string;
    relation: Relation;
    count: number;
  }>;
}

/**
 * 도메인 간 협업 매트릭스 셀
 */
export interface DomainMatrixCell {
  sourceDomain: string;
  targetDomain: string;
  pairCount: number;
  preCount: number;
  postCount: number;
  totalCount: number;
}

/**
 * 협업 부하 히트맵 행
 */
export interface CollaborationLoadRow {
  name: string;
  domain: string;
  pairCount: number;
  preCount: number; // 내가 선행 협업자로 지정한 수
  postCount: number; // 내가 후행 협업자로 지정한 수
  preInbound: number; // 다른 사람이 나를 pre로 지정한 수
  totalLoad: number;
}

/**
 * 병목 노드 (Bottleneck Map용)
 */
export interface BottleneckNode {
  name: string;
  domain: string;
  inboundCount: number; // 나를 기다리는 사람 수
  outboundCount: number; // 내가 기다리는 사람 수
  intensity: number; // 병목 강도 (inbound 기준)
  waiters: string[]; // 나를 기다리는 사람들
  blocking: string[]; // 내가 기다리는 사람들
}

/**
 * 주차별 협업 추이 데이터
 */
export interface WeeklyCollaborationTrend {
  weekKey: string;
  weekLabel: string;
  pairCount: number;
  preCount: number;
  postCount: number;
  totalCollaborations: number;
}

