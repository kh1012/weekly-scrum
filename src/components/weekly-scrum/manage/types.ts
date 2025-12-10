/**
 * 스냅샷 관리 모듈 타입 정의
 * 
 * 이 파일의 모든 타입은 "임시 작업 공간용 상태"입니다.
 * 실제 저장 기능이 필요할 때 연결할 수 있도록 설계되었습니다.
 */

import type { ScrumItemV2 } from "@/types/scrum";

/**
 * 임시 스냅샷 타입
 * v2 스키마 기반 + 편집 관리용 메타데이터
 */
export interface TempSnapshot extends ScrumItemV2 {
  /** 임시 ID (클라이언트 측 생성) */
  tempId: string;
  /** 원본 데이터 여부 (불러온 데이터인지) */
  isOriginal: boolean;
  /** 원본 주차 키 (불러온 경우) */
  originalWeekKey?: string;
  /** 수정 여부 */
  isDirty: boolean;
  /** 생성 시각 */
  createdAt: Date;
  /** 수정 시각 */
  updatedAt: Date;
}

/**
 * 관리 화면 상태 타입
 */
export interface ManageState {
  /** 현재 화면 모드 */
  screen: "entry" | "editor";
  /** 임시 스냅샷 리스트 */
  snapshots: TempSnapshot[];
  /** 현재 선택된 스냅샷 ID */
  selectedId: string | null;
}

/**
 * 데이터 불러오기 모드
 */
export type LoadMode = "byName" | "byWeek";

/**
 * 불러오기 선택 상태
 */
export interface LoadSelectionState {
  /** 불러오기 모드 */
  mode: LoadMode;
  /** 선택된 이름들 */
  selectedNames: Set<string>;
  /** 선택된 주차들 */
  selectedWeeks: Set<string>;
}

/**
 * 빈 스냅샷 생성 함수
 */
export function createEmptySnapshot(): TempSnapshot {
  const now = new Date();
  return {
    tempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    isOriginal: false,
    isDirty: false,
    createdAt: now,
    updatedAt: now,
    name: "",
    domain: "",
    project: "",
    module: "",
    feature: "",
    pastWeek: {
      tasks: [],
      risk: null,
      riskLevel: null,
      collaborators: [],
    },
    thisWeek: {
      tasks: [],
    },
  };
}

/**
 * relation을 relations 배열로 변환하는 헬퍼
 */
function normalizeRelations(
  collab: { name: string; relation?: string; relations?: string[] }
): ("pair" | "pre" | "post")[] {
  // relations 배열이 있으면 사용
  if (collab.relations && Array.isArray(collab.relations)) {
    return collab.relations.filter((r): r is "pair" | "pre" | "post" => 
      ["pair", "pre", "post"].includes(r)
    );
  }
  // relation 단일 값이 있으면 배열로 변환
  if (collab.relation && ["pair", "pre", "post"].includes(collab.relation)) {
    return [collab.relation as "pair" | "pre" | "post"];
  }
  // 기본값
  return ["pair"];
}

/**
 * v1 ScrumItem을 TempSnapshot으로 변환
 */
