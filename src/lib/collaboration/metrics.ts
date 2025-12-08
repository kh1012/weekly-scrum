/**
 * 협업 지표 계산 유틸리티
 */

import type { ScrumItem, Relation } from "@/types/scrum";
import type {
  CollaborationEdge,
  CollaborationNode,
  MemberCollaborationSummary,
  DomainMatrixCell,
  CollaborationLoadRow,
  BottleneckNode,
} from "./types";

/**
 * 멤버별 pair 협업 수 계산
 */
export function getPairCountPerMember(items: ScrumItem[]): Map<string, number> {
  const pairCounts = new Map<string, number>();

  for (const item of items) {
    const pairs = item.collaborators?.filter((c) => c.relation === "pair") ?? [];
    const currentCount = pairCounts.get(item.name) ?? 0;
    pairCounts.set(item.name, currentCount + pairs.length);
  }

  return pairCounts;
}

/**
 * 멤버별 pre 관계 수 계산 (내가 선행 협업자로 지정한 수)
 */
export function getPreCount(items: ScrumItem[]): Map<string, number> {
  const preCounts = new Map<string, number>();

  for (const item of items) {
    const pres = item.collaborators?.filter((c) => c.relation === "pre") ?? [];
    const currentCount = preCounts.get(item.name) ?? 0;
    preCounts.set(item.name, currentCount + pres.length);
  }

  return preCounts;
}

/**
 * 멤버별 post 관계 수 계산 (내가 후행 협업자로 지정한 수)
 */
export function getPostCount(items: ScrumItem[]): Map<string, number> {
  const postCounts = new Map<string, number>();

  for (const item of items) {
    const posts = item.collaborators?.filter((c) => c.relation === "post") ?? [];
    const currentCount = postCounts.get(item.name) ?? 0;
    postCounts.set(item.name, currentCount + posts.length);
  }

  return postCounts;
}

/**
 * 멤버별 pre inbound 수 계산 (다른 사람이 나를 pre로 지정한 수 = 나를 기다리는 수)
 */
export function getPreInbound(items: ScrumItem[]): Map<string, number> {
  const inboundCounts = new Map<string, number>();

  for (const item of items) {
    const pres = item.collaborators?.filter((c) => c.relation === "pre") ?? [];
    for (const collab of pres) {
      const currentCount = inboundCounts.get(collab.name) ?? 0;
      inboundCounts.set(collab.name, currentCount + 1);
    }
  }

  return inboundCounts;
}

/**
 * 멤버별 도메인 정보 추출
 */
export function getMemberDomains(items: ScrumItem[]): Map<string, string> {
  const memberDomains = new Map<string, string>();
  for (const item of items) {
    if (!memberDomains.has(item.name)) {
      memberDomains.set(item.name, item.domain);
    }
  }
  return memberDomains;
}

/**
 * 크로스 도메인 협업 점수 계산 (0~100)
 */
export function getCrossDomainCollaboration(
  items: ScrumItem[],
  memberName: string
): number {
  const memberDomains = getMemberDomains(items);
  const memberDomain = memberDomains.get(memberName);
  if (!memberDomain) return 0;

  const memberItems = items.filter((item) => item.name === memberName);
  let totalCollabs = 0;
  let crossDomainCollabs = 0;

  for (const item of memberItems) {
    if (!item.collaborators) continue;
    for (const collab of item.collaborators) {
      totalCollabs++;
      const collabDomain = memberDomains.get(collab.name);
      if (collabDomain && collabDomain !== memberDomain) {
        crossDomainCollabs++;
      }
    }
  }

  return totalCollabs > 0 ? Math.round((crossDomainCollabs / totalCollabs) * 100) : 0;
}

/**
 * 크로스 모듈 협업 점수 계산 (0~100)
 */
export function getCrossModuleCollaboration(
  items: ScrumItem[],
  memberName: string
): number {
  const memberItems = items.filter((item) => item.name === memberName);
  const memberModules = new Set(memberItems.map((i) => i.module).filter(Boolean));
  
  if (memberModules.size === 0) return 0;

  // 협업자들의 모듈 수집
  const collabModules = new Set<string>();
  for (const item of memberItems) {
    if (!item.collaborators) continue;
    for (const collab of item.collaborators) {
      const collabItems = items.filter((i) => i.name === collab.name);
      for (const ci of collabItems) {
        if (ci.module) collabModules.add(ci.module);
      }
    }
  }

  // 교집합이 아닌 모듈 수 / 전체 협업 모듈 수
  let crossModuleCount = 0;
  for (const mod of collabModules) {
    if (!memberModules.has(mod)) {
      crossModuleCount++;
    }
  }

  return collabModules.size > 0 
    ? Math.round((crossModuleCount / collabModules.size) * 100) 
    : 0;
}

/**
 * 협업 엣지 목록 생성 (네트워크 그래프용)
 */
export function getCollaborationEdges(items: ScrumItem[]): CollaborationEdge[] {
  const edgeMap = new Map<string, CollaborationEdge>();

  for (const item of items) {
    if (!item.collaborators) continue;
    for (const collab of item.collaborators) {
      const key = `${item.name}->${collab.name}:${collab.relation}`;
      const existing = edgeMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        edgeMap.set(key, {
          source: item.name,
          target: collab.name,
          relation: collab.relation,
          count: 1,
        });
      }
    }
  }

  return Array.from(edgeMap.values());
}

/**
 * 협업 노드 목록 생성 (네트워크 그래프용)
 */
export function getCollaborationNodes(items: ScrumItem[]): CollaborationNode[] {
  const memberDomains = getMemberDomains(items);
  const pairCounts = getPairCountPerMember(items);
  const preCounts = getPreCount(items);
  const postCounts = getPostCount(items);
  const preInboundCounts = getPreInbound(items);
  const edges = getCollaborationEdges(items);

  // 모든 멤버 수집 (작업자 + 협업자)
  const allMembers = new Set<string>();
  for (const item of items) {
    allMembers.add(item.name);
    if (item.collaborators) {
      for (const c of item.collaborators) {
        allMembers.add(c.name);
      }
    }
  }

  // 노드별 degree 계산
  const degreeMap = new Map<string, number>();
  for (const edge of edges) {
    degreeMap.set(edge.source, (degreeMap.get(edge.source) ?? 0) + edge.count);
    degreeMap.set(edge.target, (degreeMap.get(edge.target) ?? 0) + edge.count);
  }

  return Array.from(allMembers).map((name) => ({
    id: name,
    name,
    domain: memberDomains.get(name) ?? "Unknown",
    degree: degreeMap.get(name) ?? 0,
    pairCount: pairCounts.get(name) ?? 0,
    preCount: preInboundCounts.get(name) ?? 0, // 나를 pre로 지정한 수 (나를 기다리는 수)
    postCount: postCounts.get(name) ?? 0,
  }));
}

/**
 * 도메인 간 협업 매트릭스 생성
 */
export function getCollaborationMatrix(
  items: ScrumItem[],
  relationFilter?: Relation | "both"
): DomainMatrixCell[] {
  const memberDomains = getMemberDomains(items);
  const matrixMap = new Map<string, DomainMatrixCell>();

  // 모든 도메인 수집
  const domains = new Set<string>();
  for (const item of items) {
    domains.add(item.domain);
  }

  // 초기화
  for (const source of domains) {
    for (const target of domains) {
      const key = `${source}->${target}`;
      matrixMap.set(key, {
        sourceDomain: source,
        targetDomain: target,
        pairCount: 0,
        preCount: 0,
        postCount: 0,
        totalCount: 0,
      });
    }
  }

  // 협업 관계 집계
  for (const item of items) {
    if (!item.collaborators) continue;
    const sourceDomain = item.domain;

    for (const collab of item.collaborators) {
      const targetDomain = memberDomains.get(collab.name);
      if (!targetDomain) continue;

      const key = `${sourceDomain}->${targetDomain}`;
      const cell = matrixMap.get(key);
      if (!cell) continue;

      if (collab.relation === "pair") {
        cell.pairCount++;
      } else if (collab.relation === "pre") {
        cell.preCount++;
      } else if (collab.relation === "post") {
        cell.postCount++;
      }
      cell.totalCount++;
    }
  }

  // 필터 적용
  let result = Array.from(matrixMap.values());
  if (relationFilter === "pair") {
    result = result.map((c) => ({ ...c, totalCount: c.pairCount }));
  } else if (relationFilter === "pre") {
    result = result.map((c) => ({ ...c, totalCount: c.preCount }));
  } else if (relationFilter === "post") {
    result = result.map((c) => ({ ...c, totalCount: c.postCount }));
  }

  return result;
}

/**
 * 멤버별 협업 요약 정보 생성 (개인 대시보드용)
 */