export function convertToTempSnapshot(
  item: {
    name: string;
    domain: string;
    project: string;
    module?: string | null;
    topic?: string;
    feature?: string;
    progress?: string[];
    progressPercent?: number;
    next?: string[];
    risk?: string[] | null;
    riskLevel?: number | null;
    collaborators?: { name: string; relation?: string; relations?: string[] }[];
    pastWeek?: {
      tasks: { title: string; progress: number }[];
      risk: string[] | null;
      riskLevel: number | null;
      collaborators: { name: string; relation?: string; relations?: string[] }[];
    };
    thisWeek?: {
      tasks: string[];
    };
  },
  weekKey?: string
): TempSnapshot {
  const now = new Date();
  
  // v2 형식인지 확인
  if (item.pastWeek && item.thisWeek) {
    return {
      tempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      isOriginal: true,
      originalWeekKey: weekKey,
      isDirty: false,
      createdAt: now,
      updatedAt: now,
      name: item.name,
      domain: item.domain,
      project: item.project,
      module: item.module || "",
      feature: item.feature || item.topic || "",
      pastWeek: {
        tasks: item.pastWeek.tasks,
        risk: item.pastWeek.risk,
        riskLevel: item.pastWeek.riskLevel as 0 | 1 | 2 | 3 | null,
        collaborators: item.pastWeek.collaborators.map((c) => {
          const relations = normalizeRelations(c);
          return {
            name: c.name,
            relation: relations[0], // 하위 호환성
            relations,
          };
        }),
      },
      thisWeek: {
        tasks: item.thisWeek.tasks,
      },
    };
  }
  
  // v1 형식 변환
  const progressTasks = (item.progress || []).map((p) => {
    const match = p.match(/^(.+?)\s*\((\d+)%?\)$/);
    if (match) {
      return { title: match[1].trim(), progress: parseInt(match[2], 10) };
    }
    return { title: p, progress: item.progressPercent || 0 };
  });

  return {
    tempId: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    isOriginal: true,
    originalWeekKey: weekKey,
    isDirty: false,
    createdAt: now,
    updatedAt: now,
    name: item.name,
    domain: item.domain,
    project: item.project,
    module: item.module || "",
    feature: item.topic || item.feature || "",
    pastWeek: {
      tasks: progressTasks,
      risk: item.risk || null,
      riskLevel: item.riskLevel as 0 | 1 | 2 | 3 | null,
      collaborators: (item.collaborators || []).map((c) => {
        const relations = normalizeRelations(c);
        return {
          name: c.name,
          relation: relations[0], // 하위 호환성
          relations,
        };
      }),
    },
    thisWeek: {
      tasks: item.next || [],
    },
  };
}

/**
 * TempSnapshot을 v2 JSON으로 변환
 */
export function tempSnapshotToV2Json(snapshot: TempSnapshot): ScrumItemV2 {
  return {
    name: snapshot.name,
    domain: snapshot.domain,
    project: snapshot.project,
    module: snapshot.module,
    feature: snapshot.feature,
    pastWeek: snapshot.pastWeek,
    thisWeek: snapshot.thisWeek,
  };
}

/**
 * TempSnapshot을 Plain Text로 변환 (v2 형식)
 * 
 * v2 형식에서는 Define 블록이 삭제되었습니다.
 * 헤더 [Domain / Project / Module / Feature]가 계층 정보를 명시합니다.
 */
export function tempSnapshotToPlainText(snapshot: TempSnapshot): string {
  const lines: string[] = [];
  
  // 헤더 (계층 정보 명시) - 바로 다음 줄에 Name이 오도록
  lines.push(`[${snapshot.domain} / ${snapshot.project} / ${snapshot.module} / ${snapshot.feature}]`);
  
  // Name
  lines.push(`* Name: ${snapshot.name}`);
  
  // Past Week
  lines.push("* Past Week");
  lines.push("    * Tasks");
  if (snapshot.pastWeek.tasks.length > 0) {
    snapshot.pastWeek.tasks.forEach((task) => {
      lines.push(`        * ${task.title} (${task.progress}%)`);
    });
  }
  
  // Risks (v2: 복수형)
  if (snapshot.pastWeek.risk && snapshot.pastWeek.risk.length > 0) {
    lines.push("    * Risks");
    snapshot.pastWeek.risk.forEach((r) => {
      lines.push(`        * ${r}`);
    });
  } else {
    lines.push("    * Risks: None");
  }
  
  // RiskLevel
  lines.push(`    * RiskLevel: ${snapshot.pastWeek.riskLevel ?? "None"}`);
  
  // Collaborators
  if (snapshot.pastWeek.collaborators.length > 0) {
    lines.push("    * Collaborators");
    snapshot.pastWeek.collaborators.forEach((c) => {
      const relationsStr = (c.relations || []).join(", ");
      lines.push(`        * ${c.name} (${relationsStr})`);
    });
  } else {
    lines.push("    * Collaborators: None");
  }
  
  // This Week
  lines.push("* This Week");
  lines.push("    * Tasks");
  if (snapshot.thisWeek.tasks.length > 0) {
    snapshot.thisWeek.tasks.forEach((task) => {
      lines.push(`        * ${task}`);
    });
  }
  
  return lines.join("\n");
}