export function getMemberSummary(
  items: ScrumItem[],
  memberName: string
): MemberCollaborationSummary {
  const memberDomains = getMemberDomains(items);
  const memberDomain = memberDomains.get(memberName) ?? "Unknown";
  const memberItems = items.filter((item) => item.name === memberName);

  // 협업자별 통계
  const collabStats = new Map<string, { relation: Relation; count: number }>();
  let pairCount = 0;
  let preCount = 0;
  let postCount = 0;

  for (const item of memberItems) {
    if (!item.collaborators) continue;
    for (const collab of item.collaborators) {
      const key = `${collab.name}:${collab.relation}`;
      const existing = collabStats.get(key);
      if (existing) {
        existing.count++;
      } else {
        collabStats.set(key, { relation: collab.relation, count: 1 });
      }

      switch (collab.relation) {
        case "pair":
          pairCount++;
          break;
        case "pre":
          preCount++;
          break;
        case "post":
          postCount++;
          break;
      }
    }
  }

  // pre inbound 계산 (다른 사람이 나를 pre로 지정한 수)
  let preInbound = 0;
  for (const item of items) {
    if (item.name === memberName) continue;
    const preForMe = item.collaborators?.filter(
      (c) => c.name === memberName && c.relation === "pre"
    );
    preInbound += preForMe?.length ?? 0;
  }

  // 협업자 목록 정리
  const collaboratorsMap = new Map<string, { name: string; relation: Relation; count: number }>();
  for (const [key, stats] of collabStats) {
    const name = key.split(":")[0];
    const existing = collaboratorsMap.get(name);
    if (existing) {
      existing.count += stats.count;
    } else {
      collaboratorsMap.set(name, { name, relation: stats.relation, count: stats.count });
    }
  }

  const totalCollaborations = pairCount + preCount + postCount + preInbound;

  return {
    name: memberName,
    domain: memberDomain,
    pairCount,
    preCount,
    postCount,
    preInbound,
    crossDomainScore: getCrossDomainCollaboration(items, memberName),
    crossModuleScore: getCrossModuleCollaboration(items, memberName),
    totalCollaborations,
    collaborators: Array.from(collaboratorsMap.values()).sort((a, b) => b.count - a.count),
  };
}

/**
 * 협업 부하 히트맵 데이터 생성
 */
export function getCollaborationLoadHeatmap(items: ScrumItem[]): CollaborationLoadRow[] {
  const memberDomains = getMemberDomains(items);
  const members = Array.from(new Set(items.map((i) => i.name)));
  const preInboundCounts = getPreInbound(items);

  const rows: CollaborationLoadRow[] = [];

  for (const member of members) {
    const memberItems = items.filter((i) => i.name === member);
    let pairCount = 0;
    let preCount = 0;
    let postCount = 0;

    for (const item of memberItems) {
      if (!item.collaborators) continue;
      for (const c of item.collaborators) {
        switch (c.relation) {
          case "pair":
            pairCount++;
            break;
          case "pre":
            preCount++;
            break;
          case "post":
            postCount++;
            break;
        }
      }
    }

    const preInbound = preInboundCounts.get(member) ?? 0;
    const totalLoad = pairCount + preCount + postCount + preInbound;

    rows.push({
      name: member,
      domain: memberDomains.get(member) ?? "Unknown",
      pairCount,
      preCount,
      postCount,
      preInbound,
      totalLoad,
    });
  }

  return rows.sort((a, b) => b.totalLoad - a.totalLoad);
}

/**
 * 병목 노드 목록 생성 (Bottleneck Map용)
 * 병목 = 다른 사람이 나를 pre로 지정한 경우 (나를 기다리는 사람이 많음)
 */
export function getBottleneckNodes(items: ScrumItem[]): BottleneckNode[] {
  const memberDomains = getMemberDomains(items);
  const preInboundCounts = getPreInbound(items);
  const preCounts = getPreCount(items);

  // 모든 멤버 수집
  const allMembers = new Set<string>();
  for (const item of items) {
    allMembers.add(item.name);
    if (item.collaborators) {
      for (const c of item.collaborators) {
        allMembers.add(c.name);
      }
    }
  }

  // 누가 누구를 기다리는지 매핑 (pre 관계 기준)
  const waitersMap = new Map<string, string[]>(); // target -> waiters (나를 pre로 지정한 사람들)
  const blockingMap = new Map<string, string[]>(); // source -> blocking (내가 pre로 지정한 사람들)

  for (const item of items) {
    if (!item.collaborators) continue;
    for (const c of item.collaborators) {
      if (c.relation === "pre") {
        // item.name이 c.name을 pre로 지정 (item.name이 c.name을 기다림)
        const waiters = waitersMap.get(c.name) ?? [];
        waiters.push(item.name);
        waitersMap.set(c.name, waiters);

        const blocking = blockingMap.get(item.name) ?? [];
        blocking.push(c.name);
        blockingMap.set(item.name, blocking);
      }
    }
  }

  // 최대 inbound 수 (정규화용)
  const maxInbound = Math.max(...Array.from(preInboundCounts.values()), 1);

  return Array.from(allMembers).map((name) => {
    const inboundCount = preInboundCounts.get(name) ?? 0;
    return {
      name,
      domain: memberDomains.get(name) ?? "Unknown",
      inboundCount,
      outboundCount: preCounts.get(name) ?? 0,
      intensity: Math.round((inboundCount / maxInbound) * 100),
      waiters: waitersMap.get(name) ?? [],
      blocking: blockingMap.get(name) ?? [],
    };
  }).sort((a, b) => b.inboundCount - a.inboundCount);
}
